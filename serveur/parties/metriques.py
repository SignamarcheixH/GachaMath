"""
Lecture d'une sauvegarde : métriques du classement et contrôles de cohérence.

Le serveur ne rejoue pas la partie — ce serait porter les 65 traits en Python,
avec la divergence garantie qui va avec. Il lit la sauvegarde et s'appuie sur
une table nombre → rareté générée depuis le moteur du jeu lui-même
(voir serveur/outils/generer_raretes.js).
"""
import json
from pathlib import Path

VIVIER = 9999                    # le tirage va de 1 à 9999
FORGE_MIN = 10000

_TABLE = None
_BORNES = None


def bornes() -> dict:
    """Combien il existe de Légendaires, de théorèmes, de défis.

    CES NOMBRES NE SE RETAPENT PAS. Ils étaient écrits en dur juste en dessous,
    et le jour où le barème des traits a été recalculé sur la fréquence réelle
    des propriétés, il y a eu 74 Légendaires au lieu de 11. Le contrôle de
    plausibilité s'est alors mis à signaler comme tricheur tout joueur qui en
    possédait douze — et le classement écarte les joueurs signalés, sans jamais
    les prévenir. Un plafond faux est pire qu'un plafond absent.

    Ils sont donc générés depuis le moteur du jeu, comme la table des raretés :
    node serveur/outils/generer_raretes.js
    """
    global _BORNES
    if _BORNES is None:
        chemin = Path(__file__).resolve().parent / "data" / "bornes.json"
        if not chemin.exists():
            raise RuntimeError(
                "serveur/parties/data/bornes.json manque. "
                "Générez-le : node serveur/outils/generer_raretes.js"
            )
        _BORNES = json.loads(chemin.read_text(encoding="utf-8"))
    return _BORNES


def table_raretes() -> str:
    """Un chiffre (indice de rareté 0 à 5) par nombre, de 1 à 9999."""
    global _TABLE
    if _TABLE is None:
        chemin = Path(__file__).resolve().parent / "data" / "raretes.txt"
        _TABLE = chemin.read_text(encoding="utf-8").strip()
        if len(_TABLE) != VIVIER:
            raise RuntimeError(
                f"Table de raretés incohérente ({len(_TABLE)} entrées au lieu de {VIVIER}). "
                "Régénérez-la : node serveur/outils/generer_raretes.js"
            )
    return _TABLE


def rarete(n: int) -> int:
    """Indice de rareté d'un nombre, ou -1 s'il est hors du vivier (donc forgé)."""
    t = table_raretes()
    return int(t[n - 1]) if 1 <= n <= VIVIER else -1


def _entiers(cle) -> list[int]:
    """Les clés JSON sont des chaînes ; on ignore silencieusement l'invalide."""
    out = []
    for k in cle:
        try:
            out.append(int(k))
        except (TypeError, ValueError):
            continue
    return out


def mesurer(donnees: dict) -> dict:
    """Métriques du classement, lues dans la sauvegarde."""
    if not isinstance(donnees, dict):
        return {}
    possedes = _entiers((donnees.get("owned") or {}).keys())
    stats = donnees.get("stats") or {}

    tirables = [n for n in possedes if 1 <= n <= VIVIER]
    forges = [n for n in possedes if n == 0 or n >= FORGE_MIN]

    compte = {}
    for n in tirables:
        compte[rarete(n)] = compte.get(rarete(n), 0) + 1

    return {
        "nombres": len(possedes),
        "completion": round(len(tirables) / VIVIER * 100, 2),
        "mythiques": compte.get(5, 0),
        "legendaires": compte.get(4, 0),
        "forges": len(forges),
        "theoremes": len(donnees.get("claimed") or []),
        "defis": len(donnees.get("defis") or []),
        "tirages": int(stats.get("pulls") or 0),
        "examen": int(stats.get("meilleureSerie") or 0),

        # Mini-jeux. Deux mesures de nature différente, et c'est voulu : le
        # nombre de parties récompense l'assiduité, la couche atteinte
        # récompense l'adresse. Un classement qui n'aurait que la première
        # couronnerait celui qui joue le plus, pas celui qui joue le mieux.
        # Le détail est stocké en plus de la somme : recalculer la répartition
        # depuis les sauvegardes au moment d'afficher le classement obligerait
        # à charger cent parties de plusieurs mégaoctets pour quatre entiers.
        "jeux_vagues": int(stats.get("examens") or 0),
        "jeux_appariement": int(stats.get("appariements") or 0),
        "jeux_calcul": int(stats.get("calculs") or 0),
        "jeux_expedition": int(stats.get("expeditions") or 0),
        "minijeux": (int(stats.get("examens") or 0)
                     + int(stats.get("appariements") or 0)
                     + int(stats.get("calculs") or 0)
                     + int(stats.get("expeditions") or 0)),
        "expedition": int(stats.get("meilleureCouche") or 0),
        "calcul": int(stats.get("calculRecord") or 0),
    }


def incoherences(donnees: dict, m: dict) -> str:
    """
    Contrôles de plausibilité. Ils n'arrêtent pas un tricheur déterminé — le jeu
    calcule tout côté client — mais ils repèrent la triche d'un clic et signalent
    la partie dans l'admin plutôt que de la laisser fausser le classement.
    """
    stats = donnees.get("stats") or {}
    motifs = []

    # Un nombre du vivier vient d'un tirage, d'une carte bonus de commande, ou
    # d'un doublon recyclé. En rester très large : deux fois le nombre de
    # tirages plus dix par commande couvre largement le jeu honnête.
    # L'Expédition n'a plus de profondeur maximale : une seule course peut
    # compter cinquante couches. Un plafond calculé sur le NOMBRE DE PARTIES
    # signalerait donc les joueurs qui vont loin — exactement les meilleurs, et
    # sans qu'ils l'apprennent jamais. On compte les couches réellement
    # parcourues ; les sauvegardes antérieures, qui n'ont pas ce compteur,
    # gardent l'ancienne estimation.
    couches = max(int(stats.get("couchesExpedition") or 0),
                  int(stats.get("expeditions") or 0) * 12)
    plafond = (int(stats.get("pulls") or 0) * 2
               + int(stats.get("forges") or 0) * 10
               + couches * 4                                # jusqu'à 4 nombres par couche
               + int(stats.get("calculs") or 0) * 3         # 3 cartes bonus par partie
               + 50)
    tirables = m.get("completion", 0) / 100 * VIVIER
    if tirables > plafond:
        motifs.append(f"{int(tirables)} nombres tirables pour {stats.get('pulls', 0)} tirages")

    # Un nombre au-delà du mur vient d'une commande de forge résolue — mais
    # plus seulement : l'Expédition en distribue aussi, la contrainte
    # « exactement 5 chiffres » en produit par construction, et le Calcul
    # rapide donne des cartes tirées au hasard.
    #
    # Sans ce complément, un joueur honnête qui joue les mini-jeux finissait
    # signalé, donc **écarté du classement**, sans jamais l'apprendre. Un
    # contrôle de plausibilité qui punit le jeu normal est pire qu'absent.
    # Une commande résolue ne rapporte plus un seul nombre au-delà du mur : la
    # cible, plus ses cartes bonus, qui sont désormais tirées du même côté du
    # mur. Le compte peut monter à six selon la longueur de la solution de
    # référence et les indices non demandés. On prend huit : ce contrôle est
    # là pour repérer une triche d'un clic, pas pour serrer le jeu honnête au
    # plus juste — un plafond trop bas écarterait du classement les joueurs
    # qui forgent beaucoup, sans qu'ils l'apprennent jamais.
    voies_forge = (int(stats.get("forges") or 0) * 8
                   + couches                                # au plus une carte par couche
                   + int(stats.get("calculs") or 0) * 3)
    if m.get("forges", 0) > voies_forge + 10:
        motifs.append(f"{m['forges']} nombres forgés pour {voies_forge} occasions d'en obtenir")

    # Le nombre de mythiques et de légendaires du vivier est un plafond absolu —
    # mais il change avec le barème des traits, donc on le lit, on ne le devine
    # pas. Voir bornes().
    b = bornes()
    if (m.get("mythiques", 0) > b["paliers"]["mythique"]
            or m.get("legendaires", 0) > b["paliers"]["legendaire"]):
        motifs.append("plus de mythiques ou de légendaires qu'il n'en existe")

    if m.get("theoremes", 0) > b["theoremes"] or m.get("defis", 0) > b["defis"]:
        motifs.append("plus de théorèmes ou de défis qu'il n'en existe")

    return " ; ".join(motifs)[:200]
