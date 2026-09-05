/* ============================================================
   RÉVISION — l'examen.

   Une suite de vagues. À chaque vague, quatre nombres de votre
   collection et un trait demandé : un seul des quatre le porte.

   Les cartes sont volontairement anonymes — ni couleur de rareté,
   ni surnom, ni emoji de trait. Sans ça la bonne réponse se lirait
   sur la bordure, et l'on réviserait la palette au lieu des maths.
   Même précaution sur la taille : les leurres sont choisis dans le
   même ordre de grandeur, pour qu'aucun nombre ne dépasse.
   ============================================================ */

const REV_MIN_COLLEC = 25;
const REV_VIES = 3;

/* Le trait « culte » n'est pas une propriété mathématique : hors sujet ici. */
const traitsQuestionnables = () => TRAITS.filter(t => t.id !== 'culte');

const porteLeTrait = (n, id) => evaluate(n).traits.some(t => t.id === id);
const melangeRev = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

/* La difficulté monte par paliers : on n'ouvre les traits subtils qu'une fois
   les évidents digérés. */
const niveauMax = vague => Math.min(4, 1 + Math.floor(vague / 4));

function nouvelleVague() {
  const r = state.revision;
  const owned = Object.keys(state.owned).map(Number);
  if (owned.length < REV_MIN_COLLEC) return null;

  const plafond = niveauMax(r.vague);
  const candidats = melangeRev(traitsQuestionnables().filter(t => t.niveau <= plafond));

  for (const t of candidats) {
    const avec = owned.filter(n => porteLeTrait(n, t.id));
    if (!avec.length) continue;
    const sans = owned.filter(n => !porteLeTrait(n, t.id));
    if (sans.length < 3) continue;

    const bonne = avec[(Math.random() * avec.length) | 0];

    /* Leurres du même ordre de grandeur que la bonne réponse : un nombre à
       deux chiffres au milieu de trois nombres à quatre chiffres serait
       repérable sans rien connaître au trait demandé. */
    const taille = String(bonne).length;
    let vivier = sans.filter(n => String(n).length === taille);
    if (vivier.length < 3) vivier = sans.filter(n => Math.abs(String(n).length - taille) <= 1);
    if (vivier.length < 3) vivier = sans;

    const leurres = melangeRev(vivier).slice(0, 3);
    return { traitId: t.id, bonne, cartes: melangeRev([bonne, ...leurres]) };
  }
  return null;
}

function demarrerRevision() {
  if (uniqueCount(state) < REV_MIN_COLLEC)
    return { error: `L'examen demande au moins ${REV_MIN_COLLEC} nombres différents. Vous en avez ${uniqueCount(state)}.` };

  state.revision = { mode: 'vagues', vague: 0, vies: REV_VIES, serie: 0, question: null, reponse: null, fini: false };
  const q = nouvelleVague();
  if (!q) { state.revision = null; return { error: "Votre collection est trop homogène pour composer une question. Élargissez-la." }; }
  state.revision.question = q;
  return state.revision;
}

/* Renvoie { juste, bonne, trait, choisi } — et fait avancer ou saigner. */
function repondre(n) {
  const r = state.revision;
  if (!r || r.fini || r.reponse !== null) return { error: "Pas de question en attente." };
  if (!r.question.cartes.includes(n)) return { error: "Ce nombre n'est pas proposé." };

  const juste = n === r.question.bonne;
  r.reponse = n;

  if (juste) {
    r.serie++;
    const s = state.stats;
    s.bonnesReponses = (s.bonnesReponses || 0) + 1;
    if (r.serie > (s.meilleureSerie || 0)) s.meilleureSerie = r.serie;   // meilleur examen, pas plus longue série

    const jetons = 30 + 10 * r.vague;
    const poussiere = 5 + 2 * r.vague;
    state.coins += jetons; state.dust += poussiere;
    s.coinsEarned += jetons; s.dustEarned += poussiere;
    return { juste, gainJetons: jetons, gainPoussiere: poussiere };
  }

  /* On ne clôture PAS ici, même à court de vies : le joueur doit d'abord lire
     la correction. C'est le bouton « Voir le bilan » qui met fin à l'examen. */
  r.vies--;
  return { juste: false, bonne: r.question.bonne, choisi: n, derniere: r.vies <= 0 };
}

function vagueSuivante() {
  const r = state.revision;
  if (!r || r.fini) return null;
  r.vague++;
  r.reponse = null;
  const q = nouvelleVague();
  if (!q) { r.fini = true; cloreExamen(r); return null; }
  r.question = q;
  return q;
}

/* Une partie de Vagues achevée compte, comme les autres mini-jeux. */
function cloreExamen(r) {
  if (!r || r.compte) return;
  r.compte = true;
  state.stats.examens = (state.stats.examens || 0) + 1;
}

function quitterRevision() { state.revision = null; }

/* ============================================================
   RENDU
   ============================================================ */
function renderRevision() {
  const zone = $('#revZone');
  const r = state.revision;

  if (!r) {                       // aucun jeu en cours : on présente celui du sélecteur
    zone.innerHTML = accueilDuJeu(jeuChoisi());
    cablerRevision(); cablerCalcul(); cablerExpedition(); return;
  }
  if (r.mode === 'appariement') {                       // l'autre exercice vit dans appariement.js
    zone.innerHTML = r.fini ? appBilanHTML(r) : appHTML(r);
    cablerRevision(); cablerAppariement(); return;
  }
  if (r.mode === 'calcul') {                            // et celui-ci dans calcul.js
    zone.innerHTML = r.fini ? calcBilanHTML(r) : calcHTML(r);
    cablerRevision(); cablerCalcul(); return;
  }
  if (r.mode === 'expedition') {                        // expedition.js
    zone.innerHTML = r.fini ? expBilanHTML(r) : expHTML(r);
    cablerRevision(); cablerExpedition(); return;
  }
  if (r.fini) { zone.innerHTML = revBilanHTML(r); cablerRevision(); return; }

  const t = TRAIT_BY_ID[r.question.traitId];
  const repondu = r.reponse !== null;
  const juste = repondu && r.reponse === r.question.bonne;

  zone.innerHTML = `
    <div class="revBarre">
      <span class="revVague">Vague ${r.vague + 1}</span>
      <span class="revVies">${'❤'.repeat(r.vies)}${'<span class="perdue">❤</span>'.repeat(REV_VIES - r.vies)}</span>
      <span class="tiny">Réussites : <b>${r.serie}</b>${state.stats.meilleureSerie ? ` · record ${state.stats.meilleureSerie}` : ''}</span>
      <span class="tiny">Niveau ${niveauMax(r.vague)} / 4</span>
    </div>

    <div class="revQuestion">
      <div class="revConsigne">Lequel de ces nombres est</div>
      <div class="revTrait">${t.emoji} ${t.label}</div>
      <details class="revDef"><summary>Rappeler la définition</summary><p>${t.desc}</p></details>
    </div>

    <div class="revCartes ${repondu ? 'figees' : ''}">
      ${r.question.cartes.map(n => {
        const bonne = n === r.question.bonne;
        const cls = !repondu ? '' : (bonne ? 'bonne' : (n === r.reponse ? 'mauvaise' : 'neutre'));
        return `<button class="qCard ${cls}" data-rep="${n}" ${repondu ? 'disabled' : ''}>${fmt(n)}</button>`;
      }).join('')}
    </div>

    ${repondu ? `<div class="revVerdict ${juste ? 'ok' : 'ko'}">
      <div class="revVerdictTitre">${juste ? '✅ Exact.' : `❌ Non — c'était ${fmt(r.question.bonne)}.`}</div>
      ${preuveVagueHTML(r.question.bonne, t)}
      ${!juste ? explicationRefusHTML(r.reponse, t) : ''}
      <button class="btn" id="revSuivant">${r.vies > 0 ? 'Vague suivante' : '💀 Plus de vies — voir le bilan'}</button>
    </div>` : ''}

    <div class="revPied">
      <button class="btn ghost sm" id="revQuitter">Abandonner l'examen</button>
    </div>`;
  cablerRevision();
}

function preuveVagueHTML(n, t) {
  const ev = evaluate(n);
  const trait = ev.traits.find(x => x.id === t.id);
  return `<div class="revPreuve">
    <b>${fmt(n)}</b> est ${t.label.toLowerCase()} : ${proofTexte(trait, n) || t.desc}
  </div>`;
}

/* Pourquoi le nombre choisi ne convenait pas : on le décrit tel qu'il est. */
function explicationRefusHTML(n, t) {
  const ev = evaluate(n);
  const autres = ev.traits.filter(x => x.pts > 0 && x.id !== 'culte').slice(0, 4).map(x => x.label);
  return `<div class="revPreuve refus">
    <b>${fmt(n)}</b> ne l'est pas : ${ev.factors}${autres.length ? ` — il est plutôt ${autres.join(', ').toLowerCase()}` : ''}.
  </div>`;
}

/* Réutilise les démonstrations du Codex, en texte brut. */
function proofTexte(trait, n) {
  if (!trait || !trait.proof) return null;
  try { const p = trait.proof(n); return typeof p === 'object' ? p.note : p; }
  catch { return null; }
}

/* Le menu commande l'accueil affiché. Il est mémorisé par appareil : revenir
   sur l'onglet redonne le jeu qu'on y pratiquait. */
const CLE_MINIJEU = 'gachanombres.minijeu';
const JEUX = ['vagues', 'appariement', 'calcul', 'expedition'];

function jeuChoisi() {
  const menu = $('#mjChoix');
  if (menu && JEUX.includes(menu.value)) return menu.value;
  try {
    const m = localStorage.getItem(CLE_MINIJEU);
    if (JEUX.includes(m)) return m;
  } catch {}
  return 'vagues';
}

function accueilDuJeu(jeu) {
  if (jeu === 'calcul') return calcAccueilHTML();       // ne demande aucune collection
  if (jeu === 'expedition') return expAccueilHTML();    // idem

  /* Les deux exercices de traits ont besoin d'une collection : sans nombres,
     il n'y a pas de question à poser. */
  const assez = uniqueCount(state) >= REV_MIN_COLLEC;
  if (!assez) {
    return `<div class="forgeAccueil">
      <div class="forgeAccueilArt">🎓</div>
      <h3>Collection trop courte</h3>
      <p class="tiny" style="color:#ff8a9c">Il vous faut ${REV_MIN_COLLEC} nombres différents
         pour composer des questions. Vous en avez ${uniqueCount(state)}.</p>
      <p class="tiny">Le Calcul rapide, lui, se joue dès maintenant.</p>
    </div>`;
  }

  if (jeu === 'appariement') {
    return `<div class="forgeAccueil">
      <div class="forgeAccueilArt">🔗</div>
      <h3>L'Appariement</h3>
      <p>Dix traits à gauche, dix définitions à droite, dans le désordre.
         Remettez chaque trait en face de la sienne.</p>
      <p class="tiny">Le nom du trait est masqué dans sa définition : impossible de
         deviner sans avoir compris.</p>
      <div class="revChoix">
        <button class="btn big gold" id="appStart"><b>Commencer</b><small>dix paires à reconstituer</small></button>
      </div>
    </div>`;
  }

  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">🎓</div>
    <h3>Les Vagues</h3>
    <p>Une suite de vagues. À chaque vague, <b>quatre nombres de votre collection</b>
       et un trait demandé : un seul des quatre le porte. À vous de le désigner.</p>
    <p class="tiny">Les cartes sont anonymes — ni couleur de rareté, ni surnom, ni emoji.
       La bonne réponse ne se lit que dans le nombre lui-même. Les traits subtils
       n'apparaissent qu'une fois les évidents passés, et vous avez ${REV_VIES} vies.</p>
    <div class="revChoix">
      <button class="btn big" id="revStart"><b>Commencer</b><small>reconnaître un trait parmi quatre nombres</small></button>
    </div>
  </div>`;
}

const revAccueilHTML = () => accueilDuJeu(jeuChoisi());

function revBilanHTML(r) {
  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">${r.serie >= 20 ? '🏆' : r.serie >= 10 ? '🎓' : '📕'}</div>
    <h3>Examen terminé</h3>
    <p><b>${r.serie}</b> bonne${r.serie > 1 ? 's' : ''} réponse${r.serie > 1 ? 's' : ''},
       jusqu'à la vague ${r.vague + 1}${state.stats.meilleureSerie === r.serie && r.serie > 0 ? ' — <b>nouveau record</b>' : ''}.</p>
    <p class="tiny">Meilleur examen : ${state.stats.meilleureSerie || 0} réussites · total toutes sessions : ${state.stats.bonnesReponses || 0}</p>
    <div class="revChoix">
      <button class="btn big" id="revStart"><b>Recommencer</b><small>nouvelle serie de vagues</small></button>
      <button class="btn big gold" id="appStart"><b>L'Appariement</b><small>changer d'exercice</small></button>
    </div>
  </div>`;
}

function cablerMenuMiniJeux() {
  const menu = $('#mjChoix');
  if (!menu || menu.dataset.cable) return;
  menu.dataset.cable = '1';
  menu.value = jeuChoisi();
  menu.addEventListener('change', () => {
    try { localStorage.setItem(CLE_MINIJEU, menu.value); } catch {}
    /* Changer de jeu abandonne la partie en cours : garder deux exercices en
       suspens dans le même onglet donnerait un état impossible à lire. */
    if (typeof calcArreterChrono === 'function') calcArreterChrono();
    state.revision = null;
    save(); renderRevision();
    /* L'Expédition et l'Académie partagent l'onglet : la vue du lieu suit
       l'exercice qu'on vient de choisir. */
    if (typeof poserFondDeLieu === 'function') poserFondDeLieu();
  });
}

function cablerRevision() {
  cablerMenuMiniJeux();
  const menu = $('#mjChoix');
  if (menu && !state.revision) menu.disabled = false;
  else if (menu) menu.disabled = !!state.revision && !state.revision.fini;

  const b = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  b('#revStart', () => {
    const r = demarrerRevision();
    if (r.error) return toast(r.error, 'bad');
    save(); renderRevision();
  });
  b('#revQuitter', () => { quitterRevision(); save(); renderRevision(); });
  b('#appStart', () => {
    const a = demarrerAppariement();
    if (a.error) return toast(a.error, 'bad');
    save(); renderRevision();
  });
  b('#revSuivant', () => {
    const r = state.revision;
    if (r.vies <= 0) { r.fini = true; cloreExamen(r); save(); return renderRevision(); }
    vagueSuivante(); save(); renderRevision();
  });

  $$('#revZone .qCard[data-rep]').forEach(el => el.addEventListener('click', () => {
    const res = repondre(+el.dataset.rep);
    if (res.error) return toast(res.error, 'bad');
    save(); renderRevision(); renderWallet();
    if (res.juste) toast(`✅ +${fmt(res.gainJetons)} 🪙 · +${fmt(res.gainPoussiere)} ✨`, 'good');
  }));
}
