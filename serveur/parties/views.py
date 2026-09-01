"""
API de sauvegarde et de classement.

Authentification : un cookie signé, posé par le serveur, valable deux ans.
C'est délibéré — le plafond de sept jours de Safari ne frappe que le stockage
écrit côté client (localStorage et document.cookie). Un cookie d'en-tête
`Set-Cookie` y échappe, et c'est ce qui permet à un joueur de retrouver sa
partie sans avoir rien noté.
"""
import hashlib
import json
import re
from datetime import timedelta

from django.conf import settings
from django.core.signing import BadSignature
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from django.utils import timezone

from .metriques import incoherences, mesurer
from .models import Joueur, Retour, Sauvegarde

# Mesuré, pas estimé : une sauvegarde coûte ~30 octets par nombre possédé,
# soit 2,9 Mo pour la collection complète (0 à 99 999). L'ancienne limite de
# 2 Mio reposait sur une estimation de 0,4 Mo et aurait refusé les parties les
# plus avancées — précisément celles qu'on ne veut surtout pas perdre.
TAILLE_MAX = 8 * 1024 * 1024
PSEUDO_VALIDE = re.compile(r"^[\w \-']{2,24}$", re.UNICODE)

# Cadence des retours : de quoi signaler plusieurs choses d'affilée, pas de quoi
# inonder la table. Le plafond vaut par empreinte d'envoi et par heure.
RETOURS_PAR_HEURE = 6

CLASSEMENTS = {
    "completion": ("-nombres", "nombres"),
    "mythiques": ("-mythiques", "mythiques"),
    "theoremes": ("-theoremes", "theoremes"),
    "examen": ("-examen", "examen"),
    "forges": ("-forges", "forges"),
    "minijeux": ("-minijeux", "minijeux"),
    "expedition": ("-expedition", "expedition"),
}


def _json(requete):
    try:
        return json.loads(requete.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return None


def _pose_cookie(reponse, joueur):
    reponse.set_signed_cookie(
        settings.COOKIE_JOUEUR, str(joueur.id),
        max_age=settings.COOKIE_DUREE,
        httponly=True,                       # inaccessible au JavaScript, donc épargné par Safari
        samesite="Lax",
        secure=not settings.DEBUG,
        path="/",
    )
    return reponse


def joueur_courant(requete):
    try:
        ident = requete.get_signed_cookie(settings.COOKIE_JOUEUR, default=None,
                                          max_age=settings.COOKIE_DUREE)
    except BadSignature:
        return None
    if not ident:
        return None
    return Joueur.objects.filter(id=ident).first()


# ------------------------------------------------------------------ identité
@require_http_methods(["POST"])
def inscription(requete):
    corps = _json(requete)
    if corps is None:
        return JsonResponse({"erreur": "Corps illisible."}, status=400)

    pseudo = (corps.get("pseudo") or "").strip()
    if not PSEUDO_VALIDE.match(pseudo):
        return JsonResponse(
            {"erreur": "Le pseudo doit faire 2 à 24 caractères, sans ponctuation exotique."},
            status=400)
    if Joueur.objects.filter(pseudo__iexact=pseudo).exists():
        return JsonResponse({"erreur": "Ce pseudo est déjà pris."}, status=409)

    joueur = Joueur.objects.create(pseudo=pseudo)
    return _pose_cookie(
        JsonResponse({"id": str(joueur.id), "pseudo": joueur.pseudo, "code": joueur.code}),
        joueur)


@require_http_methods(["POST"])
def reprise(requete):
    """Reprendre sa partie sur un autre appareil, ou après effacement complet."""
    corps = _json(requete)
    if corps is None:
        return JsonResponse({"erreur": "Corps illisible."}, status=400)

    code = (corps.get("code") or "").strip().upper().replace(" ", "")
    if not code.startswith("GN-"):
        code = "GN-" + code
    joueur = Joueur.objects.filter(code=code).first()
    if not joueur:
        return JsonResponse({"erreur": "Code inconnu."}, status=404)

    sauv = getattr(joueur, "sauvegarde", None)
    return _pose_cookie(JsonResponse({
        "pseudo": joueur.pseudo, "code": joueur.code,
        "donnees": sauv.donnees if sauv else None,
        "maj_le": sauv.maj_le.isoformat() if sauv else None,
    }), joueur)


@ensure_csrf_cookie          # c'est ici que le client récupère son jeton CSRF
@require_http_methods(["GET"])
def moi(requete):
    joueur = joueur_courant(requete)
    if not joueur:
        return JsonResponse({"connecte": False})
    sauv = getattr(joueur, "sauvegarde", None)
    return JsonResponse({
        "connecte": True, "pseudo": joueur.pseudo, "code": joueur.code,
        "maj_le": sauv.maj_le.isoformat() if sauv else None,
    })


@require_http_methods(["POST"])
def deconnexion(requete):
    reponse = JsonResponse({"ok": True})
    reponse.delete_cookie(settings.COOKIE_JOUEUR, path="/")
    return reponse


# ------------------------------------------------------------------ partie
@require_http_methods(["GET", "PUT"])
def partie(requete):
    joueur = joueur_courant(requete)
    if not joueur:
        return JsonResponse({"erreur": "Aucune partie associée à cet appareil."}, status=401)

    if requete.method == "GET":
        sauv = getattr(joueur, "sauvegarde", None)
        if not sauv:
            return JsonResponse({"donnees": None})
        return JsonResponse({"donnees": sauv.donnees, "maj_le": sauv.maj_le.isoformat()})

    if len(requete.body) > TAILLE_MAX:
        return JsonResponse({"erreur": "Sauvegarde trop volumineuse."}, status=413)

    corps = _json(requete)
    if not isinstance(corps, dict) or not isinstance(corps.get("donnees"), dict):
        return JsonResponse({"erreur": "Sauvegarde illisible."}, status=400)

    donnees = corps["donnees"]
    mesures = mesurer(donnees)

    with transaction.atomic():
        sauv, _ = Sauvegarde.objects.update_or_create(
            joueur=joueur,
            defaults={"donnees": donnees, "octets": len(requete.body)},
        )
        for champ, valeur in mesures.items():
            setattr(joueur, champ, valeur)
        joueur.suspect = incoherences(donnees, mesures)
        joueur.save()

    # On renvoie l'horodatage : le client n'a pas à relire la sauvegarde derrière.
    return JsonResponse({"ok": True, "maj_le": sauv.maj_le.isoformat(),
                         "mesures": mesures, "suspect": joueur.suspect})


# ------------------------------------------------------------------ classement
@require_http_methods(["GET"])
def classement(requete):
    tri = requete.GET.get("tri", "completion")
    if tri not in CLASSEMENTS:
        tri = "completion"
    ordre, champ = CLASSEMENTS[tri]

    joueur = joueur_courant(requete)
    base = Joueur.objects.filter(banni=False).exclude(suspect__gt="")

    # Le tri « mini-jeux » affiche une colonne par jeu : le total seul ne dit
    # pas si l'on a tout pratiqué ou creusé un seul sillon.
    DETAIL = ("jeux_vagues", "jeux_appariement", "jeux_calcul", "jeux_expedition")

    def ligne(i, j):
        l = {
            "rang": i,
            "pseudo": j.pseudo,
            "valeur": getattr(j, champ),
            "completion": j.completion,
            "moi": bool(joueur and j.id == joueur.id),
        }
        if tri == "minijeux":
            l["detail"] = {k: getattr(j, k) for k in DETAIL}
        return l

    lignes = [ligne(i, j) for i, j in enumerate(base.order_by(ordre, "cree_le")[:100], start=1)]

    mien = None
    if joueur and not any(l["moi"] for l in lignes):
        devant = base.filter(**{f"{champ}__gt": getattr(joueur, champ)}).count()
        mien = {"rang": devant + 1, "pseudo": joueur.pseudo,
                "valeur": getattr(joueur, champ), "completion": joueur.completion, "moi": True}
        if tri == "minijeux":
            mien["detail"] = {k: getattr(joueur, k) for k in DETAIL}

    return JsonResponse({"tri": tri, "lignes": lignes, "moi": mien,
                         "total": base.count()})


# ------------------------------------------------------------------ retours
def _empreinte_envoyeur(requete) -> str:
    """Identifie un envoyeur pendant une heure, sans conserver son adresse.

    On ne stocke pas l'IP : la salant avec la clé secrète suffit à limiter la
    cadence, et n'expose rien qui permettrait de remonter à quelqu'un. La page
    de confidentialité annonce cette absence — il faut qu'elle reste vraie.
    """
    avant = requete.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = (avant.split(",")[0] if avant else requete.META.get("REMOTE_ADDR", "")).strip()
    graine = f"{ip}|{settings.SECRET_KEY}".encode()
    return hashlib.sha256(graine).hexdigest()[:32]


@require_http_methods(["POST"])
def retour(requete):
    corps = _json(requete)
    if not isinstance(corps, dict):
        return JsonResponse({"erreur": "Message illisible."}, status=400)

    # L'objet est un choix fermé. Accepter une valeur libre ici en ferait un
    # second champ de texte non contrôlé, ce qui n'a aucune raison d'exister.
    objet = corps.get("objet")
    if objet not in Retour.OBJETS_VALIDES:
        return JsonResponse({"erreur": "Objet inconnu."}, status=400)

    message = (corps.get("message") or "").strip()
    if len(message) < 4:
        return JsonResponse({"erreur": "Décrivez un peu plus, en quelques mots."}, status=400)
    if len(message) > Retour.MESSAGE_MAX:
        return JsonResponse({"erreur": "Message trop long."}, status=400)

    empreinte = _empreinte_envoyeur(requete)
    depuis = timezone.now() - timedelta(hours=1)
    if Retour.objects.filter(empreinte=empreinte, cree_le__gte=depuis).count() >= RETOURS_PAR_HEURE:
        return JsonResponse(
            {"erreur": "Vous avez déjà envoyé plusieurs retours récemment. Merci, et à tout à l'heure."},
            status=429)

    # Le contexte vient du client : on le tronque et on n'en attend rien.
    def borne(valeur, taille):
        return str(valeur or "")[:taille]

    Retour.objects.create(
        objet=objet,
        message=message,
        joueur=joueur_courant(requete),
        page=borne(corps.get("page"), 120),
        version=borne(corps.get("version"), 16),
        agent=borne(requete.META.get("HTTP_USER_AGENT"), 200),
        empreinte=empreinte,
    )
    return JsonResponse({"ok": True})
