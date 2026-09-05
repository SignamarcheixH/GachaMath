/* ============================================================
   LES QUÊTES

   UNE QUÊTE EST UNE SUITE D'ÉTAPES, de trois sortes seulement :

     dire    — quelqu'un parle. On avance en lisant.
     faire   — un objectif vérifié sur la partie : pêcher vingt nombres, mettre
               un instrument en service, démontrer un théorème. Il ne s'avance
               pas d'un clic ; il faut aller le faire, et l'étape indique où.
     enigme  — une question de mathématiques, avec une réponse exacte. On peut
               se tromper : rien n'est perdu, on retente.

   POURQUOI CETTE FORME. Un dialogue seul ne fait rien apprendre, et un exercice
   seul n'a pas de raison d'être. En alternant, chaque calcul arrive parce que
   quelqu'un en avait besoin — c'est ce qui distingue une quête d'un cahier.

   LES ÉNIGMES SONT VÉRIFIÉES, PAS RACONTÉES. Chaque réponse est un nombre que
   le moteur du jeu sait recalculer — `outils/verifier_quetes.py` refait tous
   les calculs et refuse de passer si l'un d'eux est faux. Une énigme fausse
   dans un jeu qui promet des mathématiques exactes serait pire qu'une absence
   d'énigme.

   DEUX FAÇONS D'ÊTRE PROPOSÉE :
   — par l'acte, pour les quêtes du fil principal ;
   — par un NOMBRE, pour celles qui naissent d'une trouvaille. Tirer 1729 fait
     apparaître la quête qui le nomme. Le nombre peut dormir des semaines dans
     l'herbier avant que son acte n'arrive : la Cité ne l'oublie pas.
   ============================================================ */

const QUETES = [
  /* ---------------- acte I : compter ---------------- */
  {
    id: 'registre', acte: 1, batiment: 'gare',
    titre: 'Le registre vide',
    personnage: 'Le Conservateur',
    lieu: 'Le Port — votre premier jour',
    amorce: "Le Conservateur vous attend sur le quai, un registre sous le bras.",
    etapes: [
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Vous voilà. Bien. Je ne vais pas vous expliquer l'Herbier — on n'explique pas un herbier, on le remplit. Allez au Vivier et rapportez-moi de quoi commencer." },
      { type: 'faire', ou: 'vivier', texte: "Pêcher vingt-cinq nombres au Vivier",
        fait: () => uniqueCount(state) >= 25,
        mesure: () => `${fmt(Math.min(uniqueCount(state), 25))} / 25` },
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Vingt-cinq. C'est un début. Maintenant dites-moi : sauriez-vous les additionner tous, de 1 à 100, sans les écrire ?" },
      { type: 'enigme', question: "1 + 2 + 3 + … + 99 + 100 = ?",
        reponse: 5050, indice: "Appariez le premier et le dernier : 1 + 100 = 101. Puis 2 + 99. Combien de paires ?",
        texte: "On raconte qu'un maître d'école allemand donna ce calcul à sa classe pour avoir la paix. Un garçon de neuf ans rendit sa copie en quelques secondes. Il s'appelait Gauss." },
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Cinquante paires à cent un. Voilà : vous n'avez pas compté, vous avez <b>vu</b>. C'est exactement ce qu'on attend de vous ici." },
    ],
    recompense: { objet: 'lebombo', jetons: 600, poussiere: 150,
      mot: "Le Conservateur vous inscrit au registre." },
  },

  {
    id: 'diviseurs', acte: 1, batiment: 'gare',
    titre: 'Ce qui se partage',
    personnage: 'Le Conservateur',
    lieu: "Le Port — l'atelier de tri",
    amorce: "Une question de partage, qui a l'air simple.",
    etapes: [
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Un nombre vaut par ce qui le divise. Douze se partage en deux, trois, quatre, six — c'est pour ça qu'il y a douze mois et douze heures, et pas dix." },
      { type: 'enigme', question: "Quel est le plus petit nombre qui a exactement six diviseurs ?",
        reponse: 12, indice: "Essayez dans l'ordre. 6 en a quatre : 1, 2, 3, 6. Cherchez juste au-dessus.",
        texte: "Comptez les diviseurs, 1 et le nombre lui-même compris." },
      { type: 'faire', ou: 'herbier', texte: "Ouvrir la fiche d'un nombre à l'Herbier",
        fait: () => (state.stats.fichesOuvertes || 0) >= 1,
        mesure: () => `${state.stats.fichesOuvertes || 0} / 1` },
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Chaque fiche vous dit ce qu'un nombre est, et le démontre. Ne me croyez jamais sur parole — c'est écrit dessous." },
    ],
    recompense: { objet: 'ishango', jetons: 500, poussiere: 200,
      mot: "Vous savez lire une fiche." },
  },

  /* ---------------- acte II : démontrer ---------------- */
  {
    id: 'parfait', acte: 2, batiment: 'gare',
    titre: 'La somme de ses parts',
    personnage: 'Nicomaque de Gérasa',
    lieu: 'Le Port — vers 100 de notre ère',
    amorce: "Un homme trie des cailloux en trois tas : les abondants, les déficients, et les autres.",
    etapes: [
      { type: 'dire', qui: 'Nicomaque',
        texte: "Prenez un nombre, additionnez ses diviseurs propres — tous sauf lui-même. Six donne 1 + 2 + 3, soit six. Il est égal à la somme de ses parts. Je les appelle <b>parfaits</b>." },
      { type: 'enigme', question: "Après 6, quel est le nombre parfait suivant ?",
        reponse: 28, indice: "Cherchez entre 20 et 30. Ses diviseurs propres sont 1, 2, 4, 7 et 14.",
        texte: "Il n'en existe que quatre sous dix mille. Vous en cherchez le deuxième." },
      { type: 'faire', ou: 'vivier', texte: "Avoir 6 et 28 dans l'Herbier",
        fait: () => !!state.owned[6] && !!state.owned[28],
        mesure: () => `${(state.owned[6] ? 1 : 0) + (state.owned[28] ? 1 : 0)} / 2` },
      { type: 'dire', qui: 'Nicomaque',
        texte: "Les deux plus petits sont à vous. Les deux autres sont 496 et 8 128 — et après eux, il faut monter à plus de trente millions. Personne ne sait s'il en existe un seul qui soit impair." },
    ],
    recompense: { objet: 'thales', jetons: 900, poussiere: 400,
      mot: "Les Parfaits n'ont plus de secret pour vous." },
  },

  {
    id: 'crible', acte: 2, batiment: 'gare',
    titre: "Le tamis d'Alexandrie",
    personnage: 'Ératosthène',
    lieu: 'Le Port — Alexandrie, vers −240',
    amorce: "Le bibliothécaire en chef a une méthode pour trouver les premiers. Elle consiste surtout à barrer.",
    etapes: [
      { type: 'dire', qui: 'Ératosthène',
        texte: "On me demande toujours comment reconnaître un premier. Mauvaise question. Je ne les reconnais pas : je barre tout le reste, et je regarde ce qui tient debout." },
      { type: 'faire', ou: 'atelier', texte: "Mettre le Crible en service à l'Atelier",
        fait: () => niveauMachine('crible') >= 1,
        mesure: () => niveauMachine('crible') ? '1 / 1' : '0 / 1' },
      { type: 'enigme', question: "Combien y a-t-il de nombres premiers de 1 à 30 ?",
        reponse: 10, indice: "2, 3, 5, 7, puis les impairs qui survivent. N'oubliez pas que 1 n'est pas premier.",
        texte: "Vous venez de passer le tamis. Comptez ce qui reste." },
      { type: 'dire', qui: 'Ératosthène',
        texte: "Dix. Et il y en a 1 229 sous dix mille, puis de moins en moins — sans jamais s'arrêter. Euclide l'a prouvé trois générations avant moi, et sa démonstration tient en cinq lignes." },
    ],
    recompense: { objet: 'zenon', jetons: 1200, poussiere: 500,
      mot: "Ératosthène vous laisse son crible." },
  },

  {
    id: 'theoreme', acte: 2, batiment: 'gare',
    titre: 'La preuve avant la collection',
    personnage: 'Le Conservateur',
    lieu: 'Le Port — devant la Bibliothèque',
    amorce: "Collectionner ne suffit pas. Il va falloir démontrer.",
    etapes: [
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Vous ramassez bien. Mais un herbier n'est pas un tas : une page n'est close que lorsqu'on a la famille entière, et qu'on peut le prouver. Allez à la Bibliothèque." },
      { type: 'faire', ou: 'bibliotheque', texte: "Démontrer un théorème",
        fait: () => state.claimed.length >= 1,
        mesure: () => `${Math.min(state.claimed.length, 1)} / 1` },
      { type: 'enigme', question: "Combien de nombres carrés y a-t-il de 1 à 100 ?",
        reponse: 10, indice: "1, 4, 9, 16… jusqu'où pouvez-vous aller sans dépasser 100 ?",
        texte: "Une famille complète, c'est tout ce qui vérifie la règle — ni plus, ni moins." },
      { type: 'dire', qui: 'Le Conservateur',
        texte: "Dix, de 1² à 10². Ni onze ni neuf : <b>exactement</b> dix. C'est cette exactitude qui fait un théorème, et pas une impression." },
    ],
    recompense: { objet: 'aryabhata', jetons: 1000, poussiere: 600,
      mot: "Une page de l'Herbier est close." },
  },

  /* ---------------- acte III : écrire ---------------- */
  {
    id: 'zero', acte: 3, batiment: 'gare',
    titre: 'Le nombre qui n’était rien',
    personnage: 'Brahmagupta',
    lieu: 'Le Port — Bhillamala, 628',
    amorce: "Un astronome vient poser des règles pour un nombre que personne ne considérait comme un nombre.",
    etapes: [
      { type: 'dire', qui: 'Brahmagupta',
        texte: "Une dette moins la même dette fait zéro. Voilà. J'ai écrit les règles : ce qui reste quand on retire une chose à elle-même est un nombre comme un autre, et il se calcule." },
      { type: 'enigme', question: "Combien de zéros à la fin de 10 × 20 × 30 × 40 × 50 ?",
        reponse: 6, indice: "Chaque facteur apporte un zéro, et il faut voir combien de fois cinq et deux se rencontrent encore dans 1×2×3×4×5.",
        texte: "Un zéro final naît d'un facteur dix, donc d'un cinq rencontrant un deux." },
      { type: 'faire', ou: 'forge', texte: "Forger un nombre au-delà du mur",
        fait: () => (state.stats.forges || 0) >= 1,
        mesure: () => `${Math.min(state.stats.forges || 0, 1)} / 1` },
      { type: 'dire', qui: 'Brahmagupta',
        texte: "La Forge fabrique ce que le hasard ne donne pas — à commencer par le zéro lui-même. J'ai buté sur une seule chose : diviser par lui. Personne n'a résolu ça, parce que ça n'a pas de solution." },
    ],
    recompense: { objet: 'lilavati', jetons: 1600, poussiere: 800,
      mot: "Le zéro est un nombre, et vous savez le fabriquer." },
  },

  /* ---------------- les quêtes nées d'une trouvaille ---------------- */
  {
    id: 'taxicab', acte: 6, batiment: 'gare', declencheur: 1729, trait: 'taxicab',
    titre: 'Le taxi de Hardy',
    personnage: 'Srinivasa Ramanujan',
    lieu: 'Putney, Londres — 1919',
    amorce: "Un de vos nombres porte une propriété que personne, dans la Cité, ne sait nommer.",
    etapes: [
      { type: 'dire', qui: null,
        texte: "Vous poussez la porte d'une chambre de convalescence. Un homme y est allongé, très maigre, un carnet sur les genoux. Un autre, en manteau, vient d'arriver et cherche quoi dire." },
      { type: 'dire', qui: 'G. H. Hardy',
        texte: "Je suis venu en taxi. Son numéro était 1729. Un nombre plutôt terne, m'a-t-il semblé — j'espère que ce n'est pas un mauvais présage." },
      { type: 'dire', qui: 'Ramanujan',
        texte: "Non, Hardy. C'est un nombre très intéressant. C'est le plus petit nombre exprimable comme somme de deux cubes, de deux façons différentes." },
      { type: 'enigme', question: "1729 = 9³ + 10³. Et aussi 1³ + x³. Que vaut x ?",
        reponse: 12, indice: "1729 − 1 = 1728. Quel nombre, élevé au cube, donne 1 728 ?",
        texte: "Hardy note les deux écritures sur un coin de table." },
      { type: 'dire', qui: 'Ramanujan',
        texte: "Il y en a d'autres, bien sûr. Le suivant demande de monter beaucoup plus haut — 4 104. On les appellera comme vous voudrez." },
      { type: 'dire', qui: null,
        texte: "Hardy écrira plus tard n'avoir jamais rencontré personne pour qui chaque entier fût un ami personnel. La propriété portera le nom du taxi." },
    ],
    recompense: { objet: 'gauss17', jetons: 2500, poussiere: 1200,
      mot: "Le trait <b>Taxicab</b> est nommé. Votre 1729 le porte désormais." },
  },

  {
    id: 'kaprekar', acte: 6, batiment: 'gare', declencheur: 6174, trait: 'kaprekarC',
    titre: 'Le trou noir',
    personnage: 'D. R. Kaprekar',
    lieu: 'Devlali, Inde — 1949',
    amorce: "Un nombre de votre herbier ramène tout à lui, et vous ne savez pas encore pourquoi.",
    etapes: [
      { type: 'dire', qui: null,
        texte: "Un instituteur de province présente à un congrès un résultat que personne ne lui a demandé. Il a une craie, un tableau, et quatre chiffres." },
      { type: 'dire', qui: 'Kaprekar',
        texte: "Prenez quatre chiffres, pas tous égaux. Rangez-les dans l'ordre décroissant, puis dans l'ordre croissant. Soustrayez. Recommencez." },
      { type: 'enigme', question: "Partez de 3524 : 5432 − 2345 = ?",
        reponse: 3087, indice: "Posez la soustraction. Les chiffres rangés en décroissant, moins les mêmes en croissant.",
        texte: "Faites le premier tour vous-même." },
      { type: 'enigme', question: "Continuez : 8730 − 0378 = ?",
        reponse: 8352, indice: "Les chiffres de 3087 rangés dans les deux sens.",
        texte: "Encore un tour. Vous y êtes presque." },
      { type: 'dire', qui: 'Kaprekar',
        texte: "Un tour de plus et vous tombez sur 6174. Et là, vous pouvez continuer tant que vous voudrez : 7641 − 1467 = 6174. Sept étapes suffisent toujours, quel que soit le nombre de départ." },
      { type: 'dire', qui: null,
        texte: "Kaprekar est resté instituteur toute sa vie. Ses résultats, longtemps ignorés des revues, sont aujourd'hui dans tous les livres de récréation mathématique." },
    ],
    recompense: { objet: 'recorde', jetons: 2500, poussiere: 1200,
      mot: "Le trait <b>Constante de Kaprekar</b> est nommé." },
  },
];

/* ============================================================
   ⚠ QUÊTE D'ESSAI — REJOUABLE À L'INFINI

   À QUOI ELLE SERT. Toutes les autres quêtes s'achèvent une fois pour toutes :
   pour retester le moteur — un dialogue, une énigme fausse puis juste, un
   objectif qui se coche, la fin — il fallait jusqu'ici remettre la partie à
   zéro. Celle-ci se relance d'elle-même dès qu'on l'a finie.

   ELLE NE RAPPORTE RIEN, ET C'EST NÉCESSAIRE. Une quête qu'on peut rejouer
   sans limite et qui verserait des jetons serait une source infinie : le
   testeur ne mesurerait plus jamais l'économie réelle. Elle n'a donc pas de
   récompense, et pas de curiosité — les curiosités ne se donnent qu'une fois
   de toute façon.

   SON OBJECTIF EST RELATIF, pas absolu. « Faire un tirage » comparé à un seuil
   fixe serait déjà rempli à la deuxième partie. On note donc le compteur de
   tirages au moment où on la (re)commence, et on demande un tirage DE PLUS.

   Elle est à l'acte 0 pour être là dès le premier instant, et elle disparaît
   entièrement avec ACTES_TEST — comme la remise à zéro de la progression.
   ============================================================ */
const ESSAI_REJOUABLE = (typeof ACTES_TEST !== 'undefined' && ACTES_TEST);

/* Le compteur de tirages au moment où l'essai a (re)commencé. */
const departEssai = () =>
  (state.quetes && state.quetes.essai && state.quetes.essai.depart) || 0;

if (ESSAI_REJOUABLE) QUETES.push({
  id: 'essai', acte: 0, batiment: 'gare', rejouable: true,
  titre: '⚠ Quête d’essai',
  personnage: 'Le Contrôleur',
  lieu: 'Le Port — quai de service',
  amorce: "Une quête qui ne finit jamais vraiment : elle sert à vérifier que les autres marchent.",
  etapes: [
    { type: 'dire', qui: 'Le Contrôleur',
      texte: "Bonjour. Je ne fais pas partie de l'histoire — je vérifie que les rails tiennent. Trois étapes : je parle, vous calculez, vous allez faire quelque chose. Puis on recommence." },
    { type: 'enigme', question: "Combien font 7 × 6 ?",
      reponse: 42, indice: "Six fois sept, ou sept fois six : c'est la même chose. Comptez par sept.",
      texte: "Répondez faux d'abord si vous voulez voir l'indice : rien n'est perdu." },
    { type: 'faire', ou: 'vivier', texte: "Faire un tirage au Vivier",
      fait: () => (state.stats.pulls || 0) > departEssai(),
      mesure: () => `${Math.min(Math.max((state.stats.pulls || 0) - departEssai(), 0), 1)} / 1` },
    { type: 'dire', qui: 'Le Contrôleur',
      texte: "Voilà : dialogue, énigme, objectif, conclusion. Tout a fonctionné. Je remets le tout à zéro — repassez quand vous voulez." },
  ],
  recompense: { mot: "L'essai est concluant. La quête se relance." },
});

const QUETE_PAR_ID = Object.fromEntries(QUETES.map(q => [q.id, q]));
/* Un trait masqué tant que sa quête n'est pas achevée. Le nombre garde sa
   rareté ; c'est son NOM qui manque. */
const TRAIT_SOUS_QUETE = Object.fromEntries(
  QUETES.filter(q => q.trait).map(q => [q.trait, q.id]));

const etatQuete = (id) => (state.quetes && state.quetes[id] && state.quetes[id].etat) || 'dormante';
const etapeQuete = (id) => (state.quetes && state.quetes[id] && state.quetes[id].etape) || 0;
const traitConnu = (traitId) => {
  const q = TRAIT_SOUS_QUETE[traitId];
  return !q || etatQuete(q) === 'achevee';
};

function poserQuete(id, etat, etape) {
  state.quetes = state.quetes || {};
  const a = state.quetes[id] || {};
  /* On repart de l'entrée existante plutôt que d'en fabriquer une neuve : un
     objet remplacé perdrait tout ce qu'il porte en plus de l'état et de
     l'étape — le repère `depart` des objectifs relatifs, notamment. */
  state.quetes[id] = Object.assign({}, a,
    { etat, etape: etape === undefined ? (a.etape || 0) : etape });
}

/* Une quête est PROPOSABLE quand son acte est atteint — et, si elle naît d'une
   trouvaille, quand le nombre déclencheur est dans l'herbier. */
function queteProposable(q) {
  if (acteCourant() < q.acte) return false;
  if (q.declencheur && !state.owned[q.declencheur]) return false;
  return true;
}

/* Appelé à chaque acquisition : un nombre peut réveiller sa quête. */
function declencherQuetes(n) {
  const nouvelles = [];
  for (const q of QUETES) {
    if (q.declencheur !== n) continue;
    if (etatQuete(q.id) !== 'dormante') continue;
    if (!queteProposable(q)) { poserQuete(q.id, 'attente', 0); continue; }
    poserQuete(q.id, 'offerte', 0);
    nouvelles.push(q);
  }
  return nouvelles;
}

/* Au passage d'un acte, tout ce qui devient proposable s'ouvre. C'est aussi ce
   qui met les premières quêtes sur le quai dès l'acte I. */
function reveillerQuetes() {
  for (const q of QUETES) {
    const e = etatQuete(q.id);
    if (e !== 'dormante' && e !== 'attente') continue;
    if (queteProposable(q)) poserQuete(q.id, 'offerte', 0);
  }
}

const quetesDuBatiment = (bat) => QUETES.filter(q =>
  q.batiment === bat && ['offerte', 'encours', 'achevee'].includes(etatQuete(q.id)));
const quetesOuvertes = () => QUETES.filter(q => ['offerte', 'encours'].includes(etatQuete(q.id)));

/* ---------- l'étape courante ---------- */
const etapeCourante = (q) => q.etapes[Math.min(etapeQuete(q.id), q.etapes.length - 1)];

/* Un objectif ne s'avance pas d'un clic : on relit l'état de la partie. */
function objectifRempli(e) {
  if (e.type !== 'faire') return true;
  try { return !!e.fait(); } catch (err) { return false; }
}

function avancerQuete(id) {
  const q = QUETE_PAR_ID[id];
  if (!q) return;
  const i = etapeQuete(id);
  if (i + 1 >= q.etapes.length) return acheverQuete(id);
  poserQuete(id, 'encours', i + 1);
  save(); renderQuete();
}

function acheverQuete(id) {
  const q = QUETE_PAR_ID[id];
  const r = q.recompense || {};

  /* Une quête rejouable revient à son point de départ au lieu de se clore :
     ni récompense, ni curiosité, ni entrée dans « déjà accomplies ». Le seul
     état qu'on remet à jour est le repère de l'objectif relatif. */
  if (q.rejouable) {
    poserQuete(id, 'offerte', 0);
    marquerDepart(id);
    save();
    toast(`⚠ <b>${q.titre}</b> — ${r.mot || 'relancée'}`, 'gold');
    _queteOuverte = null;
    renderQuete(); renderAll();
    return;
  }

  poserQuete(id, 'achevee', q.etapes.length - 1);
  if (r.jetons) { state.coins += r.jetons; state.stats.coinsEarned += r.jetons; }
  if (r.poussiere) { state.dust += r.poussiere; state.stats.dustEarned += r.poussiere; }
  /* La curiosité : une pièce d'histoire rapportée, qui se consulte au Carnet
     et se voit sur la Frise. On n'en donne jamais deux fois la même. */
  if (r.objet && !possedeCuriosite(r.objet)) {
    state.objets = state.objets || [];
    state.objets.push(r.objet);
  }
  invalideRevenu();
  save();
  toast(`📜 <b>${q.titre}</b> — ${r.mot || 'quête achevée'}`
      + (r.jetons ? ` · +${fmt(r.jetons)} 🪙` : '')
      + (r.poussiere ? ` · +${fmt(r.poussiere)} ✨` : ''), 'gold');
  _queteOuverte = null;
  renderQuete(); renderAll();
}

/* ---------- la vue ---------- */
let _queteOuverte = null;      // la quête en cours de lecture
let _gareOuverte = false;      // le tableau du quai
let _gareArret = null;         // décroche le suivi du défilement
let _enigmeMot = '';           // le retour de la dernière tentative

function ouvrirGare() { _gareOuverte = true; _queteOuverte = null; _enigmeMot = ''; renderQuete(); }
function fermerGare() {
  _gareOuverte = false; _queteOuverte = null;
  if (_gareArret) { _gareArret(); _gareArret = null; }
  renderQuete(); renderAll();
}

/* Le repère d'un objectif relatif : où en était le compteur quand la quête a
   (re)commencé. Sans lui, « faire un tirage » serait déjà vrai au deuxième
   passage, et l'étape se cocherait sans qu'on ait rien fait. */
function marquerDepart(id) {
  state.quetes = state.quetes || {};
  const a = state.quetes[id] || {};
  a.depart = (state.stats && state.stats.pulls) || 0;
  state.quetes[id] = a;
}

function ouvrirQuete(id) {
  const q = QUETE_PAR_ID[id];
  if (!q || etatQuete(id) === 'dormante' || etatQuete(id) === 'attente') return;
  if (etatQuete(id) === 'offerte') {
    if (q.rejouable) marquerDepart(id);
    poserQuete(id, 'encours', 0);
  }
  _queteOuverte = id; _enigmeMot = '';
  save(); renderQuete();
}
function fermerQuete() { _queteOuverte = null; _enigmeMot = ''; renderQuete(); renderAll(); }

function repondreEnigme(valeur) {
  const q = QUETE_PAR_ID[_queteOuverte];
  const e = etapeCourante(q);
  const n = parseInt(String(valeur).replace(/[\s  ]/g, ''), 10);
  if (!Number.isFinite(n)) { _enigmeMot = 'Il faut un nombre.'; return renderQuete(); }
  if (n !== e.reponse) {
    /* On ne punit pas : l'erreur fait partie du calcul. On donne l'indice. */
    _enigmeMot = `Ce n'est pas ${fmt(n)}. ${e.indice || ''}`;
    return renderQuete();
  }
  _enigmeMot = '';
  avancerQuete(q.id);
}

function renderQuete() {
  const boite = document.querySelector('#queteBoite');
  if (!boite) return;

  /* Passer du tableau à une scène décroche l'ancrage : la scène est centrée,
     et un suivi laissé actif la recollerait au bord de la carte. */
  if (_queteOuverte) {
    if (_gareArret) { _gareArret(); _gareArret = null; }
    boite.classList.remove('ancree');       // la scène se centre
    return renderQueteScene(boite, QUETE_PAR_ID[_queteOuverte]);
  }
  if (_gareOuverte) return renderGare(boite);
  if (_gareArret) { _gareArret(); _gareArret = null; }
  boite.classList.remove('ancree');
  cacherSurcouche(boite); boite.innerHTML = '';
}

/* Le tableau du quai : tout ce qu'on peut faire, et ce qui est déjà fait. */
function renderGare(boite) {
  const ouvertes = QUETES.filter(q => q.batiment === 'gare' && ['offerte','encours'].includes(etatQuete(q.id)));
  const faites = QUETES.filter(q => q.batiment === 'gare' && etatQuete(q.id) === 'achevee');

  const ligne = (q, fini) => {
    const e = etapeCourante(q);
    const etat = fini ? 'achevée'
      : e.type === 'faire' ? (objectifRempli(e) ? 'objectif atteint' : e.texte)
      : e.type === 'enigme' ? 'une question vous attend'
      : etatQuete(q.id) === 'offerte' ? 'à commencer' : 'en cours';
    return `<button class="qtLigne${fini ? ' faite' : ''}" type="button" data-quete="${q.id}">
      <span class="qtLTitre">${q.titre}</span>
      <span class="qtLQui">${q.personnage}</span>
      <span class="qtLEtat">${etat}</span>
      <span class="qtLPas">${Math.min(etapeQuete(q.id) + (fini ? 1 : 0), q.etapes.length)}/${q.etapes.length}</span>
    </button>`;
  };

  boite.innerHTML = `<div class="qtCadre qrCadre gaCadre" role="dialog" aria-modal="true"
      aria-label="Le Port">
    <i class="qrBec" aria-hidden="true"></i>
    <div class="qtTete">
      <span class="qtTitre">Le Port</span>
      <span class="qtLieu">${ouvertes.length ? `${ouvertes.length} en cours` : 'le quai est désert'}</span>
      <button class="btn ghost sm" id="qtFermer" type="button">Fermer</button>
    </div>

    <!-- Le corps défile, pas le cadre : l'en-tête et son bouton Fermer doivent
         rester atteignables quand le quai porte quinze quêtes. Le cadre, lui,
         laisse déborder — son bec vit dehors. Voir .gaCorps dans la feuille
         de style. -->
    <div class="gaCorps">
      ${ouvertes.length ? `<div class="qtListe">${ouvertes.map(q => ligne(q, false)).join('')}</div>`
        : `<p class="qtVide">Personne ne vous attend pour l'instant. Avancez dans les actes,
           ou rapportez un nombre dont nul ne sait dire ce qu'il a de particulier.</p>`}

      ${faites.length ? `<div class="qtFaites">
        <span class="qtFTitre">Déjà accomplies</span>
        <div class="qtListe">${faites.map(q => ligne(q, true)).join('')}</div></div>` : ''}
    </div>
  </div>`;

  /* MÊME FORME QUE LE QUARTIER ET LA PLACE : posé à côté du Port, sans voile.
     La SCÈNE d'une quête, elle, garde la modale centrée — on n'y choisit pas,
     on y lit, et un dialogue collé au bord de la carte se lirait mal. */
  boite.classList.add('ancree');
  montrerSurcouche(boite);
  const placer = () => ancrerSurNoeud(boite.querySelector('.gaCadre'), 'gare');
  placerBientot(placer);
  if (_gareArret) _gareArret();
  _gareArret = suivreNoeud(placer);

  boite.querySelector('#qtFermer').addEventListener('click', fermerGare);
  boite.addEventListener('click', ev => { if (ev.target === boite) fermerGare(); });
  boite.querySelectorAll('[data-quete]').forEach(b =>
    b.addEventListener('click', () => ouvrirQuete(b.dataset.quete)));
}

/* Une étape de quête. Les trois sortes partagent le même cadre. */
function renderQueteScene(boite, q) {
  const i = Math.min(etapeQuete(q.id), q.etapes.length - 1);
  const e = q.etapes[i];
  const fini = etatQuete(q.id) === 'achevee';
  const dernier = i === q.etapes.length - 1;

  let corps = '', pied = '';
  if (e.type === 'dire') {
    corps = `<div class="qtScene">
      ${e.qui ? `<span class="qtQui">${e.qui}</span>` : ''}
      <p class="qtTexte">${e.texte.replace(/\n/g, '<br>')}</p></div>`;
    pied = fini ? '' : `<button class="btn" id="qtSuivant" type="button">${
      dernier ? 'Refermer le carnet' : 'Continuer'}</button>`;
  }

  if (e.type === 'faire') {
    const ok = objectifRempli(e);
    const lieu = (typeof HUB_LIEUX !== 'undefined') ? HUB_LIEUX.find(l => l.id === e.ou) : null;
    corps = `<div class="qtScene">
      <span class="qtQui">À faire</span>
      <p class="qtTexte">${e.texte}</p>
      <div class="qtObjectif${ok ? ' ok' : ''}">
        <span class="qtOCoche">${ok ? '✓' : '○'}</span>
        <!-- Les lieux portent leur article — « Le Vivier », « L'Herbier » —, donc
             aucune préposition ne se contracte proprement devant eux. On pose
             deux points plutôt que d'écrire « à Le Vivier ». -->
        <span class="qtOTexte">${ok ? "C'est fait."
          : lieu ? `Rendez-vous : <b>${lieu.nom}</b>` : 'À faire sur place'}</span>
        <span class="qtOCompte">${e.mesure ? e.mesure() : ''}</span>
      </div></div>`;
    pied = ok
      ? `<button class="btn" id="qtSuivant" type="button">Continuer</button>`
      : `<span class="qtConsigne">L'objectif se coche tout seul quand c'est fait.</span>`;
  }

  if (e.type === 'enigme') {
    corps = `<div class="qtScene">
      <span class="qtQui">Énigme</span>
      ${e.texte ? `<p class="qtTexte">${e.texte}</p>` : ''}
      <p class="qtQuestion">${e.question}</p>
      ${_enigmeMot ? `<p class="qtRate">${_enigmeMot}</p>` : ''}
      <div class="qtReponse">
        <input type="number" id="qtChamp" inputmode="numeric" autocomplete="off"
               placeholder="votre réponse" aria-label="Votre réponse">
        <button class="btn sm" id="qtValider" type="button">Répondre</button>
      </div></div>`;
    pied = `<span class="qtConsigne">Une erreur ne coûte rien.</span>`;
  }

  montrerSurcouche(boite);
  boite.innerHTML = `<div class="qtCadre" role="dialog" aria-modal="true" aria-label="${q.titre}">
    <div class="qtTete">
      <span class="qtTitre">${q.titre}</span>
      <span class="qtLieu">${q.lieu}</span>
      <button class="btn ghost sm" id="qtRetour" type="button">${fini ? 'Fermer' : 'Le quai'}</button>
    </div>
    ${corps}
    <div class="qtPied">
      <span class="qtPerles">${q.etapes.map((_, k) =>
        `<i class="${k < i || fini ? 'bon' : k === i ? 'encours' : 'avenir'}"></i>`).join('')}</span>
      ${pied}
    </div>
  </div>`;

  boite.querySelector('#qtRetour').addEventListener('click', () => fini ? fermerGare() : ouvrirGare());
  const suivant = boite.querySelector('#qtSuivant');
  if (suivant) suivant.addEventListener('click', () => avancerQuete(q.id));
  const valider = boite.querySelector('#qtValider');
  if (valider) {
    const champ = boite.querySelector('#qtChamp');
    valider.addEventListener('click', () => repondreEnigme(champ.value));
    champ.addEventListener('keydown', ev => { if (ev.key === 'Enter') repondreEnigme(champ.value); });
    champ.focus();
  }
}

/* ============================================================
   LES CURIOSITÉS

   Une quête achevée rapporte une pièce d'histoire — l'os d'Ishango, le signe
   égal de Recorde, le polygone à dix-sept côtés de Gauss. Ce sont des entrées
   de la Frise marquées « décor » : vraies, datées, mais sans mécanique de jeu.
   Elles n'en avaient donc aucune raison d'exister… jusqu'à devenir ce qu'on
   rapporte d'une quête.

   ELLES NE SERVENT À RIEN, ET C'EST VOULU. Aucun bonus, aucun rendement : ce
   sont des souvenirs. Un jeu où tout rapporte quelque chose n'a plus rien à
   offrir gratuitement.

   Elles se consultent au Carnet, et la Frise marque celles qu'on possède —
   la même page sert alors de plan de travail et de vitrine.
   ============================================================ */
const possedeCuriosite = (id) => !!(state.objets && state.objets.includes(id));

/* La notice complète, lue dans la Frise : on ne recopie pas un texte qui
   existe déjà, on pointe dessus. */
function curiosite(id) {
  if (typeof FRISE === 'undefined') return null;
  return FRISE.find(e => e.id === id) || null;
}

const curiositesPossedees = () => (state.objets || [])
  .map(curiosite).filter(Boolean).sort((a, b) => a.an - b.an);

/* Toutes celles qu'une quête peut offrir — pour montrer ce qui reste. */
const curiositesTotales = () => QUETES
  .map(q => q.recompense && q.recompense.objet).filter(Boolean);

/* ============================================================
   LA PLACE — LES GENS DE LA CITÉ

   Une quête part d'un nombre ; un PNJ, lui, est simplement là. La Place est
   l'endroit où l'on va parler à quelqu'un sans avoir rien à lui apporter —
   et c'est aussi le seul lieu ouvert dès l'acte 0, parce que c'est de là que
   part la visite.

   Chaque personnage arrive à son acte et ne repart plus. Ses répliques
   changent avec l'avancement : le même homme ne dit pas la même chose à
   quelqu'un qui vient d'arriver et à quelqu'un qui a démontré dix théorèmes.
   La première réplique dont la condition est vraie l'emporte, donc l'ordre
   compte — du cas le plus particulier au plus général.
   ============================================================ */
const PNJ = [
  { id: 'conservateur', nom: 'Le Conservateur', acte: 0, emoji: '📖',
    role: "Il tient le Grand Herbier depuis plus longtemps qu'il ne veut le dire.",
    repliques: [
      { si: () => acteCourant() === 0,
        texte: "Prenez votre temps. L'Herbier attend depuis quatre mille ans, il attendra bien votre première pêche." },
      { si: () => uniqueCount(state) < 50,
        texte: "Cinquante nombres, et je vous présente quelqu'un. Pour l'instant vous avez surtout de la chance, pas encore de méthode." },
      { si: () => !state.claimed.length,
        texte: "Vous collectionnez bien. Mais collectionner n'est pas démontrer — allez voir à la Bibliothèque ce qu'on attend de vous." },
      { si: () => true,
        texte: "Vous avancez. Je vous préviens tout de suite : personne n'a jamais fini cet herbier, et ce n'est pas une façon de parler." },
    ],
    propos: [
      "On me demande souvent combien de nombres tient l'Herbier. Neuf mille neuf cent quatre-vingt-dix-neuf qui se pêchent. Ce n'est pas beaucoup. C'est ce qu'on sait dire sur chacun qui n'a pas de fin.",
      "Un nombre n'est pas précieux parce qu'il est grand. <b>7</b> est plus intéressant que 7 000, et il tient sur une main.",
      "Vous croiserez des nombres sans aucune propriété. Ne les méprisez pas : ils sont la majorité, et c'est exactement ce qui rend les autres remarquables.",
      "Je ne vous demanderai jamais de me croire. Chaque fiche porte sa démonstration — lisez-la, et prenez-moi en défaut si vous pouvez.",
      "Mon prédécesseur disait que l'Herbier se remplit par le bas : d'abord les petits, qui ont le plus de propriétés, puis les grands, qui n'en ont souvent aucune.",
    ] },

  /* DEUX HABITANTS DE PLUS À L'ACTE 0, et ce ne sont pas des figurants.
     L'acte 0 ne se franchit plus au bout du tutoriel : il demande trente
     nombres et un tour de la Place. Avec un seul personnage, « parler aux
     gens » n'aurait voulu dire qu'une réplique. Ces deux-là ne sont pas des
     mathématiciens — l'histoire ne commence qu'à l'acte I, à Sumer. Ce sont
     des gens de la Cité, et chacun apprend une chose que le joueur a besoin
     de savoir tout de suite : le hasard du tirage, et le mur. */
  { id: 'pecheuse', nom: 'La Pêcheuse', acte: 0, emoji: '🎣',
    role: "Elle passe ses journées au bord du Vivier, et elle n'a jamais choisi une seule prise.",
    repliques: [
      { si: () => uniqueCount(state) === 0,
        texte: "Vous n'avez encore rien pêché ? Allez-y. On ne choisit pas ce qui mord — c'est la première chose à accepter, et la dernière qu'on accepte vraiment." },
      { si: () => uniqueCount(state) < 30,
        texte: "Vous allez retomber sur les mêmes, c'est normal. Un doublon n'est jamais perdu : il part en poussière, et la poussière fait tourner les machines." },
      { si: () => true,
        texte: "Vous commencez à avoir de quoi. Méfiez-vous quand même : au début tout est neuf, ensuite il faut dix prises pour une nouveauté. C'est le métier." },
    ],
    propos: [
      "Le Vivier ne se vide pas. Vous pouvez y pêcher mille fois, il y aura toujours les mêmes neuf mille nombres — c'est vous qui changez.",
      "Les premiers jours, tout est nouveau. Ensuite il faut dix prises pour une nouveauté, puis cent. Ce n'est pas de la malchance, c'est de l'arithmétique.",
      "On m'a demandé une fois si je pouvais viser. Non. Personne ne vise, ici. Ceux qui veulent choisir vont à la Forge, et ils paient.",
      "Un doublon n'est pas une prise perdue. Il part en poussière, et la poussière fait tourner les machines de l'Atelier pendant que vous dormez.",
      "Mon meilleur souvenir ? Un 1729. Je n'ai su que bien plus tard pourquoi tout le monde le voulait.",
    ] },

  { id: 'veilleur', nom: 'Le Veilleur', acte: 0, emoji: '🧱',
    role: "Il surveille le rempart. Il n'a jamais rien vu en revenir tout seul.",
    repliques: [
      { si: () => acteCourant() === 0,
        texte: "Le mur porte un chiffre : dix mille. En deçà, ça se pêche. Au-delà, ça se fabrique ou ça se va chercher — et les deux portes sont fermées pour vous, pour l'instant." },
      { si: () => (state.stats.forges || 0) === 0,
        texte: "La Forge est ouverte, maintenant. Ce qui passe le mur ne tombe pas du ciel : on le commande, on le paie, on le calcule." },
      { si: () => true,
        texte: "Vous franchissez le mur régulièrement, à ce que je vois. Ça ne le rend pas plus bas — ça vous rend plus obstiné." },
    ],
    propos: [
      "Dix mille. Ce n'est pas un chiffre rond par hasard : c'est là que le vivier s'arrête, et rien de plus.",
      "Au-delà, ça monte jusqu'à quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf. Après, il n'y a plus rien du tout. Vraiment rien.",
      "On croit que le mur protège la ville. Il ne protège rien : il dit seulement jusqu'où on sait pêcher.",
      "Deux portes, pas une de plus. La Forge fabrique ce qu'on lui commande ; l'Expédition va le chercher. Les deux coûtent, chacune à sa façon.",
      "J'ai vu des gens passer des semaines à regarder de l'autre côté. Le mur ne bouge pas. C'est eux qui finissent par apprendre à le franchir.",
    ] },

  { id: 'eratosthene', nom: 'Ératosthène', acte: 2, emoji: '🕸️',
    role: "Bibliothécaire à Alexandrie. Il a mesuré la Terre avec un bâton et une ombre.",
    repliques: [
      { si: () => !niveauMachine('crible'),
        texte: "On me résume toujours à mon crible. Passez-le donc une fois à la main : vous verrez que barrer est un travail." },
      { si: () => true,
        texte: "Vous savez rayer les multiples. Sachez aussi qu'avec une ombre de sept degrés et un puits sans ombre, on mesure une planète." },
    ],
    propos: [
      "J'ai mesuré la Terre avec un bâton, une ombre et un puits. Les gens retiennent le puits. C'est l'ombre qui compte.",
      "Mon crible ne reconnaît rien du tout. Il barre. Ce qui reste debout est premier, et je n'ai eu à décider de rien.",
      "Il y a 1 229 premiers sous dix mille. Ils se raréfient sans jamais s'arrêter — Euclide l'a prouvé trois générations avant moi, en cinq lignes.",
      "On m'appelait « Bêta » à la Bibliothèque : deuxième en tout, premier en rien. Je l'ai pris pour un compliment.",
    ] },

  { id: 'pascal', nom: 'Blaise Pascal', acte: 5, emoji: '⚙️',
    role: "Dix-neuf ans, un père collecteur d'impôts, et une machine à faire.",
    repliques: [
      { si: () => !niveauMachine('pascaline'),
        texte: "Additionner, n'importe quel enfant sait le faire. Ce que j'ai mis des années à obtenir, c'est que la retenue passe toute seule d'une roue à l'autre." },
      { si: () => true,
        texte: "Vous avez fait tomber les sautoirs vous-même. Imaginez maintenant le faire cinquante fois par jour, pour des comptes d'impôts." },
    ],
    propos: [
      "J'ai bâti cette machine pour mon père, qui comptait des impôts jusqu'à la nuit. Le difficile n'était pas d'additionner : c'était la retenue.",
      "Un joueur m'a écrit au sujet d'une partie de dés interrompue. J'ai répondu, Fermat a répondu, et nous avons inventé sans le vouloir une façon de calculer l'avenir.",
      "On ne partage pas les mises selon les points marqués. On les partage selon les parties qu'on aurait jouées. Ça ressemble à un détail. C'est tout le sujet.",
      "Cinquante exemplaires construits, neuf qui nous restent. Ce n'était pas un succès. C'était une preuve.",
    ] },
];

const pnjPresents = () => PNJ.filter(p => acteCourant() >= p.acte);

function repliqueDe(p) {
  for (const r of p.repliques) { try { if (r.si()) return r.texte; } catch (e) {} }
  return p.repliques[p.repliques.length - 1].texte;
}

/* ---------- la Place ----------
   MÊME FORME QUE LE QUARTIER : une fenêtre posée à côté du bâtiment, sans
   voile noir, deux colonnes. À gauche on choisit à qui l'on parle ; à droite,
   ce qu'il dit.

   DEUX SORTES DE RÉPLIQUES, et elles ne servent pas à la même chose :

   — `repliques` est CONTEXTUELLE. La première dont la condition est vraie
     l'emporte : le même homme ne dit pas la même chose à quelqu'un qui vient
     d'arriver et à quelqu'un qui a démontré dix théorèmes. C'est ce qu'on
     entend en s'approchant.

   — `propos` est une SUITE. On y avance en appuyant sur « Parler », et elle
     tourne en boucle. Ce sont les choses que le personnage a à dire quand on
     reste avec lui — vraies, vérifiables, et sans mécanique de jeu derrière.
     Un personnage à qui l'on ne peut adresser qu'une phrase n'est pas
     quelqu'un, c'est un panneau.

   Le compteur de propos n'est PAS enregistré : une conversation se reprend au
   début. Personne ne veut retrouver un dialogue à la phrase quatre trois jours
   plus tard. */
let _pnjOuvert = null;
let _pnjPropos = 0;            // où l'on en est dans la suite, pour ce PNJ
let _pnjArret = null;          // pour décrocher le suivi du défilement

/* LES RENCONTRES SONT COMPTÉES. L'acte 0 demande de faire le tour de la
   Place : il faut donc savoir à qui on a déjà parlé. On note l'identifiant à
   l'ouverture de la fiche — c'est le moment où la réplique s'affiche, donc le
   moment où l'on a effectivement parlé à quelqu'un. */
const aRencontre = (id) => !!(state.rencontres && state.rencontres.includes(id));
const pnjRencontres = () => (state.rencontres || [])
  .filter(id => PNJ.some(p => p.id === id && acteCourant() >= p.acte)).length;

function noterRencontre(id) {
  if (!id || aRencontre(id)) return;
  state.rencontres = state.rencontres || [];
  state.rencontres.push(id);
  save();
}

function ouvrirPlace(id) {
  const neuf = id || (pnjPresents()[0] || {}).id || null;
  if (neuf !== _pnjOuvert) _pnjPropos = 0;      // on change d'interlocuteur
  _pnjOuvert = neuf;
  noterRencontre(_pnjOuvert);
  renderPlace();
}
function fermerPlace() {
  _pnjOuvert = null; _pnjPropos = 0;
  if (_pnjArret) { _pnjArret(); _pnjArret = null; }
  renderPlace();
}
function parlerEncore() {
  _pnjPropos++;
  renderPlace();
}

/* Ce que le personnage dit maintenant : sa réplique d'accueil au premier
   temps, puis ses propos, en boucle. */
function proposDe(p) {
  const suite = p.propos || [];
  if (!suite.length || _pnjPropos === 0) return repliqueDe(p);
  return suite[(_pnjPropos - 1) % suite.length];
}

function renderPlace() {
  const boite = document.querySelector('#placeBoite');
  if (!boite) return;
  const gens = pnjPresents();
  const choisi = gens.find(p => p.id === _pnjOuvert);
  if (!choisi) {
    boite.classList.remove('ancree');
    cacherSurcouche(boite); boite.innerHTML = ''; return;
  }

  const suite = choisi.propos || [];
  const rang = suite.length ? (_pnjPropos % (suite.length + 1)) : 0;

  boite.innerHTML = `<div class="qtCadre qrCadre plCadre" role="dialog" aria-modal="true"
      aria-label="La Place">
    <i class="qrBec" aria-hidden="true"></i>
    <div class="qtTete">
      <span class="qtTitre">La Place</span>
      <span class="qtLieu">${gens.length} personne${gens.length > 1 ? 's' : ''}</span>
      <button class="btn ghost sm" id="plFermer" type="button">Fermer</button>
    </div>

    <div class="qrCorps">
      <nav class="qrListe">${gens.map(p => `<button class="qrChoix${
          p.id === choisi.id ? ' on' : ''}" type="button" data-pnj="${p.id}">
        <span class="plEmoji">${p.emoji}</span>
        <span class="qrCNom">${p.nom}</span>
      </button>`).join('')}</nav>

      <div class="qrVolet">
        <div class="plDit">
          <span class="plQui">${choisi.nom}</span>
          <p class="plTexte">${proposDe(choisi)}</p>
        </div>
        <p class="plRole">${choisi.role}</p>
        ${suite.length ? `<div class="plPied">
          <button class="btn sm" id="plParler" type="button">Parler</button>
          <span class="plPerles">${suite.map((_, k) =>
            `<i class="${k + 1 === rang ? 'encours' : ''}"></i>`).join('')}</span>
        </div>` : ''}
      </div>
    </div>
  </div>`;

  boite.classList.add('ancree');
  montrerSurcouche(boite);
  const placer = () => ancrerSurNoeud(boite.querySelector('.plCadre'), 'place');
  placerBientot(placer);
  if (_pnjArret) _pnjArret();
  _pnjArret = suivreNoeud(placer);

  boite.querySelector('#plFermer').addEventListener('click', fermerPlace);
  /* Le fond est transparent : c'est lui qui attrape le clic à côté. */
  boite.addEventListener('click', ev => { if (ev.target === boite) fermerPlace(); });
  boite.querySelectorAll('[data-pnj]').forEach(b =>
    b.addEventListener('click', () => ouvrirPlace(b.dataset.pnj)));
  const parler = boite.querySelector('#plParler');
  if (parler) parler.addEventListener('click', parlerEncore);
}

/* ============================================================
   LE CARNET

   UN SEUL ENDROIT POUR SAVOIR OÙ ON EN EST. Les quêtes vivaient au Port, la
   porte de l'acte sur la Carte, les curiosités nulle part : trois réponses à
   une seule question — « qu'est-ce que je dois faire ? ». Le Carnet les
   rassemble, et il s'ouvre depuis l'en-tête, donc de n'importe quel onglet.

   IL NE DUPLIQUE RIEN. Les conditions viennent de `conditionsPour()`, les
   quêtes de leur propre état, les curiosités de la Frise, les noms de lieux et
   d'instruments de la Carte et de l'Atelier. Le Carnet lit ; il ne tient aucun
   compte de son côté, et ne peut donc pas se désynchroniser.

   IL EST RANGÉ PAR ACTE, en onglets verticaux. C'est la seule division que le
   joueur connaît déjà : ses lieux, ses instruments, ses quêtes et ses pièces
   d'histoire lui arrivent tous par acte. Trois listes plates — quêtes, porte,
   curiosités — obligeaient à recomposer mentalement ce découpage à chaque
   ouverture ; ici chaque acte tient sur une page.

   ET IL LAISSE VOIR DEVANT. Un acte non atteint montre ses conditions et ce
   qu'il ouvre — c'est ce qu'on vient chercher —, mais pas le titre de ses
   quêtes : un titre raconte déjà la moitié de ce qu'une quête a à dire.
   ============================================================ */
let _carnetOuvert = false;
let _carnetActe = null;        // l'acte consulté ; null = celui où l'on est

function ouvrirCarnet() {
  _carnetOuvert = true;
  if (_carnetActe === null) _carnetActe = acteCourant();
  renderCarnet();
}
function fermerCarnet() { _carnetOuvert = false; renderCarnet(); }
function carnetVoirActe(n) { _carnetActe = Math.max(0, Math.min(ACTE_MAX, n)); renderCarnet(); }

/* Les noms lisibles, lus là où ils sont définis. On ne recopie pas une liste
   qui existe : un bâtiment renommé sur la Carte doit se renommer ici tout
   seul, et un identifiant qui ne correspond à rien doit se voir. */
function nomDeLieu(id) {
  const l = (typeof HUB_LIEUX !== 'undefined') ? HUB_LIEUX.find(x => x.id === id) : null;
  return l ? l.nom : id;
}
function nomDInstrument(id) {
  const m = (typeof MACHINES !== 'undefined') ? MACHINES.find(x => x.id === id) : null;
  return m ? m.nom : id;
}

/* Le compteur d'étapes. Une quête offerte n'a rien fait : elle affiche 0, pas
   1 — annoncer une étape franchie avant d'avoir ouvert la quête serait faux.
   Une quête en cours affiche l'étape où elle est, une achevée son total. */
function pasFaits(q, etat) {
  if (etat === 'achevee') return q.etapes.length;
  if (etat === 'offerte') return 0;
  return Math.min(etapeQuete(q.id) + 1, q.etapes.length);
}

/* Les curiosités que cet acte peut rendre : elles suivent ses quêtes. */
const curiositesDeLActe = (n) => QUETES
  .filter(q => q.acte === n && q.recompense && q.recompense.objet)
  .map(q => ({ quete: q, piece: curiosite(q.recompense.objet) }))
  .filter(x => x.piece);

function renderCarnet() {
  const boite = document.querySelector('#carnetBoite');
  if (!boite) return;
  if (!_carnetOuvert) { cacherSurcouche(boite); boite.innerHTML = ''; return; }

  const ici = acteCourant();
  const n = Math.max(0, Math.min(ACTE_MAX, _carnetActe === null ? ici : _carnetActe));
  const acte = acteDe(n);

  /* TROIS RÉGIMES, ET PAS DEUX.

     — ATTEINT (n <= ici) : tout est là.
     — LA PORTE (n = ici + 1) : uniquement ce qu'il faut faire pour entrer. Ni
       ce que l'acte contient, ni ce qu'il ouvre. C'est le seul acte verrouillé
       dont on montre quelque chose, parce que c'est exactement ce qu'on vient
       consulter : « qu'est-ce qui me reste à faire ? »
     — SCELLÉ (au-delà) : rien. Pas son époque, pas son résumé, pas même son
       nom dans la colonne. Un acte lointain qu'on peut lire d'avance n'est
       plus une progression, c'est un sommaire. */
  const atteint = n <= ici;
  const porteSuivante = (n === ici + 1);
  const scelle = (n > ici + 1);

  /* ---- la colonne de gauche : un onglet par acte ---- */
  const onglets = ACTES.map(a => {
    const etat = a.n < ici ? 'fait' : a.n === ici ? 'ici' : a.n === ici + 1 ? 'porte' : 'loin';
    const marque = etat === 'fait' ? '✓' : etat === 'ici' ? '▸' : etat === 'porte' ? '◦' : '🔒';
    return `<button class="cnOnglet ${etat}${a.n === n ? ' actif' : ''}" type="button"
        role="tab" aria-selected="${a.n === n}" data-carnet-acte="${a.n}">
      <span class="cnOMarque">${marque}</span>
      <span class="cnOActe">Acte ${a.n}</span>
      <span class="cnONom">${etat === 'loin' ? 'verrouillé' : a.nom}</span>
    </button>`;
  }).join('');

  /* ---- la porte : ce qu'il faut avoir fait pour entrer dans cet acte ---- */
  let porte = '';
  if (n === 0) {
    porte = `<p class="cnMot">Le seuil. On y entre en poussant la porte, sans rien devoir.</p>`;
  } else if (atteint) {
    porte = `<p class="cnMot">${n === ici ? "Vous y êtes." : "Acte franchi."}</p>`;
  } else {
    const cs = conditionsPour(n);
    const pret = cs.every(c => c.ok);
    /* Les conditions se mesurent sur la partie telle qu'elle est : elles sont
       donc honnêtes même pour un acte lointain. Seul le bouton attend son
       tour — on ne saute pas un acte. */
    porte = (cs.length
      ? `<ul class="porteListe">${cs.map(c => `<li class="${c.ok ? 'ok' : ''}">
          <span class="porteCoche">${c.ok ? '✓' : '○'}</span>
          <span class="porteTexte">${c.texte}</span>
          <span class="porteCompte">${c.requis > 1 ? `${fmt(Math.min(c.atteint, c.requis))} / ${fmt(c.requis)}` : ''}</span>
        </li>`).join('')}</ul>`
      : `<p class="cnMot">Rien à faire d'autre que de franchir.</p>`)
      + (pret ? `<button class="btn sm" id="cnFranchir" type="button">Entrer dans l'acte ${n}</button>` : '');
  }

  /* ---- ce que l'acte ouvre ---- */
  const ouvre = [
    ...acte.lieux.map(id => `<span class="cnClef">🏛 ${nomDeLieu(id)}</span>`),
    ...acte.instruments.map(id => `<span class="cnClef">⚙ ${nomDInstrument(id)}</span>`),
  ].join('');

  /* ---- les quêtes de l'acte ----
     Uniquement pour un acte atteint : un acte verrouillé ne montre rien, pas
     même combien de quêtes il porte. */
  const lot = QUETES.filter(q => q.acte === n);
  let quetes;
  if (!lot.length) {
    quetes = `<p class="cnMot">Aucune quête à cet acte.</p>`;
  } else {
    quetes = lot.map(q => {
      const e = etatQuete(q.id);
      if (e === 'dormante' || e === 'attente') {
        return `<div class="cnQuete morte">
          <span class="cnQTitre">${q.titre}</span>
          <span class="cnQPas">—</span>
          <span class="cnQQuoi">${q.declencheur
            ? "Elle dort : un nombre de votre herbier la réveillera."
            : "Pas encore proposée."}</span></div>`;
      }
      const et = etapeCourante(q);
      const quoi = e === 'achevee' ? (q.recompense && q.recompense.mot) || 'achevée'
        : et.type === 'faire' ? (objectifRempli(et) ? "objectif atteint — retournez le voir" : et.texte)
        : et.type === 'enigme' ? 'une question vous attend'
        : e === 'offerte' ? (q.rejouable ? 'prête à être rejouée' : 'à commencer') : 'à poursuivre';
      return `<button class="cnQuete${e === 'achevee' ? ' faite' : ''}" type="button"
          data-carnet-quete="${q.id}">
        <span class="cnQTitre">${q.titre}</span>
        <span class="cnQPas">${pasFaits(q, e)}/${q.etapes.length}</span>
        <span class="cnQQui">${q.personnage}</span>
        <span class="cnQQuoi">${quoi}</span>
      </button>`;
    }).join('');
  }

  /* ---- les curiosités de l'acte ---- */
  const pieces = curiositesDeLActe(n);
  let cur;
  if (!pieces.length) {
    cur = `<p class="cnMot">Cet acte n'en rapporte aucune.</p>`;
  } else {
    cur = pieces.map(({ quete, piece }) => possedeCuriosite(piece.id)
      ? `<div class="cnObjet">
          <span class="cnODate">${piece.quand}</span>
          <b class="cnONomP">${piece.titre}</b>
          <p class="cnOTexte">${piece.texte}</p>
          <span class="cnOQui">${piece.qui ? `${piece.qui} · ` : ''}${piece.lieu}</span>
        </div>`
      : `<div class="cnObjet vide">
          <b class="cnONomP">Pièce non rapportée</b>
          <p class="cnOTexte">Elle vous attend au bout de « ${quete.titre} ».</p>
        </div>`).join('');
  }

  const eues = curiositesPossedees().length;
  const total = curiositesTotales().length;

  montrerSurcouche(boite);
  boite.innerHTML = `<div class="qtCadre cnCadre" role="dialog" aria-modal="true" aria-label="Carnet">
    <div class="qtTete">
      <span class="qtTitre">Carnet</span>
      <span class="qtLieu">Acte ${ici} · ${acteDe(ici).nom} — curiosités ${eues} / ${total}</span>
      <button class="btn ghost sm" id="cnFermer" type="button">Fermer</button>
    </div>

    <div class="cnCorps">
      <nav class="cnOnglets" role="tablist" aria-orientation="vertical"
           aria-label="Les actes">${onglets}</nav>

      <div class="cnVue" role="tabpanel" aria-label="Acte ${n}">${
        scelle ? `
        <div class="cnScelle">
          <span class="cnSCadenas">🔒</span>
          <p class="cnSMot">L'acte ${n} est verrouillé.</p>
          <p class="cnSNote">Passez d'abord l'acte ${ici + 1}. Ce qu'il y a derrière
             ne se lit pas d'avance — c'est ce qui fait qu'on y arrive.</p>
        </div>`
        : porteSuivante ? `
        <header class="cnVTete">
          <h3 class="cnVNom">Acte ${n} — ${acte.nom}</h3>
          <p class="cnVSous">Verrouillé. Voici ce qui l'ouvre.</p>
        </header>

        <section class="cnBloc">
          <h4 class="cnTitre">Pour y entrer</h4>
          ${porte}
        </section>

        <p class="cnMot">Le reste — ce qu'il ouvre, qui vous y attend, ce qu'on
           en rapporte — se découvre en y entrant.</p>`
        : `
        <header class="cnVTete">
          ${acte.epoque ? `<span class="cnVEpoque">${acte.epoque}</span>` : ''}
          <h3 class="cnVNom">Acte ${n} — ${acte.nom}</h3>
          <p class="cnVSous">${acte.titre}</p>
          <p class="cnVResume">${acte.resume}</p>
        </header>

        <section class="cnBloc">
          <h4 class="cnTitre">La porte</h4>
          ${porte}
        </section>

        <section class="cnBloc">
          <h4 class="cnTitre">Ce qu'il ouvre</h4>
          ${ouvre ? `<div class="cnClefs">${ouvre}</div>`
                  : `<p class="cnMot">Rien de nouveau sur la Carte : c'est un acte de récit.</p>`}
        </section>

        <section class="cnBloc">
          <h4 class="cnTitre">Quêtes <i>${lot.length}</i></h4>
          <div class="cnQuetes">${quetes}</div>
        </section>

        <section class="cnBloc">
          <h4 class="cnTitre">Curiosités <i>${pieces.filter(p => possedeCuriosite(p.piece.id)).length} / ${pieces.length}</i></h4>
          <div class="cnObjets">${cur}</div>
        </section>`
      }</div>
    </div>
  </div>`;

  boite.querySelector('#cnFermer').addEventListener('click', fermerCarnet);
  boite.querySelectorAll('[data-carnet-acte]').forEach(b =>
    b.addEventListener('click', () => carnetVoirActe(+b.dataset.carnetActe)));
  const fr = boite.querySelector('#cnFranchir');
  if (fr) fr.addEventListener('click', () => {
    const ouvert = franchirActe();
    if (!ouvert) return toast('Il manque encore quelque chose.', 'bad');
    toast(`▸ <b>Acte ${ouvert.n} — ${ouvert.nom}.</b> ${ouvert.titre}.`, 'gold');
    _carnetActe = ouvert.n;
    renderAll(); renderCarnet();
  });
  boite.querySelectorAll('[data-carnet-quete]').forEach(b =>
    b.addEventListener('click', () => { fermerCarnet(); ouvrirQuete(b.dataset.carnetQuete); }));
}
