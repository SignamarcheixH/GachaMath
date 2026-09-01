/* ============================================================
   L'EXPÉDITION

   Une carte de nœuds dont on ne connaît que la couleur. On y avance de proche
   en proche : certains nœuds remplissent une besace — des nombres, des
   opérateurs — d'autres imposent une contrainte qu'il faut lever en dépensant
   ce qu'on a ramassé.

   CE QUI A CHANGÉ, ET POURQUOI. La version précédente n'offrait que trois
   voies subies : le joueur espérait que la suivante lèverait la contrainte,
   sans prise réelle sur le jeu. La décision est maintenant ailleurs — quel
   chemin prendre pour se doter, et comment dépenser une besace limitée le
   moment venu. C'est de la préparation, plus du pari.

   AUCUNE VÉRIFICATION DE FAISABILITÉ. La version précédente garantissait
   qu'une contrainte restait toujours atteignable. Cela coûtait cher — jusqu'à
   une seconde par palier — et surtout cela supprimait l'enjeu : une besace
   mal garnie doit pouvoir échouer, sinon le chemin choisi ne compte pas.
   ============================================================ */

const EXP = {
  /* La piste n'a plus de fin. Elle se déroule au fur et à mesure : on garde
     toujours quelques couches d'avance, ce que personne ne voit puisque le
     cadre en montre moins que ça. La course ne s'arrête donc plus toute seule
     — elle s'arrête quand le joueur rentre par un camp, ou quand sa besace ne
     permet plus rien devant une épreuve. */
  horizon: 4,            // couches tenues d'avance sur le joueur
  camp: 5,               // un camp de base barre la piste toutes les N couches
  largeurMax: 3,         // nœuds par couche, au plus
  plafond: 99999,
  defiCalculs: 3,        // calculs d'affilée à passer au poste de calcul
};

/* ---------- opérateurs ----------
   Deux familles, et la distinction porte tout l'équilibre du jeu.

   Les cinq opérateurs de BASE sont toujours disponibles : sans eux le jeu
   demandait de deviner ce que le hasard voudrait bien donner, ce qui le rendait
   opaque. Ils sont gratuits, mais ils consomment un nombre.

   Les SPÉCIAUX viennent des ateliers et se consomment. Ce sont eux qui font la
   rareté.

   La ressource, ce sont donc les nombres — jamais les opérateurs de base. Une
   combinaison en dépense deux pour n'en rendre qu'un : la besace fond à chaque
   geste, et c'est ce qui empêche de fabriquer n'importe quoi. */
const EXP_OPERATEURS = (() => {
  const ch = n => String(n).split('');
  const val = d => { const s = d.join('').replace(/^0+/, ''); return s === '' ? 0 : +s; };
  const borne = v => (Number.isInteger(v) && v >= 0 && v <= EXP.plafond) ? v : null;

  const liste = [
    // ---- base : toujours là, gratuits, mais consomment un nombre ----
    ['plus',   '+',  true,  (a, b) => borne(a + b)],
    ['moins',  '−',  true,  (a, b) => borne(a - b)],
    ['fois',   '×',  true,  (a, b) => borne(a * b)],
    ['divise', '÷',  true,  (a, b) => (b !== 0 && a % b === 0) ? borne(a / b) : null],
    ['colle',  '‖',  true,  (a, b) => borne(+(String(a) + String(b)))],

    // ---- unaires ----
    ['miroir',   'Miroir',                false, a => borne(val(ch(a).reverse()))],
    ['kaprekar', 'Kaprekar',              false, a => a > 9 ? borne(val(ch(a).sort().reverse()) - val(ch(a).sort())) : null],
    ['triA',     'Chiffres croissants',   false, a => borne(val(ch(a).sort()))],
    ['triD',     'Chiffres décroissants', false, a => borne(val(ch(a).sort().reverse()))],
    ['c9',       'Complément à 9',        false, a => borne(val(ch(a).map(c => String(9 - +c))))],
    ['inc',      'Chiffres +1',           false, a => borne(val(ch(a).map(c => String((+c + 1) % 10))))],
    ['dec',      'Chiffres −1',           false, a => borne(val(ch(a).map(c => String((+c + 9) % 10))))],
    ['oteQueue', 'Ôte le dernier',        false, a => a > 9 ? borne(val(ch(a).slice(0, -1))) : null],
    ['oteTete',  'Ôte le 1ᵉʳ',            false, a => a > 9 ? borne(val(ch(a).slice(1))) : null],
    ['rotD',     'Rotation →',            false, a => a > 9 ? borne(val([ch(a)[ch(a).length - 1]].concat(ch(a).slice(0, -1)))) : null],
    ['somme',    'Somme des chiffres',    false, a => borne(ch(a).reduce((s, c) => s + +c, 0))],
    ['carre',    'n²',                    false, a => borne(a * a)],
    ['racine',   '√n',                    false, a => { const r = Math.round(Math.sqrt(a)); return r * r === a ? borne(r) : null; }],
  ];

  const table = {};
  for (const [cle, nom, binaire, f] of liste) table[cle] = { cle, nom, binaire, f };
  return table;
})();

const EXP_BASE = ['plus', 'moins', 'fois', 'divise', 'colle'];
const EXP_SPECIAUX = Object.keys(EXP_OPERATEURS).filter(c => !EXP_BASE.includes(c));

/* ---------- contraintes ---------- */
const EXP_CONTRAINTES = (() => {
  const ch = n => String(n).split('');
  const premier = n => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  return [
    ['pair',      'Un nombre pair',                n => n % 2 === 0],
    ['impair',    'Un nombre impair',              n => n % 2 === 1],
    ['mult3',     'Un multiple de 3',              n => n > 0 && n % 3 === 0],
    ['mult5',     'Un multiple de 5',              n => n > 0 && n % 5 === 0],
    ['contient7', 'Contenir un 7',                 n => String(n).includes('7')],
    ['deux6',     'Contenir deux 6',               n => ch(n).filter(c => c === '6').length >= 2],
    ['doublon',   'Deux chiffres identiques',      n => new Set(ch(n)).size < ch(n).length],
    ['tousDiff',  'Tous les chiffres différents',  n => n > 9 && new Set(ch(n)).size === ch(n).length],
    ['palin',     'Un palindrome de 3 chiffres ou plus', n => n > 99 && String(n) === ch(n).reverse().join('')],
    ['somme20',   'Somme des chiffres ≥ 20',       n => ch(n).reduce((s, c) => s + +c, 0) >= 20],
    ['quatre',    'Exactement 4 chiffres',         n => n >= 1000 && n <= 9999],
    ['cinq',      'Exactement 5 chiffres',         n => n >= 10000],
    ['premier',   'Un nombre premier',             n => premier(n)],
    ['carre',     'Un carré parfait',              n => n > 0 && Math.round(Math.sqrt(n)) ** 2 === n],
    ['finit0',    'Finir par 0',                   n => n > 0 && n % 10 === 0],
    ['sup1000',   'Dépasser 1 000',                n => n > 1000],
    ['inf100',    'Descendre sous 100',            n => n < 100],
  ].map(([cle, texte, test]) => ({ cle, texte, test }));
})();

/* ---------- types de nœuds ----------
   Seul le type est visible avant d'y arriver : c'est la seule information sur
   laquelle le joueur trace sa route. */
const EXP_NOEUDS = {
  nombres:    { nom: 'Gisement',     emoji: '🔢', desc: 'des nombres pour la besace' },
  operateurs: { nom: 'Atelier',      emoji: '⚙️', desc: 'des opérateurs' },
  contrainte: { nom: 'Épreuve',      emoji: '🎯', desc: 'une contrainte à lever' },
  tresor:     { nom: 'Trésor',       emoji: '💰', desc: 'jetons, parfois une carte' },
  checkpoint: { nom: 'Camp de base', emoji: '🏕️', desc: 'rentrer avec la récolte, ou pousser plus loin' },
  calcul:     { nom: 'Poste de calcul', emoji: '⚡', desc: `${EXP.defiCalculs} calculs de tête, sans traîner` },
  revision:   { nom: 'Halte d’étude',   emoji: '📖', desc: 'reconnaître un trait à sa définition' },
};

const auHasard = a => a[(Math.random() * a.length) | 0];

/* ---------- le vivier de nombres ----------
   Un nombre de la besace n'a d'intérêt que s'il se manie. Tirer 3 545 ou 8 617
   au hasard donnait des jetons décoratifs : on ne divise par rien, on ne
   multiplie sans déborder, et les coller produit un monstre. Le vivier ne
   contient donc que des outils.

   Les petits entiers servent partout, les puissances de deux se divisent et se
   multiplient proprement, les ronds font des fins en zéro, et les chiffres
   isolés se collent pour placer un 7 ou un second 6. */
const EXP_VIVIER = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 15, 16, 20, 25, 32, 50, 64, 100, 128, 1000,
  6, 7, 66, 77,                       // deux fois : ils dénouent des contraintes précises
  2, 3, 5, 10,                        // et ceux-là servent le plus souvent
];

/* ============================================================
   LA CARTE
   ============================================================ */
function expTirerTypeNoeud(couche) {
  /* Le tout début est fixe : un atelier puis un gisement. Sans cela on pouvait
     entamer trois couches de nombres et se présenter à la première épreuve
     sans un seul opérateur — une défaite sans décision. */
  if (couche === 0) return 'operateurs';
  if (couche === 1) return 'nombres';

  /* Un camp barre la piste toute entière toutes les EXP.camp couches. Le semer
     au hasard n'aurait pas marché : les liens ne vont qu'au voisin immédiat,
     un camp isolé se serait retrouvé hors du chemin choisi, et une piste sans
     fin sans sortie garantie n'est plus une décision — c'est un piège. */
  if (couche % EXP.camp === 0) return 'checkpoint';

  /* Plus on s'enfonce, plus les épreuves se pressent et moins les gisements
     rendent. Sans cette dérive une carte sans fin serait une rente : les gains
     montent avec la profondeur, et rien n'obligerait jamais à rentrer. */
  const durete = Math.min(0.25, (couche - 2) * 0.010);
  const r = Math.random();
  if (r < 0.30 + durete) return 'contrainte';
  if (r < 0.52) return 'nombres';
  if (r < 0.76) return 'operateurs';
  if (r < 0.84) return 'tresor';
  /* Deux haltes qui paient l'adresse plutôt que la chance. Elles prennent leur
     part sur le trésor : c'était le seul nœud qui donnait sans rien demander,
     et il en donne encore, moins souvent. */
  if (r < 0.92) return 'calcul';
  return 'revision';
}

/* Une couche, tirée d'un coup et pour de bon. Les positions sont mémorisées :
   les recalculer au rendu ferait sauter toute la carte à chaque clic. */
function expConstruireCouche(c) {
  const largeur = c === 0 ? 1 : 2 + ((Math.random() * EXP.largeurMax) | 0);
  const rangee = [];
  for (let i = 0; i < largeur; i++) {
    /* Une grille régulière donnait un aspect de tableur ; le désordre se borne
       pour que deux nœuds voisins ne se chevauchent jamais. Le désordre
       horizontal reste dans le tiers du créneau : au-delà, les chemins
       traversaient la carte de part en part à chaque couche. */
    const pas = 1 / largeur;
    const x = (i + 0.5) * pas + (Math.random() - 0.5) * pas * 0.30;
    /* `y` se compte désormais EN COUCHES, plus en pourcentage de la carte : une
       piste sans fin n'a pas de dénominateur fixe. Le rendu divise par la
       hauteur du moment, la même pour les nœuds et pour les liens, si bien que
       tout reste d'aplomb quand la carte s'allonge. Le désordre reste bien en
       deçà de l'écart entre deux couches, sinon elles se chevaucheraient. */
    const y = Math.max(0, c + (Math.random() - 0.5) * 0.16);
    rangee.push({
      type: expTirerTypeNoeud(c), vu: false, liens: [],
      x: Math.min(0.94, Math.max(0.06, x)),
      y,
    });
  }
  return rangee;
}

/* Les liens ne vont qu'à la couche suivante, entre voisins de position : une
   carte où tout mène à tout n'offrirait aucun choix. */
function expRelierCouche(couches, c) {
  const ici = couches[c], la = couches[c + 1];
  if (!ici || !la) return;
  ici.forEach((n, i) => {
    const centre = ici.length > 1
      ? Math.round(i * (la.length - 1) / (ici.length - 1))
      : Math.floor(la.length / 2);
    /* On ne relie qu'au voisin immédiat, et on écarte les sauts trop latéraux :
       un lien qui traverse la carte se lit mal et ne se suit pas. */
    const candidats = [centre - 1, centre, centre + 1]
      .filter(k => k >= 0 && k < la.length)
      .filter(k => Math.abs((k + 0.5) / la.length - (i + 0.5) / ici.length) < 0.34);
    const utiles = candidats.length ? candidats : [Math.min(centre, la.length - 1)];
    const nb = 1 + ((Math.random() * Math.min(2, utiles.length)) | 0);
    n.liens = [...new Set(utiles.sort(() => Math.random() - 0.5).slice(0, nb))].sort((a, b) => a - b);
  });
  // Aucun nœud orphelin, sinon une branche entière serait décorative.
  la.forEach((_, j) => {
    if (ici.some(n => n.liens.includes(j))) return;
    const parent = ici[(Math.random() * ici.length) | 0];
    parent.liens = [...new Set(parent.liens.concat(j))].sort((a, b) => a - b);
  });
}

/* Déroule la piste juste assez loin devant le joueur. Le cadre montre moins de
   couches que l'horizon, si bien que le bord du monde n'est jamais visible :
   on ne voit pas la carte se fabriquer. */
function expEtendreCarte(r) {
  const vise = (r.position ? r.position.couche : 0) + EXP.horizon;
  while (r.carte.length <= vise) {
    r.carte.push(expConstruireCouche(r.carte.length));
    if (r.carte.length >= 2) expRelierCouche(r.carte, r.carte.length - 2);
  }
}

/* ============================================================
   LA COURSE
   ============================================================ */
function expDemarrer() {
  /* On ne porte plus de nombre. L'épreuve se joue entièrement sur la besace :
     il s'agit d'en fabriquer un qui satisfasse la contrainte, pas de traîner
     un nombre unique de bout en bout. */
  const r = {
    mode: 'expedition',
    carte: [],                      // déroulée au fur et à mesure
    position: null,                 // null tant qu'on n'est pas parti
    /* On part avec de quoi agir, sans plus. Quinze nombres au départ faisaient
       passer les premières épreuves toutes seules ; six obligent à aller
       chercher aux gisements ce qu'il manque. */
    besace: { nombres: Array.from({ length: 6 }, expNombreCadeau), operateurs: [] },
    epreuve: null,                  // { texte, test, coups } sur un nœud contrainte
    defi: null,                     // le poste de calcul ou la halte d'étude en cours
    jetons: 0,                      // promis, pas versés
    nombres: [],                    // promis eux aussi : acquis au camp seulement
    cartes: [],                     // remplies à l'arrivée, par expVerser
    fini: false, cause: '',
  };
  expEtendreCarte(r);
  state.revision = r;
  return r;
}

/* Où peut-on aller depuis la position courante ? */
function expAccessibles(r) {
  if (r.epreuve || r.defi || r.fini) return [];   // on règle d'abord ce qui est devant
  if (!r.position) return r.carte[0].map((_, i) => ({ couche: 0, index: i }));
  /* La piste se déroule ici aussi : c'est la garantie qu'il y a toujours un pas
     devant, quelle que soit la route par laquelle on est arrivé. Sans fin de
     carte, se retrouver sans destination serait un blocage sans issue. */
  expEtendreCarte(r);
  const { couche, index } = r.position;
  return r.carte[couche][index].liens.map(i => ({ couche: couche + 1, index: i }));
}

/* RIEN N'EST ACQUIS AVANT LE CAMP. Jetons et nombres restent sur le dos de
   l'expédition : ils s'entassent dans la besace du voyageur, et n'entrent dans
   la partie qu'au moment où l'on rentre. Une course qui tourne mal ne laisse
   rien du tout.

   C'est ce qui donne son prix à chaque couche de plus : la récolte grossit, et
   c'est elle entière que l'on remet en jeu à chaque pas. */
function expEncaisser(r, jetons) {
  if (jetons > 0) r.jetons += jetons;
}

/* Et voici le seul endroit où la récolte devient réelle. */
function expVerser(r) {
  if (r.jetons > 0) {
    state.coins += r.jetons;
    state.stats.coinsEarned = (state.stats.coinsEarned || 0) + r.jetons;
  }
  /* Les nombres n'ont été que promis jusqu'ici : c'est maintenant qu'ils
     entrent dans la collection, avec les jetons et la poussière que chacun
     rapporte. */
  r.cartes = r.nombres.map(n => acquire(n, 'prime'));
  r.nombres = [];
}

function expGain(couche) {
  const base = Math.max(40, Math.floor(coinsPerMinute() / 80));
  return Math.round(base * (1 + couche * 0.5));
}

const expNombreCadeau = () => auHasard(EXP_VIVIER);

function expEntrer(couche, index) {
  const r = state.revision;
  if (!r || r.mode !== 'expedition' || r.fini || r.epreuve || r.defi) return null;
  if (!expAccessibles(r).some(p => p.couche === couche && p.index === index)) return null;

  r.position = { couche, index };
  expEtendreCarte(r);               // la piste garde son avance sur le joueur
  const noeud = r.carte[couche][index];
  noeud.vu = true;
  /* Compté ici, et pas déduit du nombre de parties : le contrôle de
     plausibilité du classement a besoin de savoir combien de couches ont été
     réellement parcourues, maintenant qu'une seule expédition peut en compter
     cinquante. Voir serveur/parties/metriques.py. */
  state.stats.couchesExpedition = (state.stats.couchesExpedition || 0) + 1;

  const recolte = { type: noeud.type, nombres: [], operateurs: [], jetons: 0, carte: null };

  if (noeud.type === 'nombres') {
    for (let i = 0, k = 2 + ((Math.random() * 3) | 0); i < k; i++) {
      const n = expNombreCadeau();
      r.besace.nombres.push(n); recolte.nombres.push(n);
    }
  } else if (noeud.type === 'operateurs') {
    for (let i = 0, k = 1 + ((Math.random() * 2) | 0); i < k; i++) {
      const o = auHasard(EXP_SPECIAUX);
      r.besace.operateurs.push(o); recolte.operateurs.push(o);
    }
  } else if (noeud.type === 'tresor') {
    recolte.jetons += expGain(couche) * 3;
    if (Math.random() < 0.5) {
      const n = drawFromTier(rollTier());
      r.nombres.push(n); recolte.nombre = n;
    }
  } else if (noeud.type === 'contrainte') {
    const c = auHasard(EXP_CONTRAINTES);
    r.epreuve = expNouvelEtabli(c, r.besace.nombres);
  } else if (noeud.type === 'calcul' || noeud.type === 'revision') {
    r.defi = noeud.type === 'calcul' ? expNouveauCalcul() : expNouvelleRevision();
    recolte.defi = noeud.type;
  }

  recolte.jetons += expGain(couche);
  expEncaisser(r, recolte.jetons);

  if (r.epreuve && expBloque(r)) {
    expFin(r, `Plus rien à assembler devant l'épreuve : ${r.epreuve.texte.toLowerCase()}.`);
    recolte.echec = true;
  }

  return recolte;
}

/* Reste-t-il un seul geste possible ? Une besace non vide ne suffit pas : une
   division qui ne tombe pas juste, une racine sur un non-carré, un « ôte le
   dernier » sur un nombre à un chiffre ne donnent rien. Sans ce test, l'écran
   attendrait un clic qu'aucun bouton ne peut honorer. */
/* ============================================================
   L'ÉTABLI DE L'ÉPREUVE

   Le modèle est celui de la Forge : des lignes « a ⊕ b = c », des jetons qu'on
   y dépose. Deux différences.

   D'abord il n'y a pas de solution de référence : le joueur assemble ce qu'il
   veut, et la contrainte juge le résultat. Ensuite les opérateurs spéciaux
   sont unaires, d'où une seconde forme de ligne — « ⊕ a = c » — que la Forge
   n'avait pas.

   Le résultat d'une ligne devient un jeton, utilisable par les suivantes.
   Défaire une ligne rend ses jetons et fait tomber en cascade celles qui
   s'appuyaient sur son résultat : un jeton qui n'existe plus ne peut pas
   rester posé ailleurs.
   ============================================================ */
/* Le nombre de lignes n'est pas fixé. Un plan de quatre lignes disait au
   joueur, avant qu'il ait commencé, combien d'étapes sa solution devait
   tenir — et refusait la cinquième. L'établi grandit donc tout seul : il y a
   toujours exactement une ligne vierge sous les lignes entamées, et c'est en
   s'en servant qu'on en fait apparaître une de plus. */
function expAjusterLignes(e) {
  const vierge = l => !l.op && !l.a && !l.b;
  // On retire les vierges du bas — sauf une. Ne toucher qu'à la fin de la
  // liste garde l'indice des lignes utiles intact : les jetons qu'elles
  // produisent s'appellent « l » + indice.
  while (e.lignes.length > 1
         && vierge(e.lignes[e.lignes.length - 1])
         && vierge(e.lignes[e.lignes.length - 2])) e.lignes.pop();
  if (!vierge(e.lignes[e.lignes.length - 1])) e.lignes.push({ op: null, a: null, b: null });
}

function expNouvelEtabli(contrainte, nombres) {
  return {
    cle: contrainte.cle, texte: contrainte.texte, test: contrainte.test,
    jetons: nombres.map((val, i) => ({ id: 'b' + i, val })),
    lignes: [{ op: null, a: null, b: null }],
    /* Le dépôt : la case du bandeau où l'on présente son nombre. C'est ELLE qui
       juge, et elle seule. Les lignes ne servent plus qu'à fabriquer. */
    depot: null,
    suivant: nombres.length,          // pour numéroter les jetons produits
  };
}

const expJeton = (e, id) => e.jetons.find(j => j.id === id) || null;

/* Les jetons libres : ni posés sur une ligne, ni issus d'une ligne défaite. */
function expJetonsLibres(e) {
  const pris = new Set();
  e.lignes.forEach(l => { if (l.a) pris.add(l.a); if (l.b) pris.add(l.b); });
  if (e.depot) pris.add(e.depot);   // présenté au jury : plus disponible
  return e.jetons.filter(j => !pris.has(j.id));
}

function expLigneComplete(l) {
  if (!l.op) return false;
  const op = EXP_OPERATEURS[l.op];
  return op.binaire ? !!(l.a && l.b) : !!l.a;
}

function expLigneResultat(e, l) {
  if (!expLigneComplete(l)) return null;
  const op = EXP_OPERATEURS[l.op];
  const a = expJeton(e, l.a);
  if (!a) return null;
  if (!op.binaire) return op.f(a.val);
  const b = expJeton(e, l.b);
  return b ? op.f(a.val, b.val) : null;
}

/* Recalcule les jetons produits par les lignes, et fait tomber ce qui n'a plus
   de support. Appelé après chaque geste : c'est le seul endroit où l'état des
   lignes est remis d'équerre. */
function expRecomposer(e) {
  let change = true;
  while (change) {
    change = false;
    e.lignes.forEach((l, i) => {
      const idProduit = 'l' + i;
      const existant = e.jetons.findIndex(j => j.id === idProduit);
      const val = expLigneResultat(e, l);

      if (val === null) {
        if (existant >= 0) {
          e.jetons.splice(existant, 1);
          // Ce jeton disparaît : les lignes qui s'en servaient tombent.
          e.lignes.forEach(m => {
            if (m.a === idProduit) { m.a = null; change = true; }
            if (m.b === idProduit) { m.b = null; change = true; }
          });
        }
        return;
      }
      if (existant >= 0) {
        if (e.jetons[existant].val !== val) { e.jetons[existant].val = val; change = true; }
      } else {
        e.jetons.push({ id: idProduit, val, ligne: i });
        change = true;
      }
    });
  }
  expAjusterLignes(e);
  // Un jeton défait ne peut pas rester présenté au jury.
  if (e.depot && !expJeton(e, e.depot)) e.depot = null;
}

function expPoser(ligne, emplacement, id) {
  const r = state.revision;
  const e = r && r.epreuve;
  if (!e || r.fini) return { erreur: 'Aucune épreuve en cours.' };
  const l = e.lignes[ligne];
  if (!l) return { erreur: 'Ligne inconnue.' };

  if (emplacement === 'op') {
    if (!EXP_BASE.includes(id) && !r.besace.operateurs.includes(id)) {
      return { erreur: "Cet opérateur n'est plus dans la besace." };
    }
    // Passer de binaire à unaire libère la seconde case.
    l.op = id;
    if (!EXP_OPERATEURS[id].binaire) l.b = null;
  } else {
    const j = expJeton(e, id);
    if (!j) return { erreur: "Ce jeton n'existe plus." };
    if (!expJetonsLibres(e).some(x => x.id === id)) return { erreur: 'Ce jeton est déjà posé.' };
    // Une ligne ne peut pas se nourrir de son propre résultat.
    if (j.ligne === ligne) return { erreur: "Une ligne ne peut pas s'alimenter elle-même." };
    l[emplacement] = id;
  }

  expRecomposer(e);
  return expVerdict(r);
}

/* ---------- les deux haltes ----------
   Elles empruntent au Calcul rapide sa jauge et sa mise en page : un joueur qui
   connaît le mini-jeu n'a rien de neuf à apprendre en tombant sur le nœud. */
function expDefiHTML(r) {
  const d = r.defi;
  return d.type === 'calcul' ? expDefiCalculHTML(d) : expDefiRevisionHTML(d);
}

function expDefiCalculHTML(d) {
  const perles = [];
  for (let i = 0; i < EXP.defiCalculs; i++) {
    const h = d.historique[i];
    perles.push(`<i class="${!h ? (i === d.manche - 1 ? 'encours' : 'avenir')
                              : h.juste ? 'bon' : 'rate'}"></i>`);
  }
  const dernier = d.historique[d.historique.length - 1];
  return `<div class="expDefi calcZone">
    <div class="expDefiTitre">⚡ Poste de calcul</div>
    <p class="expDefiAide">Trois calculs d'affilée, ${CALC.duree / 1000} secondes chacun.
      Une estimation à moins de ${Math.round(CALC.tolerance * 100)} % suffit —
      mais <b>une seule erreur ferme la halte</b>.</p>

    <div class="calcChapelet">${perles.join('')}</div>
    <div class="calcExpr">${calcTexte(d.expr)} =</div>
    <div class="calcBarre"><i id="expCalcJauge"></i></div>
    <div class="calcSaisie">
      <input type="number" id="expCalcInput" inputmode="numeric" autocomplete="off"
             placeholder="…" aria-label="Votre réponse">
      <button class="btn" id="expCalcValider">Valider</button>
    </div>
    ${dernier ? `<p class="calcRetour ${dernier.juste ? 'bon' : 'rate'}">${dernier.texte} =
      <b>${fmt(dernier.vrai)}</b> — ${dernier.donnee === null ? 'pas de réponse'
        : dernier.juste ? 'juste' : `${fmt(dernier.donnee)}, ${Math.round(dernier.ecart * 100)} % d'écart`}</p>` : ''}
  </div>`;
}

function expDefiRevisionHTML(d) {
  return `<div class="expDefi">
    <div class="expDefiTitre">📖 Halte d'étude</div>
    <p class="expDefiAide">Laquelle de ces définitions est celle du trait
      <b>${TRAIT_BY_ID[d.traitId].emoji} ${TRAIT_BY_ID[d.traitId].label}</b> ?</p>
    <div class="expChoix">
      ${d.choix.map(id => `<button class="expChoixItem" data-trait="${id}">${
        defMasquee(TRAIT_BY_ID[id])}</button>`).join('')}
    </div>
  </div>`;
}

/* ---------- le dépôt ----------
   Poser un nombre dans le bandeau, c'est le présenter à la contrainte. Tant
   qu'aucun n'y est posé, rien n'est jugé : c'est le geste du joueur qui
   déclenche le verdict, plus une surveillance automatique de tout ce qui
   traîne sur l'établi.

   Un nombre venu tel quel de la besace est refusé : il faut l'avoir FABRIQUÉ.
   Sans cette règle, une besace un peu variée satisfaisait la contrainte
   d'emblée — « descendre sous 100 » est vraie pour la moitié du vivier — et
   l'épreuve tombait avant d'avoir commencé. */
function expDeposer(id) {
  const r = state.revision;
  const e = r && r.epreuve;
  if (!e || r.fini) return { erreur: 'Aucune épreuve en cours.' };

  const j = expJeton(e, id);
  if (!j) return { erreur: "Ce jeton n'existe plus." };
  if (!expJetonsLibres(e).some(x => x.id === id)) return { erreur: 'Ce jeton est déjà posé.' };
  if (j.ligne === undefined) {
    return { erreur: `${fmt(j.val)} sort de la besace : il faut le fabriquer sur une ligne.` };
  }

  e.depot = id;
  return expVerdict(r);
}

function expReprendre() {
  const r = state.revision;
  const e = r && r.epreuve;
  if (!e || r.fini) return;
  e.depot = null;
}

/* Le cycle des cinq usuels : vide → + → − → × → ÷ → ‖ → vide. Traverser la
   réserve pour changer d'opérateur coûtait un aller-retour à chaque essai,
   alors que le geste utile est d'en essayer plusieurs à la suite sur la même
   ligne. Le glissement reste là pour les spéciaux, et pour les usuels aussi.

   Le passage par le vide est volontaire : sans lui, un clic malheureux sur la
   ligne vierge poserait un « + » impossible à retirer. */
function expBasculerOp(ligne) {
  const r = state.revision;
  const e = r && r.epreuve;
  if (!e || r.fini) return {};
  const l = e.lignes[ligne];
  if (!l) return {};

  /* Un spécial n'est pas dans le cycle : on entre au début plutôt que de le
     remplacer par un usuel pris au hasard. */
  const rang = l.op ? EXP_BASE.indexOf(l.op) : -1;
  const suivant = EXP_BASE[(rang + 1) % (EXP_BASE.length + 1)];   // undefined = le vide

  if (!suivant) { expRetirer(ligne, 'op'); return {}; }
  /* Les cinq usuels sont binaires : passer de l'un à l'autre ne perd jamais
     d'opérande. Seul le départ d'un spécial unaire libère une case, et c'est
     expPoser qui s'en charge. */
  return expPoser(ligne, 'op', suivant);
}

function expRetirer(ligne, emplacement) {
  const r = state.revision;
  const e = r && r.epreuve;
  if (!e || r.fini) return;
  const l = e.lignes[ligne];
  if (!l) return;
  l[emplacement] = null;
  if (emplacement === 'op') { l.a = null; l.b = null; }
  expRecomposer(e);
}

/* Un jeton satisfait-il la contrainte ? C'est le seul critère de réussite. */
function expVerdict(r) {
  const e = r.epreuve;
  /* Un seul candidat : celui qui est dans le dépôt. */
  const presente = e.depot ? expJeton(e, e.depot) : null;

  if (presente && e.test(presente.val)) {
    /* Les jetons consommés quittent la besace, le reste y retourne. On dépense
       vraiment ce qu'on a assemblé. */
    /* `!j.ligne` aurait été vrai pour la ligne 0 : son résultat serait retourné
       dans la besace, mais pas celui des autres lignes. On teste l'absence de
       la propriété, pas sa fausseté. */
    const libres = expJetonsLibres(e).filter(j => j.ligne === undefined).map(j => j.val);
    const opsUtilises = e.lignes.map(l => l.op).filter(o => o && !EXP_BASE.includes(o));
    r.besace.nombres = libres;
    opsUtilises.forEach(o => {
      const i = r.besace.operateurs.indexOf(o);
      if (i >= 0) r.besace.operateurs.splice(i, 1);
    });
    return expLeverEpreuve(r, null, presente.val);
  }

  if (expBloque(r)) {
    expFin(r, `Plus rien à assembler devant l'épreuve : ${e.texte.toLowerCase()}.`);
    return { echec: true };
  }
  /* Refusé, mais le nombre reste dans le dépôt, en rouge : le joueur voit ce
     qu'il a proposé et le reprend d'un clic. */
  if (presente) return { refuse: presente.val };
  return {};
}

/* Reste-t-il un assemblage possible ? Il y a toujours une ligne vierge : la
   seule vraie question est celle de la matière. Les opérateurs de base sont
   toujours là, il suffit donc de deux jetons libres combinables, ou d'un
   spécial applicable à un jeton. */
function expBloque(r) {
  const e = r.epreuve;
  if (!e) return false;
  /* Le jeton présenté compte comme disponible : il se reprend d'un clic, et
     déclarer la partie perdue parce que le joueur a posé son dernier nombre
     dans le dépôt serait une défaite fabriquée de toutes pièces. */
  const libres = expJetonsLibres(e).concat(e.depot ? [expJeton(e, e.depot)] : []).filter(Boolean);

  for (const cle of EXP_BASE) {
    const op = EXP_OPERATEURS[cle];
    for (let i = 0; i < libres.length; i++)
      for (let j = 0; j < libres.length; j++)
        if (i !== j && op.f(libres[i].val, libres[j].val) !== null) return false;
  }
  for (const cle of r.besace.operateurs) {
    const op = EXP_OPERATEURS[cle];
    for (const j of libres) if (op.f(j.val) !== null) return false;
  }
  return true;
}

/* L'épreuve tombe : on encaisse la prime, et le nombre fabriqué entre dans la
   collection. C'est le sens même de l'épreuve — on repart avec ce qu'on a
   assemblé, pas avec une récompense abstraite. */
function expLeverEpreuve(r, recolte, valeur) {
  const prime = expGain(r.position.couche) * 4;
  r.epreuve = null;
  expEncaisser(r, prime);
  /* Le nombre fabriqué est promis, pas encore acquis : il ne rejoindra la
     collection qu'au camp, comme le reste de la récolte. */
  r.nombres.push(valeur);
  if (recolte) { recolte.jetons += prime; recolte.nombre = valeur; recolte.epreuveLevee = true; }
  return { epreuveLevee: true, nombre: valeur, jetons: prime };
}

function expFin(r, cause) {
  r.fini = true;
  r.cause = cause;
  r.epreuve = null;
  r.defi = null;
  /* Ce qui n'a pas été versé au camp n'a jamais existé. On le met de côté pour
     le bilan — dire ce qu'on a laissé sur la piste fait partie de la leçon —
     mais on le retire de la récolte, sans quoi l'écran de fin annoncerait un
     gain que le joueur ne trouverait nulle part dans sa bourse. */
  if (!r.verse) { r.perdu = { jetons: r.jetons, nombres: r.nombres.length }; r.jetons = 0; r.nombres = []; }
  state.stats.expeditions = (state.stats.expeditions || 0) + 1;
  const atteint = r.position ? r.position.couche + 1 : 0;
  state.stats.meilleureCouche = Math.max(state.stats.meilleureCouche || 0, atteint);
}

/* ============================================================
   LES DEUX HALTES

   Un poste de calcul et une halte d'étude. Toutes deux paient l'adresse, là où
   gisements, ateliers et trésors paient la chance.

   ELLES NE TUENT PAS. Une expédition ne s'arrête que d'une façon : devant une
   contrainte qu'on n'a plus de quoi lever. Faire mourir une course sur un
   calcul mental raté aurait mis un réflexe de trois secondes en travers d'une
   récolte de vingt couches — la sanction n'aurait plus rien à voir avec la
   faute. Rater une halte, c'est repartir les mains vides, et c'est tout.
   ============================================================ */
const expPrimeDefi = couche => expGain(couche) * 3;

/* ---------- le poste de calcul ----------
   Le même exercice que le mini-jeu dédié, en plus court : trois expressions
   d'affilée, chacune à estimer avant la fin du décompte. « Survivre », c'est
   rester dans la tolérance à chaque fois. */
function expNouveauCalcul() {
  const d = {
    type: 'calcul',
    manche: 0, reussies: 0,
    expr: null, debut: 0,
    historique: [],
    fini: false, gagne: false,
  };
  expCalculMancheSuivante(d);       // la première manche part avec la halte
  return d;
}

function expCalculMancheSuivante(d) {
  d.manche++;
  d.expr = calcNouvelleExpression(d.reussies);   // le générateur du mini-jeu
  d.debut = Date.now();
}

/* `reponse` vaut null quand le décompte s'achève sans saisie. */
function expCalculRepondre(reponse) {
  const r = state.revision;
  const d = r && r.defi;
  if (!d || d.type !== 'calcul' || d.fini) return null;

  const vrai = d.expr.valeur;
  const donnee = Number.isFinite(reponse) ? reponse : null;
  const ecart = donnee === null ? Infinity
              : Math.abs(donnee - vrai) / Math.max(1, Math.abs(vrai));
  const juste = ecart <= CALC.tolerance;

  d.historique.push({ texte: calcTexte(d.expr), donnee, vrai, ecart, juste });
  if (juste) d.reussies++;

  /* Une seule erreur suffit : « survivre à trois calculs » n'aurait pas de sens
     si l'on pouvait en manquer un. La halte se ferme aussitôt — inutile de
     faire jouer deux manches dont le résultat est déjà écrit. */
  if (!juste) { d.fini = true; d.gagne = false; return expCloreDefi(r); }
  if (d.reussies >= EXP.defiCalculs) { d.fini = true; d.gagne = true; return expCloreDefi(r); }
  expCalculMancheSuivante(d);
  return { manche: d.manche };
}

/* ---------- la halte d'étude ----------
   Un trait est nommé, quatre définitions sont proposées. Les leurres viennent
   de vrais traits : reconnaître la bonne demande de les avoir lus, pas
   d'éliminer trois phrases absurdes.

   Le nom du trait est masqué DANS les définitions — `defMasquee` s'en charge —
   sans quoi la réponse se lirait sans rien connaître au sujet. */
function expNouvelleRevision() {
  const questionnables = TRAITS.filter(t => t.id !== 'culte' && t.desc);
  const bon = auHasard(questionnables);
  const leurres = questionnables
    .filter(t => t.id !== bon.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return {
    type: 'revision',
    traitId: bon.id,
    choix: [bon, ...leurres].sort(() => Math.random() - 0.5).map(t => t.id),
    choisi: null, fini: false, gagne: false,
  };
}

function expRevisionRepondre(id) {
  const r = state.revision;
  const d = r && r.defi;
  if (!d || d.type !== 'revision' || d.fini) return null;
  d.choisi = id;
  d.fini = true;
  d.gagne = id === d.traitId;
  return expCloreDefi(r);
}

/* La sortie commune des deux haltes : on paie si c'est gagné, et on rend la
   carte au joueur dans tous les cas. */
function expCloreDefi(r) {
  const d = r.defi;
  const bilan = { defiFini: true, gagne: d.gagne, type: d.type, jetons: 0, nombre: null };
  if (d.gagne) {
    bilan.jetons = expPrimeDefi(r.position.couche);
    expEncaisser(r, bilan.jetons);
    /* Promis, pas acquis : comme tout le reste, cela n'entre dans la partie
       qu'au camp. */
    bilan.nombre = drawFromTier(rollTier());
    r.nombres.push(bilan.nombre);
  }
  r.defi = null;
  return bilan;
}

/* ---------- rentrer, ou abandonner ----------
   Le camp est le seul endroit où la récolte devient réelle. Ailleurs — un
   abandon en chemin, une épreuve devant laquelle on n'a plus rien — tout ce
   qui a été ramassé reste sur la piste.

   C'est ce qui fait du camp une décision plutôt qu'un bouton : chaque couche
   de plus grossit la récolte, et chaque couche de plus la remet entière en
   jeu. */
const expSurCamp = r => !!r && !!r.position && !r.epreuve && !r.defi && !r.fini
  && r.carte[r.position.couche][r.position.index].type === 'checkpoint';

function expRentrer() {
  const r = state.revision;
  if (!expSurCamp(r)) return null;
  const bilan = { jetons: r.jetons, nombres: r.nombres.length };
  expVerser(r);
  r.verse = true;                   // expFin ne doit pas effacer ce qui vient d'être versé
  expFin(r, `Rentré par le camp de la couche ${r.position.couche + 1} — la récolte est à vous.`);
  return bilan;
}

function expReplier() {
  const r = state.revision;
  if (r && r.mode === 'expedition' && !r.fini) {
    expFin(r, 'Expédition abandonnée en chemin — la récolte reste sur la piste.');
  }
}

function quitterExpedition() { state.revision = null; }

/* ============================================================
   RENDU
   ============================================================ */
function expAccueilHTML() {
  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">🗺️</div>
    <h3>L'Expédition</h3>
    <p>Une carte de nœuds dont vous ne voyez que la nature. Tracez votre route :
       les <b>gisements</b> et les <b>ateliers</b> remplissent votre besace,
       les <b>épreuves</b> la vident.</p>
    <p class="tiny">Sur une épreuve, il faut <b>fabriquer</b> un nombre qui satisfait la
       contrainte, en assemblant vos nombres et vos opérateurs sur autant de lignes qu'il faut —
       en posséder un qui convient déjà ne suffit pas. Ce qui est consommé ne revient pas.</p>
    <p class="tiny">La piste n'a pas de fin, et <b>rien n'est à vous tant que vous n'êtes pas
       rentré</b> : jetons et nombres s'entassent sur votre dos. Un <b>camp de base</b> 🏕️ barre
       le chemin toutes les ${EXP.camp} couches — c'est le seul endroit d'où l'on rentre.
       Abandonner ailleurs, ou rester bloqué devant une épreuve, c'est tout laisser sur la piste.</p>
    <div class="revChoix">
      <button class="btn big gold" id="expStart"><b>Partir</b><small>une piste sans fin</small></button>
    </div>
  </div>`;
}

function expCarteHTML(r) {
  const acces = expAccessibles(r);
  const estAcces = (c, i) => acces.some(p => p.couche === c && p.index === i);

  /* Les liens sont tracés en pourcentages : aucune mesure du DOM n'est
     nécessaire, donc rien à recalculer au redimensionnement. */
  const derniere = r.carte.length - 1;
  /* Le départ est en bas, la progression monte. Dans le SVG l'axe descend :
     y_svg = 100 − y. Les deux repères doivent rester d'accord, sinon les liens
     ne rejoignent pas les nœuds. Les coordonnées viennent de la carte
     elle-même, jamais d'un calcul refait au rendu. */
  /* Le repère se règle sur la longueur du moment. La valeur mémorisée d'un nœud
     ne bouge jamais ; c'est le diviseur qui change, et il est le même pour les
     nœuds et pour les liens — les deux restent donc superposés quand la carte
     s'allonge. La marge de 0,1 laisse la dernière couche sous le plafond. */
  const echelle = r.carte.length - 1 + 0.1;
  const pc = y => (y / echelle) * 100;

  const traits = [];
  for (let c = 0; c < derniere; c++) {
    const ici = r.carte[c], la = r.carte[c + 1];
    ici.forEach(n => {
      n.liens.forEach(j => {
        const m = la[j];
        const emprunte = r.position && r.position.couche === c + 1 && r.position.index === j;
        traits.push(`<line x1="${n.x * 100}" y1="${100 - pc(n.y)}"
                            x2="${m.x * 100}" y2="${100 - pc(m.y)}"
                      class="expLien${emprunte ? ' pris' : ''}" />`);
      });
    });
  }

  const rangees = r.carte.map((rangee, c) => {
    return rangee.map((n, i) => {
      const x = n.x * 100, y = pc(n.y);
      const ici = r.position && r.position.couche === c && r.position.index === i;
      const t = EXP_NOEUDS[n.type];
      const classes = ['expNoeud', n.type,
        ici ? 'ici' : '', n.vu ? 'vu' : '', estAcces(c, i) ? 'ouvert' : ''].filter(Boolean).join(' ');
      return `<button class="${classes}" style="left:${x}%;bottom:${y}%"
                data-couche="${c}" data-index="${i}"
                ${estAcces(c, i) ? '' : 'disabled'}
                data-nom="${t.nom}" data-desc="${t.desc}"><span>${t.emoji}</span></button>`;
    }).join('');
  }).join('');

  /* Les nœuds et le SVG vivent dans la même piste : un seul cadre, donc un
     seul repère en pourcentages. Les placer dans des conteneurs différents
     faisait diverger les liens des points qu'ils relient. */
  /* La piste grandit avec la carte : à hauteur fixe, l'écart entre deux couches
     se serait resserré à chaque pas jusqu'à les empiler. */
  const hauteur = Math.max(420, Math.round(r.carte.length * 92));

  return `<div class="expCarte">
    <div class="expPiste" style="height:${hauteur}px">
      <svg class="expLiens" viewBox="0 0 100 100" preserveAspectRatio="none">${traits.join('')}</svg>
      ${rangees}
    </div>
  </div>`;
}

/* La quantité d'un lot se lit dans un coin du jeton, pas à la suite de sa
   valeur : « 6 ×4 » se lisait comme une multiplication, dans un jeu où c'en
   est une. Un seul exemplaire n'affiche rien. */
const bulle = n => n > 1 ? `<i class="jetonNb">${n}</i>` : '';

/* La besace hors épreuve : un simple inventaire, groupé et trié. */
function expBesaceHTML(r) {
  const compte = new Map();
  r.besace.operateurs.forEach(c => compte.set(c, (compte.get(c) || 0) + 1));
  const speciaux = [...compte.entries()]
    .sort((a, b) => EXP_OPERATEURS[a[0]].nom.localeCompare(EXP_OPERATEURS[b[0]].nom))
    .map(([cle, n]) => `<span class="expJetonOp special">${EXP_OPERATEURS[cle].nom}${bulle(n)}</span>`)
    .join('') || '<span class="expVide">aucun opérateur spécial</span>';

  const parValeur = new Map();
  r.besace.nombres.forEach(n => parValeur.set(n, (parValeur.get(n) || 0) + 1));
  const nums = [...parValeur.entries()].sort((a, b) => a[0] - b[0])
    .map(([v, n]) => `<span class="expJetonNum">${fmt(v)}${bulle(n)}</span>`)
    .join('') || '<span class="expVide">besace vide</span>';

  return `<div class="expBesace">
    <div class="expBesaceLot">
      <h4>Opérateurs de base <span class="expToujours">toujours là</span></h4>
      <div class="expJetons">${EXP_BASE.map(c =>
        `<span class="expJetonOp base">${EXP_OPERATEURS[c].nom}</span>`).join('')}</div>
      <h4 class="secondTitre">Spéciaux</h4>
      <div class="expJetons">${speciaux}</div>
    </div>
    <div class="expBesaceLot">
      <h4>Nombres <span class="expToujours">${r.besace.nombres.length}</span></h4>
      <div class="expJetons">${nums}</div>
    </div>
  </div>`;
}

/* ---------- les deux haltes ----------
   Elles empruntent au Calcul rapide sa jauge et sa mise en page : un joueur qui
   connaît le mini-jeu n'a rien de neuf à apprendre en tombant sur le nœud. */
function expDefiHTML(r) {
  const d = r.defi;
  return d.type === 'calcul' ? expDefiCalculHTML(d) : expDefiRevisionHTML(d);
}

function expDefiCalculHTML(d) {
  const perles = [];
  for (let i = 0; i < EXP.defiCalculs; i++) {
    const h = d.historique[i];
    perles.push(`<i class="${!h ? (i === d.manche - 1 ? 'encours' : 'avenir')
                              : h.juste ? 'bon' : 'rate'}"></i>`);
  }
  const dernier = d.historique[d.historique.length - 1];
  return `<div class="expDefi calcZone">
    <div class="expDefiTitre">⚡ Poste de calcul</div>
    <p class="expDefiAide">Trois calculs d'affilée, ${CALC.duree / 1000} secondes chacun.
      Une estimation à moins de ${Math.round(CALC.tolerance * 100)} % suffit —
      mais <b>une seule erreur ferme la halte</b>.</p>

    <div class="calcChapelet">${perles.join('')}</div>
    <div class="calcExpr">${calcTexte(d.expr)} =</div>
    <div class="calcBarre"><i id="expCalcJauge"></i></div>
    <div class="calcSaisie">
      <input type="number" id="expCalcInput" inputmode="numeric" autocomplete="off"
             placeholder="…" aria-label="Votre réponse">
      <button class="btn" id="expCalcValider">Valider</button>
    </div>
    ${dernier ? `<p class="calcRetour ${dernier.juste ? 'bon' : 'rate'}">${dernier.texte} =
      <b>${fmt(dernier.vrai)}</b> — ${dernier.donnee === null ? 'pas de réponse'
        : dernier.juste ? 'juste' : `${fmt(dernier.donnee)}, ${Math.round(dernier.ecart * 100)} % d'écart`}</p>` : ''}
  </div>`;
}

function expDefiRevisionHTML(d) {
  return `<div class="expDefi">
    <div class="expDefiTitre">📖 Halte d'étude</div>
    <p class="expDefiAide">Laquelle de ces définitions est celle du trait
      <b>${TRAIT_BY_ID[d.traitId].emoji} ${TRAIT_BY_ID[d.traitId].label}</b> ?</p>
    <div class="expChoix">
      ${d.choix.map(id => `<button class="expChoixItem" data-trait="${id}">${
        defMasquee(TRAIT_BY_ID[id])}</button>`).join('')}
    </div>
  </div>`;
}

/* ---------- le dépôt ----------
   La case qui juge. Vide, elle attend ; occupée, elle est rouge — un nombre qui
   convenait n'y resterait pas, l'épreuve serait déjà levée. */
function expDepotHTML(e) {
  const j = e.depot ? expJeton(e, e.depot) : null;
  return `<span class="expDepotBloc">
    <span class="expDepotNom">Dépôt</span>
    <span class="gCell expDepot ${j ? 'pose refuse' : 'trou'}" data-depot="1"
          title="${j ? 'Ce nombre ne satisfait pas la contrainte — cliquez pour le reprendre'
                     : 'Déposez ici le nombre fabriqué'}">${j ? fmt(j.val) : ''}</span>
  </span>`;
}

/* ---------- l'établi ----------
   Les classes reprennent celles de la Forge : mêmes lignes, mêmes cases, mêmes
   jetons. Un joueur qui a forgé sait déjà s'en servir. */
function expEtabliHTML(r) {
  const e = r.epreuve;

  const cases = (l, i) => {
    const op = l.op ? EXP_OPERATEURS[l.op] : null;
    const cell = (emplacement) => {
      const id = l[emplacement];
      const j = id ? expJeton(e, id) : null;
      return `<span class="gCell ${j ? 'pose' : 'trou'}" data-ligne="${i}" data-emp="${emplacement}"
                title="${j ? 'Cliquez pour retirer' : 'Déposez un nombre'}">${j ? fmt(j.val) : ''}</span>`;
    };
    const opCell = `<span class="gCell op ${l.op ? 'pose' : 'trou'}${op && EXP_BASE.includes(op.cle) ? ' base' : ''}" data-ligne="${i}" data-emp="op"
                      title="Cliquez pour faire défiler + − × ÷ ‖, ou déposez un spécial">${op ? op.nom : ''}</span>`;

    /* Un opérateur spécial est unaire : la ligne n'a alors qu'une seule case.
       C'est la seconde forme de ligne, que la Forge n'avait pas. */
    return (op && !op.binaire)
      ? `${opCell}${cell('a')}`
      : `${cell('a')}${opCell}${cell('b')}`;
  };

  const lignes = e.lignes.map((l, i) => {
    const val = expLigneResultat(e, l);
    /* La ligne ne dit plus si son résultat gagne. C'est au dépôt de juger, et
       une pastille verte sur la bonne ligne aurait fait du dépôt une
       formalité : le joueur n'aurait plus eu à lire la contrainte. */
    const vierge = !l.op && !l.a && !l.b;
    /* Une ligne unaire n'a que cinq enfants au lieu de six : la grille du
       téléphone, qui place chaque case par son rang, a besoin de le savoir. */
    const unaire = l.op && !EXP_OPERATEURS[l.op].binaire;
    return `<div class="gLigne${vierge ? ' vierge' : ''}${unaire ? ' unaire' : ''}">
      <span class="gNum">${i + 1}</span>
      ${cases(l, i)}
      <span class="gEgal">=</span>
      <span class="gCell resultat">${val === null ? '?' : fmt(val)}</span>
    </div>`;
  }).join('');

  /* Les jetons identiques se rangent en pile plutôt que de s'aligner en
     doublons : quinze nombres dont quatre 6 tenaient sur deux rangs pour rien.
     Le lot porte l'identifiant d'un de ses exemplaires — le prochain rendu
     regroupe ce qui reste. */
  const lots = new Map();
  for (const j of expJetonsLibres(e)) {
    const derive = j.ligne !== undefined;
    const cle = (derive ? 'd' : 'b') + ':' + j.val;
    if (!lots.has(cle)) lots.set(cle, { val: j.val, derive, ids: [], sources: [] });
    const lot = lots.get(cle);
    lot.ids.push(j.id);
    if (derive) lot.sources.push(j.ligne + 1);
  }
  const jetonsNum = [...lots.values()]
    .sort((a, b) => (a.derive - b.derive) || (a.val - b.val))
    .map(lot => {
      const source = lot.derive
        ? 'produit par la ligne ' + lot.sources.join(', ')
        : 'de la besace';
      return `<span class="jeton${lot.derive ? ' derive' : ''}" draggable="true"
         data-jeton="${lot.ids[0]}" title="${source}">${fmt(lot.val)}${bulle(lot.ids.length)}</span>`;
    }).join('') || '<span class="expVide">plus aucun jeton libre</span>';

  const compte = new Map();
  r.besace.operateurs.forEach(c => compte.set(c, (compte.get(c) || 0) + 1));
  const jetonsBase = EXP_BASE
    .map(c => `<span class="jeton op" draggable="true" data-op="${c}">${EXP_OPERATEURS[c].nom}</span>`)
    .join('');
  /* Les spéciaux ont leur propre rang : mélangés aux cinq signes de base, on ne
     voyait plus lesquels étaient gratuits et lesquels se dépensaient. */
  const jetonsSpec = [...compte.entries()]
    .sort((a, b) => EXP_OPERATEURS[a[0]].nom.localeCompare(EXP_OPERATEURS[b[0]].nom))
    .map(([c, n]) => `<span class="jeton op speciale" draggable="true" data-op="${c}"
       title="${EXP_OPERATEURS[c].nom} — se consomme">${EXP_OPERATEURS[c].nom}${bulle(n)}</span>`)
    .join('') || '<span class="expVide">aucun opérateur spécial</span>';

  return `<div class="expEtabli">
    <div class="guide">${lignes}</div>
    <div class="expReserve">
      <h4>Nombres</h4><div class="jetons">${jetonsNum}</div>
      <h4 class="secondTitre">Opérateurs de base <span class="expToujours">gratuits</span></h4>
      <div class="jetons">${jetonsBase}</div>
      <h4 class="secondTitre">Spéciaux <span class="expToujours">consommés</span></h4>
      <div class="jetons speciaux">${jetonsSpec}</div>
    </div>
  </div>`;
}

function expHTML(r) {
  const e = r.epreuve;
  /* Le camp se lit dans un bandeau, pas dans une modale : le joueur doit
     pouvoir peser sa décision en regardant la carte qui l'attend juste en
     dessous. Il peut aussi bien repartir sans rien décider — dans ce cas le
     camp est simplement passé, et la récolte reste en jeu. */
  const camp = expSurCamp(r) ? `<div class="expCamp">
      <span class="expCampTitre">🏕️ Camp de base</span>
      <span class="expCampAide">Le seul endroit d'où l'on rentre. Continuer fait grossir
        la récolte — et la remet entière en jeu.</span>
      <button class="btn gold sm" id="expRentrer">Rentrer avec la récolte</button>
    </div>` : '';

  return `<div class="expZone">
    <div class="expTete">
      <div class="expScore">
        <span>Couche <b>${r.position ? r.position.couche + 1 : 0}</b></span>
        <span title="Rien n'est acquis avant d'être rentré au camp.">En jeu
          <b class="expPrime">${fmt(r.jetons)}</b> 🪙 · <b class="expPrime">${r.nombres.length}</b>
          nombre${r.nombres.length > 1 ? 's' : ''}</span>
      </div>
    </div>

    ${camp}

    ${r.defi ? expDefiHTML(r) : e ? `<div class="expEpreuve">
        <span class="expEpreuveTitre">🎯 ${e.texte}</span>
        <span class="expEpreuveAide" id="expEtat">Fabriquez un nombre sur les lignes, puis déposez-le ici.</span>
        ${expDepotHTML(e)}
      </div>
      ${expEtabliHTML(r)}`
     : `${expBesaceHTML(r)}${expCarteHTML(r)}`}

    <div class="expPied">
      <button class="btn ghost sm" id="expReplier"
              title="Tout ce qui a été ramassé sera perdu : on ne rentre qu'à un camp de base.">Abandonner</button>
    </div>
  </div>`;
}

/* « 405 🪙 et 0 nombre » se lisait mal : on ne cite que ce qui existe. */
function expButin(b) {
  const n = b.nombres && b.nombres.length !== undefined ? b.nombres.length : (b.nombres || 0);
  const bouts = [];
  if (b.jetons) bouts.push(`${fmt(b.jetons)} 🪙`);
  if (n) bouts.push(`${n} nombre${n > 1 ? 's' : ''}`);
  return bouts.join(' et ') || 'rien';
}

function expBilanHTML(r) {
  const atteint = r.position ? r.position.couche + 1 : 0;
  const record = state.stats.meilleureCouche || 0;
  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">${atteint >= 20 ? '🏆' : atteint >= 10 ? '🗺️' : '🥾'}</div>
    <h3>Couche ${atteint}${record > atteint ? ` · record ${record}` : ''}</h3>
    <p>${r.cause}</p>
    ${r.cartes.length || r.jetons
      ? `<p class="calcGain">+${fmt(r.jetons)} 🪙${r.cartes.length
          ? ` · ${r.cartes.length} carte${r.cartes.length > 1 ? 's' : ''}` : ''}</p>`
      /* Dire ce qu'on a laissé sur la piste fait partie de la leçon : sans ce
         chiffre, le joueur ne saurait pas ce que rentrer lui aurait valu. */
      : `<p class="calcGain perdu">Rien de rapporté${r.perdu && (r.perdu.jetons || r.perdu.nombres)
          ? ` — ${expButin(r.perdu)} laissés sur la piste` : ''}</p>`}
    <div class="revChoix">
      ${r.cartes.length ? `<button class="btn big gold" id="expOuvrir"><b>Ouvrir la récolte</b><small>${r.cartes.length} carte${r.cartes.length > 1 ? 's' : ''}</small></button>` : ''}
      <button class="btn big" id="expStart"><b>Repartir</b><small>nouvelle carte</small></button>
      <button class="btn ghost" id="expQuitter"><b>Quitter</b><small>revenir au choix du jeu</small></button>
    </div>
  </div>`;
}

/* Jeton pris en main : par glissement, ou par un premier clic. */
let _expPris = null;

/* ---------- l'infobulle des nœuds ----------
   Un seul élément, posé sur la page et non dans la carte : la piste est trois
   fois plus haute que son cadre, et une bulle dessinée à l'intérieur se serait
   fait couper au premier nœud proche d'un bord. Elle bascule au-dessus ou en
   dessous selon la place, et sa flèche suit le nœud même quand la bulle a dû
   se recaler contre le bord de l'écran. */
let _expTip = null;

function expCablerInfobulle() {
  const noeuds = $$('#revZone .expNoeud');
  if (!noeuds.length) return;

  if (!_expTip) {
    _expTip = document.createElement('div');
    _expTip.className = 'expTip';
    _expTip.setAttribute('role', 'tooltip');
    document.body.appendChild(_expTip);
    /* Une seule fois : cette fonction est rappelée à chaque rendu de la carte,
       et un écouteur de plus par rendu finirait par coûter cher. */
    window.addEventListener('scroll', () => _expTip.classList.remove('on'), { passive: true });
  }
  const tip = _expTip;
  let cible = null;

  const cacher = () => { cible = null; tip.classList.remove('on'); };

  const placer = () => {
    if (!cible || !cible.isConnected) return cacher();
    const n = cible.getBoundingClientRect();
    // Hors du cadre visible de la carte, le nœud n'est plus là où on le montre.
    const cadre = cible.closest('.expCarte');
    if (cadre) {
      const c = cadre.getBoundingClientRect();
      if (n.bottom < c.top + 4 || n.top > c.bottom - 4) return cacher();
    }
    const t = tip.getBoundingClientRect();
    const dessous = n.top - t.height - 12 < 8;
    tip.classList.toggle('dessus', !dessous);
    tip.classList.toggle('dessous', dessous);
    tip.style.top = (dessous ? n.bottom + 12 : n.top - t.height - 12) + 'px';

    const centre = n.left + n.width / 2;
    const x = Math.min(Math.max(centre - t.width / 2, 8), window.innerWidth - t.width - 8);
    tip.style.left = x + 'px';
    tip.style.setProperty('--fleche', (centre - x) + 'px');
  };

  const montrer = el => {
    cible = el;
    /* Le nom et la description sont posés en texte : ils viennent de EXP_NOEUDS,
       mais la règle vaut partout — rien n'entre dans une page par innerHTML. */
    tip.textContent = '';
    const nom = document.createElement('b');
    nom.textContent = el.dataset.nom;
    tip.append(nom, document.createTextNode(' — ' + el.dataset.desc));
    tip.classList.add('on');
    placer();
  };

  noeuds.forEach(el => {
    el.addEventListener('pointerenter', () => montrer(el));
    el.addEventListener('pointerleave', cacher);
    el.addEventListener('focus', () => montrer(el));
    el.addEventListener('blur', cacher);
  });

  tip.classList.remove('on');
  // Ce cadre-ci est neuf à chaque rendu : son écouteur part avec lui.
  const cadre = $('#revZone .expCarte');
  if (cadre) cadre.addEventListener('scroll', placer, { passive: true });
}

/* ---------- le chronomètre du poste de calcul ----------
   Il vit hors de la sauvegarde, comme celui du mini-jeu : un décompte
   enregistré puis rechargé trois jours plus tard ne veut rien dire. */
let _expMinuteur = null, _expAnim = null;

function expChronoArreter() {
  clearTimeout(_expMinuteur); _expMinuteur = null;
  cancelAnimationFrame(_expAnim); _expAnim = null;
}

function expChronoLancer() {
  expChronoArreter();
  const r = state.revision;
  const d = r && r.defi;
  if (!d || d.type !== 'calcul' || d.fini) return;

  /* Les deux mêmes gardes que le mini-jeu. renderAll() rejoue tous les rendus à
     chaque changement d'onglet : sans ce test, le décompte repartirait pendant
     que le joueur consulte sa Collection, et il perdrait la manche sans l'avoir
     eue à l'écran. Idem pour l'onglet du navigateur. */
  const section = document.querySelector('#tab-minijeux');
  if (!section || !section.classList.contains('on')) return;
  if (document.visibilityState !== 'visible') return;

  d.debut = Date.now();
  const jauge = $('#expCalcJauge');
  const suivre = () => {
    const reste = Math.max(0, CALC.duree - (Date.now() - d.debut));
    if (jauge) jauge.style.width = (100 * reste / CALC.duree) + '%';
    if (reste > 0) _expAnim = requestAnimationFrame(suivre);
  };
  suivre();
  _expMinuteur = setTimeout(() => expSoumettreCalcul(), CALC.duree);
}

/* Revenir sur la page relance la manche entière : punir une interruption qu'on
   n'a pas choisie serait pire que la légère indulgence que cela accorde. */
document.addEventListener('visibilitychange', () => {
  const r = state && state.revision;
  if (!r || r.mode !== 'expedition' || !r.defi) return;
  if (document.visibilityState === 'visible') expChronoLancer(); else expChronoArreter();
});

/* Une seule porte de sortie pour une manche : Entrée, le bouton et le temps
   écoulé passent tous par ici. */
function expSoumettreCalcul() {
  const r = state.revision;
  if (!r || !r.defi || r.defi.type !== 'calcul' || r.defi.fini) return;
  expChronoArreter();
  const champ = $('#expCalcInput');
  const saisi = champ ? champ.value.trim() : '';
  const bilan = expCalculRepondre(saisi === '' ? null : Number(saisi));
  save(); renderRevision(); renderWallet();
  expAnnoncerDefi(bilan);
}

function expAnnoncerDefi(bilan) {
  if (!bilan || !bilan.defiFini) return;
  if (bilan.gagne) {
    toast(`✅ Halte réussie — <b>+${fmt(bilan.jetons)}</b> 🪙 et <b>${fmt(bilan.nombre)}</b> dans la récolte.`, 'good');
  } else {
    toast(bilan.type === 'calcul'
      ? '⚡ Calcul manqué — la halte se referme, vous repartez les mains vides.'
      : '📖 Mauvaise définition — vous repartez les mains vides.', 'bad');
  }
}

function cablerDefi() {
  const r = state.revision;
  const d = r && r.defi;
  if (!d) { expChronoArreter(); return; }

  if (d.type === 'calcul') {
    const champ = $('#expCalcInput');
    const bouton = $('#expCalcValider');
    if (bouton) bouton.addEventListener('click', expSoumettreCalcul);
    if (champ) {
      champ.addEventListener('keydown', ev => { if (ev.key === 'Enter') expSoumettreCalcul(); });
      champ.focus();
    }
    expChronoLancer();
    return;
  }

  $$('#revZone .expChoixItem').forEach(el => el.addEventListener('click', () => {
    const bilan = expRevisionRepondre(el.dataset.trait);
    save(); renderRevision(); renderWallet();
    expAnnoncerDefi(bilan);
  }));
}

function cablerExpedition() {
  const b = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  const dire = t => { const el = $('#expEtat'); if (el) el.textContent = t; };

  b('#expStart', () => { _expPris = null; expDemarrer(); save(); renderRevision(); });
  b('#expQuitter', () => { _expPris = null; quitterExpedition(); save(); renderRevision(); });
  b('#expRentrer', () => {
    _expPris = null;
    const bilan = expRentrer();
    save(); renderRevision(); renderWallet();
    if (bilan) toast(`🏕️ Rentré au camp — <b>+${fmt(bilan.jetons)}</b> 🪙 et ${bilan.nombres} nombre${bilan.nombres > 1 ? 's' : ''}.`, 'gold');
  });

  /* Abandonner coûte toute la récolte. Un deuxième clic est donc demandé, et il
     dit précisément ce qu'il jette : il n'y a pas d'annulation possible une
     fois la course close. */
  b('#expReplier', ev => {
    const bouton = ev.currentTarget;
    if (bouton.dataset.confirme !== 'oui') {
      bouton.dataset.confirme = 'oui';
      bouton.classList.add('danger');
      const r = state.revision;
      bouton.textContent = (r && (r.jetons || r.nombres.length))
        ? `Confirmer — ${expButin(r)} perdus`
        : 'Confirmer l’abandon';
      setTimeout(() => {
        if (!bouton.isConnected) return;
        bouton.dataset.confirme = '';
        bouton.classList.remove('danger');
        bouton.textContent = 'Abandonner';
      }, 4000);
      return;
    }
    _expPris = null; expReplier(); save(); renderRevision();
  });
  b('#expOuvrir', () => {
    const r = state.revision;
    if (r && r.cartes.length) showReveal(r.cartes, `Récolte — couche ${r.position ? r.position.couche + 1 : 0}`);
  });

  $$('#revZone .expNoeud[data-couche]').forEach(el => el.addEventListener('click', () => {
    const rec = expEntrer(+el.dataset.couche, +el.dataset.index);
    save(); renderRevision(); renderWallet();
    if (!rec) return;
    if (rec.defi) return;                       // la halte parle d'elle-même à l'écran
    if (rec.epreuveLevee) toast('✅ Épreuve levée d’emblée.', 'good');
    else if (rec.nombres.length) toast(`🔢 ${rec.nombres.map(fmt).join(' · ')} dans la besace.`, 'good');
    else if (rec.operateurs.length) toast(`⚙️ ${rec.operateurs.map(o => EXP_OPERATEURS[o].nom).join(' · ')} récupéré.`, 'good');
    else if (rec.nombre !== undefined && rec.nombre !== null)
      toast(`🎴 <b>${fmt(rec.nombre)}</b> rejoint la récolte — à confirmer au camp.`, 'gold');
  }));

  expCablerInfobulle();

  /* La carte suit le joueur : sans ce recentrage, une piste plus haute que son
     cadre laisserait le nœud courant hors de vue après quelques pas. */
  const carte = $('#revZone .expCarte');
  const ici = $('#revZone .expNoeud.ici') || $('#revZone .expNoeud.ouvert');
  if (carte && ici) carte.scrollTop = Math.max(0, ici.offsetTop - carte.clientHeight / 2 + ici.offsetHeight / 2);

  // ---------- l'établi ----------
  const prendre = el => {
    _expPris = el.dataset.jeton ? { jeton: el.dataset.jeton } : { op: el.dataset.op };
    $$('#revZone .jeton').forEach(x => x.classList.toggle('drag', x === el));
  };

  /* Glissement et clic-clic cohabitent : le premier n'existe pas au doigt, le
     second sert aussi de repli quand le glissement rate. */
  $$('#revZone .jeton').forEach(el => {
    el.addEventListener('dragstart', ev => { prendre(el); ev.dataTransfer.setData('text/plain', 'x'); });
    el.addEventListener('dragend', () => $$('#revZone .jeton').forEach(x => x.classList.remove('drag')));
    el.addEventListener('click', () => { prendre(el); dire('Déposez-le sur une case.'); });
  });

  cablerDefi();

  /* Le dépôt accepte les mêmes gestes que les cases de ligne : on y glisse un
     jeton, ou on le prend d'un clic puis on clique la case. */
  const depot = $('#revZone .expDepot');
  if (depot) {
    const deposer = () => {
      if (depot.classList.contains('pose') && !_expPris) { expReprendre(); save(); renderRevision(); return; }
      if (!_expPris) return dire('Prenez d’abord un nombre fabriqué.');
      if (!_expPris.jeton) return dire('Le dépôt attend un nombre, pas un opérateur.');
      const res = expDeposer(_expPris.jeton);
      _expPris = null;
      if (res && res.erreur) { renderRevision(); return dire(res.erreur); }
      save(); renderRevision(); renderWallet();
      if (res && res.epreuveLevee) toast(`✅ Épreuve levée — <b>${fmt(res.nombre)}</b> dans la récolte.`, 'good');
      else if (res && res.echec) toast('Plus rien à assembler : l’expédition s’arrête ici.', 'bad');
      else if (res && res.refuse !== undefined) dire(`${fmt(res.refuse)} ne satisfait pas la contrainte. Reprenez-le et fabriquez autre chose.`);
    };
    depot.addEventListener('dragover', ev => { ev.preventDefault(); depot.classList.add('survol'); });
    depot.addEventListener('dragleave', () => depot.classList.remove('survol'));
    depot.addEventListener('drop', ev => { ev.preventDefault(); depot.classList.remove('survol'); deposer(); });
    depot.addEventListener('click', deposer);
  }

  $$('#revZone .gCell[data-ligne]').forEach(el => {
    const poser = () => {
      if (!_expPris) return dire('Prenez d’abord un jeton.');
      const emp = el.dataset.emp;
      const id = emp === 'op' ? _expPris.op : _expPris.jeton;
      if (!id) return dire(emp === 'op' ? 'Cette case attend un opérateur.' : 'Cette case attend un nombre.');
      const res = expPoser(+el.dataset.ligne, emp, id);
      _expPris = null;
      if (res && res.erreur) { renderRevision(); return dire(res.erreur); }
      save(); renderRevision(); renderWallet();
      if (res && res.epreuveLevee) toast(`✅ Épreuve levée — <b>${fmt(res.nombre)}</b> dans la récolte.`, 'good');
      else if (res && res.echec) toast('Plus rien à assembler : l’expédition s’arrête ici.', 'bad');
    };
    el.addEventListener('dragover', ev => { ev.preventDefault(); el.classList.add('survol'); });
    el.addEventListener('dragleave', () => el.classList.remove('survol'));
    el.addEventListener('drop', ev => { ev.preventDefault(); el.classList.remove('survol'); poser(); });
    el.addEventListener('click', () => {
      // Case d'opérateur, main vide : on fait tourner les usuels.
      if (el.dataset.emp === 'op' && !_expPris) {
        const res = expBasculerOp(+el.dataset.ligne);
        save(); renderRevision(); renderWallet();
        if (res && res.echec) toast('Plus rien à assembler : l’expédition s’arrête ici.', 'bad');
        return;
      }
      if (el.classList.contains('pose') && !_expPris) {
        expRetirer(+el.dataset.ligne, el.dataset.emp);
        save(); renderRevision();
        return;
      }
      poser();
    });
  });
}
