/* ============================================================
   L'ATELIER — LES MACHINES À CALCULER

   La poussière n'avait que deux débouchés, tous deux dans la Forge, et le
   second était piégé : chaque indice acheté retire une carte bonus de la
   commande. Un joueur qui compte n'en achetait aucun, et la poussière
   s'entassait — quarante mille sur une partie avancée, soit soixante-treize
   indices que personne n'achètera jamais.

   CE QUE CES MACHINES NE SONT PAS. Ce ne sont pas des producteurs à taux fixe
   qu'on empile. Un « +40 poussière/min » écrit dans une table serait le
   squelette de tous les incrementals depuis vingt ans, et il souffrirait du
   défaut qu'on vient de corriger sur les théorèmes : dérisoire tard, énorme
   tôt.

   CE QU'ELLES SONT. Chaque instrument sait faire UNE opération, et il ne
   travaille que sur les nombres de votre herbier qui s'y prêtent. L'abaque
   additionne, donc il vit sous cent. Le crible d'Ératosthène raye les
   multiples, donc il vit sur vos premiers. La machine à différences évalue des
   polynômes, donc elle vit sur vos nombres figurés — triangulaires, carrés,
   pentagonaux.

   Le rendement n'est donc jamais écrit : il se CALCULE sur la collection. Un
   atelier ne peut pas décoller sans herbier, et collectionner améliore les
   deux moteurs à la fois. C'est ce qui les empêche de diverger — il n'y a pas
   de garde-fou à régler, la mécanique s'en charge.

   L'ORDRE EST CELUI DE L'HISTOIRE, de l'abaque sumérien à l'arithmomètre. Ce
   n'est pas un décor : c'est la seule échelle de progression du jeu qui soit
   vraie.
   ============================================================ */

/* ════════════════════════════════════════════════════════════
   ⚠ AIDES DE TEST — TEMPORAIRES, À RETIRER AVANT MISE EN LIGNE

   Deux commodités pour éprouver l'atelier sans jouer trente heures :
   cliquer sur la poussière du bandeau en ajoute cent mille, et chaque
   machine gagne un bouton qui la remet à zéro.

   Tout ce qu'elles touchent est regroupé sous ce seul drapeau. Le passer à
   `false` les fait disparaître entièrement — aucun autre fichier n'est
   concerné, et rien d'autre dans le jeu n'en dépend.
   ════════════════════════════════════════════════════════════ */
const ATELIER_TEST = true;
const ATELIER_TEST_POUSSIERE = 100000;

const ATELIER = {
  /* Le coût monte en exponentielle, le rendement en linéaire. C'est ce qui
     permet à l'atelier d'absorber n'importe quelle quantité de poussière sans
     jamais s'emballer : chaque niveau de plus vaut un peu moins que le
     précédent, indéfiniment. */
  facteurPrix: 1.55,
  clicsParMinute: 120,     // au-delà, le clic n'est plus payé
  /* Mettre une machine en service ne veut plus dire la même chose : il faut
     désormais SAVOIR S'EN SERVIR, sur une reproduction de l'instrument. Les
     ateliers montés sous l'ancienne règle sont donc remis à zéro — ils avaient
     été ouverts sur une promesse différente. Incrémenter ce nombre reverrouille
     tout le monde, une fois. */
  version: 2,
};

/* `sur` répond : cette machine sait-elle travailler ce nombre ?
   `taux` est la poussière par minute et par nombre traité, au niveau 1. Il est
   calibré à l'inverse de la taille du gisement — 30 nombres pour la règle à
   calcul, 2 625 pour les bâtons de Napier — pour qu'aucun instrument ne soit
   ridicule à côté d'un autre. */
const MACHINES = (() => {
  const trait = (...ids) => n => evaluate(n).traits.some(t => t.pts > 0 && ids.includes(t.id));
  return [
    { id: 'abaque', nom: "L'Abaque", epoque: '−2700', emoji: '🧮',
      op: 'additionner',
      desc: "Des jetons qu'on pousse. Il compte petit, mais il compte depuis Sumer.",
      gisement: 'vos nombres sous cent',
    /* Le seul instrument reproduit pour de bon, pour l'instant : un soroban à
       quatre tiges, une perle de ciel qui vaut cinq et quatre perles de terre
       qui valent un. On ne tape pas la réponse, on la compose. */
    interactif: 'abaque',
    manches: 1,
    epreuve: (p = 0) => {
      const combien = 3 + Math.min(2, p);
      const ampleur = 76 + p * 260;
      const t = Array.from({ length: combien }, () => 12 + ((Math.random() * ampleur) | 0));
      const mots = ['Trois', 'Quatre', 'Cinq'];
      return { enonce: t.join(' + '), reponse: t.reduce((a, b) => a + b, 0),
               aide: `${mots[combien - 3]} jetons poussés, autant de nombres additionnés.` };
    },
      sur: n => n < 100, taux: 0.40, base: 120 },

    { id: 'quipu', nom: 'Le Quipu', epoque: '−1500', emoji: '🪢',
      op: 'nouer en base dix',
      desc: "Des cordes à nœuds. Un empire entier tenait sa comptabilité là-dessus.",
      gisement: 'vos multiples de dix',
    /* Deuxième instrument reproduit : un cordon pendant, un rang par puissance
       de dix, et les trois sortes de nœuds des khipus andins. */
    interactif: 'quipu',
    manches: 1,
    epreuve: (p = 0) => {
      /* Le quipu ne calcule pas : il ENREGISTRE, en base dix et par position.
         L'épreuve porte donc sur les rangs — combien de dizaines dans un
         nombre, combien de centaines — et la réponse se noue sur le cordon.
         Recopier des chiffres qu'on vient de lire n'aurait rien appris. */
      const rangs = [[10, 'dizaines'], [100, 'centaines'], [1000, 'milliers']];
      const [diviseur, nom] = rangs[Math.min(rangs.length - 1, (Math.random() * (1 + Math.min(2, p))) | 0)];
      const chiffres = 3 + Math.min(3, p);
      const reponse = Math.pow(10, chiffres - 1)
                    + ((Math.random() * (Math.pow(10, chiffres) - Math.pow(10, chiffres - 1))) | 0);
      const reste = (Math.random() * diviseur) | 0;
      return { enonce: `Combien de ${nom} entières dans ${fmt(reponse * diviseur + reste)} ?`,
               reponse,
               aide: `Un rang de plus, un zéro de moins : nouez le compte des ${nom}.` };
    },
      sur: n => n % 10 === 0, taux: 0.045, base: 400 },

    { id: 'crible', nom: "Le Crible d'Ératosthène", epoque: '−240', emoji: '🕸️',
      op: 'rayer les multiples',
      desc: "On barre deux sur deux, trois sur trois, et ce qui survit est premier.",
      gisement: 'vos premiers',
    /* Troisième instrument reproduit : la table, et le tamis qu'on y passe. */
    interactif: 'crible',
    manches: 1,
    epreuve: (p = 0) => {
      /* CE QUE L'ON FAIT FAIRE, ET POURQUOI ÇA A CHANGÉ.

         La première version faisait dérouler le crible entier : on couronnait
         un survivant, la machine barrait ses multiples. Ça ne demandait aucune
         réflexion — « cliquer sur le nombre le plus à gauche qui reste » donne
         toujours la bonne réponse, et la grille se résolvait toute seule.
         L'automate faisait le travail ; le joueur faisait le figurant.

         Or le travail du crible, c'est BARRER. On donne donc une table déjà
         passée aux premiers plus petits, et on demande une seule passe, à la
         main : quels nombres tombent quand vient le tour de p ?

         Ce ne sont pas les multiples de p — ce sont ceux qui ont SURVÉCU
         jusque-là, c'est-à-dire p×q avec q premier au moins égal à p. Pour
         sept sur cent : 49, 77 et 91, et rien d'autre. Il faut les chercher.
         C'est aussi ainsi qu'on découvre que la passe de p commence à p². */
      const tables = [100, 150, 200, 300];
      const n = tables[Math.min(tables.length - 1, p)];

      /* On choisit le tamis pour que la passe compte entre trois et sept
         victimes : moins, c'est anecdotique ; plus, c'est du remplissage. */
      const candidats = [3, 5, 7, 11, 13].filter(q => q * q <= n);
      let tamis = candidats[candidats.length - 1], cibles = [];
      for (const q of candidats.slice().reverse()) {
        const v = [];
        for (let m = q * q; m <= n; m += q) if (plusPetitFacteur(m) === q) v.push(m);
        if (v.length >= 3 && v.length <= 7) { tamis = q; cibles = v; break; }
        if (!cibles.length) { tamis = q; cibles = v; }
      }

      const passees = candidats.filter(q => q < tamis);
      const deja = [2].concat(passees).join(', ');
      return {
        enonce: `La table est passée à ${deja}. À vous le ${tamis} : barrez ce qui tombe`,
        reponse: cibles.length, borne: n, tamis, consigne: true,
        aide: `Barrez tout ce que la passe du ${tamis} emporte — et rien d'autre.`,
      };
    },
      sur: trait('premier'), taux: 0.036, base: 1200 },

    { id: 'napier', nom: 'Les Bâtons de Napier', epoque: '1617', emoji: '🪵',
      op: 'multiplier',
      desc: "Neuf réglettes gravées qui ramènent toute multiplication à une addition.",
      gisement: 'vos semi-premiers',
    /* Quatrième instrument reproduit : neuf réglettes, et la lecture en
       diagonale qui fait tout leur intérêt. */
    interactif: 'napier',
    manches: 1,
    epreuve: (p = 0) => {
      /* Le multiplicateur reste à UN CHIFFRE, à tous les paliers : c'est ce
         que les réglettes savent faire d'une seule lecture. Un multiplicateur
         à deux chiffres demanderait deux lectures et un décalage — une autre
         leçon, pour un autre jour. Ce qui grandit, c'est le multiplicande :
         cinq réglettes à sommer en diagonale, ce n'est plus la même affaire
         que deux. */
      const chiffres = 2 + Math.min(3, p);
      const bas = Math.pow(10, chiffres - 1);
      const a = bas + ((Math.random() * (bas * 9)) | 0);
      const b = 3 + ((Math.random() * 7) | 0);
      return { enonce: `${fmt(a)} × ${b}`, reponse: a * b, multiplicande: a, multiplicateur: b,
               aide: 'Lisez la rangée du multiplicateur, puis sommez les diagonales.' };
    },
      sur: trait('semipremier'), taux: 0.017, base: 3000 },

    { id: 'regle', nom: 'La Règle à calcul', epoque: '1622', emoji: '📏',
      op: 'multiplier par les logarithmes',
      desc: "Deux échelles qui glissent. Elle a envoyé des hommes sur la Lune.",
      gisement: 'vos puissances de deux et vos cubes',
    /* Cinquième instrument reproduit : deux échelles logarithmiques, et la
       décade laissée au jugement de l'opérateur. */
    interactif: 'regle',
    manches: 1,
    epreuve: (p = 0) => {
      /* Deux mantisses au dixième, deux décades : c'est exactement ce qu'une
         règle sait faire. Leur produit reste sous dix, pour que le nombre
         cherché ne sorte pas du coulisseau — l'autre index est une leçon pour
         plus tard.

         Ce qui monte avec le palier, ce sont les décades : le produit des
         mantisses ne change pas de nature, mais placer la virgule dans
         37 000 × 240 demande plus d'attention que dans 37 × 24. */
      let m1, m2;
      do {
        m1 = (11 + ((Math.random() * 89) | 0)) / 10;
        m2 = (11 + ((Math.random() * 89) | 0)) / 10;
      } while (m1 * m2 >= 9.95);
      const d1 = 1 + ((Math.random() * (1 + Math.min(2, p))) | 0);
      const d2 = 1 + ((Math.random() * (1 + Math.min(2, p))) | 0);
      const a = Math.round(m1 * Math.pow(10, d1)), b = Math.round(m2 * Math.pow(10, d2));
      return { enonce: `${fmt(a)} × ${fmt(b)}`, reponse: a * b,
               aide: 'Posez l\'index du coulisseau sur la première mantisse, le curseur sur la seconde — puis dites la décade.' };
    },
      sur: trait('pow2', 'cube'), taux: 1.4, base: 7000 },

    { id: 'pascaline', nom: 'La Pascaline', epoque: '1642', emoji: '⚙️',
      op: 'propager une retenue',
      desc: "Pascal avait dix-neuf ans et voulait soulager son père, collecteur d'impôts.",
      gisement: 'vos palindromes',
    /* Sixième instrument reproduit : les lucarnes, les roues, et surtout
       les sautoirs — la vraie invention de Pascal. */
    interactif: 'pascaline',
    manches: 1,
    epreuve: (p = 0) => {
      /* Des chiffres tous ≥ 5 : chaque colonne déborde, et c'est la retenue qui
         est en jeu, pas l'addition. Le nombre de colonnes monte avec le palier
         — et donc le nombre de sautoirs à faire tomber. */
      const larg = 4 + Math.min(4, p);
      const chiffres = () => Array.from({ length: larg }, () => 5 + ((Math.random() * 5) | 0));
      const a = +chiffres().join(''), b = +chiffres().join('');
      return { enonce: `${fmt(a)} + ${fmt(b)}`, reponse: a + b, premier: a, second: b,
               aide: 'La machine porte déjà le premier nombre. Entrez le second, puis faites tomber les sautoirs.' };
    },
      sur: trait('palindrome'), taux: 0.22, base: 15000 },

    { id: 'jacquard', nom: 'Le Métier Jacquard', epoque: '1801', emoji: '🎴',
      op: 'répéter un motif',
      desc: "Des cartes perforées pour tisser. La première machine qu'on ait programmée.",
      gisement: 'vos repdigits et vos ondulants',
    manches: 3,
    epreuve: (p = 0) => {
      /* Le motif s'allonge : deux cartes au départ, jusqu'à cinq. Plus il est
         long, plus il faut compter les perforations avant de savoir laquelle
         revient. */
      const periode = 2 + Math.min(3, p);
      const motif = Array.from({ length: periode }, () => 1 + ((Math.random() * 9) | 0));
      const montre = 2 * periode + 1 + ((Math.random() * periode) | 0);
      const suite = Array.from({ length: montre }, (_, i) => motif[i % periode]);
      return { enonce: `${suite.join(', ')}, ?`, reponse: motif[montre % periode],
               aide: 'La carte perforée répète, et ne se lasse jamais.' };
    },
      sur: trait('repdigit', 'ondulant'), taux: 0.22, base: 32000 },

    { id: 'differences', nom: 'La Machine à différences', epoque: '1822', emoji: '🛞',
      op: 'évaluer un polynôme',
      desc: "Babbage voulait des tables sans erreur. Il n'a jamais fini de la construire.",
      gisement: 'vos nombres figurés',
    manches: 3,
    epreuve: (p = 0) => {
      /* Au départ, des suites du second degré — celles que Babbage tabulait.
         Au-delà, le troisième degré : il faut trois rangs de différences avant
         que ça se stabilise. */
      const quadratiques = [
        k => k * (k + 1) / 2,        // triangulaires
        k => k * k,                  // carrés
        k => k * (3 * k - 1) / 2,    // pentagonaux
        k => k * (2 * k - 1),        // hexagonaux
      ];
      const cubiques = [
        k => k * k * k,                      // cubes
        k => k * (k + 1) * (k + 2) / 6,      // tétraédriques
        k => k * (k + 1) * (2 * k + 1) / 6,  // pyramidaux carrés
      ];
      const table = p < 2 ? quadratiques : cubiques;
      const g = table[(Math.random() * table.length) | 0];
      const d = 1 + ((Math.random() * (3 + p * 2)) | 0);
      return { enonce: [0, 1, 2, 3].map(i => g(d + i)).join(', ') + ', ?',
               reponse: g(d + 4),
               aide: 'Les différences successives finissent toujours par se stabiliser.' };
    },
      sur: trait('triangle', 'carre', 'pentagonal', 'hexagonal', 'tetraedrique', 'pyramidal'),
      taux: 0.12, base: 70000 },

    { id: 'analytique', nom: 'La Machine analytique', epoque: '1837', emoji: '🕰️',
      op: 'tout, en principe',
      desc: "Jamais bâtie. Ada Lovelace y a pourtant écrit le premier programme.",
      gisement: 'vos nombres au-delà du mur',
    manches: 3,
    epreuve: (p = 0) => {
      // La suite de Syracuse : une règle, une boucle, un état. Le premier
      // programme qu'Ada Lovelace aurait pu écrire. La boucle s'allonge.
      const tours = 3 + p * 2;
      const mots = ['trois', 'cinq', 'sept', 'neuf', 'onze', 'treize'];
      let n = 6 + ((Math.random() * 20) | 0);
      const depart = n;
      for (let i = 0; i < tours; i++) n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      return { enonce: `${depart}, puis ${mots[Math.min(p, 5)]} tours de « pair → moitié, impair → 3n+1 »`,
               reponse: n, aide: `Déroulez la boucle à la main, ${tours} fois.` };
    },
      /* Seule machine dont la matière vit au-delà du mur : son recensement ne
         peut pas se faire sur le vivier, qui s'arrête à 9 999. */
      domaine: [10000, 99999],
      sur: n => n === 0 || n >= 10000, taux: 3.2, base: 150000 },

    { id: 'arithmometre', nom: "L'Arithmomètre", epoque: '1851', emoji: '🏭',
      op: 'diviser',
      desc: "La première machine à calculer vendue en série. Quarante ans de succès.",
      gisement: 'vos hautement composés et vos pratiques',
    manches: 3,
    epreuve: (p = 0) => {
      const b = 7 + ((Math.random() * (24 + p * 70)) | 0);
      const q = 12 + ((Math.random() * (78 + p * 400)) | 0);
      return { enonce: `${fmt(b * q)} ÷ ${fmt(b)}`, reponse: q,
               aide: 'La division tombe juste : la machine ne rend pas de reste.' };
    },
      sur: trait('hcn', 'pratique'), taux: 0.030, base: 320000 },
  ];
})();

const MACHINE_PAR_ID = Object.fromEntries(MACHINES.map(m => [m.id, m]));

/* L'état est créé à la volée : une sauvegarde antérieure à l'atelier n'a rien
   à migrer, elle démarre simplement sans machine. */
function atelierEtat() {
  if (!state.atelier) state.atelier = { machines: {}, version: ATELIER.version };
  if (!state.atelier.machines) state.atelier.machines = {};
  if (state.atelier.version !== ATELIER.version) {
    state.atelier.machines = {};
    state.atelier.version = ATELIER.version;
    invalideGisement();
  }
  return state.atelier;
}

const niveauMachine = id => atelierEtat().machines[id] || 0;
const prixMachine = (m, niveau = niveauMachine(m.id)) =>
  Math.round(m.base * Math.pow(ATELIER.facteurPrix, niveau));

/* ---------- les gisements ----------
   Deux comptes par machine, et les deux comptent :

   — celui de VOTRE HERBIER, qui fait tourner l'instrument aujourd'hui ;
   — celui du VIVIER ENTIER, qui dit ce qu'il rendrait si vous aviez tout.

   Le second est fixe : il se calcule une fois, sur les 9 999 nombres, et ne
   bouge plus jamais. Le premier périme dès que la collection change — par le
   même `invalideRevenu` que le revenu passif, sans quoi dix mille nombres fois
   dix instruments seraient reparcourus à chaque affichage. */
let _gisementCache = null, _gisementEtat = null, _vivierCache = null;

function gisements() {
  if (_gisementCache && _gisementEtat === state) return _gisementCache;
  const compte = {};
  MACHINES.forEach(m => compte[m.id] = 0);
  for (const cle of Object.keys(state.owned)) {
    const n = +cle;
    for (const m of MACHINES) if (m.sur(n)) compte[m.id]++;
  }
  _gisementEtat = state;
  return _gisementCache = compte;
}

function invalideGisement() { _gisementCache = null; }

/* Le recensement ne change jamais : un seul parcours pour toute la partie.
   Chaque machine est comptée sur SON domaine — le vivier pour presque toutes,
   l'au-delà du mur pour la machine analytique, dont la matière n'existe pas
   en deçà de 10 000. */
function gisementsVivier() {
  if (_vivierCache) return _vivierCache;
  const compte = {};
  for (const m of MACHINES) {
    const [bas, haut] = m.domaine || [1, POOL_MAX];
    let c = 0;
    for (let n = bas; n <= haut; n++) if (m.sur(n)) c++;
    compte[m.id] = c;
  }
  return _vivierCache = compte;
}

/* Ce qu'une machine rend, par minute. Zéro si elle n'est pas bâtie, et zéro
   tant que l'herbier ne contient rien qu'elle sache traiter — une machine sans
   matière ne tourne pas, c'est tout le principe. */
const rendementParNombre = m => m.taux * niveauMachine(m.id);

function rendementMachine(m) {
  return rendementParNombre(m) * (gisements()[m.id] || 0);
}

function poussiereParMinute() {
  return MACHINES.reduce((s, m) => s + rendementMachine(m), 0);
}

/* Un clic vaut une seconde d'atelier, et jamais moins d'une poussière : au
   démarrage il fait tout le travail, plus tard il reste un appoint. Le compte
   est plafonné comme celui du fond — non par méfiance envers le joueur, qui ne
   triche que contre lui-même, mais parce que le classement se déduit des
   sauvegardes. Cliquer peut donc au mieux doubler la production. */
let _clics = [];

function clicAtelier() {
  const maintenant = Date.now();
  _clics = _clics.filter(t => maintenant - t < 60000);
  const paye = _clics.length < ATELIER.clicsParMinute;
  if (paye) _clics.push(maintenant);

  const gain = paye ? Math.max(1, Math.round(poussiereParMinute() / 60)) : 0;
  if (gain > 0) {
    state.dust += gain;
    state.stats.dustEarned = (state.stats.dustEarned || 0) + gain;
  }
  return gain;
}

/* ============================================================
   LA MISE EN SERVICE

   On n'achète pas une machine : on la fait marcher. Une reproduction est
   montée sur l'établi, et il faut mener à la main l'opération qu'elle
   automatise — additionner pour l'abaque, rayer les multiples pour le crible,
   dérouler une boucle pour la machine analytique. Le fonctionnement
   automatique ne s'ouvre qu'ensuite.

   LA POUSSIÈRE N'EST PRÉLEVÉE QU'À LA RÉUSSITE. Un examen qu'on paie à
   l'entrée punit deux fois la même erreur, et transforme un contrôle de
   savoir-faire en pari. Échouer ne coûte que le temps de recommencer.

   L'ÉTAT NE SURVIT PAS AU RECHARGEMENT. Il vit dans une variable de module, et
   pas dans la sauvegarde : une épreuve retrouvée à moitié faite trois jours
   plus tard ne veut rien dire, et c'est exactement le défaut qui avait fait
   planter les mini-jeux.
   ============================================================ */
let _miseEnService = null;

/* ---------- où sont les portes ----------
   La première, c'est la mise en service. Les suivantes tombent tous les dix
   niveaux. Entre deux, on monte à la poussière seule : sans quoi chaque
   niveau serait un examen, et l'atelier deviendrait une salle de contrôle.

   Ce que ça règle, et qui n'était pas prévu : une fois l'instrument ouvert, il
   n'y avait plus rien à faire que cliquer « Améliorer » cinquante fois. */
const PALIER_TOUS_LES = 10;

const estUnePorte = niveauVise =>
  niveauVise === 1 || niveauVise % PALIER_TOUS_LES === 0;

/* Palier 0 pour la mise en service, 1 au niveau 10, 2 au niveau 20… */
const palierDe = niveauVise =>
  niveauVise === 1 ? 0 : niveauVise / PALIER_TOUS_LES;

function commencerMiseEnService(id) {
  const m = MACHINE_PAR_ID[id];
  if (!m) return { erreur: 'Machine inconnue.' };
  const vise = niveauMachine(id) + 1;
  if (!estUnePorte(vise)) return { erreur: 'Ce niveau ne demande pas d’épreuve.' };
  const prix = prixMachine(m);
  if (state.dust < prix) return { erreur: `Pas assez de poussière — il en faut ${fmt(prix)}.` };

  const palier = palierDe(vise);
  _miseEnService = Object.assign({ id, manche: 1, prix, palier, vise }, m.epreuve(palier));
  if (m.interactif === 'abaque') _miseEnService.tiges = abaqueNeuf(_miseEnService.reponse);
  if (m.interactif === 'quipu') _miseEnService.rangs = quipuNeuf(_miseEnService.reponse);
  if (m.interactif === 'crible') _miseEnService.crible = cribleNeuf(_miseEnService.borne, _miseEnService.tamis);
  if (m.interactif === 'napier') _miseEnService.reglettes = napierNeuf(_miseEnService);
  if (m.interactif === 'regle') _miseEnService.regle = regleNeuve();
  if (m.interactif === 'pascaline') _miseEnService.pascaline = pascalineNeuve(_miseEnService);
  return { ok: true };
}

function abandonnerMiseEnService() { _miseEnService = null; }

function repondreMiseEnService(valeur) {
  const e = _miseEnService;
  if (!e) return null;
  const m = MACHINE_PAR_ID[e.id];
  /* Sur un instrument reproduit, la réponse se lit sur les perles : il n'y a
     pas de champ à saisir, et pas de réponse à taper. */
  if (e.tiges) valeur = valeurAbaque(e.tiges);
  if (e.rangs) valeur = valeurQuipu(e.rangs);
  if (e.crible) valeur = valeurCrible(e.crible);
  if (e.reglettes) valeur = valeurNapier(e.reglettes);
  if (e.regle) valeur = valeurRegle(e.regle);
  if (e.pascaline) valeur = valeurPascaline(e.pascaline);
  const juste = Number.isFinite(valeur) && valeur === e.reponse;

  if (!juste) {
    /* Une seule erreur ferme l'essai — mais elle ne coûte rien, et la
       reproduction se remonte d'un clic. */
    const bilan = { juste: false, attendu: e.reponse, machine: m,
                    diagnostic: e.crible ? diagnosticCrible(e.crible)
                              : e.pascaline ? diagnosticPascaline(e.pascaline) : null };
    _miseEnService = null;
    return bilan;
  }

  if (e.manche >= m.manches) {
    state.dust -= e.prix;
    atelierEtat().machines[e.id] = e.vise;
    _miseEnService = null;
    invalideGisement();
    return { juste: true, fini: true, machine: m, prix: e.prix, niveau: e.vise };
  }

  e.manche++;
  Object.assign(e, m.epreuve(e.palier));
  if (m.interactif === 'abaque') e.tiges = abaqueNeuf(e.reponse);
  if (m.interactif === 'quipu') e.rangs = quipuNeuf(e.reponse);
  if (m.interactif === 'crible') e.crible = cribleNeuf(e.borne, e.tamis);
  if (m.interactif === 'napier') e.reglettes = napierNeuf(e);
  if (m.interactif === 'regle') e.regle = regleNeuve();
  if (m.interactif === 'pascaline') e.pascaline = pascalineNeuve(e);
  return { juste: true, fini: false, manche: e.manche, total: m.manches, machine: m };
}

/* Améliorer, en revanche, ne demande rien : la machine tourne déjà, on ne fait
   qu'en monter une seconde à côté. */
function ameliorerMachine(id) {
  const m = MACHINE_PAR_ID[id];
  if (!m) return { erreur: 'Machine inconnue.' };
  if (!niveauMachine(id)) return { erreur: 'Mettez-la d’abord en service.' };
  if (estUnePorte(niveauMachine(id) + 1)) {
    return { erreur: 'Ce palier demande une révision de l’instrument.' };
  }
  const prix = prixMachine(m);
  if (state.dust < prix) return { erreur: `Pas assez de poussière — il en faut ${fmt(prix)}.` };
  state.dust -= prix;
  const e = atelierEtat();
  e.machines[id] = (e.machines[id] || 0) + 1;
  return { ok: true, niveau: e.machines[id], prix };
}

/* ============================================================
   LE SOROBAN — L'ABAQUE, POUR DE BON

   Quatre tiges. Sur chacune, une perle de ciel au-dessus de la barre qui vaut
   CINQ, et quatre perles de terre en dessous qui valent UN. Une perle compte
   quand elle touche la barre, et pas autrement : c'est toute la règle, et
   c'est elle qu'on apprend en poussant les perles.

   POURQUOI LA LECTURE EST AFFICHÉE. On ne cache pas au débutant ce que son
   instrument est en train de dire — c'est justement en voyant « 152 » se
   former qu'on comprend le rôle des rangs et de la perle de cinq. Le calcul,
   lui, reste à faire : l'énoncé donne l'opération, jamais le résultat.

   La perle de terre suit la mécanique du vrai boulier : pousser la troisième
   perle amène les trois premières contre la barre, et la repousser les renvoie
   toutes en bas. On ne déplace jamais une seule perle isolée.
   ============================================================ */
/* Quatre tiges suffisent aux premières additions ; aux paliers suivants les
   sommes dépassent dix mille, et le boulier gagne les rangs qu'il faut. Un
   vrai soroban en a treize. */
const ABAQUE_TIGES_MIN = 4, ABAQUE_TIGES_MAX = 8;

const abaqueNeuf = (attendu = 0) => {
  const n = Math.min(ABAQUE_TIGES_MAX,
                     Math.max(ABAQUE_TIGES_MIN, String(Math.max(0, attendu)).length + 1));
  return Array.from({ length: n }, () => ({ ciel: 0, terre: 0 }));
};

const valeurAbaque = (tiges) => tiges.reduce(
  (v, t) => v * 10 + (t.ciel * 5 + t.terre), 0);

/* `rang` compte depuis la gauche, `perle` vaut 0 pour le ciel et 1 à 4 pour la
   terre, comptées à partir de la barre. */
function pousserPerle(rang, perle) {
  const e = _miseEnService;
  if (!e || !e.tiges) return;
  const t = e.tiges[rang];
  if (!t) return;
  if (perle === 0) { t.ciel = t.ciel ? 0 : 1; return; }
  t.terre = t.terre >= perle ? perle - 1 : perle;
}

function remettreAZero() {
  const e = _miseEnService;
  if (e && e.tiges) e.tiges = abaqueNeuf();
}

function abaqueHTML() {
  const e = _miseEnService;
  const lu = valeurAbaque(e.tiges);
  const rangs = e.tiges.map((t, i) => {
    const ciel = `<button class="abPerle ciel ${t.ciel ? 'active' : ''}" type="button"
        data-rang="${i}" data-perle="0"
        aria-label="Perle de cinq, rang ${e.tiges.length - i}"></button>`;
    const terre = [1, 2, 3, 4].map(k => `<button class="abPerle terre ${k <= t.terre ? 'active' : ''}"
        type="button" data-rang="${i}" data-perle="${k}" style="--k:${k - 1}"
        aria-label="Perle d'un, rang ${e.tiges.length - i}"></button>`).join('');
    return `<div class="abTige">
      <div class="abCiel"><span class="abBaguette"></span>${ciel}</div>
      <div class="abTerre"><span class="abBaguette"></span>${terre}</div>
      <span class="abRang">${fmt(Math.pow(10, e.tiges.length - 1 - i))}</span>
    </div>`;
  }).join('');

  return `<div class="abaque">
    <div class="abCadre">
      <div class="abTiges">${rangs}</div>
      <div class="abBarre" aria-hidden="true"></div>
    </div>
    <div class="abLecture">
      <span>Le boulier dit</span>
      <b class="${lu === e.reponse ? 'juste' : ''}">${fmt(lu)}</b>
    </div>
  </div>`;
}


/* ============================================================
   LE QUIPU — LE CORDON, POUR DE BON

   Un cordon pendant, et sur lui des rangs : le plus haut porte la plus grande
   puissance de dix, le plus bas les unités. C'est un système POSITIONNEL, et
   c'est ce qui rend les khipus andins remarquables — la même idée que nos
   chiffres, nouée sur de la laine, plusieurs siècles avant que l'Europe ne
   l'adopte.

   TROIS SORTES DE NŒUDS, et elles ne sont pas décoratives :

   — aux rangs supérieurs, des NŒUDS SIMPLES, un par unité du rang ;
   — au rang des unités, un NŒUD LONG dont on compte les tours ;
   — et pour un seul, un NŒUD EN HUIT, parce qu'un nœud long d'un seul tour ne
     tiendrait pas.

   Le zéro est l'absence de nœud : un rang vide. C'est la seule façon d'écrire
   zéro sur une corde, et elle marche.

   On noue en cliquant sous le dernier nœud, on dénoue en cliquant sur un nœud —
   il part avec tous ceux qui le suivent, comme on défait un cordon.
   ============================================================ */
const QUIPU_RANGS_MIN = 3, QUIPU_RANGS_MAX = 6;

const quipuNeuf = (attendu = 0) => {
  const n = Math.min(QUIPU_RANGS_MAX,
                     Math.max(QUIPU_RANGS_MIN, String(Math.max(0, attendu)).length));
  return Array.from({ length: n }, () => 0);
};

const valeurQuipu = (rangs) => rangs.reduce((v, d) => v * 10 + d, 0);

/* `rang` compte depuis le haut, `n` est le nombre de nœuds visé. Cliquer sous
   le dernier nœud en ajoute un ; cliquer sur un nœud le retire, lui et ceux
   d'en dessous. */
function nouer(rang, n) {
  const e = _miseEnService;
  if (!e || !e.rangs) return;
  if (rang < 0 || rang >= e.rangs.length) return;
  e.rangs[rang] = Math.max(0, Math.min(9, n));
}

function denouerTout() {
  const e = _miseEnService;
  if (e && e.rangs) e.rangs = e.rangs.map(() => 0);
}

function quipuHTML() {
  const e = _miseEnService;
  const lu = valeurQuipu(e.rangs);
  const dernier = e.rangs.length - 1;

  const rangs = e.rangs.map((d, i) => {
    const unites = i === dernier;
    const pas = Math.min(15, 92 / Math.max(1, d));
    const noeuds = Array.from({ length: d }, (_, k) => {
      const classes = ['quNoeud', unites ? (d === 1 ? 'huit' : 'long') : 'simple'].join(' ');
      return `<button class="${classes}" type="button" data-rang="${i}" data-noeud="${k}"
          style="top:${Math.round(k * pas)}px"
          aria-label="Dénouer à partir du nœud ${k + 1}"></button>`;
    }).join('');

    return `<div class="quRang${unites ? ' unites' : ''}">
      <span class="quPoids">${fmt(Math.pow(10, dernier - i))}</span>
      <div class="quCordon">
        <span class="quFil" aria-hidden="true"></span>
        ${noeuds}
        ${d < 9 ? `<button class="quNouer" type="button" data-rang="${i}" data-noeud="-1"
             style="top:${Math.round(d * pas) + (d ? 14 : 0)}px"
             aria-label="Nouer un nœud de plus au rang ${fmt(Math.pow(10, dernier - i))}"
             >${d === 0 ? '0' : ''}</button>` : ''}
      </div>
      <span class="quChiffre">${d}</span>
    </div>`;
  }).join('');

  return `<div class="quipu">
    <div class="quCadre">
      <div class="quPrincipal" aria-hidden="true"></div>
      <div class="quRangs">${rangs}</div>
    </div>
    <div class="abLecture">
      <span>Le cordon dit</span><b>${fmt(lu)}</b>
    </div>
  </div>`;
}


/* ============================================================
   LE CRIBLE D'ÉRATOSTHÈNE — UNE PASSE, À LA MAIN

   On écrit les nombres de deux à N, on prend le plus petit qui reste, et on
   barre tous ses multiples. Ce qui survit est premier : tout l'algorithme,
   vieux de vingt-deux siècles.

   ON N'EN FAIT PASSER QU'UNE, ET C'EST VOLONTAIRE. Faire dérouler le crible
   entier ne demandait aucune réflexion : « cliquer sur le nombre le plus à
   gauche qui reste » donne toujours la bonne réponse, et la grille se
   résolvait toute seule. La machine faisait le travail, le joueur faisait le
   figurant.

   Or le travail du crible, c'est BARRER. La table arrive donc déjà passée aux
   premiers plus petits, et il faut mener une seule passe soi-même : quels
   nombres tombent quand vient le tour du tamis ?

   La réponse n'est pas « ses multiples » — ce sont ceux qui ont SURVÉCU
   jusque-là, soit p×q avec q premier au moins égal à p. Pour sept sur cent :
   49, 77 et 91, et rien d'autre. Il faut les chercher, et c'est ainsi qu'on
   découvre qu'une passe commence au carré du tamis.
   ============================================================ */
/* Le plus petit facteur premier de n. C'est lui qui dit quelle passe a
   emporté un nombre — et donc ce qui doit déjà être barré quand vient le
   tour du tamis courant. */
function plusPetitFacteur(n) {
  if (n % 2 === 0) return 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d;
  return n;
}

/* 0 = intact, 2 = barré avant vous, 3 = barré par vous. Le tamis courant est
   marqué à part : c'est lui qui mène la passe, il ne tombe pas. */
function cribleNeuf(borne, tamis) {
  const etat = new Array(borne + 1).fill(0);
  for (let k = 4; k <= borne; k++) {
    const f = plusPetitFacteur(k);
    if (f !== k && f < tamis) etat[k] = 2;      // emporté par une passe passée
  }
  return { n: borne, tamis, etat };
}

/* Un clic barre, un second relève : on se corrige sans tout reprendre. */
function barrer(k) {
  const e = _miseEnService, c = e && e.crible;
  if (!c || k < 2 || k > c.n) return;
  if (c.etat[k] === 2 || k === c.tamis) return;   // déjà tombé, ou c'est le tamis
  c.etat[k] = c.etat[k] === 3 ? 0 : 3;
}

function ratisserTout() {
  const e = _miseEnService;
  if (e && e.crible) e.crible = cribleNeuf(e.crible.n, e.crible.tamis);
}

/* La passe est juste quand les nombres barrés par le joueur sont EXACTEMENT
   ceux que le tamis emporte. On rend leur compte, ou -1. */
function valeurCrible(c) {
  let compte = 0;
  for (let k = 2; k <= c.n; k++) {
    const doitTomber = k !== c.tamis && k % c.tamis === 0 && plusPetitFacteur(k) === c.tamis;
    const barreParJoueur = c.etat[k] === 3;
    if (doitTomber !== barreParJoueur) return -1;
    if (barreParJoueur) compte++;
  }
  return compte;
}

/* Ce qui cloche, dit en clair : un « la réponse était 3 » n'apprendrait rien
   sur une passe qu'on vient de mal mener. */
function diagnosticCrible(c) {
  for (let k = 2; k <= c.n; k++) {
    const doitTomber = k !== c.tamis && k % c.tamis === 0 && plusPetitFacteur(k) === c.tamis;
    if (c.etat[k] === 3 && !doitTomber) {
      return k % c.tamis === 0
        ? `${k} était déjà tombé : ${plusPetitFacteur(k)} l'avait emporté avant le ${c.tamis}.`
        : `${k} n'est pas un multiple de ${c.tamis}.`;
    }
    if (doitTomber && c.etat[k] !== 3) {
      return `${k} tient encore debout, alors que ${c.tamis} × ${k / c.tamis} le donne.`;
    }
  }
  return null;
}

function cribleHTML() {
  const e = _miseEnService, c = e.crible;
  const cases = [];
  for (let k = 2; k <= c.n; k++) {
    const etat = c.etat[k];
    const tamis = k === c.tamis;
    const classes = ['crCase', tamis ? 'tamis' : etat === 2 ? 'barre'
                                     : etat === 3 ? 'raye' : 'intact'];
    cases.push(`<button class="${classes.join(' ')}" type="button" data-crible="${k}"
        ${etat === 2 || tamis ? 'disabled' : ''}
        aria-label="${tamis ? `${k}, le tamis` : etat === 2 ? `${k}, déjà tombé`
                    : etat === 3 ? `${k}, barré — cliquez pour le relever`
                    : `Barrer ${k}`}"
        >${k}</button>`);
  }
  let rayes = 0;
  for (let k = 2; k <= c.n; k++) if (c.etat[k] === 3) rayes++;

  return `<div class="crible">
    <div class="crTable">${cases.join('')}</div>
    <div class="abLecture">
      <span>Barrés</span><b>${fmt(rayes)}</b>
      <span class="crAppoint">par la passe du ${c.tamis}</span>
    </div>
  </div>`;
}


/* ============================================================
   LES BÂTONS DE NAPIER — LES RÉGLETTES, POUR DE BON

   Neuf réglettes gravées, une par chiffre. Sur celle du chiffre d, la rangée n
   porte le produit n×d, coupé en deux par une diagonale : les dizaines en haut
   à gauche, les unités en bas à droite.

   POUR MULTIPLIER, on aligne les réglettes du multiplicande, on lit la rangée
   du multiplicateur, et — c'est là tout l'intérêt de l'objet — ON SOMME EN
   DIAGONALE. Chaque gouttière additionne les unités d'une case et les dizaines
   de sa voisine de droite, et la retenue part vers la gauche.

   385 × 7 : les réglettes 3, 8 et 5 donnent 2|1, 5|6, 3|5 à la septième
   rangée. En diagonale : 2, puis 1+5=6, puis 6+3=9, puis 5. Deux mille six
   cent quatre-vingt-quinze. La multiplication est devenue une addition — c'est
   exactement ce que Napier vendait.

   CE QUE LA MACHINE NE FAIT PAS À VOTRE PLACE : la somme des diagonales et les
   retenues. Les réglettes affichent les produits — c'est leur travail, gravé
   dans le bois. Le reste est le vôtre.
   ============================================================ */
const napierNeuf = (e) => {
  const chiffres = String(e.multiplicande).split('').map(Number);
  return {
    chiffres, b: e.multiplicateur,
    /* Une gouttière de plus que de réglettes : la diagonale la plus à gauche
       ne reçoit que des dizaines, celle de droite que des unités. */
    gouttieres: new Array(chiffres.length + 1).fill(0),
  };
};

/* Ce que porte une case : le produit, coupé par la diagonale. */
const caseNapier = (d, n) => ({ dizaines: Math.floor(d * n / 10), unites: (d * n) % 10 });

const valeurNapier = (r) => Number(r.gouttieres.join('')) || 0;

function reglerGouttiere(i, pas) {
  const e = _miseEnService, r = e && e.reglettes;
  if (!r || i < 0 || i >= r.gouttieres.length) return;
  r.gouttieres[i] = (r.gouttieres[i] + pas + 10) % 10;
}

function reposerReglettes() {
  const e = _miseEnService;
  if (e && e.reglettes) e.reglettes.gouttieres.fill(0);
}

function napierHTML() {
  const e = _miseEnService, r = e.reglettes;
  const k = r.chiffres.length;

  /* Les neuf rangées sont là, comme sur l'objet : on voit qu'on LIT une
     réglette, et pas qu'on interroge une machine. Seule la rangée du
     multiplicateur est en pleine lumière. */
  const rangees = [];
  for (let n = 1; n <= 9; n++) {
    const cellules = r.chiffres.map(d => {
      const c = caseNapier(d, n);
      return `<span class="npCase"><i class="npDix">${c.dizaines}</i><i class="npUn">${c.unites}</i></span>`;
    }).join('');
    rangees.push(`<div class="npRangee${n === r.b ? ' lue' : ''}">
      <span class="npRang">${n}</span>${cellules}</div>`);
  }

  const gouttieres = r.gouttieres.map((g, i) => `<div class="npGout">
      <button class="npPas" type="button" data-gouttiere="${i}" data-pas="1"
              aria-label="Chiffre suivant">▲</button>
      <b>${g}</b>
      <button class="npPas" type="button" data-gouttiere="${i}" data-pas="-1"
              aria-label="Chiffre précédent">▼</button>
    </div>`).join('');

  return `<div class="napier">
    <div class="npCadre">
      <div class="npTetes"><span class="npRang"></span>${
        r.chiffres.map(d => `<span class="npTete">${d}</span>`).join('')}</div>
      <div class="npCorps">${rangees.join('')}</div>

      <div class="npLecture">
        <span class="npEtiquette">Les diagonales, de gauche à droite</span>
        <div class="npGouts">${gouttieres}</div>
      </div>
    </div>

    <div class="abLecture">
      <span>Les réglettes disent</span><b>${fmt(valeurNapier(r))}</b>
    </div>
  </div>`;
}


/* ============================================================
   LA RÈGLE À CALCUL — LES DEUX ÉCHELLES, POUR DE BON

   Deux réglettes graduées en logarithmes : D, fixe, et C, qui coulisse. Poser
   l'index de C sur un nombre de D, c'est reporter une longueur log a. Lire sur
   D en face d'un nombre de C, c'est ajouter log b à cette longueur. Et comme
   log a + log b = log(ab), la règle multiplie en additionnant des distances.

   CE QU'ELLE NE DIT PAS, ET QUI EST TOUT L'EXERCICE : l'ordre de grandeur. La
   règle ne connaît que des mantisses, de 1 à 10 ; c'est l'opérateur qui sait si
   le résultat vaut 8,88 — ou 888. Trois siècles d'ingénieurs ont vécu avec
   cette règle du jeu, et c'est elle qu'on fait pratiquer ici : normaliser les
   deux facteurs, aligner, lire, puis poser la décade soi-même.

   POURQUOI LE COULISSEAU S'ARRÊTE. L'échelle C est coupée au bord du cadre :
   quand le produit des mantisses dépasserait dix, le nombre cherché sort de la
   règle. Ce n'est pas une limite de l'écran, c'est celle de l'instrument — et
   c'est ainsi qu'on découvre qu'il faut alors se servir de l'autre index.
   ============================================================ */
const REGLE_MIN = 1.1, REGLE_MAX = 9.9;

/* Position d'une valeur sur une échelle logarithmique de 1 à 10, en fraction
   de la longueur totale. */
const posLog = (v) => Math.log10(v);

/* On arrondit au dixième : c'est la graduation, et c'est ce qui rend la
   lecture exacte au lieu d'approchée. */
const auDixieme = (v) => Math.min(REGLE_MAX, Math.max(REGLE_MIN, Math.round(v * 10) / 10));

const regleNeuve = () => ({ index: 2, curseur: 2, decade: 0 });

/* Ce que la règle affiche sous le curseur : le produit des deux mantisses. */
const mantisseRegle = (r) => Math.round(r.index * r.curseur * 100) / 100;

const valeurRegle = (r) => Math.round(mantisseRegle(r) * Math.pow(10, r.decade));

function reglerIndex(v) {
  const e = _miseEnService;
  if (e && e.regle) e.regle.index = auDixieme(v);
}

function reglerCurseur(v) {
  const e = _miseEnService;
  if (e && e.regle) e.regle.curseur = auDixieme(v);
}

function reglerDecade(pas) {
  const e = _miseEnService;
  if (e && e.regle) e.regle.decade = Math.min(6, Math.max(0, e.regle.decade + pas));
}

function reposerRegle() {
  const e = _miseEnService;
  if (e && e.regle) e.regle = regleNeuve();
}

/* Les graduations : les entiers portent leur chiffre, les dixièmes sont de
   simples traits. Au-delà de 4, un vrai modèle espace les dixièmes ; on garde
   ici le pas constant, pour que chaque graduation reste cliquable. */
function graduationsRegle(echelle) {
  const traits = [];
  for (let d = 10; d <= 100; d++) {
    const v = d / 10;
    const majeur = Number.isInteger(v);
    traits.push(`<span class="rgTrait${majeur ? ' majeur' : ''}"
        style="left:${(posLog(v) * 100).toFixed(3)}%"></span>`);
    if (majeur) {
      /* Le « 1 » et le « 10 » tombent aux deux bouts : centrés, ils sortiraient
         de l'échelle. On les rentre. */
      const bord = v === 1 ? ' debut' : v === 10 ? ' fin' : '';
      traits.push(`<span class="rgChiffre${bord}" style="left:${(posLog(v) * 100).toFixed(3)}%">${v}</span>`);
    }
  }
  return traits.join('');
}

function regleHTML() {
  const e = _miseEnService, r = e.regle;
  const decalage = posLog(r.index) * 100;
  const curseur = (posLog(r.index) + posLog(r.curseur)) * 100;
  const mantisse = mantisseRegle(r);

  return `<div class="regle">
    <div class="rgCadre">
      <button class="rgEchelle fixe" type="button" data-echelle="D"
              aria-label="Échelle D — poser l'index du coulisseau">
        <span class="rgNom">D</span>${graduationsRegle('D')}
      </button>

      <div class="rgFente">
        <button class="rgEchelle mobile" type="button" data-echelle="C"
                style="left:${decalage.toFixed(3)}%"
                aria-label="Échelle C — poser le curseur">
          <span class="rgNom">C</span>${graduationsRegle('C')}
        </button>
      </div>

      <span class="rgCurseur" style="left:${curseur.toFixed(3)}%" aria-hidden="true"></span>
    </div>

    <div class="rgLecture">
      <span class="rgChamp">
        <i>index de C sur D</i><b>${r.index.toFixed(1)}</b>
        <span class="rgFin">
          <button class="rgPas" type="button" data-regle="index" data-pas="-1">◀</button>
          <button class="rgPas" type="button" data-regle="index" data-pas="1">▶</button>
        </span>
      </span>
      <span class="rgChamp">
        <i>curseur sur C</i><b>${r.curseur.toFixed(1)}</b>
        <span class="rgFin">
          <button class="rgPas" type="button" data-regle="curseur" data-pas="-1">◀</button>
          <button class="rgPas" type="button" data-regle="curseur" data-pas="1">▶</button>
        </span>
      </span>
      <span class="rgChamp lu">
        <i>lu sur D</i><b>${mantisse.toFixed(2)}</b>
      </span>
      <span class="rgChamp">
        <i>décade</i><b>× 10<sup>${r.decade}</sup></b>
        <span class="rgFin">
          <button class="rgPas" type="button" data-regle="decade" data-pas="-1">◀</button>
          <button class="rgPas" type="button" data-regle="decade" data-pas="1">▶</button>
        </span>
      </span>
    </div>

    <div class="abLecture">
      <span>La règle dit</span><b>${fmt(valeurRegle(r))}</b>
    </div>
  </div>`;
}


/* ============================================================
   LA PASCALINE — LE SAUTOIR, POUR DE BON

   Une rangée de lucarnes qui montrent le total, une rangée de roues pour
   entrer les chiffres. On pose le stylet dans le trou du chiffre voulu et on
   tourne jusqu'à la butée : le tambour de ce rang avance d'autant.

   L'INVENTION, C'EST LA RETENUE. Quand un tambour passe de 9 à 0, un poids —
   le SAUTOIR — tombe et pousse d'un cran le tambour de gauche. Pascal avait
   dix-neuf ans, et le problème qu'il a résolu n'est pas d'additionner : c'est
   de faire propager cette retenue de proche en proche, à travers toute la
   machine, sans que rien ne se coince. 999 999 + 1 demande six sautoirs coup
   sur coup.

   ICI, LA MACHINE NE PROPAGE PAS À VOTRE PLACE. Les tambours tournent et les
   sautoirs s'arment ; c'est vous qui les faites tomber, un par un, et dans
   l'ordre — chacun peut en armer un autre. Une machine qu'on laisse avec un
   sautoir armé n'a pas fini son addition, et son total ne vaut rien : c'est
   exactement ce que Pascal a passé des années à rendre automatique.
   ============================================================ */
function pascalineNeuve(e) {
  const total = String(e.reponse).length;
  const depart = String(e.premier).padStart(total, '0').split('').map(Number);
  return {
    tambours: depart,
    sautoirs: new Array(total).fill(false),   // sautoir i pousse le rang i-1
    roue: null,                               // le rang où le stylet est posé
    aEntrer: String(e.second).padStart(total, '0').split('').map(Number),
  };
}

/* Le total lu aux lucarnes — mais une machine qui garde un sautoir armé n'a
   pas fini : son total ne veut rien dire, et on rend -1. */
function valeurPascaline(p) {
  if (p.sautoirs.some(Boolean)) return -1;
  return Number(p.tambours.join(''));
}

/* On nomme les rangs plutôt que de les chiffrer : « au rang des unités » se
   lit, « au rang des 1 » se déchiffre. */
const NOMS_RANG = ['unités', 'dizaines', 'centaines', 'milliers',
                   'dizaines de milliers', 'centaines de milliers', 'millions'];
const nomRang = (k) => NOMS_RANG[k] || `${fmt(Math.pow(10, k))}`;

function diagnosticPascaline(p) {
  const i = p.sautoirs.findIndex(Boolean);
  if (i < 0) return null;
  return `Un sautoir est encore armé au rang des ${nomRang(p.tambours.length - 1 - i)}`
       + ` : la retenue n'est pas passée.`;
}

const choisirRoue = (i) => {
  const e = _miseEnService;
  if (e && e.pascaline) e.pascaline.roue = e.pascaline.roue === i ? null : i;
};

/* Tourner la roue du rang i de d crans. Le tambour avance, et s'il franchit le
   neuf, le sautoir de ce rang s'arme — sans rien pousser encore. */
function tournerRoue(i, d) {
  const e = _miseEnService, p = e && e.pascaline;
  if (!p || i < 0 || i >= p.tambours.length) return;
  const v = p.tambours[i] + d;
  p.tambours[i] = v % 10;
  if (v >= 10) p.sautoirs[i] = true;
  p.roue = null;
}

/* Faire tomber un sautoir : il pousse d'un cran le tambour de gauche, et peut
   en armer un autre. C'est la cascade. */
function lacherSautoir(i) {
  const e = _miseEnService, p = e && e.pascaline;
  if (!p || !p.sautoirs[i]) return;
  p.sautoirs[i] = false;
  /* Au rang le plus à gauche, il n'y a plus de tambour à pousser : la retenue
     sort de la machine et se perd, comme sur l'objet. Une addition bien menée
     n'y arrive jamais — la lucarne de tête est justement là pour la recevoir. */
  if (i === 0) return;
  const v = p.tambours[i - 1] + 1;
  p.tambours[i - 1] = v % 10;
  if (v >= 10) p.sautoirs[i - 1] = true;
}

function reposerPascaline() {
  const e = _miseEnService;
  if (e && e.pascaline) e.pascaline = pascalineNeuve(e);
}

function pascalineHTML() {
  const e = _miseEnService, p = e.pascaline;
  const n = p.tambours.length;

  const colonnes = p.tambours.map((t, i) => {
    const arme = p.sautoirs[i];
    const choisie = p.roue === i;
    return `<div class="pcRang${choisie ? ' choisie' : ''}">
      <span class="pcPoids" title="rang des ${nomRang(n - 1 - i)}">10<sup>${n - 1 - i}</sup></span>
      <span class="pcLucarne">${t}</span>
      <button class="pcSautoir${arme ? ' arme' : ''}" type="button"
              data-sautoir="${i}" ${arme ? '' : 'disabled'}
              aria-label="${arme ? 'Faire tomber le sautoir' : 'Sautoir au repos'}">${
        arme ? '↰' : '·'}</button>
      <button class="pcRoue" type="button" data-roue="${i}"
              aria-label="Poser le stylet sur la roue des ${nomRang(n - 1 - i)}">
        <span class="pcMoyeu">${choisie ? '⌖' : '○'}</span>
      </button>
    </div>`;
  }).join('');

  /* Le clavier des chiffres n'apparaît que sous la roue choisie : dix trous
     par rang tiendraient sur un bureau, pas sur un téléphone. */
  const clavier = p.roue === null ? '' : `<div class="pcClavier">
      <span class="pcConsigne">Tournez la roue des ${nomRang(n - 1 - p.roue)} jusqu'au chiffre</span>
      <div class="pcTrous">${[0,1,2,3,4,5,6,7,8,9].map(d =>
        `<button class="pcTrou" type="button" data-cran="${d}">${d}</button>`).join('')}</div>
    </div>`;

  const lu = valeurPascaline(p);
  return `<div class="pascaline">
    <div class="pcCadre"><div class="pcRangs">${colonnes}</div></div>
    ${clavier}
    <div class="abLecture">
      <span>Aux lucarnes</span><b>${fmt(Number(p.tambours.join('')))}</b>
      ${lu < 0 ? '<span class="pcAlerte">une retenue attend</span>' : ''}
    </div>
  </div>`;
}

/* ============================================================
   RENDU
   ============================================================ */

/* La reproduction sur l'établi. Elle se déplie sous la ligne de la machine,
   pour qu'on voie toujours laquelle on est en train de faire marcher. */
function essaiHTML(m) {
  const e = _miseEnService;
  const perles = Array.from({ length: m.manches }, (_, i) =>
    `<i class="${i < e.manche - 1 ? 'bon' : i === e.manche - 1 ? 'encours' : 'avenir'}"></i>`).join('');
  return `<div class="atEssai">
    <div class="atEssaiTete">
      <span class="atEssaiTitre">${e.palier
        ? `Révision de l'instrument · palier ${e.palier} — ${m.op}`
        : `Reproduction sur l'établi — ${m.op}`}</span>
      <span class="calcChapelet">${perles}</span>
      <span class="atEssaiRang">${e.manche} / ${m.manches}</span>
    </div>
    <p class="atEssaiAide">${e.aide}${
      m.interactif === 'abaque'
        ? ' Une perle ne compte que si elle touche la barre : celle du haut vaut cinq, celles du bas valent un.'
      : m.interactif === 'quipu'
        ? ' Cliquez sous un cordon pour nouer, sur un nœud pour dénouer. Un rang sans nœud vaut zéro.'
      : m.interactif === 'crible'
        ? ' Un multiple du tamis déjà emporté par une passe précédente ne tombe pas deux fois : la passe commence au carré.'
      : m.interactif === 'napier'
        ? ' Chaque gouttière somme les deux demi-cases qui l\'encadrent, et la retenue va vers la gauche.'
      : m.interactif === 'regle'
        ? ' La règle ne connaît que des mantisses de 1 à 10 : l\'ordre de grandeur est à vous.'
      : m.interactif === 'pascaline'
        ? ' Un tambour qui franchit le neuf arme son sautoir — et un sautoir qui tombe peut en armer un autre.'
      : ''}</p>
    <div class="atEssaiCalcul">${e.enonce}${e.consigne || /[?？]\s*$/.test(e.enonce)
      ? '' : ' <span class="atEssaiEgal">=</span>'}</div>

    ${m.interactif === 'abaque' ? abaqueHTML()
      : m.interactif === 'quipu' ? quipuHTML()
      : m.interactif === 'crible' ? cribleHTML()
      : m.interactif === 'napier' ? napierHTML()
      : m.interactif === 'regle' ? regleHTML()
      : m.interactif === 'pascaline' ? pascalineHTML() : ''}

    <div class="calcSaisie">
      ${m.interactif ? '' : `<input type="number" id="atEssaiInput" inputmode="numeric"
             autocomplete="off" placeholder="…" aria-label="Votre réponse">`}
      <button class="btn" id="atEssaiValider">Valider</button>
      ${m.interactif ? '<button class="btn ghost sm" id="atEssaiRaz">Remettre à zéro</button>' : ''}
      <button class="btn ghost sm" id="atEssaiQuitter">Renoncer</button>
    </div>
    <p class="tiny atEssaiNote">La poussière n'est prélevée qu'à la réussite. Une erreur
       ferme l'essai, sans rien vous coûter.</p>
  </div>`;
}

/* Deux décimales écrasaient 0,045 et 0,036 sur le même « 0.04 » : deux
   machines très différentes se lisaient identiques. On garde trois chiffres
   significatifs, sans traîner de zéros inutiles. */
function tauxLisible(t) {
  if (t >= 1) return t.toFixed(2).replace(/\.?0+$/, '');
  if (t >= 0.1) return t.toFixed(3).replace(/0+$/, '');
  return t.toFixed(4).replace(/0+$/, '');
}

function renderAtelier() {
  const zone = document.querySelector('#atZone');
  if (!zone) return;

  const gis = gisements(), viv = gisementsVivier();
  const total = poussiereParMinute();
  const parClic = Math.max(1, Math.round(total / 60));

  const ligne = (m) => {
    const niveau = niveauMachine(m.id);
    const prix = prixMachine(m);
    const possede = gis[m.id] || 0, dansVivier = viv[m.id] || 0;
    /* Une machine à bâtir affiche ce qu'elle rendrait au niveau 1 : sans ça,
       toutes les lignes non bâties afficheraient zéro, et il n'y aurait aucun
       moyen de choisir laquelle monter. */
    const parNombre = niveau ? rendementParNombre(m) : m.taux;
    const totalM = parNombre * possede;
    const abordable = state.dust >= prix;
    const enCours = _miseEnService && _miseEnService.id === m.id;
    const vise = niveau + 1, porte = estUnePorte(vise);

    return `<article class="atLigne ${niveau ? 'batie' : 'aBatir'}${enCours ? ' enCours' : ''}">
      <div class="atCorps">
        <span class="atEmoji" aria-hidden="true">${m.emoji}</span>

        <div class="atIdent">
          <h3>${m.nom}${niveau ? ` <span class="atNiveau">niv. ${niveau}</span>` : ''}</h3>
          <span class="atEpoque">${m.epoque} · ${m.op}${niveau && !porte
            ? ` · <span class="atProchain">révision au niveau ${Math.ceil(vise / PALIER_TOUS_LES) * PALIER_TOUS_LES}</span>` : ''}</span>
          <p class="atDesc">${m.desc}</p>
        </div>

        <div class="atCalcul">
          <span class="atFacteur">
            <b>${tauxLisible(parNombre)}</b><i>✨/min par nombre</i>
          </span>
          <span class="atFois" aria-hidden="true">×</span>
          <span class="atFacteur">
            <b>${fmt(possede)}</b><i>traités · ${fmt(dansVivier)} existants</i>
          </span>
          <span class="atFois" aria-hidden="true">=</span>
          <span class="atFacteur produit">
            <b>${fmt(Math.round(totalM))}</b><i>✨/min${niveau ? '' : ' une fois en service'}</i>
          </span>
        </div>

        <div class="atAction">
          <button class="btn ${abordable ? '' : 'ghost'} sm ${porte && niveau ? 'porte' : ''}"
                  data-machine="${m.id}" data-geste="${porte ? 'epreuve' : 'ameliorer'}"
                  ${abordable && !enCours ? '' : 'disabled'}>
            ${!niveau ? 'Mettre en service' : porte ? 'Réviser' : 'Améliorer'}
          </button>
          ${ATELIER_TEST && niveau ? `<button class="atTest" type="button" data-reset="${m.id}"
             title="Test — remet la machine à zéro">⟲ test</button>` : ''}
          <span class="atPrix">${fmt(prix)} ✨${porte && niveau
            ? ` · <b class="atPorte">palier ${palierDe(vise)}</b>` : ''}</span>
        </div>
      </div>

      ${enCours ? essaiHTML(m) : ''}
    </article>`;
  };

  zone.innerHTML = `
    <div class="atEntete">
      <div class="atSomme">
        <span>Production</span><b>${fmt(Math.round(total))}</b><i>✨/min</i>
      </div>
      <button class="btn big atClic" id="atClic">
        <b>Tourner la manivelle</b><small>+${fmt(parClic)} ✨</small>
      </button>
      <p class="tiny atNote">Chaque machine ne travaille que les nombres de votre herbier
         qu'elle sait traiter, et il faut la faire marcher à la main avant qu'elle ne
         tourne seule. Collectionner fait tourner l'atelier ; l'atelier ne remplace pas
         la collection.</p>
    </div>
    <div class="atListe">${MACHINES.map(ligne).join('')}</div>`;

  cablerAtelier();
}

function cablerAtelier() {
  cablerAidesDeTest();

  const clic = document.querySelector('#atClic');
  if (clic) clic.addEventListener('click', () => {
    const gain = clicAtelier();
    save(); renderWallet(); renderAtelier();
    if (!gain) toast('La manivelle a chauffé. Laissez-la souffler une minute.', 'bad');
  });

  document.querySelectorAll('#atZone [data-machine]').forEach(el =>
    el.addEventListener('click', () => {
      const id = el.dataset.machine, m = MACHINE_PAR_ID[id];
      if (el.dataset.geste === 'ameliorer') {
        const r = ameliorerMachine(id);
        if (r.erreur) return toast(r.erreur, 'bad');
        save(); renderWallet(); renderAtelier();
        return toast(`${m.emoji} ${m.nom} — niveau ${r.niveau}.`, 'good');
      }
      const r = commencerMiseEnService(id);
      if (r.erreur) return toast(r.erreur, 'bad');
      renderAtelier();
      const champ = document.querySelector('#atEssaiInput');
      if (champ) champ.focus();
    }));

  document.querySelectorAll('#atZone .abPerle').forEach(el =>
    el.addEventListener('click', () => {
      pousserPerle(+el.dataset.rang, +el.dataset.perle);
      renderAtelier();
    }));

  document.querySelectorAll('#atZone [data-noeud]').forEach(el =>
    el.addEventListener('click', () => {
      const rang = +el.dataset.rang, k = +el.dataset.noeud;
      const actuel = _miseEnService.rangs[rang];
      /* Sous le dernier nœud, on en ajoute un ; sur un nœud, on retire à
         partir de lui. */
      nouer(rang, k < 0 ? actuel + 1 : k);
      renderAtelier();
    }));

  document.querySelectorAll('#atZone [data-crible]').forEach(el =>
    el.addEventListener('click', () => { barrer(+el.dataset.crible); renderAtelier(); }));

  document.querySelectorAll('#atZone [data-roue]').forEach(el =>
    el.addEventListener('click', () => { choisirRoue(+el.dataset.roue); renderAtelier(); }));

  document.querySelectorAll('#atZone [data-cran]').forEach(el =>
    el.addEventListener('click', () => {
      const p = _miseEnService.pascaline;
      if (p.roue !== null) tournerRoue(p.roue, +el.dataset.cran);
      renderAtelier();
    }));

  document.querySelectorAll('#atZone [data-sautoir]').forEach(el =>
    el.addEventListener('click', () => { lacherSautoir(+el.dataset.sautoir); renderAtelier(); }));

  document.querySelectorAll('#atZone [data-echelle]').forEach(el =>
    el.addEventListener('click', ev => {
      /* On lit la position du clic dans l'échelle, et on la convertit en
         valeur : c'est le geste de faire coulisser, ramené à un clic. */
      const r = el.getBoundingClientRect();
      if (!r.width) return;            // élément détaché : la division donnerait l'infini
      const f = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      const v = Math.pow(10, f);
      if (el.dataset.echelle === 'D') reglerIndex(v); else reglerCurseur(v);
      renderAtelier();
    }));

  document.querySelectorAll('#atZone [data-regle]').forEach(el =>
    el.addEventListener('click', () => {
      const pas = +el.dataset.pas, quoi = el.dataset.regle;
      const r = _miseEnService.regle;
      if (quoi === 'decade') reglerDecade(pas);
      else if (quoi === 'index') reglerIndex(r.index + pas / 10);
      else reglerCurseur(r.curseur + pas / 10);
      renderAtelier();
    }));

  document.querySelectorAll('#atZone [data-gouttiere]').forEach(el =>
    el.addEventListener('click', () => {
      reglerGouttiere(+el.dataset.gouttiere, +el.dataset.pas);
      renderAtelier();
    }));

  const raz = document.querySelector('#atEssaiRaz');
  if (raz) raz.addEventListener('click', () => {
    remettreAZero(); denouerTout(); ratisserTout(); reposerReglettes(); reposerRegle();
    reposerPascaline(); renderAtelier();
  });

  const valider = () => {
    const champ = document.querySelector('#atEssaiInput');
    /* Sur un instrument reproduit il n'y a pas de champ : la réponse est déjà
       posée sur les perles, et `repondreMiseEnService` la lira lui-même. */
    const saisi = champ ? champ.value.trim() : '';
    const bilan = repondreMiseEnService(champ && saisi === '' ? NaN : Number(saisi));
    if (!bilan) return;
    save(); renderWallet(); renderAtelier();

    if (!bilan.juste) {
      /* Sur un algorithme mal deroule, annoncer le nombre attendu n'apprend
         rien : on dit ce qui cloche. */
      return toast(bilan.diagnostic
        ? `✗ ${bilan.diagnostic} L'essai s'arrête — rien ne vous a été prélevé.`
        : `✗ La réponse était <b>${fmt(bilan.attendu)}</b>. L'essai s'arrête`
          + ` — rien ne vous a été prélevé.`, 'bad');
    }
    if (bilan.fini) {
      return toast(bilan.niveau === 1
        ? `${bilan.machine.emoji} <b>${bilan.machine.nom}</b> entre en service — ${fmt(bilan.prix)} ✨.`
        : `${bilan.machine.emoji} <b>${bilan.machine.nom}</b> révisée — niveau ${bilan.niveau}.`, 'good');
    }
    const suivant = document.querySelector('#atEssaiInput');
    if (suivant) suivant.focus();
  };

  const b = document.querySelector('#atEssaiValider');
  if (b) b.addEventListener('click', valider);
  const champ = document.querySelector('#atEssaiInput');
  if (champ) champ.addEventListener('keydown', ev => { if (ev.key === 'Enter') valider(); });
  const q = document.querySelector('#atEssaiQuitter');
  if (q) q.addEventListener('click', () => { abandonnerMiseEnService(); renderAtelier(); });
}


/* ⚠ AIDES DE TEST — voir le drapeau ATELIER_TEST en tête de fichier. */
let _testPoussiereCablee = false;

function cablerAidesDeTest() {
  if (!ATELIER_TEST) return;

  /* La poussière du bandeau, une seule fois : cablerAtelier() est rappelé à
     chaque rendu, et un écouteur de plus par rendu finirait par en poser des
     centaines. */
  const bourse = document.querySelector('#wDust');
  if (bourse && !_testPoussiereCablee) {
    _testPoussiereCablee = true;
    bourse.style.cursor = 'pointer';
    bourse.title = 'Test — cliquer pour ajouter 100 000 poussière';
    bourse.addEventListener('click', () => {
      state.dust += ATELIER_TEST_POUSSIERE;
      state.stats.dustEarned = (state.stats.dustEarned || 0) + ATELIER_TEST_POUSSIERE;
      save(); renderWallet();
      if (document.querySelector('#atZone')) renderAtelier();
      toast(`⚠ test — +${fmt(ATELIER_TEST_POUSSIERE)} ✨`, 'good');
    });
  }

  document.querySelectorAll('#atZone [data-reset]').forEach(el =>
    el.addEventListener('click', () => {
      const id = el.dataset.reset;
      abandonnerMiseEnService();
      delete atelierEtat().machines[id];
      invalideGisement();
      save(); renderWallet(); renderAtelier();
      toast(`⚠ test — ${MACHINE_PAR_ID[id].nom} remise à zéro.`, 'bad');
    }));
}
