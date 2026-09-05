/* ============================================================
   INTERFACE — rendu, animations, câblage.
   ============================================================ */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Math.floor(n).toLocaleString('fr-FR');
const rc  = key => `--rc:var(--r-${key})`;

/* ---------- toasts ---------- */
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3900);
}

/* ============================================================
   BOOT
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const bootNum = $('.bootNum');
  let spin = setInterval(() => {
    bootNum.textContent = String((Math.random() * 10000) | 0).padStart(4, '0');
  }, 60);

  // laisse le navigateur peindre l'écran de chargement avant le gros calcul
  setTimeout(() => {
    buildPool();
    computeTraitExamples();
    const restored = load();
    if (!state) state = freshState();

    let offline = null;
    if (restored) offline = catchUpOffline();

    clearInterval(spin);
    bootNum.textContent = fmt(POOL_MAX);
    $('#boot').classList.add('gone');
    setTimeout(() => $('#boot').remove(), 500);

    initUI();
    renderAll();
    // L'adresse fait foi : recharger au milieu d'une commande de Forge doit
    // ramener sur la Forge, pas sur l'accueil.
    const depart = vueDuFragment();
    history.replaceState({ vue: depart }, '', '#/' + depart);
    if (depart !== 'gacha') ouvrirOnglet(depart, false);

    if (offline && offline.gain > 0) {
      toast(`💤 Absence de ${offline.minutes} min — <b>${fmt(offline.gain)}</b> 🪙 accumulés.`, 'good');
    }
    if (!restored) {
      toast("Bienvenue. Vous avez 1 000 jetons et aucun nombre. Commencez par tirer.", 'gold');
    }
    // La synchro se lance en tâche de fond : elle ne doit jamais retarder le jeu.
    if (typeof initNuage === 'function') initNuage(restored);
    if (typeof initPub === 'function') initPub();

    if (state.commandePerimee) {
      delete state.commandePerimee;
      toast("Votre commande de forge en cours datait d'une version antérieure : elle a été abandonnée. Votre collection est intacte.", 'bad');
    }
  }, 60);
});

/* ============================================================
   CÂBLAGE
   ============================================================ */
let selA = null;          // pièce sélectionnée sur l'établi
let selOp = null;         // opérateur en attente
let colFilter = new Set();
let colPage = 1;
let colAll = false;            // vue exhaustive : montre aussi les manquants
let colTerritoire = null;      // null | 'tirage' | 'forge'
const PAGE = 240;
let idleSpin = null;

/* ============================================================
   ADRESSES DES VUES

   Un fragment — `#/classement` — et non un chemin. Trois raisons :
   aucune configuration serveur, ça marche aussi en mode statique
   sans Django, et surtout un fragment n'est PAS une adresse
   distincte pour un moteur de recherche. Le robot voit « / » quoi
   qu'il arrive : on gagne le bouton Retour sans créer huit pages
   vides, ce qui pénaliserait le référencement au lieu de l'aider.
   ============================================================ */
const VUES = ['hub', 'frise', 'gacha', 'collection', 'forge', 'atelier', 'bonus',
              'minijeux', 'classement', 'comptoir', 'observatoire', 'casino', 'retours'];

/* Les adresses des anciens onglets restent valides : un lien partagé, un
   signet ou un onglet resté ouvert doivent continuer de fonctionner. */
const ANCIENNES_VUES = { theoremes: 'bonus', defis: 'bonus', revision: 'minijeux' };

const vueCourante = () => {
  const b = $('#tabs button.on');
  return b ? b.dataset.tab : 'gacha';
};

const vueDuFragment = () => {
  const f = (location.hash || '').replace(/^#\/?/, '');
  if (VUES.includes(f)) return f;
  return ANCIENNES_VUES[f] || 'gacha';
};

const surcoucheOuverte = () =>
  ($('#reveal') && $('#reveal').classList.contains('on')) ||
  ($('#modal') && $('#modal').classList.contains('on'));

function fermerSurcouches() {
  if ($('#reveal') && $('#reveal').classList.contains('on')) closeReveal();
  else if ($('#modal') && $('#modal').classList.contains('on')) closeModal();
}

/* `pousser` distingue un clic du joueur — qui ajoute une entrée d'historique —
   d'un retour arrière, qui n'en ajoute évidemment pas. */
function ouvrirOnglet(nom, pousser = true) {
  if (!VUES.includes(nom)) nom = 'gacha';
  /* Le verrou des actes vaut aussi pour l'adresse : sans ça, #/forge ouvrirait
     la Forge à l'acte 0. On retombe sur le Vivier, qui est toujours là. */
  if (typeof vueOuverte === 'function' && !vueOuverte(nom)) nom = 'gacha';
  const btn = $(`#tabs button[data-tab="${nom}"]`);
  if (!btn) return;

  /* Quitter la Forge abandonne la commande en cours. Une grille laissée à
     moitié résolue puis retrouvée trois jours plus tard ne veut plus rien
     dire : on ne se souvient ni de son raisonnement, ni de la cible. Mieux
     vaut repartir d'une commande fraîche. */
  if (vueCourante() === 'forge' && nom !== 'forge' && state.commande) {
    abandonner();
    save();
  }

  /* Quitter les Mini-jeux abandonne la partie en cours, quel qu'en soit
     l'avancement. Ce sont trois exercices courts et chronométrés : en
     retrouver un figé au milieu d'une vague, trois jours plus tard, ne veut
     rien dire — et laisser tourner un compte à rebours pendant qu'on regarde
     ailleurs serait pire encore. On revient au choix du jeu. */
  if (vueCourante() === 'minijeux' && nom !== 'minijeux') {
    if (typeof calcArreterChrono === 'function') calcArreterChrono();
    if (state.revision) { state.revision = null; save(); }
  }

  majOngletsVerrouilles();
  $$('#tabs button').forEach(b => b.classList.toggle('on', b === btn));
  $$('main .tab').forEach(s => s.classList.toggle('on', s.id === 'tab-' + nom));

  if (pousser) history.pushState({ vue: nom }, '', '#/' + nom);

  renderAll();
  centrerOnglet(btn);
  if (typeof majPubVue === 'function') majPubVue();
  if (nom === 'classement' && typeof ouvrirClassement === 'function') ouvrirClassement();
  if (nom === 'retours' && typeof ouvrirRetours === 'function') ouvrirRetours();
}

/* UN ONGLET ABSENT DE `VUES` NE S'OUVRE PAS, ET RIEN NE LE DISAIT. Le Comptoir,
   l'Observatoire et le Casino ont vécu plusieurs jours avec leur bouton, leur
   section et leur rendu — mais pas leur nom ici : `ouvrirOnglet` les
   remplaçait silencieusement par le Vivier. Le rendu, lui, marchait, parce
   que `renderAll()` rend toutes les sections quelle que soit celle affichée :
   on pouvait lire leur contenu dans le document sans jamais pouvoir les voir.
   Un bouton qui n'ouvre rien ne se signale pas tout seul ; il le fait
   maintenant. */
function verifierOnglets() {
  const orphelins = $$('#tabs button[data-tab]')
    .map(b => b.dataset.tab)
    .filter(t => !VUES.includes(t));
  if (orphelins.length) {
    console.error('Onglets absents de VUES — leur bouton ne les ouvrira pas : '
      + orphelins.join(', '));
  }
  return orphelins;
}

function initUI() {
  verifierOnglets();

  // onglets
  $('#tabs').addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if (btn) ouvrirOnglet(btn.dataset.tab);
  });

  /* Retour arrière. Si une surcouche est ouverte — révélation d'un tirage,
     fiche d'un nombre — le geste doit la fermer, pas changer d'onglet derrière
     elle. On remet alors l'entrée d'historique en place. */
  window.addEventListener('popstate', () => {
    if (surcoucheOuverte()) {
      fermerSurcouches();
      history.pushState({ vue: vueCourante() }, '', '#/' + vueCourante());
      return;
    }
    const vue = vueDuFragment();
    ouvrirOnglet(vue, false);
    // Fragment inconnu : on affiche l'accueil, autant que l'adresse le dise.
    if (location.hash !== '#/' + vue) history.replaceState({ vue }, '', '#/' + vue);
  });

  // tirage
  $('#btnPull').addEventListener('click', () => doPull(state.paquet || 10));
  $('#revealClose').addEventListener('click', () => {
    closeReveal();
    if (typeof visiteSignal === 'function') visiteSignal('revelationFermee');
  });
  $('#revealSkip').addEventListener('click', () => {
    annulerCascade();
    $$('.rcard').forEach(c => c.classList.add('flip'));
  });

  // machine au repos
  idleSpin = setInterval(() => {
    if ($('#tab-gacha').classList.contains('on') && !$('#reveal').classList.contains('on'))
      $('#idleNum').textContent = String((Math.random() * POOL_MAX + 1) | 0);
  }, 90);

  // collection
  $('#colSearch').addEventListener('input', () => { colPage = 1; renderCollection(); });
  $('#colSort').addEventListener('change', renderCollection);
  $('#btnAll').addEventListener('click', () => {
    colAll = !colAll; colPage = 1;
    $('#btnAll').classList.toggle('on', colAll);
    $('#btnAll').innerHTML = colAll ? '🗃️ Ma collection' : '🌐 Vue exhaustive';
    renderCollection();
  });
  $('#btnRecycle').addEventListener('click', () => {
    const r = recycleDupes();
    if (!r.scrapped) return toast("Aucun doublon à recycler.", 'bad');
    toast(`♻️ ${r.scrapped} doublons fondus → <b>${fmt(r.gained)}</b> ✨`, 'good');
    save(); renderAll();
  });

  /* ⚠ L'interrupteur du mode placement. Hors développement il est retiré du
     document — pas caché : un bouton `hidden` reste dans le DOM, et un bouton
     de développement n'a rien à y faire en production. */
  const bp = $('#btnPlacement');
  if (bp) {
    if (typeof CARTE_DEV === 'undefined' || !CARTE_DEV) bp.remove();
    else bp.addEventListener('click', () => basculerPlacement());
  }

  // sauvegarde en ligne
  $('#nuageBtn').addEventListener('click', () => { if (typeof ouvrirNuage === 'function') ouvrirNuage(); });
  // Une page qu'on quitte n'a plus le temps d'envoyer 400 Ko : on saisit plutôt
  // le moment où elle passe en arrière-plan, où le navigateur laisse finir.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && typeof pousser === 'function') { tick(); save(); pousser(); }
  });

  // effacement
  /* ⚠ AIDE DE TEST. Repartir VRAIMENT de zéro : la sauvegarde locale, la
     progression, les quêtes, et le choix de mini-jeu. Le rechargement fait le
     reste — `wipe()` bloque l'écriture, donc rien ne peut être réenregistré
     entre l'effacement et le redémarrage. */
  const carnetB = $('#carnetBtn');
  if (carnetB) carnetB.addEventListener('click', ouvrirCarnet);

  const neuf = $('#btnNeuf');
  if (neuf) {
    if (typeof ACTES_TEST === 'undefined' || !ACTES_TEST) neuf.remove();
    else neuf.addEventListener('click', () => {
      const enLigne = typeof nuage !== 'undefined' && nuage.connecte;
      if (!confirm("TEST — repartir de zéro ?\n\n"
        + "Collection, jetons, poussière, actes, quêtes : tout est effacé, et le "
        + "tutoriel se relance comme au premier lancement."
        + (enLigne ? "\n\n⚠ Cet appareil est lié au nuage : la partie en ligne "
                   + "reviendra au prochain chargement. Déliez-le d'abord." : ""))) return;
      wipe();
      try {
        localStorage.removeItem('gachanombres.minijeu');
        localStorage.removeItem('gachanombres.sync.v1');
      } catch (e) {}
      location.reload();
    });
  }

  $('#btnWipe').addEventListener('click', () => {
    const enLigne = typeof nuage !== 'undefined' && nuage.connecte;
    const message = enLigne
      ? `Effacer la copie locale ?

Votre partie restera sauvegardée en ligne sous « ${nuage.pseudo} » `
        + `et reviendra au prochain chargement. Pour repartir vraiment de zéro, déliez d'abord `
        + `cet appareil depuis l'indicateur ☁ en haut.`
      : "Effacer définitivement la collection et repartir de zéro ?";
    if (!confirm(message)) return;
    wipe(); location.reload();
  });

  // modale
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeModal();
    if ($('#reveal').classList.contains('on')) closeReveal();
    /* La fenêtre d'un quartier n'a pas de voile : sans Échap, le seul moyen de
       sortir au clavier serait d'atteindre son bouton « Fermer ». */
    if (typeof fermerQuartier === 'function') fermerQuartier();
  });

  reglerFondsOnglets();
  $('#tabs').addEventListener('scroll', reglerFondsOnglets, { passive: true });
  window.addEventListener('resize', reglerFondsOnglets);

  buildPackSizes();
  buildRarityChips();
  buildOddsTable();

  // boucle de jeu
  setInterval(() => { tick(); renderWallet(); }, 200);   // la pastille suit les jetons de près
  setInterval(save, 10000);
  window.addEventListener('beforeunload', () => { tick(); save(); });
}

const intOrNull = v => { const n = parseInt(v, 10); return Number.isInteger(n) ? n : null; };

/* Le glisser-déposer HTML5 n'existe pas sur mobile, et le clic droit non plus.
   Les consignes doivent décrire le geste que l'appareil sait faire, pas celui
   qu'on avait en tête en l'écrivant. */
const tactile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

/* Sur téléphone, huit onglets ne tiennent pas : la barre défile. Un dégradé aux
   bords est le seul indice qu'il en reste derrière — sans lui, la moitié du jeu
   est invisible. */
function reglerFondsOnglets() {
  const t = $('#tabs');
  if (!t) return;
  const marge = 4;
  t.classList.toggle('fondD', t.scrollLeft + t.clientWidth < t.scrollWidth - marge);
  t.classList.toggle('fondG', t.scrollLeft > marge);
}

/* L'onglet choisi doit rester visible : sinon on clique sur « Codex » et la
   barre continue d'afficher « Tirage ». */
function centrerOnglet(btn) {
  if (!btn || !btn.scrollIntoView) return;
  btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  setTimeout(reglerFondsOnglets, 400);
}

/* ============================================================
   RENDU GLOBAL
   ============================================================ */
/* Chaque section se rend isolément. Sans ça, une seule exception — un état
   sauvegardé d'une ancienne version, par exemple — vidait silencieusement tous
   les onglets rendus après elle. */
const SECTIONS = [
  ['portefeuille', () => renderWallet(),   null],
  ['compteurs',    () => renderBadges(),   null],
  ['tirage',       () => renderPity(),     null],
  ['collection',   () => renderCollection(), '#colGrid'],
  ['forge',        () => renderForge(),    '#forgeZone'],
  ['atelier',      () => renderAtelier(),  '#atZone'],
  ['théorèmes',    () => renderTheoremes(), '#theoList'],
  ['défis',        () => renderDefis(),    '#defiList'],
  ['mini-jeux',    () => renderRevision(), '#revZone'],
  ['classement',   () => renderClassement(), '#clZone'],
  ['retours',      () => renderRetours(),   '#retZone'],
  ['comptoir',     () => renderComptoir(), '#cpZone'],
  ['casino',       () => renderCasino(),   '#csZone'],
  ['observatoire', () => renderObservatoire(), '#obZone'],
  ['carte',        () => renderHub(),       '#hubZone'],
  ['quartier',     () => renderQuartier(), null],
  ['frise',        () => renderFrise(),     '#friZone'],
  ['quête',        () => renderQuete(),     null],
  ['accueil',      () => renderAccueil(),   null],
  ['seuil',        () => renderSeuil(),     null],
  ['onglets',      () => majOngletsVerrouilles(), null],
  ['placement',    () => majBoutonPlacement(), null],
  ['place',        () => renderPlace(),     null],
  ['carnet',       () => renderCarnet(),    null],
  ['visite',       () => renderVisite(),    null],
  ['fond du lieu', () => poserFondDeLieu(),  null],
  ['opacité fond', () => appliquerFondOpacite(), null],
];
const sectionsSignalees = new Set();

/* ⚠ L'interrupteur du placement ne se montre que sur la Carte : ailleurs il
   n'aurait rien à commander, et un bouton inerte dans un en-tête est une
   promesse qu'on ne tient pas. */
function majBoutonPlacement() {
  const b = $('#btnPlacement');
  if (!b) return;
  b.hidden = vueCourante() !== 'hub';
  const actif = typeof CARTE_EDITION !== 'undefined' && CARTE_EDITION;
  b.classList.toggle('actif', actif);
  b.textContent = actif ? '⇱ placement actif' : '⇱ placement';
}

/* Un onglet dont le lieu n'est pas ouvert disparaît de la barre. On le CACHE
   au lieu de le désactiver : une barre de onze onglets à moitié grisés dit au
   joueur qu'il lui manque tout, alors qu'une barre courte qui s'allonge dit
   qu'il progresse. La Carte, elle, garde les lieux fermés en sourdine — c'est
   là qu'on va voir ce qui reste à mériter. */
function majOngletsVerrouilles() {
  if (typeof vueOuverte !== 'function') return;
  $$('#tabs button[data-tab]').forEach(b => {
    b.hidden = !vueOuverte(b.dataset.tab);
  });
}

function renderAll() {
  for (const [nom, fn, cible] of SECTIONS) {
    try { fn(); }
    catch (e) {
      console.error(`Rendu « ${nom} » en échec :`, e);
      if (cible && $(cible)) {
        $(cible).innerHTML = `<div class="empty">
          Cette section n'a pas pu s'afficher.<br>
          <span class="tiny">${nom} — ${e.message}</span><br>
          <button class="btn ghost sm" style="margin-top:12px" onclick="reparerSection('${nom}')">Réinitialiser cette section</button>
        </div>`;
      }
      if (!sectionsSignalees.has(nom)) {
        sectionsSignalees.add(nom);
        toast(`L'affichage « ${nom} » a échoué — le reste du jeu continue.`, 'bad');
      }
    }
  }
}

/* Filet de dernier recours : on jette l'état local fautif, jamais la collection. */
function reparerSection(nom) {
  if (nom === 'forge') { state.commande = null; save(); }
  if (nom === 'révision') { state.revision = null; save(); }
  if (nom === 'collection') { colFilter.clear(); colPage = 1; colAll = false; colTerritoire = null; }
  sectionsSignalees.delete(nom);
  renderAll();
  toast("Section réinitialisée.", 'good');
}

function renderWallet() {
  $('#wCoins').textContent = fmt(state.coins);
  $('#wDust').textContent  = fmt(state.dust);
  $('#wRate').textContent  = '+' + fmt(coinsPerMinute()) + '/min';

  const n = state.paquet || 10;
  const cout = pullCost(n), remise = Math.round((1 - remisePour(n)) * 100);
  $('#btnPull').disabled = state.coins < cout;
  $('#pullLabel').textContent = n === 1 ? 'Tirer' : `Tirer ×${n}`;
  $('#pullCost').textContent  = `🪙 ${fmt(cout)}${remise ? ` · −${remise} %` : ''}`;

  // Pastille de l'onglet : combien de tirages le portefeuille permet, au tarif
  // du paquet choisi — donc le même compte que celui du bouton.
  const possibles = tiragesPossibles(n);
  const b = $('#bTirage');
  const txt = possibles > 9999 ? '9999+' : (possibles || '');
  if (b.textContent !== txt) {            // cinq écritures DOM par seconde suffisent à user
    b.textContent = txt;
    const unitaireReel = Math.round(cout / n);
    b.title = `${fmt(possibles)} tirage${possibles > 1 ? 's' : ''} possible${possibles > 1 ? 's' : ''}`
            + ` au tarif du paquet ×${n} (${fmt(unitaireReel)} 🪙 pièce)`;
  }
  /* La pastille s'allume exactement quand le bouton est actif : les deux
     répondent à la même question, ils ne peuvent pas se contredire. */
  b.classList.toggle('pret', state.coins >= cout);

  $$('#packSizes .pack').forEach(el => {
    const k = +el.dataset.pack;
    el.classList.toggle('on', k === n);
    // Le même prix que celui du bouton, remise des théorèmes comprise.
    el.classList.toggle('cher', state.coins < pullCost(k));
  });
}

function buildPackSizes() {
  $('#packSizes').innerHTML = PAQUETS.map(k =>
    `<button class="pack" data-pack="${k}">×${k}</button>`).join('');
  $('#packSizes').addEventListener('click', e => {
    const b = e.target.closest('.pack'); if (!b) return;
    state.paquet = +b.dataset.pack;
    save(); renderWallet();
  });
}

function renderBadges() {
  // Théorèmes et Défis partagent un onglet : la pastille additionne les primes
  // à encaisser des deux listes.
  const aPrendre = pendingCollections().length + pendingDefis().length;
  $('#bBonus').textContent = aPrendre || '';
  $('#bCollection').textContent = uniqueCount(state) || '';
  /* Une porte franchissable se signale là où on la franchit. On l'annonce par
     une pastille et pas par un toast : le toast se répéterait à chaque rendu,
     et il partirait pendant qu'on regarde ailleurs. */
  const acte = $('#bActe');
  if (acte) acte.textContent = (typeof peutFranchir === 'function' && peutFranchir()) ? '▸' : '';
  /* La pastille du Carnet compte ce qui demande une action : une porte
     franchissable, et les quêtes dont l'objectif vient d'être rempli. */
  const carnet = $('#bCarnet');
  if (carnet && typeof quetesOuvertes === 'function') {
    const prets = quetesOuvertes().filter(q => {
      const e = etapeCourante(q);
      return e.type !== 'faire' || objectifRempli(e);
    }).length + ((typeof peutFranchir === 'function' && peutFranchir()) ? 1 : 0);
    carnet.textContent = prets || '';
  }
}

function renderPity() {
  // Les seuils viennent de state.js : les recopier ici ferait mentir la barre
  // au premier rééquilibrage.
  const e = Math.min(state.pity.epic, PITY_EPIQUE), l = Math.min(state.pity.legend, PITY_LEGENDAIRE);
  $('#pityEpicBar').style.width = (e / PITY_EPIQUE * 100) + '%';
  $('#pityLegBar').style.width  = (l / PITY_LEGENDAIRE * 100) + '%';
  $('#pityEpicTxt').textContent = `${state.pity.epic} / ${PITY_EPIQUE}`;
  $('#pityLegTxt').textContent  = `${state.pity.legend} / ${PITY_LEGENDAIRE}`;
}

function buildOddsTable() {
  $('#oddsTable').innerHTML = [...PULL_ODDS].map(([k, p]) => {
    const r = RARITY_BY_KEY[k];
    return `<tr style="${rc(k)}">
      <td style="color:var(--rc);font-weight:700">${r.label}</td>
      <td>${POOL[k].length} nombres</td>
      <td>${(p * 100).toFixed(2)} %</td>
    </tr>`;
  }).join('');
}

/* ============================================================
   TIRAGE
   ============================================================ */
function doPull(count) {
  const res = pull(count);
  if (res.error) return toast(res.error, 'bad');
  save();
  renderWallet(); renderPity(); renderBadges();
  showReveal(res.results);
  /* La visite attend un vrai tirage, pas un clic sur « Continuer ». */
  if (typeof visiteSignal === 'function') visiteSignal('tirage');
}

/* Les minuteurs de la cascade sont gardés pour pouvoir être annulés : sans
   ça, « Tout révéler » laisse cent réveils en attente, et un second tirage
   lancé aussitôt après verrait les retardataires du premier retourner ses
   cartes à contretemps. */
const CASCADE_DUREE_MAX = 2600;      // millisecondes, du premier au dernier
let _cascade = [];
function annulerCascade() { _cascade.forEach(clearTimeout); _cascade = []; }

function showReveal(recolte, titre) {
  /* Trié par valeur croissante, et sur une copie : `recolte` appartient à
     l'appelant — la Forge, le Calcul rapide, un tirage — qui peut s'en servir
     après coup, et le réordonner dans son dos serait une surprise désagréable.

     L'ordre de pioche n'apprend rien à personne ; l'ordre numérique, lui, rend
     un paquet de cent lisible d'un coup d'œil, et fait ressortir les suites. */
  const results = [...recolte].sort((a, b) => a.n - b.n);
  const grid = $('#revealGrid');
  /* `dense` ne commande QUE la mise en page — des cartes plus petites et une
     grille qui défile. Elle coupait aussi la cascade : au-delà de vingt cartes
     tout se retournait d'un bloc, et un paquet de cent n'avait pas de
     révélation du tout. Le retournement un à un vaut maintenant pour tous les
     paquets ; c'est le pas qui s'ajuste, pas le principe. */
  const dense = results.length > 20;
  grid.className = 'revealGrid'
    + (results.length === 1 ? ' one' : '')
    + (results.length > 10 && !dense ? ' large' : '')
    + (dense ? ' dense' : '');
  grid.innerHTML = results.map(r => {
    const k = r.ev.rarity.key;
    return `<div class="rcard ${r.isNew ? '' : 'dupe'}" data-r="${k}" style="${rc(k)}" data-n="${r.n}">
      <div class="inner">
        <div class="back">🔢</div>
        <div class="face">
          ${r.isNew ? '<span class="tag">NOUVEAU</span>' : ''}
          <span class="dup">${r.isNew ? '' : '×' + r.copies + ' · '}+${r.dust}✨</span>
          <div class="n">${fmt(r.n)}</div>
          <div class="rr">${r.ev.rarity.label}</div>
          <div class="nick">${r.ev.nickname || ''}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.rcard').forEach(c => {
    c.addEventListener('click', () => {
      if (c.classList.contains('flip')) openModal(+c.dataset.n);
      else c.classList.add('flip');
    });
  });

  const best = results.reduce((a, r) => r.ev.rarity.idx > a.ev.rarity.idx ? r : a, results[0]);
  $('#revealTitle').textContent = titre || (results.length === 1 ? 'Tirage simple' : `Paquet de ${results.length}`);
  const nNew = results.filter(r => r.isNew).length;
  const dust = results.reduce((a, r) => a + r.dust, 0);
  $('#revealSummary').innerHTML =
    `${nNew} nouveau${nNew > 1 ? 'x' : ''} · +${fmt(dust)} ✨ · meilleur : <b style="color:var(--r-${best.ev.rarity.key})">${best.ev.rarity.label}</b>`;

  /* C'est sur un paquet de cent qu'on a le plus envie d'écourter : le bouton
     est donc proposé dès qu'il y a plus d'une carte. */
  $('#revealSkip').style.display = results.length > 1 ? '' : 'none';
  $('#reveal').classList.add('on');

  /* LE PAS DE LA CASCADE. Il se resserre quand le paquet grossit, et la durée
     totale est bornée : un paquet de dix se déroule en une seconde, un paquet
     de cent en moins de trois. Sans ce plafond, cent cartes à 35 ms auraient
     fait attendre trois secondes et demie sans rien apporter de plus. */
  const cards = [...grid.children];
  const pas = Math.min(Math.max(35, 130 - results.length * 6),
                       CASCADE_DUREE_MAX / Math.max(1, results.length));
  annulerCascade();
  cards.forEach((c, i) => _cascade.push(
    setTimeout(() => c.classList.add('flip'), 260 + i * pas)));

  results.filter(r => r.ev.rarity.idx >= 4).slice(0, 5).forEach(r => {
    setTimeout(() => toast(`${r.ev.rarity.idx === 5 ? '🌠' : '✨'} <b>${fmt(r.n)}</b> — ${r.ev.rarity.label}${r.ev.nickname ? ' · ' + r.ev.nickname : ''}`, 'gold'), 700);
  });
}

function closeReveal() {
  /* Pendant la visite, on ne referme pas ce qu'elle est en train de montrer.
     Le refus vaut pour toutes les portes : le bouton, la touche Échap et le
     retour arrière passent tous par ici. */
  if (typeof visiteRetientRecap === 'function' && visiteRetientRecap()) {
    toast("Regardez votre prise — la visite vous dira quand refermer.", 'bad');
    return;
  }
  $('#reveal').classList.remove('on');
  renderAll();
}

/* ============================================================
   COLLECTION
   ============================================================ */
function buildRarityChips() {
  $('#colFilters').innerHTML = RARITIES.map(r =>
    `<button class="chip" data-k="${r.key}" style="--cc:var(--r-${r.key})">${r.label}</button>`).join('');
  $('#colFilters').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const k = b.dataset.k;
    colFilter.has(k) ? colFilter.delete(k) : colFilter.add(k);
    colPage = 1;
    b.classList.toggle('on', colFilter.has(k));
    renderCollection();
  });

  // Deux territoires : ce que le tirage peut donner, et ce qui ne s'obtient qu'à la Forge.
  $('#colTerritoires').innerHTML =
    `<button class="chip terr" data-t="tirage" style="--cc:var(--coin)">🎰 Tirage</button>
     <button class="chip terr" data-t="forge"  style="--cc:var(--dustc)">⚒️ Forge</button>`;
  $('#colTerritoires').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    colTerritoire = colTerritoire === b.dataset.t ? null : b.dataset.t;
    colPage = 1;
    $$('#colTerritoires .chip').forEach(c => c.classList.toggle('on', c.dataset.t === colTerritoire));
    renderCollection();
  });
}

function ownedList() {
  return Object.keys(state.owned).map(k => {
    const n = +k;
    return { n, ev: evaluate(n), rec: state.owned[k] };
  });
}

/* Vue exhaustive : tout le vivier 1..9999, plus les nombres forgés hors vivier
   (0 et au-delà de 9 999). Les manquants sont affichés en creux. */
function collectionList() {
  if (!colAll) return ownedList();
  const out = [];
  for (let n = 1; n <= POOL_MAX; n++) out.push({ n, ev: evaluate(n), rec: state.owned[n] });
  for (const k of Object.keys(state.owned)) {
    const n = +k;
    if (n < 1 || n > POOL_MAX) out.push({ n, ev: evaluate(n), rec: state.owned[k] });
  }
  return out;
}

function renderCollection() {
  const q = $('#colSearch').value.trim();
  const sort = $('#colSort').value;
  let list = collectionList();

  if (colFilter.size) list = list.filter(x => colFilter.has(x.ev.rarity.key));
  if (colTerritoire) list = list.filter(x => forgeable(x.n) === (colTerritoire === 'forge'));
  if (q) list = list.filter(x => String(x.n).includes(q) || (x.ev.nickname || '').toLowerCase().includes(q.toLowerCase()));

  const cop = x => x.rec ? x.rec.copies : 0;
  const cmp = {
    num:    (a, b) => a.n - b.n,
    rarity: (a, b) => b.ev.score - a.ev.score || a.n - b.n,
    copies: (a, b) => cop(b) - cop(a) || a.n - b.n,
    recent: (a, b) => (b.rec ? b.rec.first : 0) - (a.rec ? a.rec.first : 0) || a.n - b.n,
  }[sort];
  list.sort(cmp);

  // statistiques par rareté
  const counts = {};
  ownedList().forEach(x => counts[x.ev.rarity.key] = (counts[x.ev.rarity.key] || 0) + 1);
  const total = uniqueCount(state);
  const nForge = Object.keys(state.owned).filter(k => forgeable(+k)).length;
  $('#colStats').innerHTML =
    `<div style="--cc:var(--accent)">${total - nForge} / ${fmt(POOL_MAX)} tirables · ${((total - nForge) / POOL_MAX * 100).toFixed(1)} %</div>` +
    `<div style="--cc:var(--dustc)">⚒️ ${nForge} forgé${nForge > 1 ? 's' : ''}</div>` +
    RARITIES.map(r => `<div style="--cc:var(--r-${r.key})">${r.label} ${counts[r.key] || 0}${colAll ? ' / ' + POOL[r.key].length : ''}</div>`).join('');

  const grid = $('#colGrid');
  if (!list.length) {
    /* CE QUE L'ORACLE SAVAIT FAIRE, ET QUE PLUS RIEN NE FAISAIT.
       L'onglet Oracle permettait d'interroger n'importe quel entier jusqu'à
       99 999 — y compris ceux qu'on ne possède pas et ceux qui sont au-delà du
       mur. En le retirant, on aurait perdu ça sans le remplacer. La recherche
       de l'Herbier est exactement l'endroit où l'on tape un nombre : quand
       elle ne trouve rien mais qu'on a tapé un entier valide, elle propose sa
       fiche. Un geste de moins qu'un onglet dédié, et au bon endroit. */
    const cherche = /^[0-9]+$/.test(q) ? +q : null;
    const consultable = cherche !== null && cherche >= 0 && cherche <= FORGE_MAX;
    grid.innerHTML = `<div class="empty">
      ${total ? "Aucun nombre ne correspond." : "Collection vide. Direction l'onglet Tirage."}
      ${consultable ? `<br><button class="btn ghost sm" id="colFiche" type="button" style="margin-top:10px">
          Voir la fiche de ${fmt(cherche)}</button>
        <br><span class="tiny">Vous ne l'avez pas — la fiche dit quand même ce qu'il est.</span>` : ''}
    </div>`;
    const fiche = $('#colFiche');
    if (fiche) fiche.addEventListener('click', () => openModal(cherche));
    $('#colMore').innerHTML = '';
    return;
  }

  // Le vivier fait 10 000 cartes : on rend par tranches.
  const shown = list.slice(0, colPage * PAGE);
  grid.innerHTML = shown.map(x => cardHTML(x.n, x.ev, x.rec ? x.rec.copies : 0, !!x.rec)).join('');
  grid.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => openModal(+c.dataset.n)));

  $('#colMore').innerHTML = shown.length < list.length
    ? `<button class="btn ghost" id="btnMore">Afficher plus — ${fmt(shown.length)} / ${fmt(list.length)}</button>`
    : (list.length > PAGE ? `<span class="tiny">${fmt(list.length)} nombres affichés.</span>` : '');
  const more = $('#btnMore');
  if (more) more.addEventListener('click', () => { colPage++; renderCollection(); });
}

/* Une tuile carrée, et rien d'autre que le nombre. La couleur porte déjà la
   rareté ; le surnom et les pictos de traits saturaient une grille qui compte
   jusqu'à dix mille cases. Tout le détail reste au survol et au clic. */
function cardHTML(n, ev, copies, owned = true) {
  const k = ev.rarity.key;
  const forge = forgeable(n);          // 0 et au-delà de 9 999 : hors de portée du tirage
  return `<div class="card ${owned ? '' : 'locked'} ${forge ? 'forge' : ''}" data-n="${n}" data-r="${k}" style="${rc(k)}"
               title="${fmt(n)} — ${ev.rarity.label}${ev.nickname ? ' · ' + ev.nickname : ''} — ${forge ? 'obtenu à la Forge' : 'obtenable au tirage'}">
    ${copies > 1 ? `<span class="cop">×${copies}</span>` : ''}
    <span class="n">${fmt(n)}</span>
  </div>`;
}

/* ============================================================
   THÉORÈMES
   ============================================================ */
function renderTheoremes() {
  const b = bonuses();
  const sum = [];
  if (b.coinMult)      sum.push(`+${Math.round(b.coinMult * 100)} % jetons/min`);
  if (b.dustMult)      sum.push(`+${Math.round(b.dustMult * 100)} % poussière`);
  if (b.pullDiscount)  sum.push(`−${Math.round(remiseTheoremes() * 100)} % sur le prix des tirages`);
  if (b.copyBonus)     sum.push(`+${Math.round(b.copyBonus * 100)} % par exemplaire en double`);
  if (b.offlineHours)  sum.push(`+${b.offlineHours} h d'accumulation hors ligne`);
  if (b.forgeDiscount) sum.push(`−${Math.round(b.forgeDiscount * 100)} % sur les aides de la Forge`);
  if (b.luck)          sum.push(`Relance des tirages Communs`);
  $('#bonusSummary').innerHTML = sum.length
    ? sum.map(s => `<div>${s}</div>`).join('')
    : `<div style="border-color:var(--line);background:var(--panel);color:var(--dim)">Aucun bonus actif — démontrez un théorème.</div>`;

  /* Une ligne par théorème, sur le modèle de l'Atelier : à vingt et un
     théorèmes, une grille de cartes obligeait à balayer en deux dimensions
     pour répondre à la seule question qui compte — lesquels sont à portée.
     Empilés, ils se comparent d'un seul coup d'œil, l'avancement dans la même
     colonne pour tous. */
  $('#theoList').innerHTML = COLLECTIONS.map(c => {
    const p = collectionProgress(c);
    const claimed = state.claimed.includes(c.id);
    const cls = claimed ? 'done' : (p.done ? 'ready' : '');
    const manque = p.total - p.have;
    return `<article class="theoLigne ${cls}">
      <div class="theoCorps">
        <span class="theoEmoji" aria-hidden="true">${c.emoji}</span>

        <div class="theoIdent">
          <h3>${c.nom}</h3>
          <p class="theoDesc">${c.desc}</p>
          <span class="theoBonus">🎁 ${c.bonusLabel}</span>
        </div>

        <div class="theoAvance">
          <b>${p.have}<i>/${p.total}</i></b>
          <div class="bar${p.done ? ' leg' : ''}">
            <i style="width:${Math.round(p.have / p.total * 100)}%"></i>
          </div>
          <span>${claimed ? 'démontré' : manque ? `il en manque ${fmt(manque)}` : 'au complet'}</span>
        </div>

        <div class="theoAction">
          ${claimed
            ? `<span class="theoFait">✅ Démontré</span>`
            : p.done
              ? `<button class="btn sm" data-claim="${c.id}">📐 Démontrer</button>`
              : `<span class="theoAttente">à compléter</span>`}
        </div>
      </div>

      <div class="theoNums">${(c.nums || []).map(n => {
        const ev = evaluate(n);
        const have = !!state.owned[n];
        return `<span class="${have ? 'have' : ''}" data-n="${n}" style="${rc(ev.rarity.key)}">${fmt(n)}</span>`;
      }).join('')}</div>
    </article>`;
  }).join('');

  $('#theoList').querySelectorAll('[data-claim]').forEach(btn => btn.addEventListener('click', () => {
    const c = claimCollection(btn.dataset.claim);
    if (c) { toast(`📐 <b>${c.nom}</b> démontré — ${c.bonusLabel}`, 'gold'); save(); renderAll(); }
  }));
  $('#theoList').querySelectorAll('.theoNums span.have').forEach(el =>
    el.addEventListener('click', () => openModal(+el.dataset.n)));
}

/* ============================================================
   DÉFIS & STATS
   ============================================================ */
function renderDefis() {
  $('#defiList').innerHTML = DEFIS.map(d => {
    const done = state.defis.includes(d.id);
    const ready = !done && d.check(state);
    const rw = [d.rw.coins ? `${fmt(d.rw.coins)} 🪙` : '', d.rw.dust ? `${fmt(d.rw.dust)} ✨` : ''].filter(Boolean).join('<br>');
    return `<div class="defi ${done ? 'done' : ''} ${ready ? 'ready' : ''}">
      <span class="em">${d.emoji}</span>
      <div class="txt"><b>${d.nom}</b><small>${d.desc}</small></div>
      ${ready ? `<button class="btn sm" data-defi="${d.id}">Encaisser</button>`
              : `<div class="rw">${done ? '✅' : rw}</div>`}
    </div>`;
  }).join('');

  $('#defiList').querySelectorAll('[data-defi]').forEach(btn => btn.addEventListener('click', () => {
    const d = claimDefi(btn.dataset.defi);
    if (d) { toast(`🏅 <b>${d.nom}</b> validé !`, 'gold'); save(); renderAll(); }
  }));

  const s = state.stats;
  const days = Math.max(1, Math.round((Date.now() - state.started) / 86400000));
  const best = s.bestNum !== null ? `${fmt(s.bestNum)}` : '—';
  $('#statsPanel').innerHTML = [
    ['Tirages', fmt(s.pulls)],
    ['Forges', fmt(s.forges)],
    ['Nombres uniques', fmt(uniqueCount(state))],
    ['Copies totales', fmt(Object.values(state.owned).reduce((a, v) => a + v.copies, 0))],
    ['Jetons gagnés', fmt(s.coinsEarned)],
    ['Poussière gagnée', fmt(s.dustEarned)],
    ['Meilleur nombre', best],
    ['Score record', fmt(s.bestScore) + ' pts'],
    ['Jours de collection', fmt(days)],
    ['Bonnes réponses', fmt(s.bonnesReponses || 0)],
    ['Meilleur examen', fmt(s.meilleureSerie || 0)],
  ].map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join('');
}

/* La démonstration : un calcul posé, ou une phrase quand le calcul n'a pas de sens. */
function proofHTML(t, n, isExample) {
  if (!t.proof || !Number.isInteger(n)) return '';
  let p;
  try { p = t.proof(n); } catch { return ''; }
  if (!p) return '';
  const tag = isExample ? `<b>ex.</b> ` : '';
  return typeof p === 'object'
    ? `<div class="proof note">${tag}${p.note}</div>`
    : `<div class="proof">${tag}${p}</div>`;
}

function traitRowHTML(t, n, isExample) {
  /* UN TRAIT PEUT ÊTRE SANS NOM. Tant que sa quête n'est pas achevée, on
     montre qu'il y a là quelque chose — les points comptent, la rareté est
     déjà acquise — mais on ne dit pas quoi. Le manque est le déclencheur :
     c'est en voyant « ??? » sur un Mythique qu'on va chercher qui sait. */
  if (typeof traitConnu === 'function' && !traitConnu(t.id)) {
    return `<div class="traitRow inconnu">
      <span class="em">❔</span>
      <div class="body">
        <b>Propriété sans nom</b>
        <p>Ce nombre a quelque chose de remarquable, et personne dans la Cité
           ne sait encore le dire. Sa rareté, elle, est déjà comptée.</p>
      </div>
      <span class="pts">+${t.pts}</span>
    </div>`;
  }
  return `<div class="traitRow ${t.culte ? 'culte' : ''}">
    <span class="em">${t.emoji}</span>
    <div class="body">
      <b>${t.label}</b>
      <p>${t.desc}</p>
      ${proofHTML(t, n, isExample)}
    </div>
    <span class="pts ${t.pts ? '' : 'zero'}">${t.pts > 0 ? '+' + t.pts : '—'}</span>
  </div>`;
}

/* ============================================================
   MODALE
   ============================================================ */
/* ============================================================
   MONTRER ET CACHER UNE SURCOUCHE

   `display: none` → `grid` n'anime rien : un élément qui vient d'apparaître
   n'a pas d'état de départ à interpoler. On affiche donc d'abord (`on`), puis
   on anime à l'image suivante (`vu`). Toutes les surcouches du jeu passent par
   ici, sinon la fiche d'un nombre monterait en douceur pendant que la Gare
   apparaîtrait d'un coup — et deux modales qui n'entrent pas de la même façon
   se lisent comme deux jeux.

   Appelée à chaque rendu, elle ne rejoue rien : les classes sont déjà là. */
function montrerSurcouche(boite) {
  if (!boite) return;
  boite.classList.add('on');
  if (boite.classList.contains('vu')) return;
  /* ONGLET EN ARRIÈRE-PLAN : le navigateur gèle requestAnimationFrame. Sans ce
     cas, la surcouche resterait affichée à opacité zéro — invisible, mais
     posée par-dessus la page et avalant les clics. Personne ne regarde : on
     passe directement à l'état final, sans animation. */
  if (document.hidden) { boite.classList.add('vu'); return; }
  requestAnimationFrame(() => {
    if (boite.classList.contains('on')) boite.classList.add('vu');
  });
}
function cacherSurcouche(boite) {
  if (boite) boite.classList.remove('on', 'vu');
}

function openModal(n) {
  /* Une quête demande d'avoir ouvert une fiche : on compte. C'est le seul
     compteur que ce geste alimente, et il ne sert qu'à ça. */
  state.stats.fichesOuvertes = (state.stats.fichesOuvertes || 0) + 1;
  const ev = evaluate(n);
  const rec = state.owned[n];
  const k = ev.rarity.key;
  const inSets = COLLECTIONS.filter(c => c.nums ? c.nums.includes(n) : (c.pred && forgeable(n)));

  /* LA COULEUR DU PALIER COMMANDE TOUTE LA FICHE : bordure, halo, pastille,
     filet de tête. C'est la seule chose qui distingue visuellement un Commun
     d'un Mythique, et c'est ce que le joueur vient voir. */
  $('#modal').style.setProperty('--rc', `var(--r-${k})`);

  /* Les renseignements passent en jetons plutôt qu'en lignes séparées par des
     <br> : trois faits sur une ligne se lisent d'un coup d'œil, trois lignes
     de texte gris se sautent. */
  const jetons = [
    ['🧩', ev.factors],
    ['➗', `${ev.divisors} diviseur${ev.divisors > 1 ? 's' : ''}`],
    ['★', `${ev.score} pts`],
  ];
  if (rec) {
    jetons.push(['📗', `×${rec.copies}`]);
    jetons.push(['🪙', `${fmt(Math.round(ev.rarity.coin * (1 + 0.15 * (Math.min(rec.copies, 25) - 1))))}/min`]);
    jetons.push(['✨', `doublon ${fmt(ev.rarity.dust)}`]);
  }

  $('#modalBox').innerHTML = `
    <button class="modalClose" type="button" aria-label="Fermer">✕</button>
    <header class="mdTete">
      <span class="mdRang">${ev.rarity.label}</span>
      <span class="mdN">${fmt(n)}</span>
      ${ev.nickname ? `<p class="mdSurnom">« ${ev.nickname} »</p>` : ''}
      ${!rec ? '<p class="mdAbsent">Pas encore dans votre herbier.</p>' : ''}
    </header>

    <div class="mdJetons">${jetons.map(([e, t]) =>
      `<span class="mdJeton"><i>${e}</i>${t}</span>`).join('')}</div>

    ${inSets.length ? `<div class="mdTheos">${inSets.map(c =>
      `<span class="mdTheo">${c.emoji} ${c.nom}</span>`).join('')}</div>` : ''}

    <div class="traitList">${ev.traits.map(t => traitRowHTML(t, n)).join('')}</div>`;

  $('#modalBox').querySelector('.modalClose').addEventListener('click', closeModal);
  montrerSurcouche($('#modal'));
}
/* La fermeture rend la main en 200 ms au lieu de couper net : `vu` part
   d'abord (la boîte redescend et s'efface), `on` ensuite (elle disparaît).
   Le garde évite qu'une réouverture rapide se fasse escamoter par la
   temporisation de la fermeture précédente. */
function closeModal() {
  /* UNE MODALE PEUT ÊTRE IMPOSÉE. La partie périmée en est une : elle n'offre
     qu'un seul geste, et la fuir par Échap ou par un clic à côté laisserait le
     joueur sur une sauvegarde que le jeu ne sait plus interpréter. Le drapeau
     vit dans js/nuage.js, seul endroit qui le pose. */
  if (typeof _modaleImposee !== 'undefined' && _modaleImposee) return;
  const m = $('#modal');
  if (!m.classList.contains('on')) return;
  m.classList.remove('vu');
  setTimeout(() => { if (!m.classList.contains('vu')) m.classList.remove('on'); }, 200);
}
