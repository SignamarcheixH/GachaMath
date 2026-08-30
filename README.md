# 🔢 Gacha des Nombres

Un gacha où l'on collectionne des **entiers**. La blague, c'est que la rareté n'est
pas décidée par un serveur : elle est **calculée**. Un nombre est rare parce qu'il
*est* rare — parfait, narcissique, vampire, taxicab, palindrome, premier de Mersenne.

Il n'y a que quatre nombres parfaits sous dix mille. Ils sont donc Mythiques. C'est tout.

## Lancer

Le jeu tourne de deux façons. **Avec le serveur** — sauvegarde en ligne et
classement :

```bash
pip install -r serveur/requirements.txt
cd serveur && python manage.py migrate && python manage.py runserver 8778
```

Tout est alors sur <http://127.0.0.1:8778/> : le jeu à la racine, l'API sous
`/api/`, le back office sous `/admin/`. Même origine, aucun CORS.

**Sans le serveur** — le jeu seul, sauvegardé dans le navigateur. Aucune
dépendance, aucun build :

```bash
python -m http.server 8777
```

La couche réseau se sonde une fois, ne trouve rien, et s'efface : l'indicateur
affiche « Partie locale » et propose de télécharger un fichier. (Un double-clic
sur `index.html` fonctionne aussi, mais certains navigateurs bloquent
`localStorage` sur `file://` — la partie ne serait alors pas sauvegardée.)

## Les deux mécaniques

### 1. Le Tirage

80 jetons + 2 par nombre déjà possédé (*inflation numérique*). Le vivier va de
**1 à 9 999**, chaque entier ayant été évalué au chargement et rangé dans son
palier. Garanties classiques : Épique tous les 30 tirages, Légendaire tous les 90.

La **taille du paquet** se choisit — ×1, ×10, ×25, ×50, ×100 — avec une remise
croissante (0, 10, 12, 15 et 20 %). Au-delà de vingt cartes, la révélation
renonce au retournement carte par carte : cent animations en cascade feraient
attendre pour rien. La grille passe en mode compact, défilante, et le bandeau
« NOUVEAU » se réduit à un point — sur cent cartes presque toutes neuves, il ne
disait plus rien.

Dans le récapitulatif, les **doublons sont estompés** : la proportion de
nouveaux se lit d'un coup d'œil, sans compter.

Une **pastille sur l'onglet** indique en permanence combien de tirages le
portefeuille permet, au prix unitaire, rafraîchie cinq fois par seconde. Elle
passe au vert dès que le paquet sélectionné est payable.

### 2. La Forge — Le Compte est Bon

Le tirage règne sur **1 à 9 999** : c'est la chance. La Forge règne sur le
reste — **0**, et **10 000 à 99 999** : c'est l'adresse. Deux territoires, deux
jeux, une seule collection.

Ici vous ne choisissez pas ce que vous fabriquez. La Forge pioche **six nombres**
dans votre collection, annonce une **cible**, et vous laisse chercher. Chaque
pièce ne sert qu'une fois, mais chaque résultat devient une pièce nouvelle.

```
Cible : 15 907          Main : 7 · 9 · 299 · 360 · 1 511 · 1 888

    9 × 299   = 2 691
    7 × 1 888 = 13 216
2 691 + 13 216 = 15 907          ✅ le compte est bon
```

**Cinq opérateurs suffisent** — `+ − × ÷ ‖` (la dernière colle les chiffres bout
à bout). Personne n'a besoin de connaître l'indicatrice d'Euler pour jouer. Les
instruments de spécialiste — `⇄ Σ ∧ ∨ ↺ σ φ →` — se débloquent avec la taille de
la collection et ne sont **jamais nécessaires** : ce sont des raccourcis.

**Toute commande est solvable par construction.** La Forge n'invente pas une
cible en croisant les doigts : elle explore d'abord, par programmation dynamique
sur les sous-ensembles, l'intégralité de ce que la main peut produire, puis
choisit la cible là-dedans — pondérée par la rareté, comme le gacha, pour que la
Forge ait elle aussi ses coups d'éclat. Elle mémorise au passage l'origine de
chaque valeur, ce qui rend la reconstruction d'une solution immédiate : c'est ce
qui alimente les indices.

**La grille est le mode par défaut.** On ne part pas d'une page blanche : la
Forge annonce en combien d'étapes une solution existe, et révèle quelques cases
en guise de prises — un opérateur ici, un objectif intermédiaire là.

```
1  [3 060]  [÷]  [30]   = 102        ← résolue
2    ▢       ▢    ▢     = 226        ← objectif révélé, ligne en cours
3   [57]     ▢    ▢     = ?          ← opérande donné
4  [628]     ▢    ▢     = ?

Jetons : 124   4 491   102          (102 est né de la ligne 1)
```

**La banque ne contient pas les réponses.** Elle démarre avec les six pièces de
la main, et chaque ligne complétée y ajoute *son* résultat — celui que vous avez
produit, pas celui qu'il fallait. Poser les mauvais opérandes fabrique donc un
jeton parfaitement réel et parfaitement inutile, qu'il faudra défaire. Les jetons
issus de vos calculs se distinguent en violet de ceux de la main.

**Retirer un jeton ne touche à aucune autre ligne.** Chaque jeton posé garde
l'empreinte de sa valeur d'alors. Si celui-ci disparaît — la ligne qui le
fabriquait est redevenue incomplète — ou s'il ne vaut plus la même chose, les
lignes qui s'appuyaient dessus affichent la référence **en rouge, barrée**, avec
la mention « jeton périmé ». Rien n'est effacé d'autorité : les opérateurs et les
autres opérandes restent en place, et c'est au joueur de faire le ménage. Les
lignes qui ne dépendaient de rien continuent leur vie sans broncher.

**Clic droit sur un jeton posé** pour le retirer (le clic gauche marche aussi).
Un jeton posé se **glisse aussi d'une ligne à l'autre** : si la case d'arrivée
est occupée, les deux s'échangent. Un jeton né d'une ligne ne peut jamais
redescendre dans une ligne antérieure à celle qui le fabrique — la Forge le
refuse en le disant.

La case résultat n'est jamais
un trou — c'est soit un objectif révélé, soit ce que votre calcul donne, affiché
en rouge s'il ne correspond pas à l'objectif annoncé. Les opérateurs, eux, sont
réutilisables : ce ne sont pas des ressources.

**Résoudre une commande rapporte des cartes bonus** en plus de la cible : des
nombres tirés exactement comme au gacha, avec les mêmes cotes, révélés dans la
même animation de cartes. Leur nombre vaut **1 + le nombre d'étapes** de la
commande — trois cartes pour un puzzle à deux lignes, six pour un puzzle à cinq.

**💡 Révéler un indice** dévoile un objectif intermédiaire de plus, puis un
opérateur, sans jamais toucher à vos placements. Chaque indice demandé **retire
une carte bonus** : l'aide se paie en butin, pas en frustration, et le bandeau
affiche en permanence ce qui reste à gagner. Les cases offertes au départ, elles,
sont gratuites. **↩ Mode libre** rend
l'établi sans grille ni nombre d'étapes imposé, pour ceux qui préfèrent chercher
à découvert.

**Forger est gratuit et illimité.** La poussière, née des doublons, ne paie plus
la fabrication mais le **secours** : repiocher une autre main capable d'atteindre
la même cible (250 ✨), ou révéler une étape d'une solution valide (600 ✨).

**Le compte n'est pas bon, mais…** Si vous échouez, tout autre nombre forgeable
resté sur l'établi peut être emporté — sans la prime. On ne repart jamais
bredouille.

### Autour

- **Collection** — deux territoires nettement séparés : les nombres **obtenables
  au tirage** (1 à 9 999) et ceux qui ne s'obtiennent **qu'à la Forge** (0, et
  au-delà de 9 999). Ces derniers portent un coin coupé cyan — la couleur étant
  déjà prise par la rareté, il fallait un second canal, orthogonal. Deux chips
  filtrent l'un ou l'autre, et le compteur les distingue
  (`296 / 9 999 tirables` · `⚒️ 5 forgés`).
  Des **tuiles carrées ne portant que le nombre** : à dix mille
  cases, le surnom et les pictogrammes de traits saturaient la grille, et la
  couleur suffit à dire la rareté. Le détail reste au survol et au clic.
  Filtres par rareté, recherche, quatre tris. Le bouton
  *Vue exhaustive* bascule sur la carte complète du vivier : les 9 999 nombres,
  ceux que vous n'avez pas encore affichés en creux mais toujours colorés par
  rareté. Une carte de la conquête autant que de ce qui reste.
- **Théorèmes** — 14 collections thématiques (Les Parfaits, Le Panthéon, Les
  Puissances de Deux…). En compléter une donne un bonus permanent. La dernière,
  *Le Grand Large*, se compte au lieu de s'énumérer : douze nombres au-delà du
  mur, à gagner une commande à la fois.
- **Oracle** — analyse gratuite de n'importe quel entier de 0 à 99 999, avec le
  détail de ses propriétés et la démonstration de chacune. Il ne donne rien :
  il explique.
- **Démonstrations** — chaque trait affiché est accompagné de sa preuve, calculée
  pour ce nombre précis : `153 = 1³ + 5³ + 3³`, `3797 → 379 → 37 → 3`,
  `7777² = 60481729, et 6048 + 1729 = 7777`. Quand aucun calcul n'a de sens
  (Palindrome, Bizarre, un nombre culte), une phrase le remplace. Le Codex
  reprend les 65 traits avec, pour chacun, le plus petit nombre qui l'illustre —
  trouvé automatiquement, pas écrit à la main.
- **Révision** — deux exercices. **Les Vagues** : quatre nombres de votre
  collection, un trait demandé, un seul qui le porte. Trois vies. Les cartes
  sont **rigoureusement anonymes** — ni couleur de rareté, ni surnom, ni emoji,
  et les leurres sont choisis dans le même ordre de grandeur : sans ces
  précautions on réviserait la palette au lieu des mathématiques. La difficulté
  monte par paliers, du repérable à l'œil (`pair`, `carré`, `palindrome`) au
  franchement retors (`Smith`, `narcissique`, `bizarre`). Chaque réponse, juste
  ou fausse, affiche la démonstration — et pour une erreur, ce que votre nombre
  était *vraiment*.

```
Lequel de ces nombres est 🕴️ Smith ?     9 609   1 352   6 091   2 484

❌ Non — c'était 2 484.
   2 484 est smith : 2+4+8+4 = 18 — et 2484 = 2×2×3×3×3×23,
   dont les chiffres font 2+2+3+3+3+(2+3) = 18
   9 609 ne l'est pas : 3 × 3203 — il est plutôt semi-premier.
```

  **L'Appariement** : dix traits à gauche, dix définitions à droite, à remettre
  en face les uns des autres en glissant les étiquettes. Le mélange de départ
  est un **dérangement complet** — aucune étiquette ne commence en face de sa
  définition, pour qu'on ne gagne rien par hasard. Les définitions qui nomment
  leur propre concept sont **masquées** (« ▒▒▒ pensait qu'ils étaient tous
  premiers » plutôt que « Fermat pensait… »), sans quoi trois paires sur dix se
  liraient au lieu de se chercher. Chaque vérification verrouille les lignes
  justes en vert ; la récompense décroît avec le nombre de vérifications.

- **Défis** — 22 jalons, des primes, et un décompte honnête du temps investi.

## Structure

| Fichier | Rôle |
|---|---|
| `js/numerology.js` | Le moteur. Primalité, factorisation, 65 propriétés mathématiques, score de rareté. |
| `js/data.js` | Le folklore : nombres cultes, collections, opérateurs, défis. |
| `js/state.js` | Économie, tirage, acquisition, sauvegarde. Aucun DOM. |
| `js/forge.js` | Le Compte est Bon : exploration, génération de commandes, établi, indices. |
| `js/forge-ui.js` | L'établi à l'écran. |
| `js/revision.js` | Les Vagues : génération des questions, correction, rendu. |
| `js/appariement.js` | L'Appariement : tirage des paires, masquage des définitions, échanges. |
| `js/config.js` | Identifiant éditeur et emplacements publicitaires. Vide par défaut. |
| `js/pub.js` | Emplacements : réservation de place, repli si bloqué, vues autorisées. |
| `js/nuage.js` | Sauvegarde en ligne : sondage, réconciliation, compte, conflits. |
| `js/classement.js` | L'onglet Classement. |
| `js/ui.js` | Rendu et câblage du reste. |

### Sur l'exhaustivité du catalogue

Elle est impossible. « Propriété d'un entier » n'est pas une notion finie :
l'OEIS recense environ 380 000 suites, et rien n'empêche d'en définir une de
plus. Ce que le catalogue vise, c'est la couverture des **classes classiques,
nommées, et calculables sous 99 999** — soit 65 traits, répartis en familles :

| Famille | Traits |
|---|---|
| Primalité | premier, jumeau, cousin, sexy, Sophie Germain, sûr, Pythagore, emirp, tronquable à droite et à gauche, permutable, Mersenne, Fermat, Wieferich |
| Diviseurs | parfait, amical, abondant, déficient, hautement composé, pratique, puissant, Achille, sans facteur carré, semi-premier, sphénique |
| Figurés | carré, cube, triangulaire, pentagonal, hexagonal, tétraédrique, pyramidal carré |
| Suites | Fibonacci, Lucas, Pell, Catalan, Motzkin, Bell, factorielle, primorielle, puissance de 2 |
| Chiffres | palindrome, repdigit, ondulant, Harshad, Zuckerman, heureux, narcissique, Münchhausen, Dudeney, Keith, automorphe, Kaprekar, Smith, auto-nombre, Lychrel |
| Curiosités | taxicab, constante de Kaprekar, vampire, bizarre, Carmichael, idoine d'Euler, chanceux |

Sont restées dehors, faute d'être calculables à ce coût : les nombres
intouchables et semi-parfaits (somme de sous-ensembles, trop lourde sur dix
mille entiers), et tout ce qui vit au-delà de 99 999 — le prochain Mersenne
(131 071), le prochain Carmichael (101 101), le prochain nombre parfait
(33 550 336).

Les listes tabulées ont été recoupées avec les suites OEIS correspondantes, et
les densités calculées le confirment : 6 082 nombres sans facteur carré sous
10 000 pour 6/π² = 60,79 % attendus, et 1 118 nombres chanceux, valeur exacte
connue.

### Une note sur le score

Le score de rareté n'est **pas** la somme des points des traits. Les tout petits
nombres ouvrent toutes les suites à la fois — 1 est à lui seul Fibonacci, Catalan,
factorielle, Kaprekar et puissance de deux — et écrasaient tout le classement en
addition simple. Le score applique donc des rendements décroissants
(`×1, ×0.5, ×0.3, ×0.15, puis ×0.08`) : seul le trait dominant compte pleinement.

Les seuils de rareté (`0 / 3 / 8 / 12 / 18 / 27`) sont calibrés sur la
distribution réelle des scores, et **recalibrés à chaque ajout de traits** :
passer de 38 à 65 traits enrichissait mécaniquement tout le monde et avait vidé
le palier Commun de deux mille nombres. Les proportions visées sont celles-ci —
mesurées sur le vivier 1…9 999 :

| Commun | Peu commun | Rare | Épique | Légendaire | Mythique |
|---|---|---|---|---|---|
| 4 737 | 4 748 | 412 | 79 | 11 | 12 |

Les douze Mythiques : **1, 3, 5, 6, 28, 496, 1093, 1729, 3435, 3511, 6174,
8128** — les quatre nombres parfaits, les deux premiers de Wieferich, le
Münchhausen, le taxicab de Ramanujan et la constante de Kaprekar.

### Une note sur les caches

Le rafraîchissement du portefeuille tourne cinq fois par seconde. À collection
pleine il coûtait **2,78 ms** — non pas à cause du calcul de revenu, comme je le
croyais, mais parce que `uniqueCount` reconstruit un tableau de dix mille clés et
que `pullCost` l'appelle sept fois par rafraîchissement. Les deux sont désormais
mémorisés, et le rafraîchissement est tombé à **0,28 ms**, soit 0,14 % du
processeur.

Les deux caches retiennent l'objet `state` lui-même en plus de leur valeur :
remplacer l'état d'un bloc — au chargement d'une sauvegarde, par exemple —
suffit à les périmer, sans qu'aucun appel explicite ne soit nécessaire.

## Sauvegarde en ligne et classement

Le jeu fonctionne sans serveur : ouvert depuis un fichier ou un hébergement
statique, l'API n'existe pas, la couche réseau se sonde une fois puis s'efface,
et personne n'en entend parler. Servi par Django (`serveur/`), il gagne la
sauvegarde en ligne et le classement.

**Pourquoi un cookie serveur.** Safari efface `localStorage` après **sept jours**
sans visite. Le plafond ne vise que le stockage écrit côté client — un cookie
posé par l'en-tête `Set-Cookie` y échappe. D'où la répartition :

| | Rôle |
|---|---|
| Cookie `HttpOnly`, 2 ans | L'identité. Survit à la purge, invisible du joueur. |
| Serveur | La sauvegarde de référence. |
| `localStorage` | Une copie de travail. Sa perte est sans conséquence. |
| Code de reprise | Changer d'appareil, ou tout avoir effacé cookies compris. |

Vérifié en effaçant intégralement `localStorage` : au rechargement, les 735
nombres reviennent **sans aucune boîte de dialogue**.

Aucun e-mail, aucun mot de passe : un pseudo pour le classement, un code de
reprise à noter.

**Quand monte-t-on ?** Pas sur l'empreinte de la sauvegarde : le revenu passif
fait bouger `coins` et `lastTick` à chaque seconde, ce qui déclenchait une montée
toutes les 45 secondes **joueur absent** — 80 par heure, soit 33 Mo/h et par
joueur sur une partie complète. La décision se prend donc sur une *signature de
progression* (nombres possédés, théorèmes, défis, tirages, forges, poussière
gagnée, scores) : les jetons accumulés en veille ne déclenchent rien, et partent
au moment où l'onglet passe en arrière-plan. `beforeunload` ne laisse pas le
temps d'envoyer 400 Ko, `visibilitychange` si.

Mesuré : **60 secondes d'inactivité, zéro requête**. Un tirage, et la montée part
dans les 45 secondes.

Quand les deux côtés ont avancé séparément, le jeu **ne tranche pas** : il
affiche les deux versions avec leur date et leur nombre de cartes, et propose de
télécharger la locale avant de choisir.

## Sur téléphone

Testé à 375 px. Quatre choses ne tenaient pas, et une cinquième était fausse.

**La barre du haut rognait le compteur de poussière.** Sous 560 px, le pseudo du
nuage s'efface au profit de la seule icône, et les compteurs se resserrent : le
solde compte plus que le nom.

**La grille de la Forge repliait « a op b = res » sur quatre rangées** — l'équation
devenait illisible. Comprimer les cases ne suffisait pas : elle passe en grille
explicite, opérandes sur la première ligne, `= résultat` sur la seconde. C'est la
façon normale d'écrire une équation dans une colonne étroite.

**Rien ne laissait deviner qu'il y a huit onglets.** La barre défile désormais
avec un dégradé aux bords, et l'onglet choisi se recentre tout seul — sinon on
touche « Oracle » et l'en-tête continue d'afficher « Tirage ».

**Les cibles tactiles** passent à 44 px sur les chips, les tailles de paquet et
les petits boutons.

**Et le jeu mentait.** Il disait « Glissez un jeton » et « Clic droit pour
retirer » : deux gestes qui n'existent pas au doigt — le glisser-déposer HTML5
n'est pas implémenté sur mobile. Les consignes se lisent maintenant selon
l'appareil (`pointer: coarse`) et décrivent le geste qu'il sait faire.

Vérifié après coup : aucun débordement sur les huit onglets, aucun bouton sous
32 px, et rien n'a bougé à 1 280 px.

## Publicité

Les emplacements existent, la plomberie est prête. **Rien n'est diffusé tant que
`client` est vide dans `js/config.js`** : aucun script tiers n'est appelé et le
jeu est exactement celui d'avant. Vérifié : zéro requête vers googlesyndication.

Trois principes tiennent l'implémentation.

**La place est réservée avant le chargement** — 90 px pour le bandeau, 250 pour
le rectangle. Une annonce qui arrive et pousse le contenu vers le bas fait rater
un clic ; c'est le défaut le plus courant et le plus détestable.

**Rien près des commandes de jeu.** Le rectangle n'apparaît que sur les vues où
l'on lit : Oracle, Défis, Classement, Théorèmes. Jamais sur le Tirage ni la
Forge. Ce n'est pas de la délicatesse : un clic accidentel compte comme un
« clic invalide » chez Google, et c'est le premier motif de fermeture de compte.

**Si le script ne vient pas** — bloqueur, hors ligne, identifiant absent —
l'emplacement se referme. Mesuré : 276 px rendus au contenu, pas de rectangle
mort.

### Les pages de contenu

Le jeu est une application monopage : le robot d'indexation n'y voit qu'un
squelette vide, tout étant fabriqué en JavaScript après le chargement. C'est le
cas de rejet classique. Or le contenu existe — 65 définitions de traits, 50
notices de nombres, 14 théorèmes, tous rédigés. Il fallait qu'il existe aussi
dans le HTML servi.

`node outils/generer_pages.js` engendre cinq pages depuis le moteur du jeu, donc
toujours à jour :

| Page | Contenu |
|---|---|
| `codex.html` | Les 65 traits, par famille, avec définition et démonstration |
| `nombres.html` | Les 50 nombres qui portent un nom, avec leur notice |
| `theoremes.html` | Les 14 collections |
| `regles.html` | Comment la rareté est calculée |
| `a-propos.html` | Présentation et contact |

**6 400 mots présents dans le HTML servi**, sans JavaScript.

**Ce qu'on ne fait pas : une page par nombre.** Dix mille pages engendrées
mécaniquement, c'est du « contenu à grande échelle » au sens de Google, et un
motif de rejet plutôt qu'un remède. On ne publie que ce qui a été écrit.

**La navigation reste fluide.** `js/doc.js` intercepte les liens entre pages de
contenu : il récupère la suivante, remplace le contenu et pousse l'historique —
aucun rechargement, et le préchargement au survol rend le passage immédiat.
Le référencement ne dépend jamais du JavaScript : sans lui, les liens restent
des liens. Seul le confort en dépend.

### Ce qu'il reste à faire, et que le code ne peut pas faire

1. **Mettre le site en ligne sur un domaine.** Google ne valide pas un
   `localhost`, et un sous-domaine d'hébergeur gratuit passe mal.
2. **Compléter l'adresse de contact** dans `confidentialite.html` et
   `outils/generer_pages.js` (page « À propos ») — elle est exigée par AdSense
   comme par le RGPD, et son absence fait échouer la demande.
   **Et remplacer `exemple.fr`** dans `robots.txt` et `sitemap.xml`.
3. **Demander l'ouverture du compte**, puis reporter l'identifiant éditeur et
   les identifiants de blocs dans `js/config.js`.
4. **Activer le CMP** dans la console AdSense (« Confidentialité et messages »).
   Il est **obligatoire** pour diffuser en Europe depuis janvier 2024 ; le script
   d'AdSense l'embarque, d'où son chargement avant toute annonce.

Une réserve que je maintiens : un jeu monopage en JavaScript est un cas de rejet
classique — le robot d'indexation ne voit presque aucun texte, tout étant généré
côté client. Le Codex des 65 traits est du vrai contenu, mais il n'existe pas
dans le HTML servi. Si la demande est refusée, c'est par là qu'il faudra
commencer.

`PUB.apercu = true` affiche les emplacements sans charger AdSense, pour juger de
la mise en page.

## Modifier le code

Les balises `<script>` et `<link>` portent un `?v=N`. Sans lui, les navigateurs
resservent l'ancien JS depuis leur cache après une modification — et on débogue
un code qui n'est plus celui du disque. **Incrémenter ce numéro à chaque
changement de source**, dans `index.html`.

## Sauvegarde

Automatique dans `localStorage` (`gachanombres.save.v1`), toutes les 10 secondes
et à chaque action notable. Une commande de forge en cours issue d'une version
antérieure est détectée au chargement et abandonnée : une partie de puzzle à
moitié faite ne vaut pas le risque d'emporter la collection avec elle. Le rendu
est cloisonné par section, pour qu'une exception dans un onglet n'en vide jamais
un autre. Le revenu passif continue hors ligne, plafonné à 8 h.
« Effacer la sauvegarde » se trouve en bas de l'onglet Défis.
