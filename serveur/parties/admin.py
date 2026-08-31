"""
Le back office. Les métriques étant recalculées à chaque sauvegarde, ce sont
elles qu'on affiche — jamais des chiffres envoyés par le client.
"""
import json

from django.contrib import admin, messages
from django.utils.html import format_html

from .metriques import incoherences, mesurer
from .models import Joueur, Retour, Sauvegarde


class SauvegardeInline(admin.StackedInline):
    model = Sauvegarde
    can_delete = False
    readonly_fields = ("maj_le", "octets", "apercu")
    fields = ("maj_le", "octets", "apercu")
    extra = 0

    @admin.display(description="aperçu")
    def apercu(self, obj):
        if not obj.donnees:
            return "—"
        extrait = {k: v for k, v in obj.donnees.items() if k != "owned"}
        extrait["owned"] = f"… {len(obj.donnees.get('owned') or {})} nombres"
        return format_html("<pre style='max-height:22em;overflow:auto'>{}</pre>",
                           json.dumps(extrait, indent=2, ensure_ascii=False)[:4000])


@admin.register(Joueur)
class JoueurAdmin(admin.ModelAdmin):
    list_display = ("pseudo", "barre", "nombres", "mythiques", "legendaires",
                    "forges", "theoremes", "examen", "alerte", "vu_le")
    list_filter = ("banni", "cree_le")
    search_fields = ("pseudo", "code", "id")
    ordering = ("-nombres",)
    readonly_fields = ("id", "code", "cree_le", "vu_le", "nombres", "completion",
                       "mythiques", "legendaires", "forges", "theoremes", "defis",
                       "tirages", "examen", "suspect")
    inlines = [SauvegardeInline]
    actions = ["recalculer", "bannir", "reintegrer"]

    @admin.display(description="complétion", ordering="completion")
    def barre(self, obj):
        return format_html(
            '<div style="background:#eee;width:110px;height:11px;border-radius:6px;overflow:hidden">'
            '<div style="background:#4ec97a;width:{}%;height:100%"></div></div>'
            '<small>{} %</small>', min(obj.completion, 100), obj.completion)

    @admin.display(description="⚠")
    def alerte(self, obj):
        if obj.banni:
            return format_html('<b style="color:#b00">exclu</b>')
        if obj.suspect:
            return format_html('<b style="color:#c60" title="{}">incohérent</b>', obj.suspect)
        return ""

    @admin.action(description="Recalculer les métriques depuis la sauvegarde")
    def recalculer(self, requete, lot):
        touches = 0
        for joueur in lot.select_related("sauvegarde"):
            sauv = getattr(joueur, "sauvegarde", None)
            if not sauv:
                continue
            mesures = mesurer(sauv.donnees)
            for champ, valeur in mesures.items():
                setattr(joueur, champ, valeur)
            joueur.suspect = incoherences(sauv.donnees, mesures)
            joueur.save()
            touches += 1
        self.message_user(requete, f"{touches} joueur(s) recalculé(s).", messages.SUCCESS)

    @admin.action(description="Exclure du classement")
    def bannir(self, requete, lot):
        self.message_user(requete, f"{lot.update(banni=True)} joueur(s) exclu(s).")

    @admin.action(description="Réintégrer au classement")
    def reintegrer(self, requete, lot):
        self.message_user(requete, f"{lot.update(banni=False)} joueur(s) réintégré(s).")


@admin.register(Sauvegarde)
class SauvegardeAdmin(admin.ModelAdmin):
    list_display = ("joueur", "poids", "maj_le")
    search_fields = ("joueur__pseudo",)
    readonly_fields = ("joueur", "octets", "maj_le")
    ordering = ("-maj_le",)

    @admin.display(description="poids", ordering="octets")
    def poids(self, obj):
        return f"{obj.octets / 1024:.0f} Ko"


@admin.register(Retour)
class RetourAdmin(admin.ModelAdmin):
    """Le message n'est jamais passé par format_html.

    Les gabarits de l'admin échappent le HTML d'office ; format_html ne le
    ferait plus, et un retour contenant du script s'exécuterait dans la seule
    page où l'on est authentifié en administrateur. L'aperçu ci-dessous rend
    donc du texte, pas du balisage.
    """

    list_display = ("cree_le", "objet", "extrait", "qui", "traite")
    list_filter = ("objet", "traite", "cree_le")
    search_fields = ("message", "joueur__pseudo")
    readonly_fields = ("objet", "message", "joueur", "page", "version",
                       "agent", "empreinte", "cree_le")
    ordering = ("-cree_le",)
    actions = ["marquer_traite", "marquer_a_faire"]
    list_per_page = 50

    @admin.display(description="message")
    def extrait(self, obj):
        texte = " ".join(obj.message.split())
        return texte[:90] + ("…" if len(texte) > 90 else "")

    @admin.display(description="joueur")
    def qui(self, obj):
        return obj.joueur.pseudo if obj.joueur else "—"

    @admin.action(description="Marquer comme traité")
    def marquer_traite(self, requete, lot):
        self.message_user(requete, f"{lot.update(traite=True)} retour(s) traité(s).")

    @admin.action(description="Remettre à traiter")
    def marquer_a_faire(self, requete, lot):
        self.message_user(requete, f"{lot.update(traite=False)} retour(s) à traiter.")

    def has_add_permission(self, requete):
        return False        # les retours arrivent par l'API, jamais à la main


admin.site.site_header = "Gacha des Nombres"
admin.site.site_title = "Gacha des Nombres"
admin.site.index_title = "Administration"
