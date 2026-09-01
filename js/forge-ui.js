/* ============================================================
   FORGE — l'établi.
   Un clic sur une pièce, un clic sur un opérateur, un clic sur une
   seconde pièce. Les deux pièces fusionnent en une nouvelle, qui
   redevient combinable. Aucun symbole à connaître d'avance.
   ============================================================ */

function renderForge() {
  const zone = $('#forgeZone');
  const c = cmd();

  if (!c) { zone.innerHTML = accueilForgeHTML(); cablerForge(); return; }

  const cibleEv = evaluate(c.cible);
  const vivantes = piecesVivantes();
  const gagne = cibleAtteinte();
  const outils = OPS_OUTILS.filter(o => uniqueCount(state) >= o.unlock);

  zone.innerHTML = `
    <div class="commande ${gagne ? 'gagne' : ''}" style="${rc(cibleEv.rarity.key)}">
      <div class="cmdLabel">Cible</div>
      <div class="cmdCible">${fmt(c.cible)}</div>
      <div class="cmdMeta">
        <span class="rr">${cibleEv.rarity.label}</span>
        ${cibleEv.nickname ? `<span class="nick">« ${cibleEv.nickname} »</span>` : ''}
        <span class="tiny">${state.owned[c.cible] ? 'déjà possédé' : 'inédit'}</span>
      </div>
      ${gagne ? `<div class="cmdGagne">✅ Le compte est bon.</div>` : ''}
      <div class="cmdPrime">Récompense : la cible ${cartesBonus(c)
        ? `+ <b>${cartesBonus(c)}</b> carte${cartesBonus(c) > 1 ? 's' : ''} bonus`
        : `<span class="tiny">(plus aucune carte bonus — indices épuisés)</span>`}${
        c.indices ? ` <span class="tiny">· ${c.indices} indice${c.indices > 1 ? 's' : ''} utilisé${c.indices > 1 ? 's' : ''}</span>` : ''}</div>
    </div>

    ${c.guide ? guideHTML(c) : `
    <div class="etabli">
      <div class="etabliHead">
        <h3>Établi</h3>
        <span class="tiny">${selA === null ? 'Choisissez une pièce.' : (selOp === null ? 'Choisissez un opérateur.' : 'Choisissez la seconde pièce.')}</span>
      </div>
      <div class="pieces">${vivantes.map(p => pieceHTML(p, c.cible)).join('')}</div>

      <div class="opBar">
        ${OPS_BASE.map(o => opHTML(o)).join('')}
        ${outils.length ? `<span class="opSep" title="Instruments de spécialiste — jamais nécessaires pour résoudre une commande">outils</span>` : ''}
        ${outils.map(o => opHTML(o)).join('')}
      </div>

      ${c.etapes.length ? `<ol class="journal">${c.etapes.map(e => `<li>${e.arity === 1
          ? `${e.sym} ${fmt(e.a)}` : `${fmt(e.a)} ${e.sym} ${fmt(e.b)}`} = <b>${fmt(e.res)}</b></li>`).join('')}</ol>` : ''}

      <div class="etabliBtns">
        <button class="btn ghost sm" id="fUndo" ${c.etapes.length ? '' : 'disabled'}>↩ Annuler</button>
        <button class="btn ghost sm" id="fReset" ${c.etapes.length ? '' : 'disabled'}>Recommencer</button>
        <button class="btn sm" id="fGuide" title="Revenir a la grille guidee">🧩 Grille</button>
        <button class="btn ghost sm" id="fRepioche" title="Garde la cible, tire une autre main capable de l'atteindre">🔄 Repiocher — ${fmt(COUT_REPIOCHE())} ✨</button>
        <button class="btn ghost sm" id="fIndice" title="Révèle une étape d'une solution valide">💡 Indice — ${fmt(COUT_INDICE())} ✨</button>
        <button class="btn ghost sm danger" id="fAbandon">Abandonner</button>
      </div>
      <div id="fIndiceOut"></div>
    </div>`}

    ${bilanHTML(c, vivantes, gagne)}`;

  cablerForge();
}

function accueilForgeHTML() {
  const assez = uniqueCount(state) >= MIN_COLLEC;
  return `<div class="forgeAccueil">
    <div class="forgeAccueilArt">⚒️</div>
    <h3>Aucune commande en cours</h3>
    <p>La Forge tire <b>six nombres</b> de votre collection et annonce une cible entre 10 000 et 99 999.
       À vous de l'atteindre en les combinant. Chaque pièce ne sert qu'une fois, mais chaque résultat
       devient une pièce nouvelle.</p>
    <p class="tiny">Toute commande est <b>solvable avec les cinq opérateurs de base</b> — la Forge ne propose
       jamais une cible qu'elle sait hors d'atteinte.</p>
    ${assez
      ? `<button class="btn big" id="fNouvelle"><b>Nouvelle commande</b><small>gratuit, et autant de fois qu'il faut</small></button>`
      : `<p class="tiny" style="color:#ff8a9c">Il vous faut ${MIN_COLLEC} nombres différents pour composer une main. Vous en avez ${uniqueCount(state)}.</p>`}
  </div>`;
}

function pieceHTML(p, cible) {
  const sel = selA === p.id;
  return `<button class="piece ${sel ? 'sel' : ''} ${p.val === cible ? 'cible' : ''}"
    data-piece="${p.id}">${fmt(p.val)}</button>`;
}

function opHTML(o) {
  return `<button class="opBtn ${selOp === o.id ? 'on' : ''}" data-op="${o.id}"
    title="${o.nom}${o.hint ? ' — ' + o.hint : ''}">${o.sym}</button>`;
}

/* Ce qu'on peut emporter : la cible, ou tout autre nombre forgeable construit
   en chemin — « le compte n'est pas bon, mais… ». */
function bilanHTML(c, vivantes, gagne) {
  if (c.fini) return `<div class="bilan"><button class="btn" id="fNouvelle">Nouvelle commande</button></div>`;
  const gardables = vivantes.filter(p => forgeable(p.val));
  if (!gardables.length) return '';
  return `<div class="bilan">
    ${gardables.map(p => {
      const ev = evaluate(p.val);
      const exact = p.val === c.cible;
      return `<button class="btn ${exact ? '' : 'ghost'}" data-keep="${p.val}" style="${rc(ev.rarity.key)}">
        ${exact ? '🏆 Encaisser' : 'Garder'} ${fmt(p.val)} — ${ev.rarity.label}${exact ? '' : ' (sans prime)'}
      </button>`;
    }).join('')}
  </div>`;
}

/* ============================================================
   MODE GUIDÉ — la grille à l'écran.
   Les jetons naissent des lignes complétées : la banque de départ,
   c'est la main, rien d'autre. Un mauvais calcul produit un jeton
   bien réel et parfaitement inutile.
   ============================================================ */
let jetonSel = null;        // jeton choisi au clic (alternative au glisser)
let opSel = null;           // opérateur choisi au clic

function guideHTML(c) {
  const g = c.guide;
  const et = etatGuide();
  const ops = opsGuide();

  const ligneHTML = (l) => {
    const active = l.i === et.courante;
    const cell = (ch, tok, perime, empreinte) => {
      const verrou = verrouille(g, l.i, ch);
      const occupe = tok || perime;
      const cls = perime ? 'perime' : (occupe ? 'pose' : 'trou');
      const txt = perime ? (empreinte !== undefined ? fmt(empreinte) : '✕') : (tok ? fmt(tok.val) : '');
      return `<span class="gCell ${cls} ${verrou ? 'verrou' : ''}"
        ${verrou ? '' : `data-slot="${l.i}:${ch}"`}
        ${!verrou && occupe && !perime ? 'draggable="true"' : ''}
        title="${verrou ? 'Case donnée' : perime
          ? 'Jeton périmé — retirez-le'
          : (occupe ? (tactile ? 'Touchez pour retirer' : 'Clic ou clic droit pour retirer')
                    : 'Déposez un jeton')}"
      >${txt}</span>`;
    };
    const verrouOp = verrouille(g, l.i, 'op');
    const opCell = `<span class="gCell op ${l.op ? 'pose' : 'trou'} ${verrouOp ? 'verrou' : ''}"
      ${verrouOp ? '' : `data-slot="${l.i}:op"`}
      ${!verrouOp && l.op ? 'draggable="true"' : ''}
      title="${verrouOp ? 'Opérateur donné' : 'Déposez un opérateur'}"
    >${l.op ? l.op.sym : ''}</span>`;

    // La case résultat n'est jamais un trou : c'est un objectif, ou ce que vous avez produit.
    let res;
    if (l.perimeA || l.perimeB) {
      res = `<span class="gRes vide">?</span>`;
    } else if (l.res !== null) {
      const cible = l.res === c.cible;
      res = `<span class="gRes ${cible ? 'cible' : ''} ${l.devie ? 'devie' : ''}">${fmt(l.res)}</span>`;
    } else if (l.objectif !== undefined) {
      res = `<span class="gRes objectif" title="Objectif révélé : cette ligne doit produire ce nombre">${fmt(l.objectif)}</span>`;
    } else {
      res = `<span class="gRes vide">?</span>`;
    }

    return `<div class="gLigne ${active ? 'active' : ''} ${l.perimeA || l.perimeB ? 'perimee' : ''}">
      <span class="gNum">${l.i + 1}</span>
      ${cell('a', l.tokA, l.perimeA, l.valA)}${opCell}${cell('b', l.tokB, l.perimeB, l.valB)}
      <span class="gEq">=</span>
      ${res}
      ${l.perimeA || l.perimeB ? `<span class="gAlerte">jeton périmé — retirez-le</span>` : ''}
      ${l.objectif !== undefined && l.res !== null && l.devie
        ? `<span class="gAlerte">attendu ${fmt(l.objectif)}</span>` : ''}
      ${l.refus ? `<span class="gAlerte">${l.refus}</span>` : ''}
    </div>`;
  };

  return `<div class="guide">
    <div class="guideHead">
      <h3>🧩 L'établi</h3>
      <span class="tiny">${tactile
        ? `Touchez un jeton, puis la case où le poser. Chaque ligne complétée
           <b>fabrique un nouveau jeton</b> : le vôtre, juste ou faux.
           Touchez un jeton posé pour le retirer.`
        : `Glissez un jeton dans une case — ou cliquez le jeton, puis la case.
           Chaque ligne complétée <b>fabrique un nouveau jeton</b> : le vôtre, juste ou faux.
           <b>Clic droit</b> sur un jeton posé pour le retirer.`}</span>
    </div>

    <div class="guideLignes">${et.lignes.map(ligneHTML).join('')}</div>

    <div class="banqueHead">Jetons disponibles
      <span class="tiny">${et.dispo.length} libre${et.dispo.length > 1 ? 's' : ''}${et.dispo.some(t => t.ligne >= 0) ? ' · les violets sortent de vos propres calculs' : ''}</span>
    </div>
    <div class="banque">
      ${et.dispo.length
        ? et.dispo.map(t => `<button class="jeton ${t.ligne >= 0 ? 'derive' : ''} ${jetonSel === t.tid ? 'sel' : ''}"
             draggable="true" data-tid="${t.tid}"
             title="${t.ligne >= 0 ? `Produit par la ligne ${t.ligne + 1}` : 'Pièce de la main'}">${fmt(t.val)}</button>`).join('')
        : `<span class="tiny">Plus aucun jeton libre — retirez-en un d'une ligne.</span>`}
    </div>

    <div class="banqueHead">Opérateurs <span class="tiny">réutilisables à volonté</span></div>
    <div class="banque ops">
      ${ops.map(o => `<button class="jeton op ${opSel === o.id ? 'sel' : ''}" draggable="true"
         data-op="${o.id}" title="${o.nom}">${o.sym}</button>`).join('')}
    </div>

    <div class="etabliBtns">
      <button class="btn ghost sm" id="gVider">Tout vider</button>
      <button class="btn ghost sm" id="gIndice" title="Révèle un objectif intermédiaire, puis un opérateur. Partage la prime en deux.">💡 Révéler un indice</button>
      <button class="btn ghost sm" id="fRepioche" title="Garde la cible, tire une autre main capable de l'atteindre">🔄 Repiocher — ${fmt(COUT_REPIOCHE())} ✨</button>
      <button class="btn ghost sm" id="gLibre" title="L'établi sans grille ni nombre d'étapes imposé">↩ Mode libre</button>
      <button class="btn ghost sm danger" id="fAbandon">Abandonner</button>
    </div>
    <div id="gMsg"></div>
    <p class="tiny" style="margin-top:10px">La grille dit combien d'étapes suffisent, et vous en offre quelques-unes.
      Le reste est à trouver : la banque ne contient pas les réponses.${c.aide ? ' <b>Indice utilisé — prime réduite de moitié.</b>' : ''}</p>
  </div>`;
}

function verifierVictoire() {
  if (!cmd() || !cmd().guide || !etatGuide().gagne) return;
  const a = appliquerGuide();
  if (a.error) return toast(a.error, 'bad');
  save(); renderForge();
  toast("✅ Le compte est bon — encaissez votre cible.", 'gold');
}

function cablerGuide() {
  /* Le cycle : vide → + → − → × → ÷ → ‖ → vide. Il repasse par le vide pour
     qu'un clic malheureux se défasse sans avoir à viser la corbeille. */
  const basculerOp = (i, el) => {
    const g = state.commande && state.commande.guide;
    const l = g && g.lignes[i];
    if (!l) return;
    // Le guide stocke l'identifiant de l'opérateur, pas l'objet : c'est l'état
    // dérivé qui le résout pour l'affichage.
    const rang = l.op ? OPS_BASE.findIndex(o => o.id === l.op) : -1;
    /* Un outil (miroir, PGCD…) n'est pas dans le cycle : on entre au début
       plutôt que de le remplacer par un opérateur pris au hasard. */
    const suivant = OPS_BASE[(rang + 1) % (OPS_BASE.length + 1)];
    const r = suivant ? poserGuide(i, 'op', suivant.id) : retirerGuide(i, 'op');
    if (r && r.error) return toast(r.error, 'bad');
    jetonSel = opSel = null;
    save(); renderForge(); verifierVictoire();
  };

  const poser = (slot, tid, isOp) => {
    const [i, ch] = slot.split(':');
    const r = poserGuide(+i, ch, isOp ? tid : +tid);
    if (r.error) return toast(r.error, 'bad');
    jetonSel = opSel = null;
    save(); renderForge(); verifierVictoire();
  };

  $$('#forgeZone .jeton').forEach(el => {
    const isOp = !!el.dataset.op;
    const val = isOp ? el.dataset.op : el.dataset.tid;
    el.addEventListener('click', () => {
      if (isOp) { opSel = opSel === val ? null : val; jetonSel = null; }
      else { jetonSel = jetonSel === +val ? null : +val; opSel = null; }
      renderForge();
    });
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', (isOp ? 'op:' : 'num:') + val);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('drag');
    });
    el.addEventListener('dragend', () => el.classList.remove('drag'));
  });

  $$('#forgeZone .gCell[data-slot]').forEach(el => {
    const slot = el.dataset.slot;
    const attendOp = slot.endsWith(':op');
    const retirer = () => {
      const [i, ch] = slot.split(':');
      retirerGuide(+i, ch); jetonSel = opSel = null; save(); renderForge();
    };
    el.addEventListener('contextmenu', e => {            // clic droit : retrait direct
      if (!el.classList.contains('pose') && !el.classList.contains('perime')) return;
      e.preventDefault(); retirer();
    });
    el.addEventListener('click', () => {
      const [i, ch] = slot.split(':');
      /* Une case d'opérateur fait défiler les cinq usuels d'un clic. Traverser
         la réserve pour + puis − puis × coûtait trois allers-retours à chaque
         essai, alors que le geste utile est d'essayer les quatre à la suite.
         Le glissement reste là pour les outils, et pour les usuels aussi.

         Un opérateur explicitement choisi dans la réserve garde la main : le
         joueur a dit ce qu'il voulait, ce n'est plus une exploration. */
      if (attendOp && opSel === null) return basculerOp(+i, el);
      if (el.classList.contains('pose') || el.classList.contains('perime')) return retirer();
      if (attendOp) return poser(slot, opSel, true);
      if (jetonSel === null) return toast("Choisissez d'abord un jeton.", 'bad');
      poser(slot, jetonSel, false);
    });
    el.addEventListener('dragstart', e => {              // d'une ligne vers une autre
      e.dataTransfer.setData('text/plain', 'move:' + slot);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('drag');
    });
    el.addEventListener('dragend', () => el.classList.remove('drag'));
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('survol'); });
    el.addEventListener('dragleave', () => el.classList.remove('survol'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('survol');
      const data = e.dataTransfer.getData('text/plain');

      if (data.startsWith('move:')) {                     // déplacement, ou échange
        const r = deplacerGuide(data.slice(5), slot);
        if (r.error) return toast(r.error, 'bad');
        jetonSel = opSel = null; save(); renderForge(); verifierVictoire();
        return;
      }
      const estOp = data.startsWith('op:');
      if (estOp !== attendOp) return toast(estOp ? "Un opérateur ne va pas dans une case nombre." : "Il faut un opérateur ici.", 'bad');
      poser(slot, data.slice(estOp ? 3 : 4), estOp);
    });
  });

  const b = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  b('#gVider', () => { viderDepuis(0); jetonSel = opSel = null; save(); renderForge(); });
  b('#gLibre', () => { quitterGuide(); jetonSel = opSel = null; save(); renderForge(); });
  b('#gIndice', () => {
    const r = revelerIndice();
    if (r.error) return toast(r.error, 'bad');
    save(); renderForge();
    $('#gMsg').innerHTML = `<div class="indice">💡 ${r.type === 'objectif'
      ? `La ligne ${r.ligne + 1} doit produire <b>${fmt(r.val)}</b>.`
      : `La ligne ${r.ligne + 1} est une opération <b>${r.sym}</b>.`}</div>`;
  });
}

/* ---------- câblage ---------- */
function cablerForge() {
  const nouvelle = $('#fNouvelle');
  if (nouvelle) nouvelle.addEventListener('click', () => {
    const r = nouvelleCommande();
    if (r.error) return toast(r.error, 'bad');
    selA = selOp = null;
    save(); renderForge();
    toast(`Cible : <b>${fmt(r.cible)}</b> — ${evaluate(r.cible).rarity.label}`, 'gold');
  });

  if (cmd() && cmd().guide) cablerGuide();
  $$('#forgeZone .piece').forEach(el => el.addEventListener('click', () => clicPiece(+el.dataset.piece)));
  $$('#forgeZone .opBtn').forEach(el => el.addEventListener('click', () => clicOp(el.dataset.op)));

  const b = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  b('#fUndo',  () => { annuler(); selA = selOp = null; save(); renderForge(); });
  b('#fReset', () => { recommencer(); selA = selOp = null; save(); renderForge(); });
  b('#fAbandon', () => {
    if (!confirm("Abandonner cette commande ? La cible sera perdue.")) return;
    abandonner(); selA = selOp = null; save(); renderForge();
  });
  b('#fRepioche', () => {
    const r = repiocher();
    if (r.error) return toast(r.error, 'bad');
    selA = selOp = null; save(); renderForge();
    toast("🔄 Nouvelle main — la cible reste atteignable.", 'good');
  });
  b('#fGuide', () => {
    const g = creerGuide();
    if (g.error) return toast(g.error, 'bad');
    jetonSel = null; save(); renderForge();
    toast("🧩 Retour à la grille.", 'good');
  });
  b('#fIndice', () => {
    const r = indice();
    if (r.error) return toast(r.error, 'bad');
    save(); renderForge();
    const p = r.pas;
    $('#fIndiceOut').innerHTML = `<div class="indice">💡 Étape ${r.rang} sur ${r.total} d'une solution :
      <b>${fmt(p.a)} ${p.sym} ${fmt(p.b)} = ${fmt(p.res)}</b></div>`;
  });

  $$('#forgeZone [data-keep]').forEach(el => el.addEventListener('click', () => {
    const r = encaisser(+el.dataset.keep);
    if (r.error) return toast(r.error, 'bad');
    save(); renderAll();
    if (r.exact) {
      toast(`🏆 <b>${fmt(r.n)}</b> — le compte est bon ! ${r.ev.rarity.label} · +${fmt(r.prime)} 🪙 · +${fmt(r.primeDust)} ✨`, 'gold');
      showReveal([r, ...(r.cartes || [])], `Commande réussie — la cible et ${r.cartes.length} carte${r.cartes.length > 1 ? 's' : ''} bonus`);
    } else {
      toast(`${fmt(r.n)} emporté — ${r.ev.rarity.label}, sans prime.`, '');
      openModal(r.n);
    }
  }));
}

function clicPiece(id) {
  const c = cmd();
  if (!c || c.fini) return;

  if (selA === null) { selA = id; renderForge(); return; }
  if (selA === id)   { selA = null; selOp = null; renderForge(); return; }
  if (selOp === null) { selA = id; renderForge(); return; }   // repique sur une autre pièce

  const r = appliquer(selOp, selA, id);
  selA = null; selOp = null;
  if (r.error) { renderForge(); return toast(r.error, 'bad'); }
  save(); renderForge();
  if (r.gagne) toast("✅ Le compte est bon — encaissez votre cible.", 'gold');
}

function clicOp(opId) {
  const c = cmd();
  if (!c || c.fini) return;
  const op = [...OPS_BASE, ...OPS_OUTILS].find(o => o.id === opId);

  if (op.arity === 1) {                       // les outils unaires agissent seuls
    if (selA === null) return toast("Choisissez d'abord une pièce.", 'bad');
    const r = appliquer(opId, selA, null);
    selA = null; selOp = null;
    if (r.error) { renderForge(); return toast(r.error, 'bad'); }
    save(); renderForge();
    if (r.gagne) toast("✅ Le compte est bon — encaissez votre cible.", 'gold');
    return;
  }
  if (selA === null) return toast("Choisissez d'abord une pièce.", 'bad');
  selOp = (selOp === opId) ? null : opId;
  renderForge();
}
