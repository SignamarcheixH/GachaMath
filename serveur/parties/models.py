"""
Le modèle de données tient en trois tables : un joueur, une sauvegarde, et les
retours envoyés depuis le jeu.

Les métriques du classement ne sont pas envoyées par le client — elles sont
**recalculées ici** à chaque enregistrement, à partir de la sauvegarde reçue.
Un joueur peut trafiquer sa partie, mais il ne peut pas se déclarer premier
sans que sa sauvegarde le reflète, ce qui rend la triche visible à l'admin.
"""
import secrets
import uuid

from django.db import models

# Alphabet sans les caractères qu'on confond en les recopiant : 0/O, 1/I/L, 2/Z, 5/S, 8/B.
ALPHABET_CODE = "ACDEFGHJKMNPQRTUVWXY34679"


def nouveau_code() -> str:
    """Douze caractères en trois groupes : GN-K7QM-3FVX-9BTR."""
    tirage = "".join(secrets.choice(ALPHABET_CODE) for _ in range(12))
    return "GN-" + "-".join(tirage[i:i + 4] for i in range(0, 12, 4))


class Joueur(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pseudo = models.CharField("pseudo", max_length=24, unique=True)

    # Le code sert à reprendre sa partie sur un autre appareil. Il est stocké
    # en clair pour que le joueur puisse le relire depuis n'importe quel écran
    # connecté ; il ne protège qu'une sauvegarde de jeu, sans donnée personnelle.
    code = models.CharField("code de reprise", max_length=16, unique=True,
                            default=nouveau_code, db_index=True)

    cree_le = models.DateTimeField("créé le", auto_now_add=True)
    vu_le = models.DateTimeField("vu le", auto_now=True)
    banni = models.BooleanField("exclu du classement", default=False)

    # --- métriques dérivées, recalculées à chaque sauvegarde ---
    nombres = models.PositiveIntegerField("nombres uniques", default=0)
    completion = models.FloatField("complétion du vivier (%)", default=0)
    mythiques = models.PositiveIntegerField(default=0)
    legendaires = models.PositiveIntegerField(default=0)
    forges = models.PositiveIntegerField("nombres forgés", default=0)
    theoremes = models.PositiveIntegerField("théorèmes démontrés", default=0)
    defis = models.PositiveIntegerField("défis validés", default=0)
    tirages = models.PositiveIntegerField(default=0)
    examen = models.PositiveIntegerField("meilleur examen", default=0)
    minijeux = models.PositiveIntegerField("mini-jeux terminés", default=0)
    jeux_vagues = models.PositiveIntegerField("parties de Vagues", default=0)
    jeux_appariement = models.PositiveIntegerField("parties d'Appariement", default=0)
    jeux_calcul = models.PositiveIntegerField("parties de Calcul rapide", default=0)
    jeux_expedition = models.PositiveIntegerField("expéditions menées", default=0)
    expedition = models.PositiveIntegerField("couche la plus profonde", default=0)
    calcul = models.PositiveIntegerField("meilleur calcul rapide", default=0)
    suspect = models.CharField("incohérence relevée", max_length=200, blank=True)

    class Meta:
        verbose_name = "joueur"
        verbose_name_plural = "joueurs"
        ordering = ["-nombres"]

    def __str__(self):
        return f"{self.pseudo} ({self.nombres} nombres)"


class Sauvegarde(models.Model):
    joueur = models.OneToOneField(Joueur, on_delete=models.CASCADE,
                                  related_name="sauvegarde", primary_key=True)
    donnees = models.JSONField("état de la partie")
    octets = models.PositiveIntegerField(default=0)
    maj_le = models.DateTimeField("mise à jour", auto_now=True)

    class Meta:
        verbose_name = "sauvegarde"
        verbose_name_plural = "sauvegardes"

    def __str__(self):
        return f"sauvegarde de {self.joueur.pseudo} ({self.octets // 1024} Ko)"


class Retour(models.Model):
    """Un message envoyé depuis le bouton de retour, en jeu ou sur une page.

    Tout ce qui arrive ici vient du visiteur, donc rien n'est digne de
    confiance. Trois règles tiennent la sécurité :

    1. `objet` est un choix fermé, jamais du texte libre. La vue rejette toute
       valeur absente de OBJETS, sans quoi ce champ deviendrait un second champ
       de texte non contrôlé.
    2. Le message est stocké tel quel et **jamais réinjecté dans le jeu**. Il
       n'apparaît que dans l'admin Django, dont les gabarits échappent le HTML
       par défaut — à condition de ne jamais le passer par format_html.
    3. Aucune adresse IP n'est conservée. L'empreinte est salée par la clé
       secrète : elle suffit à regrouper les envois d'une même source dans
       l'admin, sans permettre de remonter à qui que ce soit. Elle ne limite
       plus la cadence — voir la note dans views.retour.
    """

    OBJETS = [
        ("bug", "Un bug"),
        ("idee", "Une idée"),
        ("maths", "Une erreur mathématique"),
        ("equilibrage", "Équilibrage"),
        ("autre", "Autre"),
    ]
    OBJETS_VALIDES = {cle for cle, _ in OBJETS}

    # Où en est ce retour. Une liste publique classée devient une promesse : si
    # le premier de la liste reste intouché trois mois, la page se lit comme de
    # l'abandon. Le statut est ce qui permet de répondre sans écrire.
    STATUTS = [
        ("recu",   "Reçu"),
        ("retenu", "Retenu"),
        ("fait",   "Fait"),
        ("refuse", "Non retenu"),
    ]

    MESSAGE_MAX = 2000

    objet = models.CharField("objet", max_length=16, choices=OBJETS)
    message = models.TextField("message", max_length=MESSAGE_MAX)

    # Facultatif : un retour anonyme reste un retour utile.
    joueur = models.ForeignKey(Joueur, null=True, blank=True, on_delete=models.SET_NULL,
                              related_name="retours", verbose_name="joueur")

    # ---------- publication ----------
    # RIEN N'EST PUBLIC PAR DÉFAUT. L'envoi est un POST ouvert, sans compte : si
    # ce qui arrive s'affichait d'office, n'importe qui pourrait faire écrire ce
    # qu'il veut sur le site, à tous les visiteurs et au robot d'AdSense. La
    # publication est donc un geste explicite, pris dans l'admin.
    publie = models.BooleanField("publié", default=False)
    statut = models.CharField("statut", max_length=8, choices=STATUTS, default="recu")

    # Le pseudo s'affiche, sauf si l'auteur a demandé l'inverse. L'admin voit
    # toujours qui a écrit : anonyme veut dire « anonyme aux autres joueurs »,
    # jamais « anonyme pour vous ».
    anonyme = models.BooleanField("afficher en anonyme", default=False)

    # Compte dénormalisé. La liste se trie dessus à chaque affichage ; refaire
    # un COUNT par ligne pour une valeur qui ne bouge qu'au clic serait payer
    # cher une exactitude que la table Voix garantit déjà.
    votes = models.PositiveIntegerField("votes", default=0)

    # Contexte, utile surtout pour les rapports de bug. Fourni par le client,
    # donc tronqué et traité comme du texte quelconque.
    page = models.CharField("page", max_length=120, blank=True)
    version = models.CharField("version des fichiers", max_length=16, blank=True)
    agent = models.CharField("navigateur", max_length=200, blank=True)

    empreinte = models.CharField("empreinte d'envoi", max_length=32, blank=True, db_index=True)
    cree_le = models.DateTimeField("reçu le", auto_now_add=True)
    traite = models.BooleanField("traité", default=False)

    class Meta:
        verbose_name = "retour"
        verbose_name_plural = "retours"
        ordering = ["-cree_le"]

    def __str__(self):
        return f"{self.get_objet_display()} — {self.message[:60]}"


class Voix(models.Model):
    """Un joueur soutient un retour. Une voix par joueur et par retour.

    POURQUOI LE JOUEUR, ET PAS L'EMPREINTE. L'empreinte salée qui identifie un
    envoyeur est bonne pour compter des envois, mauvaise pour compter des voix :
    un foyer, un opérateur mobile ou un VPN partagent une adresse, et comme le
    hachage est à sens unique, un litige serait indébrouillable. Un vote ne vaut
    que l'identité derrière lui — ici, un pseudo choisi et un cocon signé par le
    serveur.

    IL N'Y A PAS DE VOIX CONTRE. « Moi aussi » est une information ; « ton idée
    est mauvaise » est un jugement sur un autre joueur, qui enterre ce avec quoi
    on n'est pas d'accord plutôt que ce qui est faux. Le refus d'une idée se
    dit par le statut du retour, posé par l'auteur du jeu.
    """

    retour = models.ForeignKey(Retour, on_delete=models.CASCADE,
                               related_name="voix", verbose_name="retour")
    joueur = models.ForeignKey(Joueur, on_delete=models.CASCADE,
                               related_name="voix", verbose_name="joueur")
    cree_le = models.DateTimeField("donnée le", auto_now_add=True)

    class Meta:
        verbose_name = "voix"
        verbose_name_plural = "voix"
        constraints = [
            models.UniqueConstraint(fields=["retour", "joueur"], name="une_voix_par_joueur"),
        ]

    def __str__(self):
        return f"{self.joueur.pseudo} → {self.retour_id}"
