/* ============================================================
   LA FRISE — L'HISTOIRE DES MATHÉMATIQUES, POINT PAR POINT

   Ce n'est pas un onglet de jeu : c'est un PLAN DE TRAVAIL. Il sert à
   trancher, en le lisant, ce qui peut devenir une quête, un instrument, une
   collection — et ce qui restera du décor.

   D'OÙ VIENNENT LES DATES, ET CE QU'ELLES VALENT. Tout le reste du jeu est
   démontrable : la rareté est déduite, `verifier_theoremes.py` prouve les
   listes, `verifier_decors.py` valide les décorations. L'histoire, elle, est
   ATTESTÉE, pas démontrable — aucun script ne prouvera qu'Ératosthène a mesuré
   la Terre vers −240. Trois précautions, donc :

   1. `quand` porte la date telle qu'on peut l'écrire honnêtement — « vers »
      quand c'est vers, un intervalle quand c'en est un. `an` ne sert qu'au tri.
   2. `doute` porte, en clair, ce qui est disputé. Une frise qui lisse les
      incertitudes enseigne moins bien qu'une frise qui les nomme.
   3. Rien n'est daté au hasard pour faire joli : quand je ne sais pas, la
      notice le dit.

   `piste` est le champ de triage, et c'est le seul qui vous concerne :

     'enJeu'     — déjà construit, `lien` dit où
     'procedure' — il y a un geste à refaire À LA MAIN, donc une vue jouable
     'nombres'   — ça donne des nombres, donc une collection ou un rate-up
     'decor'     — vrai et beau, mais rien à y jouer

   `id` n'est posé que sur les entrées qu'une quête peut offrir : ce sont les
   CURIOSITÉS, les pièces d'histoire qu'on rapporte et qu'on garde. Une entrée
   sans id n'est pas collectionnable, et c'est très bien : tout ne se ramasse
   pas. `outils/verifier_quetes.py` refuse une récompense qui pointerait vers
   un identifiant inexistant.

   La distinction 'procedure' / 'decor' est la leçon du crible : quand la
   machine faisait le travail, il n'y avait « pas vraiment de réflexion ni de
   jeu ». Une découverte n'est jouable que si le joueur peut refaire le geste.
   ============================================================ */

const FRISE_PISTES = {
  enJeu:     { nom: 'Déjà dans le jeu', emoji: '✅' },
  procedure: { nom: 'Procédure jouable', emoji: '🖐️' },
  nombres:   { nom: 'Donne des nombres', emoji: '🔢' },
  decor:     { nom: 'Décor', emoji: '🏛️' },
};

/* Les âges servent au regroupement visuel. Les bornes sont commodes, pas
   savantes : aucune histoire ne change de siècle un mardi. */
const FRISE_AGES = [
  { id: 'avant',  nom: "Avant l'écriture",        de: -99999, a: -3200 },
  { id: 'scribes', nom: 'Les scribes',             de: -3200,  a: -600 },
  { id: 'grece',  nom: 'La Grèce',                 de: -600,   a: 400 },
  { id: 'monde',  nom: "L'Inde, la Chine, l'islam", de: 400,   a: 1200 },
  { id: 'renais', nom: 'Renaissance et algèbre',   de: 1200,   a: 1600 },
  { id: 'classiq', nom: "L'âge classique",         de: 1600,   a: 1700 },
  { id: 'lumiere', nom: 'Les Lumières',            de: 1700,   a: 1800 },
  { id: 'moderne', nom: 'Le grand dix-neuvième',   de: 1800,   a: 1900 },
  { id: 'contemp', nom: 'Le siècle des machines',  de: 1900,   a: 99999 },
];

const FRISE = [
  /* ---------- avant l'écriture ---------- */
  { an: -35000, quand: 'vers −35 000', lieu: 'Eswatini', qui: null,
    id: 'lebombo', titre: 'Le bâton de Lebombo',
    texte: "Un péroné de babouin portant vingt-neuf entailles. Le plus ancien objet connu qui compte quelque chose.",
    doute: "Vingt-neuf : un mois lunaire ? Le bâton est cassé, il en manquait peut-être.",
    piste: 'decor' },

  { an: -20000, quand: 'vers −20 000', lieu: 'Congo', qui: null,
    id: 'ishango', titre: "L'os d'Ishango",
    texte: "Trois colonnes d'entailles. L'une ne contient que 11, 13, 17, 19 — les premiers entre 10 et 20.",
    doute: "La lecture arithmétique est séduisante et très disputée : sur si peu de marques, le hasard produit des coïncidences.",
    piste: 'decor' },

  { an: -8000, quand: 'vers −8000', lieu: 'Proche-Orient', qui: null,
    titre: "Les jetons d'argile",
    texte: "Un jeton par bête, un jeton par mesure de grain. Compter avant de savoir écrire les nombres.",
    piste: 'procedure',
    idee: "La correspondance un-pour-un, avant tout chiffre : poser autant de jetons que de bêtes, sans jamais compter." },

  { an: -3400, quand: 'vers −3400', lieu: 'Suse, Uruk', qui: null,
    titre: "La bulle-enveloppe, et l'écriture qui en sort",
    texte: "On enferme les jetons dans une boule d'argile, puis on les imprime dessus pour lire sans l'ouvrir. L'empreinte a remplacé l'objet : le chiffre est né.",
    piste: 'decor' },

  /* ---------- les scribes ---------- */
  { an: -3000, quand: 'vers −3000', lieu: 'Sumer', qui: null,
    titre: 'La base soixante',
    texte: "Une numération sexagésimale, encore vivante dans nos heures et nos degrés. Soixante a douze diviseurs : il se partage.",
    piste: 'nombres',
    idee: "Les hautement composés existent déjà en jeu — 60, 120, 360 sont exactement ce que Sumer a choisi." },

  { an: -2700, quand: 'vers −2700', lieu: 'Sumer', qui: null,
    titre: "L'abaque",
    texte: "Des jetons qu'on pousse sur des colonnes. Il compte petit, mais il compte depuis Sumer.",
    piste: 'enJeu', lien: "Atelier — L'Abaque" },

  { an: -1850, quand: 'vers −1850', lieu: 'Égypte', qui: null,
    titre: 'Le papyrus de Moscou',
    texte: "Le volume exact d'une pyramide tronquée. Personne ne sait comment ils l'ont trouvé.",
    piste: 'decor' },

  { an: -1800, quand: 'vers −1800', lieu: 'Babylone', qui: null,
    titre: 'Plimpton 322',
    texte: "Une tablette de quinze lignes, toutes des triplets pythagoriciens — mille ans avant Pythagore.",
    doute: "Table trigonométrique ? Exercices scolaires ? Les spécialistes s'en disputent encore l'usage.",
    piste: 'nombres',
    idee: "Une collection « Les Triplets » : 3-4-5, 5-12-13, 8-15-17…" },

  { an: -1650, quand: 'vers −1650', lieu: 'Égypte', qui: 'Ahmès',
    titre: 'Le papyrus Rhind',
    texte: "Quatre-vingt-sept problèmes, et une aire du cercle qui revient à poser π ≈ 3,16.",
    piste: 'procedure',
    idee: "Les fractions égyptiennes : tout écrire en somme de fractions de numérateur 1. 2/5 = 1/3 + 1/15. C'est une vraie énigme, et elle se joue." },

  { an: -1600, quand: 'vers −1600', lieu: 'Babylone', qui: null,
    titre: 'La racine carrée de deux, à six décimales',
    texte: "La tablette YBC 7289 donne 1,41421296 pour √2. L'erreur est d'un millionième.",
    piste: 'procedure',
    idee: "La méthode babylonienne : deviner, diviser, faire la moyenne, recommencer. Trois tours suffisent — c'est un instrument à part entière." },

  { an: -1200, quand: 'vers −1200', lieu: 'Chine', qui: null,
    titre: 'Les os oraculaires',
    texte: "Une numération décimale complète, gravée sur des omoplates de bœuf.",
    piste: 'decor' },

  { an: -800, quand: 'vers −800', lieu: 'Inde', qui: null,
    titre: 'Les Śulba-sūtras',
    texte: "Des règles de corde pour bâtir les autels : le carré de l'hypoténuse y est, et les autels doivent conserver leur aire.",
    piste: 'decor' },

  /* ---------- la Grèce ---------- */
  { an: -580, quand: 'vers −580', lieu: 'Milet', qui: 'Thalès',
    id: 'thales', titre: 'La première démonstration',
    texte: "Il ne constate plus : il prouve. Un diamètre coupe le cercle en deux parts égales, et il dit pourquoi.",
    piste: 'decor',
    idee: "C'est l'acte de naissance du jeu lui-même : la rareté s'y démontre, elle ne s'attribue pas." },

  { an: -530, quand: 'vers −530', lieu: 'Crotone', qui: 'Pythagore',
    titre: 'Les nombres figurés, les parfaits, les amiables',
    texte: "Une confrérie qui range les nombres en triangles et en carrés, et découvre que 220 et 284 se nourrissent l'un l'autre.",
    piste: 'enJeu', lien: 'Théorèmes — La Pyramide, Les Amis, Les Parfaits' },

  { an: -450, quand: 'vers −450', lieu: 'Grande-Grèce', qui: 'Hippase',
    titre: "L'irrationalité de √2",
    texte: "La diagonale du carré n'est le rapport d'aucun couple d'entiers. La légende le fait jeter à la mer pour l'avoir dit.",
    doute: "La noyade est une légende tardive, sans source contemporaine.",
    piste: 'procedure',
    idee: "La démonstration par l'absurde tient en six lignes et se reconstitue pas à pas — pair, impair, contradiction." },

  { an: -430, quand: 'vers −430', lieu: 'Élée', qui: 'Zénon',
    id: 'zenon', titre: 'Achille et la tortue',
    texte: "Quatre paradoxes qui montrent qu'on ne sait pas encore additionner une infinité de termes.",
    piste: 'decor' },

  { an: -370, quand: 'vers −370', lieu: 'Cnide', qui: 'Eudoxe',
    titre: "La méthode d'exhaustion",
    texte: "Encadrer une aire par des polygones de plus en plus fins. L'intégrale, deux mille ans avant l'intégrale.",
    piste: 'decor' },

  { an: -300, quand: 'vers −300', lieu: 'Alexandrie', qui: 'Euclide',
    titre: 'Les Éléments',
    texte: "Treize livres, et le livre le plus recopié après la Bible. On y trouve l'algorithme du PGCD, l'infinité des premiers, et la formule des parfaits pairs.",
    piste: 'procedure',
    idee: "L'algorithme d'Euclide est LE candidat évident : on soustrait, on recommence, ça s'arrête. Un instrument à deux réglettes." },

  { an: -250, quand: 'vers −250', lieu: 'Syracuse', qui: 'Archimède',
    titre: "L'encadrement de π, et l'Arénaire",
    texte: "Un polygone à 96 côtés lui donne π entre 3+10/71 et 3+1/7. Dans l'Arénaire, il invente une notation pour compter les grains de sable de l'univers.",
    piste: 'procedure',
    idee: "Doubler les côtés du polygone et resserrer l'encadrement : chaque tour gagne une décimale. Et l'Arénaire est la réponse au « et au-delà du mur ? »." },

  { an: -240, quand: 'vers −240', lieu: 'Alexandrie', qui: 'Ératosthène',
    titre: 'Le crible, et la circonférence de la Terre',
    texte: "Il raye les multiples et ce qui survit est premier. La même année, une ombre de 7,2° à Alexandrie et un puits sans ombre à Syène lui donnent le tour du monde à quelques pour cent près.",
    piste: 'enJeu', lien: "Atelier — Le Crible",
    idee: "Le crible est fait ; la circonférence ne l'est pas. 5 000 stades, 7,2° — soit un cinquantième du tour : 250 000 stades. C'est la quête que vous décriviez." },

  { an: -200, quand: 'vers −200', lieu: 'Perga', qui: 'Apollonius',
    titre: 'Les coniques',
    texte: "Ellipse, parabole, hyperbole : il les nomme et les étudie. Kepler s'en servira dix-huit siècles plus tard.",
    piste: 'decor' },

  { an: -200, quand: 'vers −200', lieu: 'Chine', qui: null,
    titre: 'Les Neuf Chapitres',
    texte: "Deux cent quarante-six problèmes, l'élimination sur tableau, et les nombres négatifs — traités comme des nombres.",
    piste: 'decor' },

  { an: 100, quand: 'vers 100', lieu: 'Gérasa', qui: 'Nicomaque',
    titre: "L'Introduction arithmétique",
    texte: "Le classement des nombres en parfaits, abondants et déficients. Il donne les quatre premiers parfaits.",
    piste: 'enJeu', lien: 'Théorèmes — Les Parfaits' },

  { an: 150, quand: 'vers 150', lieu: 'Alexandrie', qui: 'Ptolémée',
    titre: "La table des cordes de l'Almageste",
    texte: "La première table trigonométrique, en base soixante, juste à cinq décimales.",
    piste: 'decor' },

  { an: 250, quand: 'vers 250', lieu: 'Alexandrie', qui: 'Diophante',
    titre: 'Les Arithmetica',
    texte: "Chercher les solutions entières, et rien qu'elles. C'est dans la marge de son exemplaire que Fermat écrira sa phrase.",
    piste: 'procedure',
    idee: "Une équation diophantienne à petits coefficients est exactement un « compte est bon » à contrainte entière." },

  { an: 400, quand: 'vers 400', lieu: 'Alexandrie', qui: 'Hypatie',
    titre: 'Hypatie',
    texte: "Elle commente Diophante et Apollonius, dirige l'école néoplatonicienne, et meurt assassinée en 415.",
    piste: 'decor' },

  /* ---------- l'Inde, la Chine, l'islam ---------- */
  { an: 450, quand: 'vers 450', lieu: 'Chine', qui: 'Sun Zi',
    titre: 'Le théorème des restes',
    texte: "« Des objets en nombre inconnu : par trois il en reste deux, par cinq il en reste trois… » La question est posée, et résolue.",
    piste: 'procedure',
    idee: "Un excellent puzzle : retrouver un nombre par ses restes. Court, exact, et vraiment difficile la première fois." },

  { an: 499, quand: '499', lieu: 'Inde', qui: 'Aryabhata',
    id: 'aryabhata', titre: "L'Aryabhatiya",
    texte: "π ≈ 3,1416 — et il précise que c'est approché, ce que personne ne disait. Les premières tables de sinus.",
    piste: 'decor' },

  { an: 628, quand: '628', lieu: 'Inde', qui: 'Brahmagupta',
    titre: 'Le zéro devient un nombre',
    texte: "Il énonce les règles : a − a = 0, et ce que font le zéro et les négatifs dans une addition. Il bute sur la division par zéro, comme tout le monde après lui.",
    piste: 'nombres',
    idee: "Le jeu contient déjà 0, et il faut le forger. La Forge est donc, sans le dire, l'Inde du VIIᵉ siècle." },

  { an: 820, quand: 'vers 820', lieu: 'Bagdad', qui: 'al-Khwârizmî',
    titre: "L'algèbre, et le mot algorithme",
    texte: "Al-jabr : remettre en place ce qu'on a déplacé. Son nom, latinisé, a donné « algorithme » ; son livre a donné « algèbre ». Il diffuse aussi les chiffres indiens.",
    piste: 'procedure',
    idee: "Résoudre une quadratique par complétion du carré, en la DESSINANT : c'est ainsi qu'il la résout, sans symboles." },

  { an: 900, quand: 'vers 900', lieu: 'Andes', qui: null,
    titre: 'Le quipu',
    texte: "Des cordes à nœuds, une base dix, et la comptabilité d'un empire sans écriture. Le nœud dit le chiffre, sa hauteur dit le rang.",
    doute: "⚠ L'Atelier le date de −1500, et rien ne l'étaye. Les plus anciens quipus datés sont wari (700–1000) ; le gros du corpus est inca (1400–1532). Le quipu de Caral, annoncé en 2005 vers −2500, reste un objet isolé et contesté. Date à corriger dans le jeu — ou à assumer comme une licence.",
    piste: 'enJeu', lien: 'Atelier — Le Quipu' },

  { an: 950, quand: 'vers 950', lieu: 'Damas', qui: 'al-Uqlîdisî',
    titre: 'Les fractions décimales',
    texte: "La virgule décimale, six siècles avant Stevin.",
    piste: 'decor' },

  { an: 1000, quand: 'vers 1000', lieu: 'Le Caire', qui: 'Ibn al-Haytham',
    titre: 'Le théorème de Wilson, avant Wilson',
    texte: "Il énonce que (p−1)! + 1 est divisible par p quand p est premier. L'Europe le redécouvrira en 1770.",
    piste: 'procedure',
    idee: "Un test de primalité exact — et impraticable dès 13. C'est une belle leçon : correct ne veut pas dire utile." },

  { an: 1020, quand: 'vers 1020', lieu: 'Bagdad', qui: 'al-Karaji',
    titre: 'La récurrence, et le triangle',
    texte: "Le premier raisonnement par récurrence connu, et le triangle des coefficients binomiaux — six siècles avant Pascal.",
    piste: 'enJeu', lien: 'Théorèmes — La Pyramide' },

  { an: 1070, quand: 'vers 1070', lieu: 'Ispahan', qui: 'Omar Khayyam',
    titre: 'Les cubiques par les coniques',
    texte: "Il résout les équations du troisième degré en croisant un cercle et une parabole. Poète, par ailleurs.",
    piste: 'decor' },

  { an: 1150, quand: '1150', lieu: 'Inde', qui: 'Bhaskara II',
    id: 'lilavati', titre: 'Le Lilavati',
    texte: "Un traité écrit, dit la tradition, pour consoler sa fille. Il y traite le zéro, les négatifs, et l'équation de Pell.",
    piste: 'decor' },

  { an: 1202, quand: '1202', lieu: 'Pise', qui: 'Fibonacci',
    titre: 'Le Liber abaci',
    texte: "Il rapporte d'Afrique du Nord les chiffres indo-arabes et la position. Un problème de lapins, en passant, donne la suite qui porte son nom.",
    piste: 'enJeu', lien: 'Théorèmes — La Suite Dorée' },

  { an: 1247, quand: '1247', lieu: 'Chine', qui: 'Qin Jiushao',
    titre: 'Le Traité mathématique en neuf sections',
    texte: "La forme générale du théorème des restes, et la résolution numérique des équations de haut degré.",
    piste: 'decor' },

  { an: 1261, quand: 'vers 1261', lieu: 'Chine', qui: 'Yang Hui',
    titre: 'Le triangle, quatre siècles avant Pascal',
    texte: "Il le publie en citant un prédécesseur du XIᵉ siècle. Il est encore appelé triangle de Yang Hui en Chine.",
    piste: 'decor' },

  { an: 1350, quand: 'vers 1350', lieu: 'Paris', qui: 'Nicole Oresme',
    titre: 'La série harmonique diverge',
    texte: "1 + 1/2 + 1/3 + … dépasse toute borne, et il le prouve en groupant les termes par paquets qui valent chacun au moins 1/2.",
    piste: 'procedure',
    idee: "La démonstration est visuelle et tient en un écran. C'est le genre de chose qu'un joueur peut refaire lui-même." },

  { an: 1400, quand: 'vers 1400', lieu: 'Kerala', qui: 'Madhava',
    titre: 'Les séries infinies',
    texte: "Il donne les développements du sinus, du cosinus et de l'arc tangente, et une série pour π — deux siècles et demi avant Leibniz.",
    piste: 'decor',
    idee: "L'école du Kerala est la meilleure réponse à qui croit que le calcul est né en Europe." },

  /* ---------- Renaissance ---------- */
  { an: 1489, quand: '1489', lieu: 'Leipzig', qui: 'Johannes Widmann',
    titre: 'Les signes + et −',
    texte: "Ils apparaissent imprimés pour la première fois, dans un manuel de commerce.",
    piste: 'decor' },

  { an: 1494, quand: '1494', lieu: 'Venise', qui: 'Luca Pacioli',
    titre: 'La Summa, et la partie double',
    texte: "La comptabilité en partie double, exposée pour la première fois. Léonard de Vinci fut son élève en mathématiques.",
    piste: 'decor' },

  { an: 1545, quand: '1545', lieu: 'Milan', qui: 'Cardan et Tartaglia',
    titre: "L'Ars Magna, et une trahison",
    texte: "La résolution des cubiques et des quartiques. Tartaglia l'avait confiée sous serment ; Cardan l'a publiée. Les racines de nombres négatifs y apparaissent, faute de pouvoir les éviter.",
    piste: 'decor' },

  { an: 1557, quand: '1557', lieu: 'Angleterre', qui: 'Robert Recorde',
    id: 'recorde', titre: 'Le signe =',
    texte: "« Deux parallèles jumelles, car deux choses ne sauraient être plus égales. »",
    piste: 'decor' },

  { an: 1572, quand: '1572', lieu: 'Bologne', qui: 'Rafael Bombelli',
    titre: 'Les nombres complexes',
    texte: "Il pose les règles de calcul sur √−1, et montre qu'elles donnent des résultats réels justes.",
    piste: 'decor' },

  { an: 1585, quand: '1585', lieu: 'Leyde', qui: 'Simon Stevin',
    titre: 'La Disme',
    texte: "Il fait campagne pour la virgule décimale et pour un système décimal des poids et mesures. Il faudra deux siècles.",
    piste: 'decor' },

  { an: 1591, quand: '1591', lieu: 'Paris', qui: 'François Viète',
    titre: "L'algèbre devient symbolique",
    texte: "Des lettres pour les inconnues, et des lettres pour les paramètres. On peut enfin écrire une équation générale.",
    piste: 'decor' },

  { an: 1614, quand: '1614', lieu: 'Écosse', qui: 'John Napier',
    titre: 'Les logarithmes',
    texte: "Vingt ans de calculs pour transformer les multiplications en additions. On a dit qu'il avait doublé la vie des astronomes.",
    piste: 'nombres',
    idee: "Toute la Règle à calcul repose là-dessus. Un instrument « table de logarithmes » serait la porte d'entrée de la Règle." },

  { an: 1617, quand: '1617', lieu: 'Écosse', qui: 'John Napier',
    titre: 'Les bâtons',
    texte: "Neuf réglettes gravées, et la multiplication devient une lecture en diagonale.",
    piste: 'enJeu', lien: 'Atelier — Les Bâtons de Napier' },

  { an: 1622, quand: '1622', lieu: 'Angleterre', qui: 'William Oughtred',
    titre: 'La règle à calcul',
    texte: "Deux échelles logarithmiques qui coulissent. Elle servira jusqu'à la calculatrice de poche, Apollo compris.",
    piste: 'enJeu', lien: 'Atelier — La Règle à calcul' },

  /* ---------- l'âge classique ---------- */
  { an: 1637, quand: '1637', lieu: 'Leyde', qui: 'René Descartes',
    titre: 'La Géométrie',
    texte: "Les coordonnées, et la notation des puissances. Une courbe devient une équation.",
    piste: 'decor' },

  { an: 1640, quand: 'vers 1640', lieu: 'Toulouse', qui: 'Pierre de Fermat',
    titre: 'Le petit théorème, et la marge',
    texte: "aᵖ ≡ a mod p. Et dans la marge de son Diophante : « J'ai trouvé une merveilleuse démonstration, mais elle est trop étroite pour la contenir. » Il faudra 358 ans.",
    piste: 'enJeu', lien: "L'onglet des retours s'appelle déjà La Marge" },

  { an: 1642, quand: '1642', lieu: 'Rouen', qui: 'Blaise Pascal',
    titre: 'La Pascaline',
    texte: "Dix-neuf ans, et un père collecteur d'impôts. Le difficile n'était pas d'additionner : c'était de propager la retenue.",
    piste: 'enJeu', lien: 'Atelier — La Pascaline' },

  { an: 1654, quand: '1654', lieu: 'Paris', qui: 'Pascal et Fermat',
    titre: 'Le problème des partis',
    texte: "Comment partager la mise d'une partie interrompue ? Leur correspondance fonde le calcul des probabilités.",
    piste: 'procedure',
    idee: "C'est la fondation mathématique du gacha lui-même. Une quête sur l'espérance, dans un jeu de tirage, se justifie toute seule." },

  { an: 1654, quand: '1654', lieu: 'Paris', qui: 'Blaise Pascal',
    titre: 'Le Traité du triangle arithmétique',
    texte: "Il n'invente pas le triangle — l'Inde, la Chine et al-Karaji l'avaient — mais il le relie aux combinaisons et à la récurrence.",
    piste: 'procedure',
    idee: "Construire le triangle ligne à ligne, chaque case étant la somme des deux du dessus. Simple, juste, et satisfaisant." },

  { an: 1656, quand: '1656', lieu: 'Oxford', qui: 'John Wallis',
    titre: 'Le symbole ∞',
    texte: "Et un produit infini pour π. Le lemniscate n'avait jamais servi à cela.",
    piste: 'decor' },

  { an: 1665, quand: '1665–1675', lieu: 'Cambridge et Hanovre', qui: 'Newton et Leibniz',
    titre: 'Le calcul infinitésimal',
    texte: "Découvert deux fois, indépendamment, à dix ans d'écart. La querelle de priorité empoisonnera un siècle de mathématiques anglaises.",
    piste: 'decor' },

  { an: 1673, quand: '1673', lieu: 'Londres', qui: 'Leibniz',
    titre: 'La machine à multiplier',
    texte: "Le cylindre cannelé — le « tambour de Leibniz » — permet enfin de multiplier mécaniquement. Il servira jusqu'au XXᵉ siècle.",
    piste: 'procedure',
    idee: "Ce serait l'instrument manquant entre la Pascaline (1642) et l'Arithmomètre (1851), et il tient la même promesse : un mécanisme à comprendre." },

  { an: 1683, quand: '1683', lieu: 'Japon', qui: 'Seki Takakazu',
    titre: 'Les déterminants',
    texte: "Il les introduit dix ans avant Leibniz, dans un Japon fermé au monde.",
    piste: 'decor' },

  { an: 1687, quand: '1687', lieu: 'Londres', qui: 'Isaac Newton',
    titre: 'Les Principia',
    texte: "La gravitation, écrite en géométrie grecque pour être irréprochable.",
    piste: 'decor' },

  /* ---------- les Lumières ---------- */
  { an: 1735, quand: '1735', lieu: 'Saint-Pétersbourg', qui: 'Leonhard Euler',
    titre: 'Le problème de Bâle',
    texte: "La somme des inverses des carrés vaut π²/6. Personne ne s'y attendait — il n'y a pas de cercle dans la question.",
    piste: 'decor' },

  { an: 1736, quand: '1736', lieu: 'Königsberg', qui: 'Leonhard Euler',
    titre: 'Les sept ponts',
    texte: "Peut-on traverser les sept ponts sans repasser deux fois ? Non, et sa démonstration invente la théorie des graphes.",
    piste: 'procedure',
    idee: "Un vrai jeu, immédiat : tracer un parcours sans lever le crayon. Et la règle des sommets impairs se découvre en jouant, pas en la lisant." },

  { an: 1742, quand: '1742', lieu: 'Berlin', qui: 'Christian Goldbach',
    titre: 'La conjecture',
    texte: "Tout pair supérieur à deux est somme de deux premiers. Vérifiée jusqu'à 4·10¹⁸, toujours pas démontrée.",
    piste: 'procedure',
    idee: "On donne un pair, le joueur trouve la décomposition. La conjecture devient une machine à énigmes vérifiables." },

  { an: 1747, quand: '1747', lieu: 'Berlin', qui: 'Leonhard Euler',
    titre: 'Les nombres amiables',
    texte: "L'Antiquité en connaissait un couple, le monde arabe trois. Euler en publie cinquante-neuf d'un coup.",
    piste: 'enJeu', lien: 'Théorèmes — Les Amis' },

  { an: 1748, quand: '1748', lieu: 'Berlin', qui: 'Leonhard Euler',
    titre: "e^{iπ} + 1 = 0",
    texte: "Cinq constantes, trois opérations, une égalité. On l'a souvent élue plus belle formule des mathématiques.",
    piste: 'decor' },

  { an: 1763, quand: '1763', lieu: 'Londres', qui: 'Thomas Bayes',
    titre: 'Le théorème de Bayes',
    texte: "Publié deux ans après sa mort. Comment réviser une probabilité quand une information arrive.",
    piste: 'decor' },

  { an: 1770, quand: '1770', lieu: 'Berlin', qui: 'Joseph-Louis Lagrange',
    titre: 'Le théorème des quatre carrés',
    texte: "Tout entier est somme d'au plus quatre carrés. Bachet l'avait conjecturé, Fermat prétendu le prouver.",
    piste: 'procedure',
    idee: "Décomposer un nombre donné en quatre carrés : c'est un « compte est bon » à règle fixe, et la solution existe toujours." },

  { an: 1777, quand: '1777', lieu: 'Paris', qui: 'Buffon',
    titre: "L'aiguille",
    texte: "Jeter une aiguille sur un parquet, compter les fois où elle croise une rainure, et en tirer π. Le hasard mesure une constante.",
    piste: 'procedure',
    idee: "Une expérience animée, et le joueur voit π sortir des jets. Le lien avec un jeu de tirage est direct." },

  { an: 1795, quand: '1795', lieu: 'Paris', qui: null,
    titre: 'Le système métrique',
    texte: "Le mètre est défini comme la dix-millionième partie du quart du méridien. La Révolution décimalise tout — y compris, brièvement, les heures.",
    piste: 'decor' },

  { an: 1796, quand: '1796', lieu: 'Göttingen', qui: 'Carl Friedrich Gauss',
    id: 'gauss17', titre: 'Le polygone à dix-sept côtés',
    texte: "À dix-huit ans, il le construit à la règle et au compas — ce que deux mille ans de géométrie avaient manqué. Il décide ce jour-là d'être mathématicien.",
    piste: 'decor' },

  { an: 1801, quand: '1801', lieu: 'Göttingen', qui: 'Carl Friedrich Gauss',
    titre: 'Les Disquisitiones Arithmeticae',
    texte: "L'arithmétique modulaire, les congruences, la loi de réciprocité quadratique. La théorie des nombres devient une science.",
    piste: 'procedure',
    idee: "L'arithmétique modulaire est jouable telle quelle : l'horloge du jeu (Les Douze) en est déjà une." },

  /* ---------- le grand dix-neuvième ---------- */
  { an: 1801, quand: '1801', lieu: 'Lyon', qui: 'Joseph-Marie Jacquard',
    titre: 'Le métier à cartes perforées',
    texte: "Le motif n'est plus dans la machine, il est sur les cartes. La première machine qu'on programme.",
    piste: 'enJeu', lien: 'Atelier — Le Métier Jacquard' },

  { an: 1807, quand: '1807', lieu: 'Grenoble', qui: 'Joseph Fourier',
    titre: 'Les séries trigonométriques',
    texte: "Toute fonction périodique est une somme de sinus. L'Académie refuse d'abord le mémoire, faute de rigueur.",
    piste: 'decor' },

  { an: 1822, quand: '1822', lieu: 'Londres', qui: 'Charles Babbage',
    titre: 'La machine à différences',
    texte: "Calculer des tables sans erreur, par simples additions successives. Jamais achevée de son vivant ; construite en 1991, elle marche.",
    piste: 'enJeu', lien: 'Atelier — La Machine à différences' },

  { an: 1824, quand: '1824', lieu: 'Christiania', qui: 'Niels Abel',
    titre: "L'équation du cinquième degré est insoluble",
    texte: "Non pas « on n'a pas trouvé » : il démontre qu'il n'existe aucune formule par radicaux. Il meurt à vingt-six ans.",
    piste: 'decor' },

  { an: 1829, quand: '1829–1832', lieu: 'Kazan et Transylvanie', qui: 'Lobatchevski et Bolyai',
    titre: 'Les géométries non euclidiennes',
    texte: "On nie le cinquième postulat, et rien ne s'effondre : une autre géométrie, cohérente, apparaît.",
    piste: 'decor' },

  { an: 1832, quand: '1832', lieu: 'Paris', qui: 'Évariste Galois',
    titre: 'La théorie des groupes',
    texte: "La nuit avant un duel qui le tue à vingt ans, il écrit ce qui fondera l'algèbre moderne. Le manuscrit dormira quatorze ans.",
    piste: 'decor' },

  { an: 1837, quand: '1837', lieu: 'Londres', qui: 'Charles Babbage',
    titre: 'La machine analytique',
    texte: "Un moulin, un magasin, des cartes perforées : un ordinateur, cent ans trop tôt. Jamais construite.",
    piste: 'enJeu', lien: 'Atelier — La Machine analytique' },

  { an: 1843, quand: '1843', lieu: 'Londres', qui: 'Ada Lovelace',
    titre: 'Le premier programme',
    texte: "Ses notes de traduction, trois fois plus longues que l'original, contiennent un algorithme pour les nombres de Bernoulli — et l'idée que la machine pourrait traiter autre chose que des nombres.",
    piste: 'nombres',
    idee: "Les nombres de Bernoulli sont rationnels, donc hors du vivier. Mais la note G se rejoue comme une suite d'instructions à ordonner." },

  { an: 1843, quand: '1843', lieu: 'Dublin', qui: 'William Rowan Hamilton',
    titre: 'Les quaternions',
    texte: "Il grave la formule sur un pont de Dublin en y passant. La multiplication n'y est plus commutative — on avait le droit.",
    piste: 'decor' },

  { an: 1847, quand: '1847', lieu: 'Cork', qui: 'George Boole',
    titre: "L'algèbre de la logique",
    texte: "Vrai et faux deviennent 1 et 0, et le raisonnement devient calcul. Shannon en fera les circuits, un siècle plus tard.",
    piste: 'procedure',
    idee: "Des portes logiques à assembler pour obtenir une sortie voulue : c'est un puzzle éprouvé, et il boucle avec Jacquard." },

  { an: 1851, quand: '1851', lieu: 'Paris', qui: 'Thomas de Colmar',
    titre: "L'Arithmomètre",
    texte: "La première machine à calculer vendue en série. Quarante ans de succès commercial.",
    piste: 'enJeu', lien: "Atelier — L'Arithmomètre" },

  { an: 1859, quand: '1859', lieu: 'Göttingen', qui: 'Bernhard Riemann',
    titre: "L'hypothèse",
    texte: "Huit pages sur la répartition des nombres premiers, et une conjecture énoncée en passant. Toujours ouverte, un million de dollars à la clé.",
    piste: 'decor' },

  { an: 1874, quand: '1874–1891', lieu: 'Halle', qui: 'Georg Cantor',
    titre: "Il y a plusieurs infinis",
    texte: "Les rationnels se dénombrent, les réels non. L'argument diagonal tient en un dessin, et il a fait scandale.",
    piste: 'procedure',
    idee: "La diagonale se joue : on fabrique le nombre absent de la liste, chiffre par chiffre. Court et renversant." },

  { an: 1882, quand: '1882', lieu: 'Fribourg', qui: 'Ferdinand von Lindemann',
    titre: 'π est transcendant',
    texte: "Donc la quadrature du cercle est impossible. Deux mille ans de tentatives closes par une démonstration.",
    piste: 'decor' },

  { an: 1889, quand: '1889', lieu: 'Turin', qui: 'Giuseppe Peano',
    titre: 'Les axiomes',
    texte: "Ce qu'est un entier naturel, en cinq règles. Le successeur, et la récurrence.",
    piste: 'decor' },

  { an: 1896, quand: '1896', lieu: 'Paris et Louvain', qui: 'Hadamard et de la Vallée Poussin',
    titre: 'Le théorème des nombres premiers',
    texte: "Les premiers jusqu'à n sont environ n/ln(n). Démontré la même année par deux hommes qui ne se concertaient pas.",
    piste: 'nombres',
    idee: "C'est la loi de raréfaction que le joueur ressent déjà en tirant. La nommer donnerait un sens à sa frustration." },

  { an: 1900, quand: '1900', lieu: 'Paris', qui: 'David Hilbert',
    titre: 'Les vingt-trois problèmes',
    texte: "Au congrès de Paris, il fixe le programme du siècle. Une dizaine restent ouverts.",
    piste: 'decor' },

  /* ---------- le siècle des machines ---------- */
  { an: 1913, quand: '1913', lieu: 'Madras et Cambridge', qui: 'Ramanujan et Hardy',
    titre: 'La lettre',
    texte: "Un employé du port de Madras envoie cent vingt théorèmes à Cambridge, sans démonstrations. Hardy comprend qu'aucun imposteur n'aurait l'imagination de les inventer.",
    piste: 'decor' },

  { an: 1919, quand: 'vers 1919', lieu: 'Londres', qui: 'Ramanujan',
    titre: 'Mille sept cent vingt-neuf',
    texte: "Hardy trouve son taxi d'un numéro banal. Ramanujan, malade : « Pas du tout — c'est le plus petit nombre somme de deux cubes de deux façons. »",
    piste: 'enJeu', lien: 'Théorèmes — Les Anomalies' },

  { an: 1931, quand: '1931', lieu: 'Vienne', qui: 'Kurt Gödel',
    titre: "L'incomplétude",
    texte: "Toute théorie assez riche contient des énoncés vrais qu'elle ne peut pas prouver. Le programme de Hilbert s'arrête là.",
    piste: 'decor' },

  { an: 1936, quand: '1936', lieu: 'Cambridge', qui: 'Alan Turing',
    titre: 'La machine',
    texte: "Un ruban, une tête, quelques règles : de quoi définir ce qui est calculable — et prouver que certaines choses ne le sont pas.",
    piste: 'procedure',
    idee: "Une machine de Turing à programmer sur trois symboles est le terme naturel de l'Atelier : de l'abaque à l'ordinateur." },

  { an: 1937, quand: '1937', lieu: 'Hambourg', qui: 'Lothar Collatz',
    titre: 'La conjecture 3n+1',
    texte: "Pair, on divise ; impair, on triple et on ajoute un. Tout le monde retombe sur 1, personne ne sait pourquoi.",
    piste: 'procedure',
    idee: "Le vol de Syracuse est déjà un mini-jeu tout fait : on suit la trajectoire d'un nombre, et on parie sur sa durée." },

  { an: 1949, quand: '1949', lieu: 'Inde', qui: 'D. R. Kaprekar',
    titre: 'Six mille cent soixante-quatorze',
    texte: "Prenez quatre chiffres non tous égaux, rangez-les dans les deux sens, soustrayez, recommencez. En sept coups au plus, vous êtes à 6174, et vous y restez.",
    piste: 'enJeu', lien: 'Théorèmes — Les Anomalies',
    idee: "La routine se refait à la main en une minute. C'est peut-être la plus jouable de toute la frise." },
];

/* Le filtre est un état d'affichage : il ne survit pas au rechargement, et
   n'a rien à faire dans la sauvegarde. */
let _frisePiste = 'tout';

const friseAgeDe = (an) => FRISE_AGES.find(a => an >= a.de && an < a.a) || FRISE_AGES[FRISE_AGES.length - 1];

function renderFrise() {
  const zone = document.querySelector('#friZone');
  if (!zone) return;

  const comptes = { tout: FRISE.length };
  FRISE.forEach(e => { comptes[e.piste] = (comptes[e.piste] || 0) + 1; });

  const filtres = ['tout'].concat(Object.keys(FRISE_PISTES)).map(k => {
    const p = FRISE_PISTES[k];
    return `<button class="friFiltre${_frisePiste === k ? ' on' : ''}" type="button" data-piste="${k}">
      ${p ? p.emoji + ' ' + p.nom : 'Tout'} <i>${comptes[k] || 0}</i>
    </button>`;
  }).join('');

  /* On trie au rendu plutôt que d'exiger un fichier en ordre : cette frise est
     faite pour qu'on y insère des entrées, et une notice ajoutée au mauvais
     endroit ne doit pas se voir. Le tri de JavaScript est stable depuis 2019 :
     deux événements de la même année gardent l'ordre du fichier. */
  /* Une curiosité rapportée se voit sur la frise : la même page sert de plan
     de travail et de vitrine. */
  const retenus = FRISE
    .filter(e => _frisePiste === 'tout' || e.piste === _frisePiste)
    .slice().sort((a, b) => a.an - b.an);

  let ageCourant = null;
  const lignes = retenus.map(e => {
    const age = friseAgeDe(e.an);
    let tete = '';
    if (age !== ageCourant) {
      ageCourant = age;
      tete = `<h3 class="friAge">${age.nom}</h3>`;
    }
    const p = FRISE_PISTES[e.piste];
    return `${tete}<article class="friLigne ${e.piste}">
      <span class="friAn">${e.quand}</span>
      <div class="friCorps">
        <h4>${e.titre}${e.qui ? ` <span class="friQui">${e.qui}</span>` : ''}
          <span class="friLieu">${e.lieu}</span></h4>
        <p class="friTexte">${e.texte}</p>
        ${e.doute ? `<p class="friDoute">${e.doute}</p>` : ''}
        ${e.idee ? `<p class="friIdee">${e.idee}</p>` : ''}
      </div>
      <div class="friPiste">
        ${e.id && typeof possedeCuriosite === 'function' && possedeCuriosite(e.id)
          ? '<span class="friAcquis">🏺 rapportée</span>' : ''}
        <span class="friBadge ${e.piste}">${p.emoji} ${p.nom}</span>
        ${e.lien ? `<span class="friLien">${e.lien}</span>` : ''}
      </div>
    </article>`;
  }).join('');

  /* ⚠ AIDE DE TEST. Elle vit dans la Frise plutôt que dans le jeu : c'est
     l'onglet de travail, et une commande de test n'a rien à faire au milieu
     des commandes de jeu. Elle disparaît avec ACTES_TEST. */
  const test = (typeof ACTES_TEST !== 'undefined' && ACTES_TEST) ? `
    <div class="friTest">
      <b>⚠ Test</b>
      <span>Acte courant : <b>${acteCourant()}</b> — ${acteDe(acteCourant()).nom}</span>
      <button class="btn ghost sm" type="button" id="friReset">⟲ Revenir à l'acte 0</button>
      <button class="btn ghost sm" type="button" id="friActeSuivant">▸ Acte suivant</button>
      <i>La collection n'est pas touchée : seuls l'acte et les quêtes sont remis à zéro.</i>
    </div>` : '';

  zone.innerHTML = test + `<div class="friFiltres">${filtres}</div>
    <div class="friListe">${lignes}</div>`;

  const raz = zone.querySelector('#friReset');
  if (raz) raz.addEventListener('click', () => {
    reinitialiserProgression();
    toast('⟲ Progression remise à zéro — acte 0.', 'bad');
    renderAll();
  });
  const suiv = zone.querySelector('#friActeSuivant');
  if (suiv) suiv.addEventListener('click', () => {
    const a = ouvrirActe(acteCourant() + 1);
    toast(a ? `▸ Acte ${a.n} — ${a.nom}.` : 'Déjà au dernier acte.', a ? 'gold' : 'bad');
    renderAll();
  });

  zone.querySelectorAll('[data-piste]').forEach(b =>
    b.addEventListener('click', () => { _frisePiste = b.dataset.piste; renderFrise(); }));
}
