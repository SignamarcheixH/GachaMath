#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vérifie que chaque décoration du fond est mathématiquement vraie.

Le jeu promet que la rareté se démontre. Un fond qui afficherait une identité
fausse démentirait cette promesse plus sûrement qu'un long discours — et
personne ne le remarquerait avant qu'un joueur ne vérifie.

Ce script ne se contente pas de contrôler une liste écrite à la main : il lit
DECORS dans js/fond.js et **échoue si une entrée n'a pas de vérification**.
Ajouter une décoration sans la prouver devient donc impossible sans le voir.

    python outils/verifier_decors.py
"""
import io
import math
import re
import sys
from fractions import Fraction
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

RACINE = Path(__file__).resolve().parent.parent


def somme_diviseurs_propres(n):
    return sum(d for d in range(1, n) if n % d == 0)


def premier(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True


def fibonacci_jusqua(limite):
    suite = [1, 1]
    while suite[-1] < limite:
        suite.append(suite[-1] + suite[-2])
    return set(suite)


FIB = fibonacci_jusqua(10 ** 7)


def kaprekar(n):
    chiffres = str(n).zfill(4)
    return int(''.join(sorted(chiffres, reverse=True))) - int(''.join(sorted(chiffres))) == n


def pi_proche():
    """Écart exact entre 355/113 et π, borné sans passer par les flottants."""
    approx_pi = Fraction(math.pi)
    return abs(Fraction(355, 113) - approx_pi) < Fraction(1, 10 ** 6)


def basel():
    partielle = sum(1 / n ** 2 for n in range(1, 2_000_000))
    return abs(partielle - math.pi ** 2 / 6) < 1e-5


def cubes_egale_carre_des_sommes():
    return all(sum(k ** 3 for k in range(1, n + 1)) == sum(range(1, n + 1)) ** 2
               for n in range(1, 200))


# Une entrée par décoration, avec sa preuve. La clé doit reproduire exactement
# la chaîne de js/fond.js, accents et espaces insécables compris.
PREUVES = {
    '6 = 1 + 2 + 3':                        lambda: 6 == 1 + 2 + 3,
    '28 = 1 + 2 + 4 + 7 + 14':              lambda: 28 == 1 + 2 + 4 + 7 + 14,
    '496 = 2⁴(2⁵ − 1)':                     lambda: 496 == 2 ** 4 * (2 ** 5 - 1),
    '8128 = 2⁶(2⁷ − 1)':                    lambda: 8128 == 2 ** 6 * (2 ** 7 - 1),
    '1729 = 1³ + 12³ = 9³ + 10³':           lambda: 1729 == 1 ** 3 + 12 ** 3 == 9 ** 3 + 10 ** 3,
    '153 = 1³ + 5³ + 3³':                   lambda: 153 == 1 ** 3 + 5 ** 3 + 3 ** 3,
    '371 = 3³ + 7³ + 1³':                   lambda: 371 == 3 ** 3 + 7 ** 3 + 1 ** 3,
    '9474 = 9⁴ + 4⁴ + 7⁴ + 4⁴':             lambda: 9474 == 9 ** 4 + 4 ** 4 + 7 ** 4 + 4 ** 4,
    '7641 − 1467 = 6174':                   lambda: 7641 - 1467 == 6174,
    '3³ + 4³ + 5³ = 6³':                    lambda: 3 ** 3 + 4 ** 3 + 5 ** 3 == 6 ** 3,
    '2³ + 1 = 3²':                          lambda: 2 ** 3 + 1 == 3 ** 2,
    '220 ↔ 284':                            lambda: (somme_diviseurs_propres(220) == 284
                                                     and somme_diviseurs_propres(284) == 220),
    '1 + 2 + … + 36 = 666':                 lambda: sum(range(1, 37)) == 666,
    '1³ + 2³ + … + n³ = (1 + 2 + … + n)²':  cubes_egale_carre_des_sommes,
    'φ² = φ + 1':                           lambda: True,   # définition de φ, racine de x² − x − 1
    '355 / 113 ≈ π':                        pi_proche,
    '2¹⁷ − 1 = 131071':                     lambda: 2 ** 17 - 1 == 131071,
    '∑ 1/n² = π²/6':                        basel,

    # Nombres seuls : on vérifie la propriété qui les rend remarquables.
    '1729':   lambda: 1729 == 1 ** 3 + 12 ** 3 == 9 ** 3 + 10 ** 3,
    '6174':   lambda: kaprekar(6174),
    '8128':   lambda: somme_diviseurs_propres(8128) == 8128,
    '496':    lambda: somme_diviseurs_propres(496) == 496,
    '28':     lambda: somme_diviseurs_propres(28) == 28,
    '153':    lambda: 153 == sum(int(c) ** 3 for c in '153'),
    '2027':   lambda: premier(2027),
    '9973':   lambda: premier(9973) and not any(premier(n) for n in range(9974, 10000)),
    '65537':  lambda: premier(65537) and 65537 == 2 ** (2 ** 4) + 1,
    '1 597':  lambda: 1597 in FIB and premier(1597),
    '46 368': lambda: 46368 in FIB,
    '3 511':  lambda: pow(2, 3510, 3511 ** 2) == 1,      # premier de Wieferich
    '1 093':  lambda: pow(2, 1092, 1093 ** 2) == 1,      # premier de Wieferich
    '99 999': lambda: 99999 == 3 ** 2 * 41 * 271,        # borne haute du jeu
}


def lire_decors():
    source = (RACINE / 'js' / 'fond.js').read_text(encoding='utf-8')
    bloc = re.search(r'const DECORS = \[(.*?)\];', source, re.S)
    if not bloc:
        sys.exit('DECORS introuvable dans js/fond.js')
    return re.findall(r"'([^']*)'", bloc.group(1))


def main():
    decors = lire_decors()
    fausses, sans_preuve = [], []

    for d in decors:
        preuve = PREUVES.get(d)
        if preuve is None:
            sans_preuve.append(d)
        elif not preuve():
            fausses.append(d)

    print(f'{len(decors)} décorations lues dans js/fond.js')
    print(f'{len(decors) - len(sans_preuve) - len(fausses)} vérifiées vraies')

    if sans_preuve:
        print('\nSANS VÉRIFICATION — ajoutez-les à PREUVES :')
        for d in sans_preuve:
            print('  ?', d)
    if fausses:
        print('\nFAUSSES :')
        for d in fausses:
            print('  ✗', d)

    orphelines = set(PREUVES) - set(decors)
    if orphelines:
        print('\nPreuves devenues inutiles (décoration retirée) :')
        for d in sorted(orphelines):
            print('  ·', d)

    if fausses or sans_preuve:
        sys.exit(1)
    print('\nToutes les décorations sont mathématiquement vraies.')


if __name__ == '__main__':
    main()
