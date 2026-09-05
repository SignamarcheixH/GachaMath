# -*- coding: utf-8 -*-
"""Prouve que le barème des traits suit leur rareté réelle, et rien d'autre.

Le jeu promet que la rareté se calcule au lieu de se décréter. C'était vrai de
la LISTE des traits et faux de leur VALEUR : les points étaient posés à la main,
et ça se voyait — « Puissant » (1,8 % des nombres) valait autant que « Pratique »
(14,6 %), et « Fibonacci » (19 nombres) moins qu'« Idoine d'Euler » (65).

Ce script rejoue le calcul de `outils/calculer_points.js` et refuse de passer si
la source s'en écarte. Il vérifie trois choses :

  1. CHAQUE TRAIT vaut exactement ce que sa fréquence commande ;
  2. LA MONOTONIE : aucun trait plus rare ne vaut moins qu'un trait plus courant ;
  3. LES PALIERS descendent : chaque niveau de rareté est plus petit que le
     précédent. C'est cette règle qui manquait — l'ancien réglage donnait onze
     Légendaires pour douze Mythiques.

Il échoue bruyamment, comme verifier_theoremes.py et verifier_decors.py : un
barème faux ne doit pas pouvoir être mis en ligne sans qu'on le sache.

Usage : python outils/verifier_points.py
"""
import io
import json
import math
import os
import re
import subprocess
import sys
import tempfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIVIER = 9999
K = 1.5                       # le facteur d'échelle, identique au calculateur
PLANCHER = math.log2(5)       # un nombre sur cinq : en deçà, ce n'est plus une distinction


def lire_le_moteur():
    """Fait tourner le moteur du jeu et rend ce qu'il sait : effectifs, points,
    seuils, tailles de paliers. On passe par Node plutôt que de réimplémenter
    soixante-cinq tests en Python — une seconde implémentation dériverait."""
    script = r"""
const fs = require('fs');
const M = new Function(
  ['js/numerology.js', 'js/data.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n')
  + '; return { evaluate, TRAITS, RARITIES };')();

const N = 9999, eff = {}, paliers = {};
M.RARITIES.forEach(r => paliers[r.key] = 0);
for (let n = 1; n <= N; n++) {
  const ev = M.evaluate(n);
  paliers[ev.rarity.key]++;
  for (const t of ev.traits || []) eff[t.id] = (eff[t.id] || 0) + 1;
}
console.log(JSON.stringify({
  effectifs: eff,
  traits: M.TRAITS.map(t => ({ id: t.id, label: t.label, pts: t.pts })),
  raretes: M.RARITIES.map(r => ({ key: r.key, min: r.min })),
  paliers,
}));
"""
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False,
                                     dir=RACINE, encoding='utf-8') as f:
        f.write(script)
        chemin = f.name
    try:
        sortie = subprocess.run(['node', os.path.basename(chemin)], cwd=RACINE,
                                capture_output=True, text=True, encoding='utf-8')
        if sortie.returncode:
            raise SystemExit('Node a échoué :\n' + (sortie.stderr or ''))
        return json.loads(sortie.stdout)
    finally:
        os.unlink(chemin)


def points_attendus(effectif):
    bits = math.log2(VIVIER / max(1, effectif))
    return 0 if bits < PLANCHER else round(K * bits)


def main():
    m = lire_le_moteur()
    eff = m['effectifs']
    fautes = []

    # ---------- 1. chaque trait vaut ce que sa fréquence commande ----------
    print('%d traits lus dans js/numerology.js\n' % len(m['traits']))
    for t in m['traits']:
        n = eff.get(t['id'], 0)
        attendu = points_attendus(n)
        if t['pts'] != attendu:
            fautes.append("« %s » porte %d points, sa fréquence (%d nombres, %.2f %%) "
                          "en commande %d" % (t['label'], t['pts'], n, 100.0 * n / VIVIER, attendu))

    # ---------- 2. la monotonie ----------
    # Un trait plus rare ne peut pas valoir moins qu'un trait plus courant.
    # C'est la règle que l'ancien barème violait le plus visiblement.
    tri = sorted(m['traits'], key=lambda t: eff.get(t['id'], 0))
    for i, a in enumerate(tri):
        for b in tri[i + 1:]:
            na, nb = eff.get(a['id'], 0), eff.get(b['id'], 0)
            if na < nb and a['pts'] < b['pts']:
                fautes.append("« %s » (%d nombres) vaut %d, moins que « %s » (%d nombres) qui vaut %d"
                              % (a['label'], na, a['pts'], b['label'], nb, b['pts']))
                break

    # ---------- 3. les paliers descendent ----------
    ordre = [r['key'] for r in m['raretes']]
    tailles = [m['paliers'][k] for k in ordre]
    print('Paliers :')
    for k, n in zip(ordre, tailles):
        print('   %-12s %5d nombres   %6.2f %%' % (k, n, 100.0 * n / VIVIER))
    print()
    for i in range(2, len(ordre)):
        if tailles[i] > tailles[i - 1]:
            fautes.append("le palier « %s » (%d) est plus grand que « %s » (%d) : "
                          "la rareté ne descend pas"
                          % (ordre[i], tailles[i], ordre[i - 1], tailles[i - 1]))

    if sum(tailles) != VIVIER:
        fautes.append("les paliers totalisent %d nombres au lieu de %d" % (sum(tailles), VIVIER))

    # ---------- verdict ----------
    if fautes:
        print('BARÈME INCOHÉRENT — %d faute%s :\n' % (len(fautes), 's' if len(fautes) > 1 else ''))
        for f in fautes:
            print('   • ' + f)
        print('\nRelancez `node outils/calculer_points.js --ecrire` pour rétablir.')
        raise SystemExit(1)

    print('Chaque trait vaut exactement ce que sa rareté commande.')
    print('Aucun trait plus rare ne vaut moins qu\'un trait plus courant.')
    print('Les six paliers descendent.')


if __name__ == '__main__':
    main()
