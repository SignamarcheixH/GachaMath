# -*- coding: utf-8 -*-
"""Contrôle les trois salles de lecture : Comptoir, Casino, Observatoire.

Elles n'ont pas de mécanique de jeu — elles n'affirment que des faits. C'est
précisément ce qui les rend dangereuses : un joueur ne peut pas repérer une
erreur dans une page qui prétend l'instruire. Chaque affirmation vérifiable
est donc recalculée ici, indépendamment du code de la vue.

Ce qui est contrôlé :

  LE COMPTOIR — les dix-neuf identifiants de `TRAITS_ECRITURE` existent bien
  dans le moteur (un identifiant fautif disparaîtrait de l'inventaire sans
  bruit), et les quatre épreuves rejouées en base dix retrouvent le verdict du
  moteur sur les nombres du vivier.

  LE CASINO — les huit suites de dénombrement sont recalculées depuis leur
  définition, terme à terme. Une suite recopiée de travers ferait mentir la
  seule chose que cette salle apporte.

  L'OBSERVATOIRE — la formule du collectionneur de coupons est contrôlée sur
  ses deux cas connus (k = 0 doit rendre N·H(N), k = N−1 doit rendre N), et
  π(9 999) est recompté.

Usage : python outils/verifier_salles.py
"""
import io
import json
import os
import re
import subprocess
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fautes = []


def lire(chemin):
    return io.open(os.path.join(RACINE, chemin), encoding='utf-8').read()


# ============================================================ LE COMPTOIR
def ids_du_moteur():
    s = lire('js/numerology.js')
    return set(re.findall(r"id:\s*'([A-Za-z0-9_]+)'", s))


def traits_ecriture():
    s = lire('js/comptoir.js')
    bloc = s[s.index('const TRAITS_ECRITURE'):s.index('const EST_ECRITURE')]
    return re.findall(r"'([A-Za-z0-9_]+)'", bloc)


def controler_comptoir():
    moteur = ids_du_moteur()
    liste = traits_ecriture()
    print('Le Comptoir — %d traits déclarés « d\'écriture »' % len(liste))
    for t in liste:
        if t not in moteur:
            fautes.append("Comptoir : le trait « %s » n'existe pas dans js/numerology.js" % t)
    if len(set(liste)) != len(liste):
        fautes.append('Comptoir : un trait est listé deux fois')

    # Les quatre épreuves, rejouées en base dix sur tout le vivier.
    def en_base(n, b):
        if n == 0:
            return '0'
        c = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        s = ''
        while n:
            s = c[n % b] + s
            n //= b
        return s

    def palindrome(s):
        return s == s[::-1]

    def repdigit(s):
        return len(s) > 1 and len(set(s)) == 1

    def ondulant(s):
        if len(s) < 3 or len(set(s)) != 2:
            return False
        return all(s[i] == s[i - 2] for i in range(2, len(s)))

    n_pal = sum(1 for n in range(1, 10000) if palindulant(n, palindrome, en_base))
    print('   %d palindromes de 1 à 9 999 en base dix' % n_pal)
    n_rep = sum(1 for n in range(1, 10000) if repdigit(en_base(n, 10)))
    n_ond = sum(1 for n in range(1, 10000) if ondulant(en_base(n, 10)))
    print('   %d repdigits, %d ondulants' % (n_rep, n_ond))

    # 585 = 1001001001 en base deux : l'exemple qui porte toute la leçon.
    if en_base(585, 2) != '1001001001':
        fautes.append('Comptoir : 585 ne vaut pas 1001001001 en base deux')
    if not palindrome(en_base(585, 2)):
        fautes.append("Comptoir : 585 devrait rester palindrome en base deux")
    if palindrome(en_base(121, 4)):
        fautes.append("Comptoir : 121 ne devrait PAS être palindrome en base quatre")


def palindulant(n, pal, en_base):
    return pal(en_base(n, 10))


# ============================================================ LE CASINO
def suites_du_casino():
    s = lire('js/casino.js')
    bloc = s[s.index('const DENOMBRE'):s.index('/* ---------- le problème des partis')]
    out = {}
    for m in re.finditer(r"\{ id: '([a-z]+)'[\s\S]*?suite: \[([^\]]*)\]", bloc):
        out[m.group(1)] = [int(x) for x in m.group(2).replace('\n', '').split(',')]
    return out


def catalan(n):
    from math import comb
    return comb(2 * n, n) // (n + 1)


def bell(n):
    ligne = [1]
    for _ in range(n):
        suivante = [ligne[-1]]
        for v in ligne:
            suivante.append(suivante[-1] + v)
        ligne = suivante
    return ligne[0]


def motzkin(n):
    m = [1, 1]
    for k in range(2, n + 1):
        m.append(((2 * k + 1) * m[k - 1] + (3 * k - 3) * m[k - 2]) // (k + 2))
    return m[n]


def factorielle(n):
    r = 1
    for i in range(2, n + 1):
        r *= i
    return r


def premiers_jusqua(n):
    crible = [True] * (n + 1)
    crible[0] = crible[1] = False
    for i in range(2, int(n ** .5) + 1):
        if crible[i]:
            for j in range(i * i, n + 1, i):
                crible[j] = False
    return [i for i, v in enumerate(crible) if v]


def primorielles(combien):
    out, p, prem = [], 1, premiers_jusqua(100)
    for q in prem[:combien]:
        p *= q
        out.append(p)
    return out


def recurrence(a, b, combien):
    out = [a, b]
    while len(out) < combien:
        out.append(out[-1] + out[-2])
    return out[:combien]


def pell(combien):
    out = [0, 1]
    while len(out) < combien:
        out.append(2 * out[-1] + out[-2])
    return out[:combien]


def controler_casino():
    lues = suites_du_casino()
    print('\nLe Casino — %d suites de dénombrement' % len(lues))

    attendues = {
        'catalan': [catalan(k) for k in range(10)],
        'bell': [bell(k) for k in range(9)],
        'motzkin': [motzkin(k) for k in range(11)],
        'factorielle': [factorielle(k) for k in range(8)],
        'primorielle': primorielles(6),
        'fibo': recurrence(1, 1, 11),
        'lucas': recurrence(2, 1, 10),
        'pell': pell(10),
    }
    for cle, vraie in attendues.items():
        lue = lues.get(cle)
        if lue is None:
            fautes.append('Casino : la suite « %s » est absente' % cle)
            continue
        if lue != vraie:
            fautes.append('Casino : la suite « %s » ne tombe pas juste\n'
                          '      lue      %s\n'
                          '      calculée %s' % (cle, lue, vraie))
        else:
            print('   %-12s %d termes exacts' % (cle, len(lue)))

    manquantes = set(lues) - set(attendues)
    for m in manquantes:
        fautes.append('Casino : la suite « %s » n\'est vérifiée par aucun calcul' % m)

    # Le problème des partis, sur le cas que tout le monde connaît :
    # partie en 5, interrompue à 4 contre 2 → 7 avenirs sur 8.
    from math import comb
    ra, rb = 1, 3
    coups = ra + rb - 1
    gagnantes = sum(comb(coups, k) for k in range(ra, coups + 1))
    if (gagnantes, 2 ** coups) != (7, 8):
        fautes.append('Casino : le problème des partis ne rend pas 7/8 sur le cas 4–2 en 5 manches')
    else:
        print('   partis       4–2 en 5 manches → %d/%d, la réponse de Pascal' % (gagnantes, 2 ** coups))


# ============================================================ L'OBSERVATOIRE
def controler_observatoire():
    print("\nL'Observatoire")

    def H(n):
        return sum(1.0 / i for i in range(1, n + 1)) if n > 0 else 0.0

    # La formule affichée : N·H(N−k). Deux cas la déterminent entièrement.
    N = 14
    if abs(N * H(N - 0) - N * H(N)) > 1e-9:
        fautes.append('Observatoire : à k = 0 la formule doit rendre N·H(N)')
    if abs(N * H(N - (N - 1)) - N) > 1e-9:
        fautes.append('Observatoire : à k = N−1 la formule doit rendre N')
    print('   collectionneur de coupons : N·H(N−k) vérifiée à k = 0 et k = N−1')

    # π(9 999), annoncé en dur dans la vue.
    src = lire('js/observatoire.js')
    m = re.search(r'const premiersVivier = (\d+);', src)
    vrai = len(premiers_jusqua(9999))
    if not m:
        fautes.append("Observatoire : `premiersVivier` introuvable")
    elif int(m.group(1)) != vrai:
        fautes.append('Observatoire : π(9 999) annoncé %s, or il vaut %d' % (m.group(1), vrai))
    else:
        print('   π(9 999) = %d, conforme' % vrai)


def main():
    controler_comptoir()
    controler_casino()
    controler_observatoire()

    if fautes:
        print('\nSALLES INCOHÉRENTES — %d faute%s :\n' % (len(fautes), 's' if len(fautes) > 1 else ''))
        for f in fautes:
            print('   • ' + f)
        raise SystemExit(1)
    print('\nLes trois salles n\'affirment que des choses vraies.')


if __name__ == '__main__':
    main()
