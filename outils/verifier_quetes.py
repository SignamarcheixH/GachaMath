# -*- coding: utf-8 -*-
"""Refait tous les calculs des énigmes de quête, et refuse de passer si l'un est faux.

Le jeu promet des mathématiques exactes. Une énigme dont la réponse attendue
serait fausse démolirait cette promesse plus sûrement que n'importe quel bug
d'affichage : le joueur qui a raison se verrait dire qu'il a tort.

Chaque énigme est donc recalculée ici, indépendamment — pas en relisant la
valeur écrite dans js/quetes.js, mais en refaisant le calcul depuis son énoncé.
Les deux doivent tomber d'accord.

Le script vérifie aussi la structure : une étape « faire » sans objectif
testable, une énigme sans indice, un lieu qui n'existe pas sur la Carte, une
quête dont l'acte n'existe pas.

Usage : python outils/verifier_quetes.py
"""
import io
import json
import os
import re
import subprocess
import sys
import tempfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ---------------------------------------------------------------- les calculs
def diviseurs(n):
    return [d for d in range(1, n + 1) if n % d == 0]


def premier(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True


def zeros_finaux(n):
    z = 0
    while n % 10 == 0:
        n //= 10
        z += 1
    return z


def kaprekar_tour(n):
    """Un tour de la routine : chiffres décroissants moins croissants."""
    c = ('%04d' % n)
    return int(''.join(sorted(c, reverse=True))) - int(''.join(sorted(c)))


"""Chaque énigme, recalculée depuis son énoncé. La clé est l'identifiant de la
quête et le rang de l'étape ; la valeur, une fonction qui rend la réponse et une
phrase disant COMMENT elle a été obtenue — pour qu'une erreur soit lisible."""
CALCULS = {
    ('registre', 3): (
        lambda: sum(range(1, 101)),
        "somme des entiers de 1 à 100"),
    ('diviseurs', 1): (
        lambda: next(n for n in range(1, 1000) if len(diviseurs(n)) == 6),
        "plus petit entier ayant exactement six diviseurs"),
    ('parfait', 1): (
        lambda: next(n for n in range(7, 10000)
                     if sum(diviseurs(n)[:-1]) == n),
        "premier nombre parfait strictement supérieur à 6"),
    ('crible', 2): (
        lambda: sum(1 for n in range(1, 31) if premier(n)),
        "nombre de premiers de 1 à 30"),
    ('theoreme', 2): (
        lambda: sum(1 for k in range(1, 101) if int(k ** .5) ** 2 == k),
        "nombre de carrés parfaits de 1 à 100"),
    ('zero', 1): (
        lambda: zeros_finaux(10 * 20 * 30 * 40 * 50),
        "zéros finaux de 10×20×30×40×50"),
    ('taxicab', 3): (
        lambda: round((1729 - 1) ** (1 / 3)),
        "x tel que 1729 = 1³ + x³"),
    ('essai', 1): (
        lambda: 7 * 6,
        "produit de 7 par 6"),
    ('kaprekar', 2): (
        lambda: kaprekar_tour(3524),
        "premier tour de Kaprekar sur 3524"),
    ('kaprekar', 3): (
        lambda: kaprekar_tour(kaprekar_tour(3524)),
        "deuxième tour de Kaprekar"),
}


# ------------------------------------------------------------------ la lecture
def lire_les_quetes():
    """Fait tourner le moteur pour obtenir les quêtes telles que le jeu les voit.
    On passe par Node plutôt que d'analyser le JavaScript à la main : un
    analyseur maison dériverait du fichier réel à la première virgule déplacée."""
    script = r"""
const fs = require('fs');
/* Le module s'appuie sur l'état du jeu et sur la Carte : on fournit le strict
   nécessaire pour que le fichier s'évalue, sans lancer la partie. */
const state = { quetes: {}, owned: {}, claimed: [], stats: {}, acte: 9 };
/* La quête d'essai n'existe que sous ACTES_TEST. On l'allume ici : une énigme
   de test reste une énigme, et une réponse fausse y serait aussi indéfendable
   qu'ailleurs. */
const ACTES_TEST = true;
const acteCourant = () => 9;
const uniqueCount = () => 0;
const niveauMachine = () => 0;
const fmt = n => String(n);
const save = () => {};
const toast = () => {};
const renderAll = () => {};
const invalideRevenu = () => {};
const document = { querySelector: () => null, querySelectorAll: () => [] };
const HUB_LIEUX = JSON.parse(process.argv[2]);

const src = fs.readFileSync('js/quetes.js', 'utf8');
const QUETES = new Function('state','acteCourant','uniqueCount','niveauMachine',
  'fmt','save','toast','renderAll','invalideRevenu','document','HUB_LIEUX',
  'ACTES_TEST',
  src + '; return QUETES;')(state, acteCourant, uniqueCount, niveauMachine,
  fmt, save, toast, renderAll, invalideRevenu, document, HUB_LIEUX, ACTES_TEST);

console.log(JSON.stringify(QUETES.map(q => ({
  id: q.id, titre: q.titre, acte: q.acte, batiment: q.batiment,
  rejouable: !!q.rejouable,
  personnage: q.personnage, declencheur: q.declencheur || null,
  recompense: q.recompense || {},
  objet: (q.recompense && q.recompense.objet) || null,
  etapes: q.etapes.map(e => ({
    type: e.type, ou: e.ou || null, question: e.question || null,
    reponse: e.reponse === undefined ? null : e.reponse,
    indice: e.indice || null, aObjectif: typeof e.fait === 'function',
    aMesure: typeof e.mesure === 'function', texte: (e.texte || '').slice(0, 40),
  })),
}))));
"""
    # les identifiants de curiosités, lus dans la Frise
    curios = subprocess.run(
        ['node', '-e',
         "const fs=require('fs');"
         "const F=new Function(fs.readFileSync('js/frise.js','utf8')+'; return FRISE;')();"
         "console.log(JSON.stringify(F.filter(e=>e.id).map(e=>e.id)));"],
        cwd=RACINE, capture_output=True, text=True, encoding='utf-8')
    if curios.returncode:
        raise SystemExit('lecture des curiosités impossible :' + (curios.stderr or ''))

    # les identifiants de lieux, lus dans la Carte
    lieux = subprocess.run(
        ['node', '-e',
         "const fs=require('fs');"
         "const s=fs.readFileSync('js/hub.js','utf8');"
         "console.log(JSON.stringify([...s.matchAll(/\\{ id: '([a-z]+)'/g)].map(m=>({id:m[1]}))));"],
        cwd=RACINE, capture_output=True, text=True, encoding='utf-8')
    if lieux.returncode:
        raise SystemExit('lecture des lieux impossible :\n' + (lieux.stderr or ''))

    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False,
                                     dir=RACINE, encoding='utf-8') as f:
        f.write(script)
        chemin = f.name
    try:
        r = subprocess.run(['node', os.path.basename(chemin), lieux.stdout.strip()],
                           cwd=RACINE, capture_output=True, text=True, encoding='utf-8')
        if r.returncode:
            raise SystemExit('Node a échoué :\n' + (r.stderr or ''))
        return (json.loads(r.stdout),
                {l['id'] for l in json.loads(lieux.stdout)},
                set(json.loads(curios.stdout)))
    finally:
        os.unlink(chemin)


def main():
    quetes, lieux, curiosites = lire_les_quetes()
    fautes = []
    enigmes = 0

    print('%d quêtes lues dans js/quetes.js\n' % len(quetes))

    for q in quetes:
        for i, e in enumerate(q['etapes']):
            cle = (q['id'], i)

            if e['type'] == 'enigme':
                enigmes += 1
                if e['reponse'] is None:
                    fautes.append("« %s » étape %d : énigme sans réponse" % (q['titre'], i))
                    continue
                if not e['indice']:
                    fautes.append("« %s » étape %d : énigme sans indice — "
                                  "une erreur doit apprendre quelque chose" % (q['titre'], i))
                if cle not in CALCULS:
                    fautes.append("« %s » étape %d : énigme non vérifiée par ce script "
                                  "(ajoutez son calcul dans CALCULS)" % (q['titre'], i))
                    continue
                calcul, comment = CALCULS[cle]
                attendu = calcul()
                if attendu != e['reponse']:
                    fautes.append("« %s » étape %d attend %s, or le %s donne %s\n      question : %s"
                                  % (q['titre'], i, e['reponse'], comment, attendu, e['question']))

            if e['type'] == 'faire':
                if not e['aObjectif']:
                    fautes.append("« %s » étape %d : objectif sans test — "
                                  "il ne pourrait jamais se cocher" % (q['titre'], i))
                if e['ou'] and e['ou'] not in lieux:
                    fautes.append("« %s » étape %d envoie à « %s », qui n'existe pas sur la Carte"
                                  % (q['titre'], i, e['ou']))

        if not q['etapes']:
            fautes.append("« %s » n'a aucune étape" % q['titre'])
        if q['etapes'] and q['etapes'][-1]['type'] == 'faire':
            fautes.append("« %s » se termine sur un objectif : la dernière étape "
                          "doit conclure, sinon la quête s'achève sans un mot" % q['titre'])
        # Une curiosité est une entrée de la Frise portant un `id`. Une
        # récompense qui pointerait ailleurs donnerait au joueur un objet
        # introuvable, et le Carnet afficherait un trou.
        if q['objet'] and q['objet'] not in curiosites:
            fautes.append("« %s » offre la curiosité « %s », qui n'existe pas dans la Frise"
                          % (q['titre'], q['objet']))

        # Une quête rejouable se relance sans fin : la moindre récompense en
        # ferait une source infinie, et le testeur ne mesurerait plus jamais
        # l'économie réelle. Une curiosité, elle, ne se donne qu'une fois —
        # l'offrir ici serait promettre ce qu'on ne tiendrait pas.
        if q['rejouable']:
            r = q['recompense']
            verse = [k for k in ('jetons', 'poussiere', 'objet') if r.get(k)]
            if verse:
                fautes.append("« %s » est rejouable et verse %s : "
                              "une source infinie" % (q['titre'], ', '.join(verse)))

        if q['batiment'] != 'gare':
            fautes.append("« %s » est rattachée à « %s », or seul le Port a un tableau"
                          % (q['titre'], q['batiment']))

    offerts = [q['objet'] for q in quetes if q['objet']]
    for o in set(offerts):
        if offerts.count(o) > 1:
            fautes.append("la curiosité « %s » est offerte par %d quêtes : "
                          "la seconde ne donnerait rien" % (o, offerts.count(o)))

    # ---------- compte rendu ----------
    print('Quêtes par acte :')
    for a in sorted({q['acte'] for q in quetes}):
        lot = [q for q in quetes if q['acte'] == a]
        print('   acte %d — %s' % (a, ', '.join(q['titre'] for q in lot)))
    rej = [q['titre'] for q in quetes if q['rejouable']]
    if rej:
        print('Rejouable (ACTES_TEST) : %s' % ', '.join(rej))
    print('\n%d énigmes, %d objectifs.\n'
          % (enigmes, sum(1 for q in quetes for e in q['etapes'] if e['type'] == 'faire')))
    print('%d curiosités offertes sur %d définies dans la Frise.'
          % (len(offerts), len(curiosites)))

    if fautes:
        print('QUÊTES INCOHÉRENTES — %d faute%s :\n' % (len(fautes), 's' if len(fautes) > 1 else ''))
        for f in fautes:
            print('   • ' + f)
        raise SystemExit(1)

    print('Toutes les énigmes ont été recalculées et tombent juste.')
    print('Tous les objectifs sont testables et pointent vers un lieu réel.')
    print('Chaque curiosité offerte existe dans la Frise, et une seule fois.')


if __name__ == '__main__':
    main()
