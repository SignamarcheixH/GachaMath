/* ============================================================
   PUBLICITÉ.

   Trois principes, parce qu'une régie mal posée abîme un jeu plus
   qu'elle ne rapporte :

   1. La place est réservée AVANT le chargement. Une annonce qui
      arrive et pousse le contenu vers le bas fait rater un clic —
      c'est le défaut le plus courant et le plus détestable.
   2. Rien près des commandes de jeu. Un clic accidentel compte
      comme un « clic invalide » chez Google, et c'est le premier
      motif de fermeture de compte.
   3. Si le script ne vient pas — bloqueur, hors ligne, identifiant
      absent — l'emplacement se referme proprement. Pas de trou.
   ============================================================ */

/* Aperçu : `?pubs` dans l'adresse dessine les emplacements sans appeler
   quoi que ce soit chez Google. Passer par l'URL plutôt que par un
   interrupteur dans le fichier évite le grand classique — visualiser,
   oublier, et mettre en ligne avec des rectangles de couleur. */
const APERCU = () =>
  (typeof PUB !== 'undefined' && PUB.apercu) || /[?&]pubs(=|&|$)/.test(location.search);

const PUB_ACTIVE = () => !!(typeof PUB !== 'undefined' && (PUB.client || APERCU()));

let _scriptDemande = false;
const _posesFaites = new WeakSet();

/* Le script d'AdSense embarque le CMP configuré dans la console : c'est lui
   qui recueille le consentement européen, et il doit donc se charger avant
   toute annonce — pas après. */
function chargerRegie() {
  if (_scriptDemande || !PUB.client || APERCU()) return;
  _scriptDemande = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(PUB.client);
  s.onerror = () => document.querySelectorAll('.pub').forEach(replierEmplacement);
  document.head.appendChild(s);
}

function replierEmplacement(bloc) {
  bloc.classList.add('vide');
  bloc.innerHTML = '';
}

/* Construit un emplacement : un cadre de hauteur connue, une étiquette, et
   l'unité elle-même. La hauteur est fixée d'avance pour que rien ne bouge. */
function emplacementHTML(nom, format) {
  return `<aside class="pub ${format}" data-pub="${nom}">
    <span class="pubLabel">Publicité</span>
    <div class="pubZone"></div>
  </aside>`;
}

/* La hauteur réservée vient d'une media query : on la lit sur l'élément plutôt
   que de la recopier en JavaScript, sinon l'aperçu finit par annoncer une
   taille et en dessiner une autre. */
function dessinerApercu(bloc) {
  const zone = bloc.querySelector('.pubZone');
  const bas = bloc.classList.contains('bas');
  const h = Math.round(parseFloat(getComputedStyle(zone).minHeight)) || 0;
  const dim = bas
    ? (h <= 60 ? '320 × 50' : '728 × 90 → 970 × 90')
    : '300 × 250 → 336 × 280';
  /* Sous 90 px, trois lignes ne tiennent pas : l'aperçu deviendrait plus haut
     que l'annonce qu'il représente, et montrerait donc l'inverse de ce qu'on
     veut vérifier. On se replie sur une ligne. */
  const court = h < 90;
  zone.innerHTML = court
    ? `<div class="pubApercu court ${bas ? 'bas' : 'lecture'}">
         <b>« ${bloc.dataset.pub} » · ${dim} · ${h} px</b>
       </div>`
    : `<div class="pubApercu ${bas ? 'bas' : 'lecture'}">
         <b>emplacement « ${bloc.dataset.pub} »</b>
         <span>${bas ? 'bandeau horizontal' : 'rectangle'} · ${dim}</span>
         <small>hauteur réservée : ${h} px — le contenu ne bougera pas</small>
       </div>`;
}

let _redessin = null;
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (!APERCU()) return;
    clearTimeout(_redessin);
    _redessin = setTimeout(() => document.querySelectorAll('.pub').forEach(dessinerApercu), 120);
  });
}

function poser(bloc) {
  if (!bloc || _posesFaites.has(bloc)) return;
  const nom = bloc.dataset.pub;
  const unite = (PUB.emplacements || {})[nom];

  if (APERCU()) {                         // visualisation sans script tiers
    _posesFaites.add(bloc);
    dessinerApercu(bloc);
    return;
  }

  if (!PUB.client || !unite) return replierEmplacement(bloc);

  _posesFaites.add(bloc);
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.setAttribute('data-ad-client', PUB.client);
  ins.setAttribute('data-ad-slot', unite);
  ins.setAttribute('data-ad-format', bloc.classList.contains('bas') ? 'horizontal' : 'rectangle');
  ins.setAttribute('data-full-width-responsive', 'true');
  bloc.querySelector('.pubZone').appendChild(ins);

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch { replierEmplacement(bloc); }

  /* Un bloqueur laisse l'unité vide : au bout de trois secondes, on referme
     plutôt que de garder un rectangle mort au milieu de la page. */
  setTimeout(() => {
    if (ins.dataset.adStatus === 'unfilled' || !ins.firstChild) replierEmplacement(bloc);
  }, 3000);
}

/* Rappel visible en bas à gauche, et sortie en un clic. */
function temoinApercu() {
  if (document.querySelector('.pubTemoin')) return;
  const t = document.createElement('div');
  t.className = 'pubTemoin';
  t.innerHTML = '<b>Aperçu des pubs</b> — aucune annonce chargée · <a href="#" style="color:inherit">quitter</a>';
  t.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    location.href = location.pathname + location.hash;
  });
  document.body.appendChild(t);
}

/* ---------- insertion dans le jeu ---------- */
function initPub() {
  if (!PUB_ACTIVE()) return;
  chargerRegie();
  if (APERCU()) temoinApercu();

  // Le bandeau du bas vit sous le contenu, hors de toute zone de jeu.
  const pied = document.querySelector('#pubBas');
  if (pied) { pied.innerHTML = emplacementHTML('bas', 'bas'); poser(pied.firstElementChild); }

  majPubLecture();
}

/* Le rectangle de lecture ne s'affiche que sur les vues où l'on lit. Sur le
   Tirage et la Forge, il n'apparaît jamais. */
function majPubLecture() {
  if (!PUB_ACTIVE()) return;
  const onglet = document.querySelector('#tabs button.on');
  const vue = onglet ? onglet.dataset.tab : '';
  const zone = document.querySelector('#pubLecture');
  if (!zone) return;

  if (!(PUB.vuesLecture || []).includes(vue)) { zone.innerHTML = ''; return; }
  if (zone.firstElementChild) return;                 // déjà en place
  zone.innerHTML = emplacementHTML('lecture', 'lecture');
  poser(zone.firstElementChild);
}
