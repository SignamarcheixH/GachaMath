/* ============================================================
   DÉCOR MATHÉMATIQUE

   Des nombres et des identités qui s'écrivent lettre à lettre dans le fond,
   puis s'effacent. Toutes les identités sont exactes : c'est la même promesse
   que le reste du jeu — ici les mathématiques ne sont pas un décor plausible,
   elles sont justes. Un joueur qui vérifie doit tomber juste.

   LA RÈGLE QUI COMMANDE TOUT LE RESTE : une décoration ne se pose jamais sur
   du contenu. Avant chaque apparition, l'emplacement visé est sondé — si un
   texte, une carte ou un panneau s'y trouve, on cherche ailleurs, et on
   renonce si rien n'est libre. Baisser l'opacité aurait été plus simple, mais
   un texte pâle derrière un paragraphe reste un texte derrière un paragraphe.
   Ici la lisibilité ne dépend pas d'un réglage bien choisi : il n'y a
   simplement rien sous le contenu.

   Le fond reste cliquable — chaque clic sur le vide rapporte des jetons — et
   la densité se règle depuis l'onglet Défis.
   ============================================================ */

/* Relevé sur les 45 écouteurs de clic du jeu, plus les surcouches et la
   publicité. Un clic dont la cible appartient à l'un d'eux n'est pas un clic
   sur le fond. Les sélecteurs de publicité sont les seuls critiques : un clic
   payé au bord d'une annonce entraînerait les joueurs à cliquer là, et c'est
   le premier motif de fermeture de compte. */
const ZONES_ACTIVES = [
  'button', 'a', 'input', 'select', 'textarea', 'summary', 'label',
  '[data-tab]', '[data-keep]', '[draggable="true"]',
  '.btn', '.card', '.rcard', '.chip', '.pack', '.piece', '.opBtn', '.jeton',
  '.gCell', '.qCard', '.appTrait', '.tabs', '.topbar',
  '.pub', '.pubVue', '.pubRail', '#pubBas',      // critiques
  '#modal', '#reveal',
].join(',');

const FOND = {
  clicsParMinute: 120,   // au-delà, le clic n'est plus payé
  densiteDefaut: 45,     // 0 à 100, réglable par le joueur
  essaisDePlacement: 30, // tentatives avant de renoncer à poser une décoration
  vitesseFrappe: 55,     // millisecondes par caractère
};

const CLE_DENSITE = 'gachanombres.densiteFond';

/* Identités vraies, toutes vérifiables, et nombres remarquables. */
const DECORS = [
  '6 = 1 + 2 + 3',
  '28 = 1 + 2 + 4 + 7 + 14',
  '496 = 2⁴(2⁵ − 1)',
  '8128 = 2⁶(2⁷ − 1)',
  '1729 = 1³ + 12³ = 9³ + 10³',
  '153 = 1³ + 5³ + 3³',
  '371 = 3³ + 7³ + 1³',
  '9474 = 9⁴ + 4⁴ + 7⁴ + 4⁴',
  '7641 − 1467 = 6174',
  '3³ + 4³ + 5³ = 6³',
  '2³ + 1 = 3²',
  '220 ↔ 284',
  '1 + 2 + … + 36 = 666',
  '1³ + 2³ + … + n³ = (1 + 2 + … + n)²',
  'φ² = φ + 1',
  '355 / 113 ≈ π',
  '2¹⁷ − 1 = 131071',
  '∑ 1/n² = π²/6',
  '1729', '6174', '8128', '496', '28', '153', '2027', '9973', '65537',
  '1 597', '46 368', '3 511', '1 093', '99 999',
];

(function () {
  const moinsDeMouvement = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const couche = document.createElement('div');
  couche.id = 'fondMath';
  couche.setAttribute('aria-hidden', 'true');   // décor : rien à annoncer

  let densite = lireDensite();
  let minuteur = null;
  let _guetteurContenu = null;      // référence gardée : sans elle, il peut être ramassé

  function lireDensite() {
    try {
      const v = parseInt(localStorage.getItem(CLE_DENSITE), 10);
      return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : FOND.densiteDefaut;
    } catch { return FOND.densiteDefaut; }
  }

  /* ---------- sonder l'espace ----------

     Un point est libre s'il ne tombe ni sur un fond peint, ni sur un élément
     qui porte lui-même du texte. La règle est générale : elle ne repose sur
     aucune liste de sélecteurs à tenir à jour au fil des écrans. */
  function porteDuTexte(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  }

  function pointLibre(x, y) {
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    if (el === document.body || el === document.documentElement) return true;
    const st = getComputedStyle(el);
    const f = st.backgroundColor;
    if (f && f !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(f)) return false;
    if (st.backgroundImage && st.backgroundImage !== 'none') return false;
    return !porteDuTexte(el);
  }

  function zoneLibre(x, y, l, h) {
    const m = 10;                       // on s'écarte un peu du contenu voisin
    const pas = Math.max(2, Math.round(l / 55));
    for (let i = 0; i <= pas; i++) {
      const px = x - m + (l + 2 * m) * (i / pas);
      if (!pointLibre(px, y - m)) return false;
      if (!pointLibre(px, y + h / 2)) return false;
      if (!pointLibre(px, y + h + m)) return false;
    }
    return true;
  }

  /* ---------- poser une décoration ---------- */
  function apparaitre() {
    if (densite <= 0 || document.visibilityState !== 'visible') return;

    const texte = DECORS[(Math.random() * DECORS.length) | 0];

    /* Tailles variées, les grandes plus rares : une taille tirée uniformément
       donnerait un fond uniforme, ce qui est exactement ce qu'on ne veut pas. */
    const r = Math.random();
    const taille = Math.round(13 + Math.pow(r, 2.2) * 34);   // 13 à 47 px

    const el = document.createElement('span');
    el.className = 'fondDeco';
    el.style.fontSize = taille + 'px';
    el.textContent = texte;             // on mesure avant d'afficher
    el.style.visibility = 'hidden';
    couche.appendChild(el);
    const l = el.offsetWidth, h = el.offsetHeight;

    let pose = null;
    for (let i = 0; i < FOND.essaisDePlacement && !pose; i++) {
      const x = Math.random() * Math.max(1, innerWidth - l);
      const y = 70 + Math.random() * Math.max(1, innerHeight - h - 110);
      if (zoneLibre(x, y, l, h)) pose = { x, y };
    }
    // Écran chargé : aucun emplacement libre. On renonce, on réessaiera.
    if (!pose) { el.remove(); return; }

    el.style.left = pose.x + 'px';
    el.style.top = pose.y + 'px';
    el.style.visibility = '';
    el.textContent = '';
    el.classList.add('on');

    if (moinsDeMouvement) {             // pas de frappe : le texte est là, point
      el.textContent = texte;
      retirer(el, 4200);
      return;
    }

    let i = 0;
    el._frappe = setInterval(() => {
      el.textContent = texte.slice(0, ++i);
      if (i >= texte.length) {
        clearInterval(el._frappe);
        el._frappe = null;
        retirer(el, 2600 + Math.random() * 2200);
      }
    }, FOND.vitesseFrappe);
  }

  /* Les décorations sont ancrées à la fenêtre, pas au document : elles ne
     défilent pas avec le contenu. Un emplacement libre au moment de la pose
     peut donc se retrouver sous un paragraphe dès que le joueur fait défiler.
     On revérifie, et on efface ce qui est devenu gênant — la règle « rien sous
     le contenu » doit tenir dans le temps, pas seulement à l'instant du choix. */
  function verifierLesPoses() {
    couche.querySelectorAll('.fondDeco:not(.part)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (!zoneLibre(r.left, r.top, r.width, r.height)) {
        if (el._frappe) { clearInterval(el._frappe); el._frappe = null; }
        el.classList.add('part');
        setTimeout(() => el.remove(), 900);
      }
    });
  }

  function retirer(el, delai) {
    setTimeout(() => {
      el.classList.add('part');
      setTimeout(() => el.remove(), 900);
    }, delai);
  }

  /* La cadence suit la densité : environ quatre secondes entre deux
     apparitions au plus calme, un tiers de seconde au plus dense. */
  function cadence() {
    return 4000 - (densite / 100) * 3650;
  }

  function programmer() {
    clearTimeout(minuteur);
    if (densite <= 0) { minuteur = null; return; }
    minuteur = setTimeout(() => { apparaitre(); programmer(); },
                          cadence() * (0.6 + Math.random() * 0.8));
  }

  function arreter() { clearTimeout(minuteur); minuteur = null; }

  function reglerDensite(v) {
    densite = Math.min(100, Math.max(0, v | 0));
    try { localStorage.setItem(CLE_DENSITE, densite); } catch {}
    if (densite <= 0) {
      arreter();
      couche.querySelectorAll('.fondDeco').forEach(e => {
        if (e._frappe) clearInterval(e._frappe);
        e.remove();
      });
    } else if (!minuteur) programmer();
  }
  window.reglerDensiteFond = reglerDensite;
  window.densiteFond = () => densite;

  /* ---------- le clic qui rapporte ---------- */

  /* Les clics payés sont comptés sur une minute glissante. Ce n'est pas de la
     méfiance envers le joueur — il ne triche que contre lui-même — mais le
     classement est déduit des sauvegardes, et un automate de clic fausserait
     le tableau pour tout le monde. Au-delà du plafond le clic répond quand
     même, il ne rapporte simplement plus rien. */
  let horodatages = [];

  function gainDuClic() {
    /* Une seconde de revenu passif : la récompense suit donc la progression au
       lieu de devenir dérisoire en fin de partie ou disproportionnée au début. */
    const parMinute = typeof coinsPerMinute === 'function' ? coinsPerMinute() : 0;
    return Math.max(5, Math.floor(parMinute / 60));
  }

  function clic(ev) {
    if (typeof state === 'undefined' || !state) return;
    const maintenant = Date.now();
    horodatages = horodatages.filter(t => maintenant - t < 60000);
    const paye = horodatages.length < FOND.clicsParMinute;
    if (paye) horodatages.push(maintenant);

    const gain = paye ? gainDuClic() : 0;
    if (gain > 0) {
      state.coins += gain;
      state.stats.coinsEarned = (state.stats.coinsEarned || 0) + gain;
      if (typeof renderWallet === 'function') renderWallet();
      if (typeof save === 'function') save();
    }
    etincelle(ev.clientX, ev.clientY, gain);
  }

  function etincelle(x, y, gain) {
    const el = document.createElement('span');
    el.className = 'fondGain' + (gain ? '' : ' muet');
    el.textContent = gain ? `+${fmt(gain)} 🪙` : '…';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /* ---------- mise en service ---------- */
  document.body.prepend(couche);
  programmer();

  /* Deux façons pour du contenu d'arriver sous une décoration déjà posée : le
     joueur fait défiler la page, ou l'écran se redessine — changement d'onglet,
     manche suivante, résultat d'un tirage. Ne surveiller que le défilement
     laissait passer le second cas, et c'est le plus fréquent. On observe donc
     aussi les mutations de <main>.

     La couche du décor vit hors de <main> : la revérification ne peut pas
     déclencher l'observateur qui l'a appelée. */
  let attenteVerif = null;
  const verifierBientot = () => {
    clearTimeout(attenteVerif);
    attenteVerif = setTimeout(verifierLesPoses, 150);
  };

  window.addEventListener('scroll', verifierBientot, { passive: true });

  const principal = document.querySelector('main');
  if (principal && typeof MutationObserver !== 'undefined') {
    _guetteurContenu = new MutationObserver(verifierBientot);
    _guetteurContenu.observe(principal, { childList: true, subtree: true, attributes: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') programmer(); else arreter();
  });

  document.addEventListener('click', ev => {
    if (ev.target.closest(ZONES_ACTIVES)) return;
    clic(ev);
  });

  /* Le curseur de densité vit dans l'onglet Défis, avec les autres réglages. */
  function cablerCurseur() {
    const c = document.querySelector('#fondDensite');
    if (!c || c.dataset.cable) return;
    c.dataset.cable = '1';
    c.value = densite;
    const etiquette = document.querySelector('#fondDensiteVal');
    const afficher = () => { if (etiquette) etiquette.textContent = c.value + ' %'; };
    afficher();
    c.addEventListener('input', () => { reglerDensite(+c.value); afficher(); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cablerCurseur);
  } else cablerCurseur();
})();
