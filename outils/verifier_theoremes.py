#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vérifie que chaque théorème est un énoncé complet et vrai.

Un théorème du jeu n'est pas une sélection de jolis nombres : c'est une
affirmation. « Les quatre nombres parfaits sous dix mille » promet qu'il n'y en
a pas un cinquième. Si la liste en oubliait un, ou en contenait un de trop, le
jeu mentirait sur exactement ce qu'il prétend démontrer — et personne ne s'en
apercevrait avant qu'un joueur ne vérifie.

Ce script lit COLLECTIONS dans js/data.js et **échoue si une liste n'a pas de
définition mathématique en face**. Ajouter un théorème sans le prouver devient
donc impossible sans le voir.

    python outils/verifier_theoremes.py
"""
import io
import re
import sys
from math import comb, factorial
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

RACINE = Path(__file__).resolve().parent.parent
VIVIER = 9999          # le tirage va de 1 à 9999 : un théorème ne peut pas sortir de là


# ---------- outils arithmétiques ----------
def diviseurs_propres(n):
    return [d for d in range(1, n) if n % d == 0]


def nb_diviseurs(n):
    total, reste, d = 1, n, 2
    while d * d <= reste:
        e = 0
        while reste % d == 0:
            reste //= d
            e += 1
        total *= e + 1
        d += 1
    if reste > 1:
        total *= 2
    return total


def premier(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True


def suite(a, b):
    """Termes ≤ VIVIER d'une suite additive partant de a, b."""
    s = [a, b]
    while s[-1] + s[-2] <= VIVIER:
        s.append(s[-1] + s[-2])
    return sorted({x for x in s if 1 <= x <= VIVIER})


def puissances(base):
    out, e = [], 0
    while base ** e <= VIVIER:
        out.append(base ** e)
        e += 1
    return out


def amiables():
    out = []
    for a in range(2, VIVIER + 1):
        b = sum(diviseurs_propres(a))
        if b != a and b <= VIVIER and sum(diviseurs_propres(b)) == a:
            out.append(a)
    return sorted(out)


def hautement_composes():
    out, record = [], 0
    for n in range(1, VIVIER + 1):
        d = nb_diviseurs(n)
        if d > record:
            record = d
            out.append(n)
    return out


def catalan():
    out, k = [], 0
    while comb(2 * k, k) // (k + 1) <= VIVIER:
        out.append(comb(2 * k, k) // (k + 1))
        k += 1
    return sorted(set(out))


def factorielles():
    out, k = [], 1
    while factorial(k) <= VIVIER:
        out.append(factorial(k))
        k += 1
    return out


def narcissiques():
    return [n for n in range(1, VIVIER + 1)
            if n == sum(int(c) ** len(str(n)) for c in str(n))]


def parfaits():
    return [n for n in range(2, VIVIER + 1) if sum(diviseurs_propres(n)) == n]


def mersenne():
    return sorted({2 ** p - 1 for p in range(2, 20)
                   if premier(p) and premier(2 ** p - 1) and 2 ** p - 1 <= VIVIER})


# Une entrée par théorème : l'ensemble EXACT que sa description promet.
# La clé est l'identifiant tel qu'il figure dans js/data.js.
ATTENDUS = {
    'parfaits':     parfaits,
    'fibo':         lambda: [x for x in suite(1, 2) if x >= 1][:15],
    'pow2':         lambda: [x for x in puissances(2) if x <= 8192],
    'premiers10':   lambda: [n for n in range(2, 40) if premier(n)][:10],
    'carres':       lambda: [i * i for i in range(1, 11)],
    'narcissiq':    lambda: [n for n in narcissiques() if n >= 100],
    'horloge':      lambda: list(range(1, 13)),
    'triangles':    lambda: [i * (i + 1) // 2 for i in range(1, 11)],
    'mersenne':     mersenne,
    'repdigits':    lambda: [c * 11 for c in range(1, 10)],
    'millenaire':   lambda: [k * 1000 for k in range(1, 10)],
    'factorielles': factorielles,
    'catalan':      catalan,
    'pow3':         lambda: puissances(3),
    'cubes':        lambda: [i ** 3 for i in range(1, 100) if i ** 3 <= VIVIER],
    'lucas':        lambda: suite(2, 1),
    'amiables':     amiables,
    'hautcomp':     hautement_composes,

    # Ces deux-là n'ont pas de définition arithmétique : ce sont des choix
    # assumés, et leurs descriptions le disent (« aucune propriété commune »,
    # « rien ne les relie »). On vérifie seulement qu'ils tiennent dans le
    # vivier — les inventer plus rigoureux serait mentir sur ce qu'ils sont.
    'pantheon':     None,
    'anomalies':    None,
}


def lire_collections():
    source = (RACINE / 'js' / 'data.js').read_text(encoding='utf-8')
    bloc = re.search(r'const COLLECTIONS = \[(.*?)\n\];', source, re.S)
    if not bloc:
        sys.exit('COLLECTIONS introuvable dans js/data.js')

    out = []
    for m in re.finditer(r"\{\s*id:'([^']+)'.*?\}(?=,\s*(?:/\*|\{|\]|$))", bloc.group(1), re.S):
        entree, ident = m.group(0), m.group(1)
        nums = re.search(r'nums:\[([\d,\s]*)\]', entree)
        pred = re.search(r'pred:\{', entree)
        out.append({
            'id': ident,
            'nums': [int(x) for x in nums.group(1).split(',') if x.strip()] if nums else None,
            'pred': bool(pred),
        })
    return out


def main():
    collections = lire_collections()
    manquants, faux, hors_vivier = [], [], []
    verifies = 0

    for c in collections:
        if c['pred']:
            continue                      # théorème à prédicat : rien à énumérer
        if c['id'] not in ATTENDUS:
            manquants.append(c['id'])
            continue

        nums = c['nums'] or []
        dehors = [n for n in nums if not (1 <= n <= VIVIER)]
        if dehors:
            hors_vivier.append((c['id'], dehors))

        calcul = ATTENDUS[c['id']]
        if calcul is None:                # ensemble choisi, pas déduit
            continue

        reel, voulu = sorted(nums), sorted(calcul())
        if reel != voulu:
            faux.append((c['id'], set(voulu) - set(reel), set(reel) - set(voulu)))
        else:
            verifies += 1

    print(f'{len(collections)} théorèmes lus dans js/data.js')
    print(f'{verifies} listes vérifiées exactes et complètes')

    if manquants:
        print('\nSANS VÉRIFICATION — ajoutez-les à ATTENDUS :')
        for i in manquants:
            print('  ?', i)
    if hors_vivier:
        print('\nHORS DU VIVIER (1 à 9999) — le tirage ne peut pas les donner :')
        for i, d in hors_vivier:
            print(f'  ✗ {i} : {d}')
    if faux:
        print('\nLISTES FAUSSES :')
        for i, oublies, en_trop in faux:
            if oublies:
                print(f'  ✗ {i} — oubliés : {sorted(oublies)}')
            if en_trop:
                print(f'  ✗ {i} — en trop : {sorted(en_trop)}')

    orphelines = set(ATTENDUS) - {c['id'] for c in collections}
    if orphelines:
        print('\nVérifications devenues inutiles (théorème retiré) :')
        for i in sorted(orphelines):
            print('  ·', i)

    if manquants or faux or hors_vivier:
        sys.exit(1)
    print('\nTous les théorèmes énumérables sont exacts et complets.')


if __name__ == '__main__':
    main()
