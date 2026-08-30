/* ============================================================
   APPARIEMENT — dix traits, dix définitions, à remettre en face.

   Les définitions sont fixes, à droite. Les étiquettes se glissent
   d'une ligne à l'autre. À la vérification, les lignes justes se
   verrouillent et l'on continue sur le reste.
   ============================================================ */

const APP_TAILLE = 10;

/* Une définition qui nomme son propre concept ne se devine pas : elle se lit.
   On masque donc les mots distinctifs de l'étiquette avant de l'afficher —
   sans quoi « Fermat pensait qu'ils étaient tous premiers » désignerait le
   Nombre de Fermat sans le moindre effort. */
function defMasquee(t) {
  let d = t.desc;
  for (const mot of t.label.split(/[\s'’\-]+/)) {
    if (mot.length < 4) continue;
    const re = new RegExp(mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*', 'gi');
    d = d.replace(re, '▒▒▒');
  }
  return d;
}

function demarrerAppariement() {
  const owned = Object.keys(state.owned).map(Number);
  // On privilégie les traits dont le joueur possède au moins un exemplaire.
  let pool = traitsQuestionnables().filter(t => owned.some(n => porteLeTrait(n, t.id)));
  if (pool.length < APP_TAILLE) pool = traitsQuestionnables();
  if (pool.length < APP_TAILLE) return { error: "Pas assez de traits pour composer l'exercice." };

  const choisis = melangeRev(pool).slice(0, APP_TAILLE).map(t => t.id);

  /* Un mélange initial qui tomberait juste quelque part serait un cadeau : on
     exige un dérangement complet, aucune étiquette en face de sa définition. */
  let ordre = melangeRev(choisis);
  for (let essai = 0; essai < 60 && !ordre.every((id, i) => id !== choisis[i]); essai++) {
    ordre = melangeRev(choisis);
  }

  state.revision = {
    mode: 'appariement',
    solution: choisis, ordre,
    verrouilles: Array(APP_TAILLE).fill(false),
    verifs: 0, fini: false, sel: null,
  };
  return state.revision;
}

function echangerAppariement(i, j) {
  const r = state.revision;
  if (!r || r.mode !== 'appariement' || r.fini) return { error: "Aucun appariement en cours." };
  if (i === j) return { ok: true };
  if (r.verrouilles[i] || r.verrouilles[j]) return { error: "Cette ligne est déjà validée : elle ne bouge plus." };
  const t = r.ordre[i]; r.ordre[i] = r.ordre[j]; r.ordre[j] = t;
  return { ok: true };
}

function verifierAppariement() {
  const r = state.revision;
  if (!r || r.mode !== 'appariement' || r.fini) return { error: "Aucun appariement en cours." };
  r.verifs++;
  let justes = 0;
  r.ordre.forEach((id, i) => { if (id === r.solution[i]) { r.verrouilles[i] = true; justes++; } });

  if (justes === APP_TAILLE) {
    r.fini = true;
    // Moins on vérifie, plus la récompense tient : deviner par élimination coûte.
    const part = Math.max(0.2, 1 - 0.15 * (r.verifs - 1));
    r.gainJetons = Math.round(1500 * part);
    r.gainPoussiere = Math.round(150 * part);
    state.coins += r.gainJetons; state.dust += r.gainPoussiere;
    state.stats.coinsEarned += r.gainJetons; state.stats.dustEarned += r.gainPoussiere;
    state.stats.appariements = (state.stats.appariements || 0) + 1;
  }
  return { justes, total: APP_TAILLE, fini: r.fini };
}

/* ---------- rendu ---------- */
function appHTML(r) {
  const places = r.verrouilles.filter(v => v).length;
  return `<div class="revBarre">
      <span class="revVague">🔗 Appariement</span>
      <span class="tiny">${places} / ${APP_TAILLE} verrouillées</span>
      <span class="tiny">${r.verifs} vérification${r.verifs > 1 ? 's' : ''}</span>
    </div>

    <p class="tiny appConsigne">
      ${tactile
        ? `Touchez une étiquette, puis une autre, pour les <b>échanger</b>.`
        : `Glissez une étiquette sur une autre pour les <b>échanger</b> — ou cliquez-en une, puis l'autre.`}
      Chaque définition attend le trait qui lui fait face. À la vérification, les lignes justes se verrouillent.
    </p>

    <div class="appairs">
      ${r.ordre.map((id, i) => {
        const t = TRAIT_BY_ID[id];
        const def = TRAIT_BY_ID[r.solution[i]];
        const ok = r.verrouilles[i];
        return `<div class="appRow ${ok ? 'juste' : ''}">
          <button class="appTrait ${ok ? 'verrou' : ''} ${r.sel === i ? 'sel' : ''}"
            ${ok ? 'disabled' : `draggable="true" data-app="${i}"`}>${t.emoji} ${t.label}</button>
          <span class="appLien">${ok ? '✓' : '↔'}</span>
          <div class="appDef">${defMasquee(def)}</div>
        </div>`;
      }).join('')}
    </div>

    <div class="revPied">
      <button class="btn" id="appVerif">Vérifier</button>
      <button class="btn ghost sm" id="revQuitter">Abandonner</button>
    </div>
    <div id="appMsg"></div>`;
}

function appBilanHTML(r) {
  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">${r.verifs === 1 ? '🏆' : r.verifs <= 3 ? '🎓' : '📘'}</div>
    <h3>Les dix paires sont bonnes</h3>
    <p>Réussi en <b>${r.verifs}</b> vérification${r.verifs > 1 ? 's' : ''}${r.verifs === 1 ? ' — du premier coup' : ''}.</p>
    <p class="tiny">+${fmt(r.gainJetons)} 🪙 · +${fmt(r.gainPoussiere)} ✨ · appariements réussis : ${state.stats.appariements || 0}</p>
    <div class="revChoix">
      <button class="btn big gold" id="appStart"><b>Recommencer</b><small>dix autres traits</small></button>
      <button class="btn big" id="revStart"><b>🌊 Les Vagues</b><small>changer d'exercice</small></button>
    </div>
  </div>`;
}

function cablerAppariement() {
  const r = state.revision;
  const echanger = (i, j) => {
    const res = echangerAppariement(i, j);
    if (res.error) return toast(res.error, 'bad');
    r.sel = null; save(); renderRevision();
  };

  $$('#revZone .appTrait[data-app]').forEach(el => {
    const i = +el.dataset.app;
    el.addEventListener('click', () => {
      if (r.sel === null) { r.sel = i; return renderRevision(); }
      if (r.sel === i)    { r.sel = null; return renderRevision(); }
      echanger(r.sel, i);
    });
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(i));
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('drag');
    });
    el.addEventListener('dragend', () => el.classList.remove('drag'));
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('survol'); });
    el.addEventListener('dragleave', () => el.classList.remove('survol'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('survol');
      const src = e.dataTransfer.getData('text/plain');
      if (src !== '') echanger(+src, i);
    });
  });

  const v = $('#appVerif');
  if (v) v.addEventListener('click', () => {
    const res = verifierAppariement();
    if (res.error) return toast(res.error, 'bad');
    save(); renderRevision(); renderWallet();
    if (res.fini) return toast("🔗 Les dix paires sont bonnes !", 'gold');
    const msg = $('#appMsg');
    if (msg) msg.innerHTML = `<div class="gErr">${res.justes} bonne${res.justes > 1 ? 's' : ''} paire${res.justes > 1 ? 's' : ''} sur ${res.total} — les autres sont à revoir.</div>`;
  });
}
