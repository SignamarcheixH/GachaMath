/* ============================================================
   ÉTAT & RÈGLES — économie, tirage, forge, progression.
   ============================================================ */

const SAVE_KEY = 'gachanombres.save.v1';
const POOL_MAX = 9999;        // plafond du tirage
const FORGE_MAX = 99999;      // plafond de la forge
const OFFLINE_CAP_H = 8;

/* Inflation numérique : chaque nombre déjà possédé renchérit les suivants.
   Sans ça le revenu passif dépasse vite le coût des tirages et les jetons
   cessent d'avoir un sens. Le ×10 garde sa remise de 10 %. */
const BASE_PULL = 80;
const prixUnitaire = () => BASE_PULL + 2 * uniqueCount(state);

/* Remises par palier : plus le paquet est gros, plus il est avantageux. */
const REMISES = [[100, 0.80], [50, 0.85], [25, 0.88], [10, 0.90]];
const PAQUETS = [1, 10, 25, 50, 100];
const remisePour = count => (REMISES.find(([n]) => count >= n) || [0, 1])[1];
const pullCost = count => Math.round(prixUnitaire() * count * remisePour(count));

/* Combien de tirages le portefeuille permet, au prix unitaire. */
const tiragesPossibles = () => Math.floor(state.coins / prixUnitaire());

/* ---------- état ---------- */
let state = null;

function freshState() {
  return {
    coins: 1000,
    dust: 0,
    owned: {},                 // { "42": { copies, first } }
    claimed: [],               // collections encaissées
    defis: [],                 // défis encaissés
    stats: { pulls: 0, forges: 0, coinsEarned: 0, dustEarned: 0, bestScore: 0, bestNum: null, failedForges: 0, bonnesReponses: 0, meilleureSerie: 0 },
    pity: { epic: 0, legend: 0 },
    paquet: 10,              // taille du paquet de tirage choisie
    commande: null,          // la commande de forge en cours
    revision: null,          // l'examen en cours
    lastTick: Date.now(),
    started: Date.now(),
  };
}

/* ---------- helpers utilisés par les défis ----------
   `uniqueCount` reconstruit un tableau de toutes les clés : 0,3 ms à dix mille
   nombres, et il est appelé partout — sept fois dans le seul rafraîchissement
   du portefeuille, via `pullCost`. On le mémorise sur l'état courant. */
let _uniqCache = null, _uniqEtat = null;
function uniqueCount(s) {
  if (s !== state) return Object.keys(s.owned).length;
  if (_uniqCache !== null && _uniqEtat === state) return _uniqCache;
  _uniqEtat = state;
  return _uniqCache = Object.keys(state.owned).length;
}
function hasRarity(s, key) {
  return Object.keys(s.owned).some(k => evaluate(+k).rarity.key === key);
}
function countAtLeast(s, idx) {
  return Object.keys(s.owned).filter(k => evaluate(+k).rarity.idx >= idx).length;
}

/* ---------- persistance ---------- */
/* Après un effacement volontaire, plus rien ne doit être écrit : `wipe()` est
   suivi d'un rechargement, et le `beforeunload` du jeu ressuscitait la partie
   que le joueur venait de supprimer. */
let _ecritureBloquee = false;

function save() {
  if (_ecritureBloquee) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    // La couche nuage n'existe que si nuage.js est chargé et l'API joignable.
    if (typeof nuageMarquer === 'function') nuageMarquer();
  } catch (e) { console.warn('Sauvegarde impossible', e); }
}
/* Une commande en cours peut venir d'une version antérieure du jeu, où la
   grille avait une tout autre forme. On ne tente pas de la migrer : une partie
   de puzzle à moitié faite ne vaut pas la collection qu'elle risquerait
   d'emporter avec elle en plantant le rendu. */
function commandeValide(c) {
  if (!c) return false;
  const base = Number.isInteger(c.cible) && Array.isArray(c.main)
            && Array.isArray(c.pieces) && Array.isArray(c.etapes);
  if (!base) return false;
  if (!c.guide) return true;
  return Array.isArray(c.guide.pas) && Array.isArray(c.guide.lignes)
      && Array.isArray(c.guide.verrous) && c.guide.objectifs !== undefined;
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    state = Object.assign(freshState(), s);
    state.stats = Object.assign(freshState().stats, s.stats || {});
    state.pity = Object.assign({ epic: 0, legend: 0 }, s.pity || {});
    if (state.commande && !commandeValide(state.commande)) {
      console.warn('Commande de forge issue d\'une version antérieure — abandonnée.');
      state.commande = null;
      state.commandePerimee = true;      // pour prévenir le joueur au démarrage
    }
    return true;
  } catch (e) { console.warn('Sauvegarde illisible', e); return false; }
}
function wipe() {
  _ecritureBloquee = true;
  localStorage.removeItem(SAVE_KEY);
  try { localStorage.removeItem('gachanombres.sync.v1'); } catch {}
}

/* ---------- le vivier : 1..9999 pré-évalué et trié par rareté ---------- */
const POOL = { commun: [], peucommun: [], rare: [], epique: [], legendaire: [], mythique: [] };
function buildPool() {
  for (let n = 1; n <= POOL_MAX; n++) POOL[evaluate(n).rarity.key].push(n);
}

/* Probabilités du banner. Les paliers vides retombent d'un cran. */
/* ---------- taux d'apparition ----------
   Ces taux ne sont pas arbitraires : ils se lisent par rapport à la taille
   réelle des viviers, qui découle des mathématiques et non d'un choix.

     palier        vivier   part du vivier   taux ici   écart
     commun          4737       47,4 %        55,6 %     1,2x
     peu commun      4748       47,5 %        32,7 %     0,7x
     rare             412        4,1 %         8,4 %     2,0x
     épique            79        0,8 %         2,7 %     3,4x
     légendaire        11        0,1 %         0,5 %     4,2x
     mythique          12        0,1 %         0,1 %     1,0x

   L'écart est la part de gacha assumée : on penche en faveur du rare, sinon
   il n'y aurait pas de frisson. Mais jamais en dessous de 1,0x — un Mythique
   plus rare qu'un entier tiré au hasard contredirait la promesse du jeu, qui
   est que la rareté se calcule au lieu de se décréter.

   Le réglage précédent penchait à 15,6x sur le Légendaire : on en trouvait un
   tous les 58 tirages alors qu'il n'en existe que onze, et le palier entier se
   bouclait en 1 500 tirages — quatre fois plus vite que les Épiques, pourtant
   censés être moins rares. */
const PULL_ODDS = [
  ['mythique',   0.0012],
  ['legendaire', 0.0030],
  ['epique',     0.0200],
  ['rare',       0.0850],
  ['peucommun',  0.3300],
  ['commun',     0.5608],
];

/* Garanties. Elles doivent rester au-delà de l'espérance du tirage, sinon
   c'est la garantie qui distribue le palier et non le hasard : à 2 % pour
   l'Épique, on en attend un tous les 50 tirages, d'où un filet à 60. */
const PITY_EPIQUE = 60;
const PITY_LEGENDAIRE = 300;

function rollTier() {
  let r = Math.random();
  for (const [key, p] of PULL_ODDS) { if (r < p) return key; r -= p; }
  return 'commun';
}
function drawFromTier(key) {
  let i = RARITY_BY_KEY[key].idx;
  while (i >= 0 && POOL[RARITIES[i].key].length === 0) i--;
  const arr = POOL[RARITIES[Math.max(0, i)].key];
  return arr[(Math.random() * arr.length) | 0];
}

/* ---------- bonus des collections ---------- */
function bonuses() {
  const b = { coinMult: 0, dustMult: 0, forgeDiscount: 0, luck: 0, coinFlat: 0 };
  for (const id of state.claimed) {
    const c = COLLECTIONS.find(x => x.id === id);
    if (c) b[c.bonus.type] += c.bonus.val;
  }
  return b;
}
function collectionProgress(c) {
  if (c.pred) {                      // théorème à prédicat : on compte, on n'énumère pas
    const have = Object.keys(state.owned).filter(k => forgeable(+k)).length;
    return { have: Math.min(have, c.pred.n), total: c.pred.n, done: have >= c.pred.n, pred: true };
  }
  const have = c.nums.filter(n => state.owned[n]).length;
  return { have, total: c.nums.length, done: have === c.nums.length };
}

/* ---------- revenu passif ----------
   Recalculer le revenu parcourt toute la collection : 1,16 ms à dix mille
   nombres. Acceptable une fois par seconde, pas dix fois. On le mémorise, et
   l'on invalide au moindre changement de collection ou de bonus. Le cache
   retient aussi l'objet `state` : le remplacer d'un bloc suffit à le périmer. */
let _revenuCache = null, _revenuEtat = null;
const invalideRevenu = () => { _revenuCache = null; _uniqCache = null; };

function coinsPerMinute() {
  if (_revenuCache !== null && _revenuEtat === state) return _revenuCache;
  const b = bonuses();
  let base = 0;
  for (const [k, v] of Object.entries(state.owned)) {
    const r = evaluate(+k).rarity;
    const copies = Math.min(v.copies, 25);
    base += r.coin * (1 + 0.15 * (copies - 1));
  }
  _revenuEtat = state;
  return _revenuCache = Math.floor((base + b.coinFlat) * (1 + b.coinMult));
}

function tick(now = Date.now()) {
  const elapsedMs = Math.max(0, now - state.lastTick);
  state.lastTick = now;
  const minutes = elapsedMs / 60000;
  const gain = coinsPerMinute() * minutes;
  if (gain > 0) { state.coins += gain; state.stats.coinsEarned += gain; }
  return gain;
}

function catchUpOffline() {
  const now = Date.now();
  const elapsed = Math.min(now - state.lastTick, OFFLINE_CAP_H * 3600 * 1000);
  const gain = Math.floor(coinsPerMinute() * (elapsed / 60000));
  state.lastTick = now;
  if (gain > 0) { state.coins += gain; state.stats.coinsEarned += gain; }
  return { gain, minutes: Math.floor(elapsed / 60000) };
}

/* ---------- acquisition ---------- */
/* Renvoie { n, ev, isNew, copies, coins, dust } */
function acquire(n, source) {
  const ev = evaluate(n);
  const b = bonuses();
  const rec = state.owned[n];
  const out = { n, ev, isNew: !rec, copies: 1, coins: 0, dust: 0, source };
  invalideRevenu();

  /* Toute acquisition laisse de la poussière — sur un vivier de 10 000 nombres,
     les doublons sont bien trop rares pour alimenter les aides de la Forge à
     eux seuls. Un nombre gagné à la Forge se mérite : plein tarif. */
  const yieldMult = rec ? 1.5 : 1;

  if (!rec) {
    state.owned[n] = { copies: 1, first: Date.now() };
    out.coins = Math.round(ev.rarity.coin * 25 + 40);
    if (ev.score > state.stats.bestScore) { state.stats.bestScore = ev.score; state.stats.bestNum = n; }
  } else {
    rec.copies++;
    out.copies = rec.copies;
  }
  out.dust = Math.round(ev.rarity.dust * yieldMult * (1 + b.dustMult));
  state.coins += out.coins;
  state.dust  += out.dust;
  state.stats.coinsEarned += out.coins;
  state.stats.dustEarned  += out.dust;
  return out;
}

/* ---------- tirage ---------- */
function pull(count) {
  const cost = pullCost(count);
  if (state.coins < cost) return { error: 'Pas assez de jetons.' };
  state.coins -= cost;

  const b = bonuses();
  const results = [];
  for (let i = 0; i < count; i++) {
    let tier;
    if (state.pity.legend >= PITY_LEGENDAIRE) tier = 'legendaire';
    else if (state.pity.epic >= PITY_EPIQUE) tier = 'epique';
    else {
      tier = rollTier();
      if (b.luck > 0 && tier === 'commun') tier = rollTier();   // Le Panthéon relance les Communs
    }

    const n = drawFromTier(tier);
    const res = acquire(n, 'tirage');
    const idx = res.ev.rarity.idx;

    state.pity.epic   = idx >= 3 ? 0 : state.pity.epic + 1;
    state.pity.legend = idx >= 4 ? 0 : state.pity.legend + 1;

    state.stats.pulls++;
    results.push(res);
  }
  return { results, cost };
}

/* ---------- forge ----------
   Toute la mécanique du Compte est Bon vit dans forge.js. Ici on ne garde que
   l'état persistant de la commande en cours. */

/* ---------- recyclage des doublons ---------- */
function recycleDupes() {
  const b = bonuses();
  let gained = 0, scrapped = 0;
  for (const [k, v] of Object.entries(state.owned)) {
    if (v.copies <= 1) continue;
    const extra = v.copies - 1;
    const r = evaluate(+k).rarity;
    gained += Math.round(r.dust * extra * 0.6 * (1 + b.dustMult));
    scrapped += extra;
    v.copies = 1;
  }
  state.dust += gained;
  state.stats.dustEarned += gained;
  invalideRevenu();
  return { gained, scrapped };
}

/* ---------- collections & défis à encaisser ---------- */
function pendingCollections() {
  return COLLECTIONS.filter(c => !state.claimed.includes(c.id) && collectionProgress(c).done);
}
function claimCollection(id) {
  if (state.claimed.includes(id)) return null;
  const c = COLLECTIONS.find(x => x.id === id);
  if (!c || !collectionProgress(c).done) return null;
  state.claimed.push(id);
  invalideRevenu();
  return c;
}
function pendingDefis() {
  return DEFIS.filter(d => !state.defis.includes(d.id) && d.check(state));
}
function claimDefi(id) {
  if (state.defis.includes(id)) return null;
  const d = DEFIS.find(x => x.id === id);
  if (!d || !d.check(state)) return null;
  state.defis.push(id);
  if (d.rw.coins) { state.coins += d.rw.coins; state.stats.coinsEarned += d.rw.coins; }
  if (d.rw.dust)  { state.dust  += d.rw.dust;  state.stats.dustEarned  += d.rw.dust; }
  return d;
}
