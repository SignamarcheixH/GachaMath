"""
Le modèle de données tient en deux tables : un joueur, une sauvegarde.

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
