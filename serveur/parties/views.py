"""
API de sauvegarde et de classement.

Authentification : un cookie signé, posé par le serveur, valable deux ans.
C'est délibéré — le plafond de sept jours de Safari ne frappe que le stockage
écrit côté client (localStorage et document.cookie). Un cookie d'en-tête
`Set-Cookie` y échappe, et c'est ce qui permet à un joueur de retrouver sa
partie sans avoir rien noté.
"""
import json
import re

from django.conf import settings
from django.core.signing import BadSignature
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .metriques import incoherences, mesurer
from .models import Joueur, Sauvegarde

TAILLE_MAX = 2 * 1024 * 1024          # 2 Mio : une partie complète en pèse ~0,4
PSEUDO_VALIDE = re.compile(r"^[\w \-']{2,24}$", re.UNICODE)

CLASSEMENTS = {
    "completion": ("-nombres", "nombres"),
    "mythiques": ("-mythiques", "mythiques"),
    "theoremes": ("-theoremes", "theoremes"),
    "examen": ("-examen", "examen"),
    "forges": ("-forges", "forges"),
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

    lignes = [{
        "rang": i,
        "pseudo": j.pseudo,
        "valeur": getattr(j, champ),
        "completion": j.completion,
        "moi": bool(joueur and j.id == joueur.id),
    } for i, j in enumerate(base.order_by(ordre, "cree_le")[:100], start=1)]

    mien = None
    if joueur and not any(l["moi"] for l in lignes):
        devant = base.filter(**{f"{champ}__gt": getattr(joueur, champ)}).count()
        mien = {"rang": devant + 1, "pseudo": joueur.pseudo,
                "valeur": getattr(joueur, champ), "completion": joueur.completion, "moi": True}

    return JsonResponse({"tri": tri, "lignes": lignes, "moi": mien,
                         "total": base.count()})
