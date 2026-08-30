/* ============================================================
   LA FORGE — Le Compte est Bon.

   Le gacha règne sur 1 → 9 999 : c'est le domaine de la chance.
   La Forge règne sur le reste — 0, et 10 000 → 99 999 : c'est le
   domaine de l'adresse. On n'y choisit pas ce qu'on fabrique.
   La Forge tire une main dans votre collection, annonce une cible,
   et vous laisse chercher.

   Principe de génération : on ne tire PAS une cible au hasard en
   espérant qu'elle soit atteignable. On explore d'abord tout ce que
   la main peut produire, puis on choisit la cible là-dedans. Une
   commande est donc toujours soluble, par construction.
   ============================================================ */

const FORGE_MIN  = 10000;      // en dessous, c'est le territoire du gacha
const HAND_SIZE  = 6;
const MIN_COLLEC = 15;         // en dessous, la main serait dégénérée

/* Une valeur est forgeable si le tirage ne peut pas la donner. */
const forgeable = v => Number.isInteger(v) && (v === 0 || (v >= FORGE_MIN && v <= FORGE_MAX));

/* Plafond de valeurs conservées par sous-ensemble, indexé sur le nombre de
   pièces. Sans ça, l'exploration d'une main de six explose : deux moitiés de
   2 000 valeurs feraient 40 millions de combinaisons. */
const CAP = [1, 1, 24, 200, 700, 1200, 1600];
const popcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

/* ---------- exploration exhaustive d'une main ----------
   Programmation dynamique sur les sous-ensembles : pour chaque sous-ensemble
   de pièces, l'ensemble des valeurs qu'il peut produire. On mémorise d'où
   vient chaque valeur, ce qui rend la reconstruction d'une solution immédiate
   — c'est ce qui alimente les indices. */
function explorer(main) {
  const n = main.length;
  const table = new Array(1 << n);

  for (let i = 0; i < n; i++) table[1 << i] = new Map([[main[i], null]]);

  for (let m = 1; m < (1 << n); m++) {
    if (table[m]) continue;
    const map = new Map();
    const cap = CAP[popcount(m)] || 1600;

    for (let sub = (m - 1) & m; sub > 0; sub = (sub - 1) & m) {
      const oth = m ^ sub;
      if (sub > oth) continue;                 // chaque découpe une seule fois
      const A = table[sub], B = table[oth];
      if (!A || !B) continue;

      for (const a of A.keys()) {
        for (const b of B.keys()) {
          for (const op of OPS_BASE) {
            const ordres = op.comm ? [[a, b, sub, oth]] : [[a, b, sub, oth], [b, a, oth, sub]];
            for (const [x, y, sx, sy] of ordres) {
              const v = op.fn(x, y);
              if (v === null || !Number.isInteger(v) || v < 0 || v > FORGE_MAX) continue;
              if (!map.has(v)) map.set(v, { op: op.id, x, y, sx, sy });
            }
          }
        }
        if (map.size >= cap) break;
      }
      if (map.size >= cap) break;
    }
    table[m] = map;
  }
  return table;
}

/* Reconstruit la suite d'opérations qui mène à `value`. */
function chemin(table, mask, value) {
  const src = table[mask].get(value);
  if (!src) return [];
  const op = OPS_BASE.find(o => o.id === src.op);
  return [
    ...chemin(table, src.sx, src.x),
    ...chemin(table, src.sy, src.y),
    { a: src.x, b: src.y, opId: op.id, sym: op.sym, res: value },
  ];
}

/* ---------- génération d'une commande ---------- */
function tirerMain() {
  const pool = Object.keys(state.owned).map(Number).filter(n => n >= 1 && n <= POOL_MAX);
  const main = [];
  const pris = new Set();
  // On force un peu de variété d'échelle : sans ça, six nombres à quatre
  // chiffres ne produisent presque rien d'atteignable.
  const petits = pool.filter(n => n < 100);
  const moyens = pool.filter(n => n >= 100 && n < 1000);
  const grands = pool.filter(n => n >= 1000);
  const pioche = (arr, k) => {
    for (let i = 0; i < k && arr.length; i++) {
      let v, garde = 0;
      do { v = arr[(Math.random() * arr.length) | 0]; } while (pris.has(v) && ++garde < 30);
      if (!pris.has(v)) { pris.add(v); main.push(v); }
    }
  };
  pioche(petits, 2); pioche(moyens, 2); pioche(grands, 2);
  pioche(pool, HAND_SIZE - main.length);            // complète si une catégorie manquait
  return main.sort((a, b) => a - b);
}

/* Choisit la cible parmi tout ce que la main peut atteindre, en privilégiant
   la rareté : la Forge a elle aussi ses coups d'éclat. */
function choisirCible(table, n) {
  const parRarete = {};
  RARITIES.forEach(r => parRarete[r.key] = []);
  const vus = new Set();

  for (let m = 1; m < (1 << n); m++) {
    if (!table[m]) continue;
    for (const v of table[m].keys()) {
      if (!forgeable(v) || vus.has(v)) continue;
      vus.add(v);
      parRarete[evaluate(v).rarity.key].push({ v, m });
    }
  }

  // Un nombre déjà possédé ne fait pas une commande intéressante.
  for (const k of Object.keys(parRarete)) {
    const inedits = parRarete[k].filter(c => !state.owned[c.v]);
    if (inedits.length) parRarete[k] = inedits;
  }

  const total = Object.values(parRarete).reduce((a, l) => a + l.length, 0);
  if (!total) return null;

  // Mêmes cotes que le gacha, en retombant d'un palier quand il est vide.
  let r = Math.random(), choisi = null;
  for (const [key, p] of PULL_ODDS) { if (r < p) { choisi = key; break; } r -= p; }
  let i = choisi ? RARITY_BY_KEY[choisi].idx : 0;
  while (i >= 0 && !parRarete[RARITIES[i].key].length) i--;
  if (i < 0) { i = 0; while (i < RARITIES.length && !parRarete[RARITIES[i].key].length) i++; }

  const liste = parRarete[RARITIES[i].key];
  return liste[(Math.random() * liste.length) | 0];
}

/* ---------- la commande en cours ---------- */
function nouvelleCommande() {
  if (uniqueCount(state) < MIN_COLLEC)
    return { error: `La Forge a besoin d'au moins ${MIN_COLLEC} nombres différents pour composer une main. Vous en avez ${uniqueCount(state)}.` };

  for (let essai = 0; essai < 8; essai++) {
    const main = tirerMain();
    if (main.length < 2) break;
    const table = explorer(main);
    const c = choisirCible(table, main.length);
    if (!c) continue;

    state.commande = {
      cible: c.v,
      main,
      pieces: main.map((val, i) => ({ id: i, val, vivante: true })),
      etapes: [],
      indices: 0,
      repioches: 0,
      debut: Date.now(),
      fini: false,
    };
    creerGuide();                    // la grille a trous est le mode par defaut
    return state.commande;
  }
  return { error: "La Forge n'a rien trouvé d'atteignable avec votre collection. Élargissez-la et revenez." };
}

const cmd = () => state.commande;
const piecesVivantes = () => cmd() ? cmd().pieces.filter(p => p.vivante) : [];
const cibleAtteinte = () => cmd() && piecesVivantes().some(p => p.val === cmd().cible);

/* Applique une opération sur une ou deux pièces du plan de travail. */
function appliquer(opId, idA, idB) {
  const c = cmd();
  if (!c || c.fini) return { error: "Aucune commande en cours." };

  const op = [...OPS_BASE, ...OPS_OUTILS].find(o => o.id === opId);
  if (!op) return { error: "Opérateur inconnu." };
  if (op.unlock && uniqueCount(state) < op.unlock)
    return { error: `${op.nom} — verrouillé (${op.unlock} nombres différents requis).` };

  const A = c.pieces.find(p => p.id === idA && p.vivante);
  if (!A) return { error: "Pièce introuvable." };
  const B = op.arity === 1 ? null : c.pieces.find(p => p.id === idB && p.vivante);
  if (op.arity === 2 && !B) return { error: "Il faut deux pièces." };
  if (op.arity === 2 && A === B) return { error: "Choisissez deux pièces différentes." };

  let v;
  try { v = op.arity === 1 ? op.fn(A.val) : op.fn(A.val, B.val); }
  catch { return { error: "Calcul impossible." }; }

  if (v === null) return { error: op.refus || "Cette opération ne donne rien d'utilisable." };
  if (!Number.isInteger(v) || !Number.isFinite(v)) return { error: "Le résultat doit être un entier." };
  if (v < 0) return { error: "Pas de nombres négatifs sur l'établi." };
  if (v > FORGE_MAX) return { error: `${v.toLocaleString('fr-FR')} dépasse le plafond de ${FORGE_MAX.toLocaleString('fr-FR')}.` };

  A.vivante = false;
  if (B) B.vivante = false;
  const piece = { id: c.pieces.length, val: v, vivante: true };
  c.pieces.push(piece);
  c.etapes.push({ opId, sym: op.sym, arity: op.arity, a: A.val, b: B ? B.val : null, res: v, idA, idB: B ? idB : null, idRes: piece.id });

  return { piece, gagne: v === c.cible };
}

function annuler() {
  const c = cmd();
  if (!c || !c.etapes.length) return false;
  const e = c.etapes.pop();
  c.pieces = c.pieces.filter(p => p.id !== e.idRes);
  const A = c.pieces.find(p => p.id === e.idA); if (A) A.vivante = true;
  if (e.idB !== null) { const B = c.pieces.find(p => p.id === e.idB); if (B) B.vivante = true; }
  c.fini = false;
  return true;
}

function recommencer() {
  const c = cmd();
  if (!c) return;
  c.pieces = c.main.map((val, i) => ({ id: i, val, vivante: true }));
  c.etapes = [];
  c.fini = false;
}

/* ---------- aides, payées en poussière ---------- */
const BASE_REPIOCHE = 250;
const BASE_INDICE   = 600;
/* Les théorèmes qui réduisaient le coût de forge s'appliquent désormais aux
   aides : forger est gratuit, seul le secours se paie. */
const coutAide = base => Math.max(20, Math.round(base * (1 - bonuses().forgeDiscount)));
const COUT_REPIOCHE = () => coutAide(BASE_REPIOCHE);
const COUT_INDICE   = () => coutAide(BASE_INDICE);

function repiocher() {
  const c = cmd();
  if (!c) return { error: "Aucune commande en cours." };
  const prix = COUT_REPIOCHE();
  if (state.dust < prix) return { error: `Pas assez de poussière — il en faut ${prix}.` };

  // On garde la cible et on cherche une nouvelle main capable de l'atteindre.
  for (let essai = 0; essai < 25; essai++) {
    const main = tirerMain();
    const table = explorer(main);
    const masque = trouverMasque(table, main.length, c.cible);
    if (masque === null) continue;
    state.dust -= prix;
    c.main = main;
    c.pieces = main.map((val, i) => ({ id: i, val, vivante: true }));
    c.etapes = [];
    c.repioches++;
    return { main };
  }
  return { error: "Aucune autre main de votre collection n'atteint cette cible." };
}

function trouverMasque(table, n, cible) {
  for (let m = 1; m < (1 << n); m++) if (table[m] && table[m].has(cible)) return m;
  return null;
}

/* L'indice révèle la prochaine étape d'une solution valide, calculée depuis la
   main d'origine — il faut donc que l'établi soit dans son état initial. */
function indice() {
  const c = cmd();
  if (!c) return { error: "Aucune commande en cours." };
  const prix = COUT_INDICE();
  if (state.dust < prix) return { error: `Pas assez de poussière — il en faut ${prix}.` };
  if (c.etapes.length) return { error: "L'indice se lit sur la main d'origine. Recommencez d'abord.", besoinReset: true };

  const table = explorer(c.main);
  const masque = trouverMasque(table, c.main.length, c.cible);
  if (masque === null) return { error: "Solution introuvable — signalez ce bug." };

  const pas = chemin(table, masque, c.cible);
  const n = Math.min(c.indices, pas.length - 1);
  state.dust -= prix;
  c.indices++;
  return { pas: pas[n], rang: n + 1, total: pas.length };
}

/* ============================================================
   MODE GUIDÉ — la grille à trous. C'est le mode par défaut.

   La grille annonce combien d'étapes prend une solution, et révèle
   quelques cases en guise de prises : un opérateur ici, un objectif
   intermédiaire là. Tout le reste est à trouver.

   La banque de jetons ne contient PAS les réponses : elle commence
   avec les six pièces de la main, et chaque ligne complétée y ajoute
   son propre résultat — celui que VOUS avez produit. Poser les
   mauvais opérandes fabrique donc un jeton parfaitement valide mais
   parfaitement inutile, qu'il faudra défaire.
   ============================================================ */

const TAUX_INDICES = 0.4;
const melanger = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const frFR = n => n.toLocaleString('fr-FR');

/* Les outils binaires débloqués s'invitent dans la grille : jamais nécessaires,
   mais ils ouvrent des routes que la solution de référence n'emprunte pas. */
const opsGuide = () => [...OPS_BASE, ...OPS_OUTILS.filter(o => o.arity === 2 && uniqueCount(state) >= o.unlock)];

function creerGuide() {
  const c = cmd();
  if (!c) return { error: "Aucune commande en cours." };
  if (c.guide) return c.guide;

  const table = explorer(c.main);
  const mq = trouverMasque(table, c.main.length, c.cible);
  if (mq === null) return { error: "Solution introuvable — signalez ce bug." };
  const pas = chemin(table, mq, c.cible);

  const g = {
    pas,                                   // la solution de référence : sert aux indices
    lignes: pas.map(() => ({ a: null, op: null, b: null })),
    verrous: [],                           // cases pré-remplies, non modifiables
    objectifs: {},                         // ligne -> résultat intermédiaire révélé
  };

  /* Cases révélables. Un opérande n'est révélable que s'il vient de la main :
     un opérande intermédiaire dépendrait d'une ligne que le joueur peut très
     bien résoudre autrement, et le verrou deviendrait faux. */
  const cand = [];
  pas.forEach((p, i) => {
    cand.push({ k: `${i}:op` });
    if (i < pas.length - 1) cand.push({ k: `${i}:res` });
    ['a', 'b'].forEach(ch => {
      const tid = c.main.indexOf(p[ch]);
      if (tid !== -1) cand.push({ k: `${i}:${ch}`, tid });
    });
  });

  const vise = Math.max(1, Math.round(cand.length * TAUX_INDICES));
  const parLigne = {}, pris = new Set();
  let poses = 0;
  for (const x of melanger(cand)) {
    if (poses >= vise) break;
    const [is, ch] = x.k.split(':');
    const i = +is;
    if ((parLigne[i] || 0) >= 2) continue;          // jamais une ligne offerte entière
    if (ch === 'res')      g.objectifs[i] = pas[i].res;
    else if (ch === 'op') { g.lignes[i].op = pas[i].opId; g.verrous.push(x.k); }
    else {
      if (pris.has(x.tid)) continue;
      pris.add(x.tid);
      g.lignes[i][ch] = x.tid;
      g.verrous.push(x.k);
    }
    parLigne[i] = (parLigne[i] || 0) + 1;
    poses++;
  }

  c.guide = g;
  c.etapesRef = pas.length;
  recommencer();
  return g;
}

/* Recalcule tout depuis les placements du joueur : jetons disponibles,
   résultats produits, lignes conformes ou non. */
function etatGuide() {
  const c = cmd(), g = c && c.guide;
  if (!g) return null;

  const jetons = c.main.map((val, tid) => ({ tid, val, ligne: -1 }));
  const consommes = new Set();
  const lignes = [];
  const ops = opsGuide();

  for (let i = 0; i < g.lignes.length; i++) {
    const L = g.lignes[i];
    const tokA = L.a !== null ? jetons.find(t => t.tid === L.a) : null;
    const tokB = L.b !== null ? jetons.find(t => t.tid === L.b) : null;
    if (tokA) consommes.add(tokA.tid);
    if (tokB) consommes.add(tokB.tid);

    /* Un jeton posé garde l'empreinte de sa valeur d'alors. S'il a disparu (la
       ligne qui le fabriquait est redevenue incomplète) ou s'il ne vaut plus la
       même chose, la référence est périmée : on la marque au lieu de vider
       d'autorité les lignes suivantes. */
    if (tokA && L.aVal === undefined) L.aVal = tokA.val;
    if (tokB && L.bVal === undefined) L.bVal = tokB.val;
    const perimeA = L.a !== null && (!tokA || (L.aVal !== undefined && tokA.val !== L.aVal));
    const perimeB = L.b !== null && (!tokB || (L.bVal !== undefined && tokB.val !== L.bVal));

    const op = L.op ? ops.find(o => o.id === L.op) : null;
    let res = null, refus = null;
    if (tokA && tokB && op && !perimeA && !perimeB) {
      const v = op.fn(tokA.val, tokB.val);
      if (v === null) refus = op.refus || "Cette opération ne donne rien d'utilisable.";
      else if (!Number.isInteger(v) || v < 0) refus = "Le résultat doit être un entier positif.";
      else if (v > FORGE_MAX) refus = `${frFR(v)} dépasse le plafond de ${frFR(FORGE_MAX)}.`;
      else res = v;
    }

    const objectif = g.objectifs[i];
    lignes.push({
      i, tokA, tokB, op, res, refus, objectif,
      perimeA, perimeB, valA: L.aVal, valB: L.bVal,
      complete: res !== null,
      devie: res !== null && objectif !== undefined && res !== objectif,
    });
    if (res !== null) jetons.push({ tid: 1000 + i, val: res, ligne: i });
  }

  const courante = lignes.findIndex(l => !l.complete);
  return {
    jetons, consommes, lignes,
    dispo: jetons.filter(t => !consommes.has(t.tid)),
    courante: courante === -1 ? lignes.length - 1 : courante,
    gagne: lignes.some(l => l.res === c.cible),
  };
}

const verrouille = (g, i, ch) => g.verrous.includes(`${i}:${ch}`);

/* Vider une ligne invalide tout ce qui vient après : les lignes suivantes ont
   pu consommer le jeton qu'elle produisait. */
function viderDepuis(i) {
  const g = cmd().guide;
  for (let j = i; j < g.lignes.length; j++) {
    ['a', 'op', 'b'].forEach(ch => {
      if (verrouille(g, j, ch)) return;
      g.lignes[j][ch] = null;
      delete g.lignes[j][ch + 'Val'];
    });
  }
}

function poserGuide(i, ch, tid) {
  const c = cmd(), g = c && c.guide;
  if (!g || verrouille(g, i, ch)) return { error: "Cette case est donnée, elle ne bouge pas." };

  const et = etatGuide();

  if (ch === 'op') {
    if (!opsGuide().some(o => o.id === tid)) return { error: "Opérateur inconnu." };
    g.lignes[i].op = tid;
  } else {
    const jeton = et.jetons.find(t => t.tid === tid);
    if (!jeton) return { error: "Jeton introuvable." };
    if (jeton.ligne >= i) return { error: `Ce jeton naît de la ligne ${jeton.ligne + 1} : il ne peut pas servir avant elle.` };
    if (et.consommes.has(tid) && g.lignes[i][ch] !== tid) return { error: "Ce jeton est déjà posé ailleurs." };
    g.lignes[i][ch] = tid;
    g.lignes[i][ch + 'Val'] = jeton.val;      // empreinte, pour détecter la péremption
  }
  return { ok: true };
}

/* Retirer un jeton ne touche à aucune autre ligne. Celles qui dépendaient
   vraiment de lui verront simplement leur référence virer au rouge, et c'est au
   joueur de faire le ménage — les autres continuent leur vie. */
function retirerGuide(i, ch) {
  const g = cmd() && cmd().guide;
  if (!g || verrouille(g, i, ch)) return false;
  g.lignes[i][ch] = null;
  delete g.lignes[i][ch + 'Val'];
  return true;
}

/* Déplacer un jeton d'une case à une autre. Si la case d'arrivée est occupée,
   les deux s'échangent — à condition qu'aucun ne se retrouve dans une ligne
   antérieure à celle qui le fabrique. */
function deplacerGuide(src, dst) {
  const g = cmd() && cmd().guide;
  if (!g) return { error: "Aucune grille en cours." };
  if (src === dst) return { ok: true };

  const [is, cs] = src.split(':'), [id, cd] = dst.split(':');
  const iS = +is, iD = +id;
  if (verrouille(g, iS, cs) || verrouille(g, iD, cd)) return { error: "Une case donnée ne bouge pas." };
  if ((cs === 'op') !== (cd === 'op'))
    return { error: "Un opérateur ne va pas dans une case nombre." };

  const A = g.lignes[iS][cs], B = g.lignes[iD][cd];
  if (A === null) return { error: "Rien à déplacer." };

  if (cs === 'op') {                                  // simple échange d'opérateurs
    g.lignes[iS][cs] = B; g.lignes[iD][cd] = A;
    return { ok: true };
  }

  const et = etatGuide();
  const info = tid => tid === null ? null : et.jetons.find(t => t.tid === tid);
  const jA = info(A), jB = info(B);
  if (!jA) return { error: "Ce jeton est périmé : retirez-le plutôt que de le déplacer." };
  if (B !== null && !jB) return { error: "La case d'arrivée contient un jeton périmé : retirez-le d'abord." };
  if (jA.ligne >= iD) return { error: `Ce jeton naît de la ligne ${jA.ligne + 1} : il ne peut pas servir avant elle.` };
  if (jB && jB.ligne >= iS) return { error: `L'échange ferait remonter un jeton né en ligne ${jB.ligne + 1}.` };

  g.lignes[iD][cd] = A; g.lignes[iD][cd + 'Val'] = jA.val;
  if (jB) { g.lignes[iS][cs] = B; g.lignes[iS][cs + 'Val'] = jB.val; }
  else    { g.lignes[iS][cs] = null; delete g.lignes[iS][cs + 'Val']; }
  return { ok: true };
}

/* L'indice révèle une prise supplémentaire : d'abord l'objectif de la ligne en
   cours, puis son opérateur. Il ne touche jamais aux placements du joueur. */
function revelerIndice() {
  const c = cmd(), g = c && c.guide;
  if (!g) return { error: "Aucune grille en cours." };
  const et = etatGuide();

  for (let i = et.courante; i < g.pas.length; i++) {
    if (i < g.pas.length - 1 && g.objectifs[i] === undefined) {
      g.objectifs[i] = g.pas[i].res; c.indices = (c.indices || 0) + 1;
      return { type: 'objectif', ligne: i, val: g.pas[i].res };
    }
    if (!verrouille(g, i, 'op')) {
      g.lignes[i].op = g.pas[i].opId; g.verrous.push(`${i}:op`); c.indices = (c.indices || 0) + 1;
      return { type: 'op', ligne: i, sym: OPS_BASE.find(o => o.id === g.pas[i].opId).sym };
    }
  }
  return { error: "Tout ce qui pouvait être révélé l'a été. Le reste vous appartient." };
}

/* Rejoue la grille gagnante sur l'établi, pour que l'état du jeu reste vrai. */
function appliquerGuide() {
  const et = etatGuide();
  if (!et || !et.gagne) return { error: "La grille n'atteint pas la cible." };
  recommencer();
  for (const l of et.lignes) {
    if (!l.complete) continue;          // une ligne abandonnée en route ne bloque rien
    const A = piecesVivantes().find(p => p.val === l.tokA.val);
    if (!A) return { error: "Le plan ne correspond plus à l'établi." };
    const B = piecesVivantes().find(p => p.val === l.tokB.val && p.id !== A.id);
    if (!B) return { error: "Le plan ne correspond plus à l'établi." };
    const r = appliquer(l.op.id, A.id, B.id);
    if (r.error) return r;
    if (l.res === cmd().cible) break;
  }
  return { ok: true };
}

function quitterGuide() { const c = cmd(); if (c) { delete c.guide; recommencer(); } }

/* ---------- clôture ----------
   Résoudre une commande rapporte, en plus de la cible, des cartes tirées comme
   au gacha. Chaque indice demandé en retire une : l'aide se paie en butin, pas
   en frustration. */
const cartesBonus = c => Math.max(0, 1 + (c.etapesRef || 2) - (c.indices || 0));

function encaisser(valeur) {
  const c = cmd();
  if (!c || c.fini) return { error: "Aucune commande en cours." };
  if (!piecesVivantes().some(p => p.val === valeur)) return { error: "Cette pièce n'est pas sur l'établi." };
  if (!forgeable(valeur)) return { error: "La Forge ne garde que ce que le tirage ne peut pas donner : 0, ou au-delà de 9 999." };

  const exact = valeur === c.cible;
  const res = acquire(valeur, 'commande');
  res.exact = exact;
  res.duree = Math.round((Date.now() - c.debut) / 1000);
  res.etapes = c.etapes.length;

  if (exact) {                                  // la prime du compte juste
    res.indices = c.indices || 0;
    res.cartes = [];
    for (let i = cartesBonus(c); i > 0; i--) res.cartes.push(acquire(drawFromTier(rollTier()), 'prime'));
    res.prime = Math.round(res.ev.rarity.coin * 60 + 200);
    res.primeDust = Math.round(res.ev.rarity.dust * 2 + 40);
    state.coins += res.prime;
    state.dust  += res.primeDust;
    state.stats.coinsEarned += res.prime;
    state.stats.dustEarned  += res.primeDust;
    state.stats.comptesJustes = (state.stats.comptesJustes || 0) + 1;
  }
  state.stats.forges++;
  c.fini = true;
  return res;
}

function abandonner() { state.commande = null; }
