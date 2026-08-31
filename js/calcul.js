/* ============================================================
   LE CALCUL RAPIDE

   Un calcul s'affiche, trois secondes pour répondre. Le gain suit la
   précision : viser juste rapporte plus que viser vite, mais il faut les deux.

   Deux partis pris qui expliquent le reste du fichier :

   1. Les divisions tombent toujours juste. On ne demande pas de taper 3,333 en
      trois secondes — l'expression est régénérée tant qu'elle ne donne pas un
      entier. C'est le générateur qui s'adapte au joueur, pas l'inverse.

   2. Les cartes bonus sont plafonnées à trois par partie. Une carte toutes les
      quatre secondes irait plus vite que le tirage lui-même, et la collection
      cesserait d'être un jeu de patience — or c'est de là que vient sa valeur.
      Les jetons, eux, ne sont pas plafonnés : ils suivent la progression et se
      dépensent.
   ============================================================ */

const CALC = {
  manches: 10,          // longueur d'une partie
  duree: 3000,          // millisecondes pour répondre
  tolerance: 0.05,      // écart relatif en deçà duquel la réponse est « juste »
  portee: 0.50,         // au-delà de cet écart, plus aucun jeton
  cartesMax: 3,         // cartes bonus par partie
};

const CALC_OPS = ['+', '−', '×', '÷'];

/* Évalue en respectant la priorité des opérateurs. Retourne null quand une
   division ne tombe pas juste : c'est le signal de régénérer. */
function calcEvaluer(termes, ops) {
  const T = termes.slice(), O = ops.slice();
  for (let i = 0; i < O.length;) {
    if (O[i] === '×' || O[i] === '÷') {
      const a = T[i], b = T[i + 1];
      if (O[i] === '÷' && (b === 0 || a % b !== 0)) return null;
      T.splice(i, 2, O[i] === '×' ? a * b : a / b);
      O.splice(i, 1);
    } else i++;
  }
  let v = T[0];
  for (let i = 0; i < O.length; i++) v = O[i] === '+' ? v + T[i + 1] : v - T[i + 1];
  return v;
}

/* La difficulté monte avec les manches réussies : d'abord deux termes courts,
   puis trois termes et des nombres plus grands. */
function calcNouvelleExpression(reussies) {
  const troisTermes = reussies >= 3 && Math.random() < 0.55;
  const ampleur = reussies >= 6 ? 40 : reussies >= 2 ? 20 : 12;

  for (let essai = 0; essai < 300; essai++) {
    const n = troisTermes ? 3 : 2;
    const ops = Array.from({ length: n - 1 },
                           () => CALC_OPS[(Math.random() * CALC_OPS.length) | 0]);
    const termes = Array.from({ length: n }, () => 2 + ((Math.random() * ampleur) | 0));
    const v = calcEvaluer(termes, ops);
    if (v === null || !Number.isInteger(v) || v < 0 || v > 99999) continue;
    return { termes, ops, valeur: v };
  }
  return { termes: [7, 8], ops: ['+'], valeur: 15 };     // repli, jamais atteint en pratique
}

const calcTexte = e => e.termes.reduce((s, t, i) => i ? `${s} ${e.ops[i - 1]} ${t}` : String(t), '');

function demarrerCalcul() {
  state.revision = {
    mode: 'calcul',
    manche: 0, reussies: 0, serie: 0, meilleureSerie: 0,
    jetons: 0, cartes: 0, cartesDonnees: 0,
    expr: null, fini: false,
    historique: [],          // une entrée par manche jouée, relue au bilan
  };
  calcMancheSuivante();
  return state.revision;
}

function calcMancheSuivante() {
  const r = state.revision;
  if (!r || r.mode !== 'calcul') return;
  if (r.manche >= CALC.manches) { r.fini = true; return; }
  r.manche++;
  r.expr = calcNouvelleExpression(r.reussies);
  r.debut = Date.now();
}

/* `reponse` vaut null quand le temps est écoulé sans saisie. */
function calcRepondre(reponse) {
  const r = state.revision;
  if (!r || r.mode !== 'calcul' || r.fini) return null;

  const vrai = r.expr.valeur;
  const donnee = Number.isFinite(reponse) ? reponse : null;
  const ecart = donnee === null ? Infinity
                                : Math.abs(donnee - vrai) / Math.max(1, Math.abs(vrai));
  const juste = ecart <= CALC.tolerance;

  /* Cinq secondes de revenu passif pour une réponse parfaite, puis dégressif
     jusqu'à zéro. La récompense suit donc la progression du joueur au lieu de
     devenir dérisoire en fin de partie. */
  const base = Math.max(20, Math.floor(coinsPerMinute() / 12));
  const gain = ecart >= CALC.portee ? 0
             : Math.round(base * (1 - ecart / CALC.portee));

  let carte = null;
  if (juste && r.cartesDonnees < CALC.cartesMax) {
    r.cartesDonnees++;
    carte = acquire(drawFromTier(rollTier()), 'prime');
    r.cartes++;
  }

  if (gain > 0) {
    state.coins += gain;
    state.stats.coinsEarned = (state.stats.coinsEarned || 0) + gain;
    r.jetons += gain;
  }
  if (juste) {
    r.reussies++;
    r.serie++;
    r.meilleureSerie = Math.max(r.meilleureSerie, r.serie);
  } else r.serie = 0;

  const bilan = { texte: calcTexte(r.expr), donnee, vrai, ecart, juste, gain, carte };
  r.historique.push(bilan);

  /* Pas d'écran intermédiaire : la manche suivante part aussitôt. Dix calculs
     d'affilée, sans rien à cliquer entre deux — c'est ce qui fait la tension du
     jeu. Le détail de chaque manche n'est pas perdu pour autant, il est relu au
     bilan, règle de précision comprise. */
  if (r.manche >= CALC.manches) r.fini = true;
  else calcMancheSuivante();
  return bilan;
}

function quitterCalcul() { state.revision = null; }

/* ============================================================
   RENDU
   ============================================================ */
function calcAccueilHTML() {
  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">⚡</div>
    <h3>Le Calcul rapide</h3>
    <p>Un calcul, <b>trois secondes</b>. Plus votre réponse est proche du compte,
       plus vous gagnez — et une réponse à moins de <b>5 %</b> rapporte en plus
       une carte bonus.</p>
    <p class="tiny">Deux ou trois termes, uniquement + − × ÷, et les divisions
       tombent toujours juste. Une partie fait ${CALC.manches} manches ;
       ${CALC.cartesMax} cartes bonus au maximum, pour que la collection reste
       un jeu de patience.</p>
    <div class="revChoix">
      <button class="btn big gold" id="calcStart"><b>Commencer</b><small>${CALC.manches} manches</small></button>
    </div>
  </div>`;
}

function calcHTML(r) {
  const hist = r.historique || [];
  const dernier = hist[hist.length - 1];
  return `<div class="calcZone">
    <div class="calcEntete">
      <span>Manche <b>${r.manche}</b> / ${CALC.manches}</span>
      <span>Série <b>${r.serie}</b></span>
      <span>Gagné <b>${fmt(r.jetons)}</b> 🪙</span>
      <span>Cartes <b>${r.cartes}</b> / ${CALC.cartesMax}</span>
    </div>

    ${chapeletHTML(r)}

    <div class="calcExpr">${calcTexte(r.expr)} =</div>

    <div class="calcBarre"><i id="calcJauge"></i></div>
    <div class="calcSaisie">
      <input type="number" id="calcInput" inputmode="numeric" autocomplete="off"
             placeholder="…" aria-label="Votre réponse">
      <button class="btn" id="calcValider">Valider</button>
    </div>

    <p class="calcRetour ${dernier ? (dernier.juste ? 'bon' : 'rate') : ''}">${
      dernier
        ? `${dernier.texte} = <b>${fmt(dernier.vrai)}</b> — ${
            dernier.donnee === null ? 'pas de réponse'
              : dernier.juste ? `juste, +${fmt(dernier.gain)} 🪙`
              : `${fmt(dernier.donnee)}, ${Math.round(dernier.ecart * 100)} % d'écart`}`
        : `Entrée pour valider. Sans réponse au bout de ${CALC.duree / 1000} s, on passe au suivant.`}</p>

    <div class="calcPied">
      <button class="btn ghost sm" id="calcQuitter">Quitter</button>
    </div>
  </div>`;
}

/* Le chapelet : une perle par manche, verte quand la réponse était dans la
   tolérance, ambre quand elle rapportait encore, rouge quand elle ne valait
   rien. Il donne le retour immédiat que l'écran intermédiaire donnait avant,
   sans rien interrompre. */
function chapeletHTML(r) {
  const perles = [];
  const hist = r.historique || [];
  for (let i = 0; i < CALC.manches; i++) {
    const h = hist[i];
    const etat = !h ? (i === r.manche - 1 ? 'encours' : 'avenir')
               : h.juste ? 'bon' : h.gain > 0 ? 'moyen' : 'rate';
    perles.push(`<i class="${etat}"${h ? ` title="${h.texte} = ${h.vrai}"` : ''}></i>`);
  }
  return `<div class="calcChapelet">${perles.join('')}</div>`;
}

/* Règle de précision.

   L'échelle couvre exactement la portée du barème : à l'extrémité gauche comme
   à droite, le gain est nul. La bande verte est la tolérance qui donne la
   carte. Le joueur voit donc non seulement s'il s'est trompé, mais de combien.

   L'écart est relatif à max(1, |cible|), comme dans le barème : sur une cible
   de 3, se tromper de 1 n'est pas la même faute que sur une cible de 3 000, et
   la règle doit raconter la même chose que le score. */
function calcRegleHTML(rep) {
  const ampleur = Math.max(1, Math.abs(rep.vrai));
  const demi = CALC.portee * ampleur;
  const largeurTolerance = 100 * CALC.tolerance / CALC.portee;

  let position = null, deborde = 0;
  if (rep.donnee !== null && rep.donnee !== undefined) {
    const brut = 50 + 50 * (rep.donnee - rep.vrai) / demi;
    deborde = brut < 0 ? -1 : brut > 100 ? 1 : 0;
    position = Math.min(100, Math.max(0, brut));
  }

  return `<div class="calcRegle">
    <div class="calcVoie">
      <span class="calcBandeTol" style="left:${50 - largeurTolerance / 2}%;width:${largeurTolerance}%"></span>
      <span class="calcCible"></span>
      ${position === null ? ''
        : `<span class="calcMarqueur ${rep.juste ? 'bon' : 'rate'}${deborde ? ' hors' : ''}"
                 style="left:${position}%"
                 title="votre réponse : ${fmt(rep.donnee)}"></span>`}
    </div>
    <div class="calcEchelle">
      <span>${fmt(Math.round(rep.vrai - demi))}</span>
      <span class="calcEchelleCible">${fmt(rep.vrai)}</span>
      <span>${fmt(Math.round(rep.vrai + demi))}</span>
    </div>
  </div>`;
}

function calcBilanHTML(r) {
  const deja = !!r.recapVu;      // déjà déroulé : on ne rejoue pas l'animation
  const lignes = (r.historique || []).map((h, i) => `
    <li class="${h.juste ? 'bon' : h.gain > 0 ? 'moyen' : 'rate'}${deja ? ' vu' : ''}" data-rang="${i}">
      <span class="mancheNo">${i + 1}</span>
      <div class="mancheCorps">
        <div class="mancheTete">
          <span class="mancheCalcul">${h.texte} = <b>${fmt(h.vrai)}</b></span>
          <span class="mancheRep">${h.donnee === null ? 'pas de réponse' : `vous : ${fmt(h.donnee)}`}</span>
        </div>
        ${calcRegleHTML(h)}
      </div>
      <span class="mancheGain">${h.gain > 0 ? `+${fmt(h.gain)}` : '—'}${
        h.carte ? '<i class="mancheCarte">🎁</i>' : ''}</span>
    </li>`).join('');

  const cartes = (r.historique || []).filter(h => h.carte).map(h => h.carte);
  return `<div class="calcBilan">
    <div class="forgeAccueilArt">${r.reussies >= 8 ? '🏆' : r.reussies >= 5 ? '⚡' : '📉'}</div>
    <h3>${r.reussies} réponse${r.reussies > 1 ? 's' : ''} juste${r.reussies > 1 ? 's' : ''} sur ${CALC.manches}</h3>
    <p>Meilleure série : <b>${r.meilleureSerie}</b> — total <b>${fmt(r.jetons)}</b> 🪙</p>

    <ol class="calcRecap" id="calcRecap">${lignes}</ol>

    <div class="calcFin${deja ? ' vu' : ''}" id="calcFin">
      ${cartes.length
        ? `<button class="btn big gold" id="calcOuvrir">
             <b>Ouvrir ${cartes.length} carte${cartes.length > 1 ? 's' : ''} bonus</b>
             <small>récoltée${cartes.length > 1 ? 's' : ''} en chemin</small></button>`
        : `<p class="tiny">Aucune carte bonus cette fois — il faut viser à moins de ${CALC.tolerance * 100} %.</p>`}
      <div class="revChoix">
        <button class="btn big" id="calcStart"><b>Rejouer</b><small>Entrée</small></button>
        <button class="btn ghost" id="calcQuitter"><b>Quitter</b><small>revenir au choix du jeu</small></button>
      </div>
    </div>
  </div>`;
}

/* Déroulé du récapitulatif.

   Les lignes sont révélées par une classe posée en JavaScript, pas par une
   transition CSS : une transition ne progresse pas quand le navigateur ne rend
   pas la page, et le récapitulatif resterait alors invisible pour toujours.
   L'animation d'entrée n'est qu'un ornement posé par-dessus l'état final. */
function deroulerRecap() {
  const liste = $('#calcRecap');
  const r = state.revision;
  if (!liste || !r || r.recapVu) return;

  const lignes = [...liste.children];
  lignes.forEach((li, i) => setTimeout(() => li.classList.add('vu'), 120 + i * 260));
  setTimeout(() => {
    const fin = $('#calcFin');
    if (fin) fin.classList.add('vu');
    if (state.revision) state.revision.recapVu = true;   // une seule fois
  }, 120 + lignes.length * 260);
}

function ouvrirCartesBonus() {
  const r = state.revision;
  if (!r || !r.historique) return;
  const cartes = (r.historique || []).filter(h => h.carte).map(h => h.carte);
  if (!cartes.length) return;
  showReveal(cartes, `Cartes bonus — Calcul rapide`);
}

/* ---------- le compte à rebours ----------
   Il vit hors de la sauvegarde : un chronomètre enregistré puis rechargé trois
   jours plus tard ne veut rien dire. À l'ouverture, une manche sans réponse
   repart donc à zéro. */
let _calcMinuteur = null;
let _calcAnim = null;

function calcArreterChrono() {
  clearTimeout(_calcMinuteur); _calcMinuteur = null;
  cancelAnimationFrame(_calcAnim); _calcAnim = null;
}

function calcLancerChrono() {
  calcArreterChrono();
  const r = state.revision;
  if (!r || r.mode !== 'calcul' || r.fini) return;

  /* Deux gardes qui évitent de perdre une manche sans l'avoir vue.

     renderAll() rejoue tous les rendus à chaque changement d'onglet : sans ce
     test, le compte à rebours repartirait alors que le joueur consulte sa
     Collection, et il perdrait la manche sans jamais l'avoir à l'écran.

     Même raison pour l'onglet du navigateur : on ne décompte pas le temps de
     quelqu'un qui regarde ailleurs. */
  const section = document.querySelector('#tab-minijeux');
  if (!section || !section.classList.contains('on')) return;
  if (document.visibilityState !== 'visible') return;

  r.debut = Date.now();
  const jauge = $('#calcJauge');

  const suivre = () => {
    const reste = Math.max(0, CALC.duree - (Date.now() - r.debut));
    if (jauge) jauge.style.width = (100 * reste / CALC.duree) + '%';
    if (reste > 0) _calcAnim = requestAnimationFrame(suivre);
  };
  suivre();

  /* Au temps écoulé, on soumet ce qui est écrit dans le champ. Valider n'est
     donc utile que pour aller plus vite : un joueur qui a tapé sa réponse mais
     n'a pas eu le temps d'appuyer sur Entrée n'est pas puni pour autant. */
  _calcMinuteur = setTimeout(() => soumettre(), CALC.duree);
}

/* Revenir sur la page relance la manche avec un compte à rebours entier. On
   pourrait déduire le temps écoulé, mais punir une interruption qu'on n'a pas
   choisie serait pire que la légère indulgence que cela accorde. */
document.addEventListener('visibilitychange', () => {
  const r = state && state.revision;
  if (!r || r.mode !== 'calcul' || r.fini) return;
  if (document.visibilityState === 'visible') calcLancerChrono();
  else calcArreterChrono();
});

/* Une seule porte de sortie pour une manche : Entrée, le bouton, ou le temps
   écoulé passent tous par ici. Trois chemins qui feraient chacun leur version
   de « valider » finiraient par diverger. */
function soumettre() {
  const r = state.revision;
  if (!r || r.mode !== 'calcul' || r.fini) return;
  calcArreterChrono();
  const champ = $('#calcInput');
  const saisi = champ ? champ.value.trim() : '';
  calcRepondre(saisi === '' ? null : Number(saisi));
  save(); renderRevision(); renderWallet();
  /* Aucune annonce ici : les cartes gagnées se découvrent au bilan, d'un seul
     coup. Les révéler au fil de l'eau couperait la série de dix. */
}

function cablerCalcul() {
  const r = state.revision;
  const b = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  b('#calcStart', () => { demarrerCalcul(); save(); renderRevision(); });
  b('#calcQuitter', () => { calcArreterChrono(); quitterCalcul(); save(); renderRevision(); });
  b('#calcValider', soumettre);
  b('#calcOuvrir', ouvrirCartesBonus);
  if (r && r.mode === 'calcul' && r.fini) deroulerRecap();

  const champ = $('#calcInput');
  if (champ) champ.focus();

  /* Entrée vaut validation où que soit le curseur : le champ perd le focus au
     moindre clic ailleurs, et devoir le récupérer casserait le rythme. Posé sur
     le document, donc remplacé à chaque rendu plutôt qu'empilé. */
  document.removeEventListener('keydown', _calcEntree);
  if (r && r.mode === 'calcul') document.addEventListener('keydown', _calcEntree);

  if (r && r.mode === 'calcul' && !r.fini) calcLancerChrono();
  else calcArreterChrono();
}

function _calcEntree(e) {
  if (e.key !== 'Enter') return;
  const r = state.revision;
  if (!r || r.mode !== 'calcul') return;
  e.preventDefault();
  if (r.fini) { demarrerCalcul(); save(); renderRevision(); }
  else soumettre();
}
