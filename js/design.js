/* ============================================================
   LE SYSTÈME DE DESIGN — PAGE DE DÉVELOPPEMENT

   Une planche de tous les éléments visuels du jeu. On clique sur l'un d'eux,
   un panneau s'ouvre avec ses réglages, on tourne les molettes, et l'aperçu
   change sous les yeux.

   ELLE NE PART PAS EN PRODUCTION. La garde est en haut de `demarrer()` : hors
   de localhost, la page affiche un mot et rien d'autre. Pas de drapeau à
   penser à repasser à `false` avant un déploiement — c'est l'adresse qui
   décide, et on ne peut pas l'oublier.

   ELLE NE MODIFIE JAMAIS `css/style.css`. Les réglages sont écrits dans une
   balise `<style>` de la page, portée par `#dsScene`, donc ils ne touchent que
   l'aperçu. C'est ce qui permet de tout essayer sans rien risquer.

   ET C'EST POURQUOI IL Y A « COPIER LE CSS ». Un réglage qu'on ne peut pas
   reporter dans la feuille est un jouet : le bouton rend les règles modifiées,
   prêtes à coller, et seulement celles qui ont bougé.
   ============================================================ */

/* ---------- les contrôles disponibles ----------
   `couleur` rend un sélecteur de couleur, `plage` un curseur avec son unité,
   `texte` un champ libre, `choix` une liste. Rien de plus : au-delà, on
   fabrique une usine à gaz pour régler un rayon de bordure. */

const DS = [
  /* ============ les jetons de base ============ */
  {
    id: 'palette', nom: 'La palette', famille: 'Fondations',
    note: "Les treize couleurs dont tout le reste est fait. Elles sont posées sur "
        + "la racine : les changer ici change tout l’aperçu d’un coup.",
    racine: true,          // les réglages s'appliquent à :root de l'aperçu
    apercu: () => `<div class="dsSwatches">${
      ['--bg','--bg2','--panel','--panel2','--line','--line2','--txt','--dim','--dim2',
       '--accent','--gold','--coin','--dustc']
      .map(v => `<span class="dsSwatch"><i style="background:var(${v})"></i><b>${v}</b></span>`).join('')}</div>`,
    reglages: [
      { prop: '--bg',     nom: 'Fond',            type: 'couleur', defaut: '#0a0b12' },
      { prop: '--bg2',    nom: 'Fond secondaire', type: 'couleur', defaut: '#10121d' },
      { prop: '--txt',    nom: 'Texte',           type: 'couleur', defaut: '#e8ecf5' },
      { prop: '--dim',    nom: 'Texte atténué',   type: 'couleur', defaut: '#9aa3b8' },
      { prop: '--dim2',   nom: 'Texte discret',   type: 'couleur', defaut: '#6b7288' },
      { prop: '--accent', nom: 'Accent',          type: 'couleur', defaut: '#7c5cff' },
      { prop: '--gold',   nom: 'Or',              type: 'couleur', defaut: '#ffb02e' },
      { prop: '--coin',   nom: 'Jeton',           type: 'couleur', defaut: '#ffd76a' },
      { prop: '--dustc',  nom: 'Poussière',       type: 'couleur', defaut: '#8be9ff' },
    ],
  },

  {
    id: 'raretes', nom: 'Les six raretés', famille: 'Fondations',
    note: "L’échelle qui porte tout le jeu. Chaque palier a sa couleur, et elle "
        + "sert aussi bien aux cartes qu’aux étiquettes et aux rayons.",
    racine: true,
    apercu: () => `<div class="dsSwatches">${
      ['commun','peucommun','rare','epique','legendaire','mythique']
      .map(k => `<span class="dsSwatch"><i style="background:var(--r-${k})"></i><b>${k}</b></span>`).join('')}</div>`,
    reglages: [
      { prop: '--r-commun',     nom: 'Commun',     type: 'couleur', defaut: '#8a93a6' },
      { prop: '--r-peucommun',  nom: 'Peu commun', type: 'couleur', defaut: '#4ec97a' },
      { prop: '--r-rare',       nom: 'Rare',       type: 'couleur', defaut: '#4aa3ff' },
      { prop: '--r-epique',     nom: 'Épique',     type: 'couleur', defaut: '#b567ff' },
      { prop: '--r-legendaire', nom: 'Légendaire', type: 'couleur', defaut: '#ffb02e' },
      { prop: '--r-mythique',   nom: 'Mythique',   type: 'couleur', defaut: '#ff4d6d' },
    ],
  },

  /* ============ les commandes ============ */
  {
    id: 'btn', nom: 'Bouton principal', famille: 'Commandes', cible: '.btn',
    note: "Le bouton plein. Il porte l’accent et une ombre portée colorée.",
    apercu: () => `<button class="btn">Tirer ×10</button>
                   <button class="btn" disabled>Indisponible</button>`,
    reglages: [
      { prop: 'padding',       nom: 'Marge intérieure', type: 'texte', defaut: '11px 20px' },
      { prop: 'border-radius', nom: 'Rayon',            type: 'plage', min: 0, max: 30, unite: 'px', defaut: 12 },
      { prop: 'font-weight',   nom: 'Graisse',          type: 'choix', options: ['400','500','600','700','800'], defaut: '600' },
      { prop: 'background',    nom: 'Fond',             type: 'texte', defaut: 'linear-gradient(135deg, var(--accent), #5b3fd6)' },
      { prop: 'box-shadow',    nom: 'Ombre',            type: 'texte', defaut: '0 6px 18px -8px rgba(124,92,255,.9)' },
      { prop: 'color',         nom: 'Texte',            type: 'couleur', defaut: '#ffffff' },
    ],
  },

  {
    id: 'btnGhost', nom: 'Bouton fantôme', famille: 'Commandes', cible: '.btn.ghost',
    note: "L’action secondaire : un cadre, pas une masse.",
    apercu: () => `<button class="btn ghost">Renoncer</button>
                   <button class="btn ghost sm">Petit</button>
                   <button class="btn ghost danger">Effacer</button>`,
    reglages: [
      { prop: 'background',    nom: 'Fond',    type: 'texte',   defaut: 'var(--panel)' },
      { prop: 'border',        nom: 'Bordure', type: 'texte',   defaut: '1px solid var(--line)' },
      { prop: 'border-radius', nom: 'Rayon',   type: 'plage', min: 0, max: 30, unite: 'px', defaut: 12 },
      { prop: 'color',         nom: 'Texte',   type: 'couleur', defaut: '#e8ecf5' },
    ],
  },

  {
    id: 'btnGold', nom: 'Bouton doré', famille: 'Commandes', cible: '.btn.gold',
    note: "Réservé au geste qui coûte : tirer, forger.",
    apercu: () => `<button class="btn gold big"><b>Tirer ×10</b><small>720 · −10 %</small></button>`,
    reglages: [
      { prop: 'background', nom: 'Fond',  type: 'texte',   defaut: 'linear-gradient(135deg, var(--gold), #e07f16)' },
      { prop: 'box-shadow', nom: 'Ombre', type: 'texte',   defaut: '0 6px 18px -8px rgba(255,176,46,.9)' },
      { prop: 'color',      nom: 'Texte', type: 'couleur', defaut: '#2a1a00' },
      { prop: 'padding',    nom: 'Marge intérieure', type: 'texte', defaut: '15px 34px' },
    ],
  },

  {
    id: 'curseur', nom: 'Curseur', famille: 'Commandes', cible: 'input[type="range"]',
    note: "Celui du fond de page. La pastille est stylée séparément par navigateur.",
    apercu: () => `<div class="fondReglage" style="justify-content:flex-start">
      <label>🖼️ Fond</label><input type="range" min="0" max="100" value="50"><span class="fondVal">50 %</span></div>`,
    reglages: [
      { prop: 'width',            nom: 'Largeur', type: 'plage', min: 60, max: 300, unite: 'px', defaut: 110 },
      { prop: 'height',           nom: 'Épaisseur', type: 'plage', min: 1, max: 14, unite: 'px', defaut: 3 },
      { prop: 'background',       nom: 'Rail',    type: 'texte', defaut: 'var(--line2)' },
      { prop: 'border-radius',    nom: 'Rayon',   type: 'plage', min: 0, max: 99, unite: 'px', defaut: 99 },
    ],
  },

  /* ============ les surfaces ============ */
  {
    id: 'panneau', nom: 'Panneau', famille: 'Surfaces', cible: '.dsPanneau',
    note: "La surface de base — c’est elle sous les lignes de l’Atelier, les "
        + "théorèmes, la porte d’acte. Elle est presque transparente : 4,5 % de blanc.",
    apercu: () => `<div class="dsPanneau"><b>Un panneau</b>
      <p class="tiny" style="margin:6px 0 0;color:var(--dim)">Le fond de page se voit au travers.</p></div>`,
    reglages: [
      { prop: 'background',    nom: 'Fond',    type: 'texte', defaut: 'var(--panel)' },
      { prop: 'border',        nom: 'Bordure', type: 'texte', defaut: '1px solid var(--line)' },
      { prop: 'border-radius', nom: 'Rayon',   type: 'plage', min: 0, max: 34, unite: 'px', defaut: 14 },
      { prop: 'padding',       nom: 'Marge intérieure', type: 'texte', defaut: '14px 16px' },
    ],
  },

  {
    id: 'badge', nom: 'Pastille', famille: 'Surfaces', cible: '.badge',
    note: "Le compteur sur un onglet. Version neutre et version alerte.",
    apercu: () => `<span>Collection <i class="badge">1 229</i></span>
                   <span style="margin-left:18px">Bonus <i class="badge alert">3</i></span>`,
    reglages: [
      { prop: 'font-size',     nom: 'Taille',  type: 'plage', min: 8, max: 18, unite: 'px', defaut: 11 },
      { prop: 'padding',       nom: 'Marge',   type: 'texte', defaut: '1px 6px' },
      { prop: 'border-radius', nom: 'Rayon',   type: 'plage', min: 0, max: 999, unite: 'px', defaut: 999 },
      { prop: 'background',    nom: 'Fond',    type: 'texte', defaut: 'var(--panel2)' },
      { prop: 'color',         nom: 'Texte',   type: 'couleur', defaut: '#9aa3b8' },
    ],
  },

  {
    id: 'barre', nom: 'Barre de progression', famille: 'Surfaces', cible: '.bar',
    note: "Les garanties du tirage, l’avancement des théorèmes.",
    apercu: () => `<div class="bar" style="width:220px"><i style="width:64%"></i></div>
      <div class="bar leg" style="width:220px;margin-top:10px"><i style="width:28%"></i></div>`,
    reglages: [
      { prop: 'height',        nom: 'Épaisseur', type: 'plage', min: 2, max: 24, unite: 'px', defaut: 6 },
      { prop: 'background',    nom: 'Rail',      type: 'texte', defaut: 'var(--panel2)' },
      { prop: 'border-radius', nom: 'Rayon',     type: 'plage', min: 0, max: 99, unite: 'px', defaut: 99 },
    ],
  },

  /* ============ les cartes ============ */
  {
    id: 'carte', nom: 'Carte de collection', famille: 'Cartes', cible: '.card',
    note: "La tuile de l’Herbier. Sa couleur vient de la rareté du nombre.",
    apercu: () => `<div class="dsGrille">${
      ['commun','peucommun','rare','epique','legendaire','mythique'].map((k, i) =>
        `<div class="card" style="--rc:var(--r-${k})"><span class="cardN">${[26,54,20,10,8,1][i]}</span></div>`).join('')}</div>`,
    reglages: [
      { prop: 'border-radius', nom: 'Rayon',   type: 'plage', min: 0, max: 30, unite: 'px', defaut: 8 },
      { prop: 'border',        nom: 'Bordure', type: 'texte', defaut: '1px solid var(--rc, var(--line))' },
      { prop: 'background',    nom: 'Fond',    type: 'texte',
        defaut: 'linear-gradient(160deg, color-mix(in srgb, var(--rc) 16%, transparent), rgba(255,255,255,.02))' },
    ],
  },

  {
    id: 'rayons', nom: 'Rayons de rareté', famille: 'Cartes', cible: '.rcard::before',
    note: "L’irradiation des hauts paliers, à la révélation. Réglez la finesse des "
        + "traits, leur portée et leur intensité — l’aperçu tourne en continu.",
    apercu: () => `<div class="dsRevele">${
      ['epique','legendaire','mythique'].map((k, i) =>
        `<div class="rcard flip" data-r="${k}" style="--rc:var(--r-${k})"><div class="inner"><div class="face">
          <div class="n">${[10,8,1][i]}</div><div class="rr">${k}</div></div></div></div>`).join('')}</div>`,
    reglages: [
      { prop: 'width',      nom: 'Portée',    type: 'plage', min: 120, max: 420, unite: '%', defaut: 250 },
      { prop: 'background', nom: 'Traits',    type: 'texte',
        defaut: 'repeating-conic-gradient(from 0deg, var(--rc) 0deg 1.6deg, transparent 1.6deg 15deg)' },
      { prop: 'animation-duration', nom: 'Tour complet', type: 'plage', min: 4, max: 60, unite: 's', defaut: 22 },
      { prop: 'opacity',    nom: 'Intensité', type: 'plage', min: 0, max: 100, div: 100, defaut: 30 },
    ],
  },

  /* ============ le texte ============ */
  {
    id: 'typo', nom: 'Hiérarchie du texte', famille: 'Texte', cible: '.dsTypo',
    note: "Trois niveaux, et rien de plus : le titre, le corps, l’aparté. "
        + "Le monospace sert aux nombres, jamais aux phrases.",
    apercu: () => `<div class="dsTypo">
      <h3 style="margin:0 0 6px">Les Bâtons de Napier</h3>
      <p style="margin:0 0 6px">Neuf réglettes gravées, et la multiplication devient une lecture en diagonale.</p>
      <p class="tiny" style="margin:0;color:var(--dim2)">2 625 nombres · +14 pts</p>
      <p style="font-family:var(--mono);margin:8px 0 0">1 729 = 1³ + 12³ = 9³ + 10³</p></div>`,
    reglages: [
      { prop: 'font-size',   nom: 'Corps',     type: 'plage', min: 11, max: 22, unite: 'px', defaut: 15 },
      { prop: 'line-height', nom: 'Interligne', type: 'plage', min: 100, max: 220, div: 100, defaut: 155 },
      { prop: 'letter-spacing', nom: 'Approche', type: 'plage', min: -2, max: 6, div: 100, unite: 'em', defaut: 0 },
      { prop: 'color',       nom: 'Couleur',   type: 'couleur', defaut: '#e8ecf5' },
    ],
  },

  {
    id: 'accordeon', nom: 'Ligne dépliante', famille: 'Texte', cible: 'details.docTrait > summary',
    note: "Le Codex des traits. Repliée, elle montre le nom, l’effectif et les points.",
    apercu: () => `<div class="docListe" style="margin:0">
      <details class="docTrait"><summary>
        <span class="docEmoji">🔷</span><span class="docNom">Premier</span>
        <span class="docCompte"><b>1 229</b> <i>12,3 %</i></span><span class="docPts">+5</span>
      </summary><div class="docCorps"><p>Indivisible. Une brique de l’univers.</p></div></details>
      <details class="docTrait" open><summary>
        <span class="docEmoji">👑</span><span class="docNom">Parfait</span>
        <span class="docCompte"><b>4</b> <i>0,04 %</i></span><span class="docPts">+17</span>
      </summary><div class="docCorps"><p>Égal à la somme de ses diviseurs propres.</p></div></details></div>`,
    reglages: [
      { prop: 'padding', nom: 'Marge intérieure', type: 'texte', defaut: '10px 14px' },
      { prop: 'gap',     nom: 'Écart',            type: 'plage', min: 0, max: 30, unite: 'px', defaut: 10 },
    ],
  },
];

/* ============================================================
   LE MOTEUR
   ============================================================ */
const DS_CLE = 'gachanombres.designsystem';
let _dsValeurs = {};        // { idCompo: { prop: valeur } }
let _dsOuvert = null;

const dsCompo = id => DS.find(c => c.id === id);
const dsDefauts = c => Object.fromEntries(c.reglages.map(r => [r.prop, r.defaut]));

/* La valeur telle qu'on l'écrit en CSS : les curseurs portent leur unité et
   leur diviseur, les autres passent tels quels. */
function dsValeurCSS(reglage, brut) {
  if (reglage.type !== 'plage') return brut;
  const n = reglage.div ? (brut / reglage.div) : brut;
  return n + (reglage.unite || '');
}

/* Les règles à appliquer, et rien d'autre : on ne réécrit que ce qui diffère
   du défaut, pour que « copier le CSS » ne rende pas la feuille entière. */
function dsRegles(c) {
  const vals = _dsValeurs[c.id] || {};
  const modifs = c.reglages.filter(r => vals[r.prop] !== undefined && String(vals[r.prop]) !== String(r.defaut));
  if (!modifs.length) return '';
  const corps = modifs.map(r => `  ${r.prop}: ${dsValeurCSS(r, vals[r.prop])};`).join('\n');
  const sel = c.racine ? `#dsScene` : `#dsScene ${c.cible}`;
  return `${sel} {\n${corps}\n}`;
}

function dsAppliquer() {
  const st = document.querySelector('#dsStyle');
  st.textContent = DS.map(dsRegles).filter(Boolean).join('\n\n');
  try { localStorage.setItem(DS_CLE, JSON.stringify(_dsValeurs)); } catch (e) {}
  const n = DS.filter(c => dsRegles(c)).length;
  document.querySelector('#dsModifies').textContent = n ? `${n} composant${n > 1 ? 's' : ''} modifié${n > 1 ? 's' : ''}` : 'aucune modification';
}

/* ---------- le panneau ---------- */
function dsOuvrir(id) {
  _dsOuvert = id;
  const c = dsCompo(id);
  const panneau = document.querySelector('#dsPanneau');
  if (!c) { panneau.classList.remove('on'); panneau.innerHTML = ''; return; }

  const vals = Object.assign(dsDefauts(c), _dsValeurs[c.id] || {});
  const champ = (r) => {
    const v = vals[r.prop];
    if (r.type === 'couleur') {
      return `<input type="color" data-prop="${r.prop}" value="${v}">
              <input type="text" class="dsTexte" data-prop="${r.prop}" data-jumeau="1" value="${v}">`;
    }
    if (r.type === 'plage') {
      return `<input type="range" data-prop="${r.prop}" min="${r.min}" max="${r.max}"
                     step="${r.div ? 1 : 1}" value="${v}">
              <output class="dsVal">${dsValeurCSS(r, v)}</output>`;
    }
    if (r.type === 'choix') {
      return `<select data-prop="${r.prop}">${r.options.map(o =>
        `<option${String(o) === String(v) ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    }
    return `<input type="text" class="dsTexte" data-prop="${r.prop}" value="${v}">`;
  };

  panneau.classList.add('on');
  panneau.innerHTML = `
    <div class="dsPTete">
      <div><span class="dsPFamille">${c.famille}</span><h2>${c.nom}</h2></div>
      <button class="btn ghost sm" id="dsFermer" type="button">Fermer</button>
    </div>
    <p class="dsPNote">${c.note}</p>
    <p class="dsPCible">${c.racine ? 'appliqué à la racine' : `<code>${c.cible}</code>`}</p>

    <div class="dsReglages">${c.reglages.map(r => `<label class="dsReglage">
      <span class="dsRNom">${r.nom}<i>${r.prop}</i></span>
      <span class="dsRChamps">${champ(r)}</span>
    </label>`).join('')}</div>

    <div class="dsPPied">
      <button class="btn ghost sm" id="dsReset" type="button">⟲ Réinitialiser ce composant</button>
      <button class="btn sm" id="dsCopier" type="button">Copier le CSS</button>
    </div>
    <pre class="dsCode" id="dsCode">${dsRegles(c) || '/* rien de modifié */'}</pre>`;

  panneau.querySelector('#dsFermer').addEventListener('click', () => dsOuvrir(null));
  panneau.querySelector('#dsReset').addEventListener('click', () => {
    delete _dsValeurs[c.id];
    dsAppliquer(); dsOuvrir(c.id);
  });
  panneau.querySelector('#dsCopier').addEventListener('click', async () => {
    const t = dsRegles(c) || '';
    try { await navigator.clipboard.writeText(t); dsMot('CSS copié'); }
    catch (e) { dsMot('copie refusée par le navigateur'); }
  });

  panneau.querySelectorAll('[data-prop]').forEach(el => {
    el.addEventListener('input', () => {
      const r = c.reglages.find(x => x.prop === el.dataset.prop);
      _dsValeurs[c.id] = _dsValeurs[c.id] || {};
      _dsValeurs[c.id][r.prop] = el.type === 'range' ? +el.value : el.value;
      /* Le champ texte et le sélecteur de couleur montrent la même valeur :
         bouger l'un doit rafraîchir l'autre, sinon ils se contredisent. */
      panneau.querySelectorAll(`[data-prop="${r.prop}"]`).forEach(f => {
        if (f !== el && f.value !== String(el.value)) f.value = el.value;
      });
      const sortie = el.parentElement.querySelector('output');
      if (sortie) sortie.textContent = dsValeurCSS(r, +el.value);
      dsAppliquer();
      panneau.querySelector('#dsCode').textContent = dsRegles(c) || '/* rien de modifié */';
    });
  });
}

function dsMot(texte) {
  const el = document.querySelector('#dsMot');
  el.textContent = texte; el.classList.add('on');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1800);
}

/* ---------- la planche ---------- */
function dsRendre() {
  const scene = document.querySelector('#dsScene');
  const familles = [...new Set(DS.map(c => c.famille))];
  scene.innerHTML = familles.map(f => `
    <section class="dsFamille">
      <h2>${f}</h2>
      <div class="dsCompos">${DS.filter(c => c.famille === f).map(c => `
        <article class="dsCompo" data-compo="${c.id}" tabindex="0" role="button"
                 aria-label="Régler : ${c.nom}">
          <header><h3>${c.nom}</h3><span class="dsRegler">régler</span></header>
          <div class="dsApercu">${c.apercu()}</div>
        </article>`).join('')}</div>
    </section>`).join('');

  scene.querySelectorAll('.dsCompo').forEach(el => {
    const ouvrir = () => dsOuvrir(el.dataset.compo);
    el.addEventListener('click', ouvrir);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); }
    });
  });
}

function demarrer() {
  /* LA GARDE. Hors développement, la page ne s'assemble pas. C'est l'adresse
     qui décide et non un drapeau : on ne peut pas oublier de le remettre. */
  /* La liste est recopiée ici, et c'est assumé : design.html ne charge pas
     js/config.js, donc `EN_DEV` n'y existe pas. C'est la seule copie. */
  const local = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname)
             || location.protocol === 'file:';
  if (!local) {
    document.body.innerHTML = `<div class="dsHors">
      <h1>Page de développement</h1>
      <p>Le système de design ne s’ouvre qu’en local. Rien à voir ici.</p>
      <p><a href="index.html">Retour au jeu</a></p></div>`;
    return;
  }

  try { _dsValeurs = JSON.parse(localStorage.getItem(DS_CLE)) || {}; } catch (e) { _dsValeurs = {}; }

  dsRendre();
  dsAppliquer();

  document.querySelector('#dsToutReset').addEventListener('click', () => {
    if (!confirm('Réinitialiser TOUS les composants ?')) return;
    _dsValeurs = {};
    dsAppliquer();
    if (_dsOuvert) dsOuvrir(_dsOuvert);
    dsMot('tout est revenu à l’initial');
  });
  document.querySelector('#dsToutCopier').addEventListener('click', async () => {
    const t = DS.map(dsRegles).filter(Boolean).join('\n\n');
    if (!t) return dsMot('rien à copier');
    try { await navigator.clipboard.writeText(t); dsMot('tout le CSS modifié est copié'); }
    catch (e) { dsMot('copie refusée par le navigateur'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') dsOuvrir(null); });
}

demarrer();
