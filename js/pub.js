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

  /* La balise est déjà dans le HTML des pages : la réinjecter chargerait la
     régie deux fois, ce qui fausse le comptage des impressions. On ne
     l'injecte donc que si elle manque — cas d'une page ajoutée plus tard qui
     aurait oublié la balise. */
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
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
const formatDe = bloc =>
  bloc.classList.contains('bas')  ? 'bas'  :
  bloc.classList.contains('rail') ? 'rail' : 'lecture';

function dessinerApercu(bloc) {
  const zone = bloc.querySelector('.pubZone');
  const f = formatDe(bloc);
  const h = Math.round(parseFloat(getComputedStyle(zone).minHeight)) || 0;
  if (zone.dataset.h === String(h)) return;           // rien n'a changé
  zone.dataset.h = h;
  if (_oeil) _oeil.observe(zone);
  const bas = f === 'bas';
  const dim = f === 'rail' ? '160 × 600'
    : bas ? (h <= 60 ? '320 × 50' : '728 × 90 → 970 × 90')
          : '300 × 250 → 336 × 280';
  /* Sous 90 px, trois lignes ne tiennent pas : l'aperçu deviendrait plus haut
     que l'annonce qu'il représente, et montrerait donc l'inverse de ce qu'on
     veut vérifier. On se replie sur une ligne. */
  const court = h < 90;
  zone.innerHTML = court
    ? `<div class="pubApercu court ${f}">
         <b>« ${bloc.dataset.pub} » · ${dim} · ${h} px</b>
       </div>`
    : `<div class="pubApercu ${f}">
         <b>emplacement « ${bloc.dataset.pub} »</b>
         <span>${f === 'rail' ? 'colonne verticale' : bas ? 'bandeau horizontal' : 'rectangle'} · ${dim}</span>
         <small>hauteur réservée : ${h} px — le contenu ne bougera pas</small>
       </div>`;
}

/* On observe la boîte plutôt que la fenêtre. Un écouteur `resize` rate le cas
   principal : le tout premier dessin, qui a lieu avant que la mise en page ne
   soit stabilisée — l'encadré annonçait alors 50 px sur un bloc de 90.
   `dataset.h` retient la dernière hauteur dessinée, ce qui rend le redessin
   idempotent et empêche l'observateur de se rappeler lui-même en boucle. */
const _oeil = typeof ResizeObserver !== 'undefined'
  ? new ResizeObserver(entrees => entrees.forEach(e => {
      const bloc = e.target.closest('.pub');
      if (bloc) dessinerApercu(bloc);
    }))
  : null;

function poser(bloc) {
  if (!bloc || _posesFaites.has(bloc)) return;
  const nom = bloc.dataset.pub;
  const emp = PUB.emplacements || {};
  const unite = emp[nom] || (nom === 'bas' ? '' : (nom.startsWith('rail') ? emp.rail || emp.lecture : emp.lecture));

  if (APERCU()) {                         // visualisation sans script tiers
    _posesFaites.add(bloc);
    dessinerApercu(bloc);
    return;
  }

  if (!PUB.client || !unite) return replierEmplacement(bloc);

  _posesFaites.add(bloc);
  demanderAnnonce(bloc, unite);
}

/* Construit l'unité, la remplace si elle existait déjà, et demande l'annonce.
   Partagée par la première pose et par le rafraîchissement — les deux doivent
   produire exactement la même chose, sinon une annonce rafraîchie n'aurait pas
   le format de celle qu'elle remplace. */
function demanderAnnonce(bloc, unite) {
  // Replier un emplacement supprime sa zone : sans ce garde-fou, la fonction
  // dépendrait de l'ordre des vérifications faites par l'appelant.
  const zone = bloc.querySelector('.pubZone');
  if (!zone) return;
  zone.innerHTML = '';

  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.setAttribute('data-ad-client', PUB.client);
  ins.setAttribute('data-ad-slot', unite);
  if (formatDe(bloc) === 'rail') {
    /* Une colonne a une taille arrêtée : la déclarer en fixe remplit mieux
       qu'un bloc responsive coincé dans 160 px de large. */
    ins.style.display = 'inline-block';
    ins.style.width = '160px';
    ins.style.height = '600px';
  } else {
    ins.setAttribute('data-ad-format', bloc.classList.contains('bas') ? 'horizontal' : 'rectangle');
    ins.setAttribute('data-full-width-responsive', 'true');
  }
  zone.appendChild(ins);

  const suivi = _suivi.get(bloc) || { demandes: 0, dernier: 0 };
  suivi.demandes++;
  suivi.dernier = Date.now();
  _suivi.set(bloc, suivi);

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


/* ============================================================
   RAFRAÎCHISSEMENT

   Le jeu est une application d'une seule page : sans rafraîchissement, les
   annonces se chargent une fois et ne bougent plus, que la partie dure deux
   minutes ou deux heures.

   Le déclencheur est le changement d'onglet — une vraie navigation, qui a sa
   propre adresse et résulte d'un geste du joueur. Jamais un minuteur : une
   annonce renouvelée sur une page que personne ne regarde produit des
   impressions sans audience, ce que la détection de trafic invalide cherche
   précisément, et c'est un motif de fermeture de compte.

   `pourquoiPas` retourne la raison du refus plutôt qu'un booléen : c'est ce
   qui rend la règle vérifiable de l'extérieur, et lisible quand on se demande
   six mois plus tard pourquoi un emplacement ne bouge pas.
   ============================================================ */
const _suivi = new WeakMap();

const surcouchePresente = () =>
  !!document.querySelector('#reveal.on, #modal.on');

/* Visible signifie « une partie du cadre est réellement dans la fenêtre ».
   Un onglet masqué a un cadre de taille nulle : il est donc écarté d'office. */
function dansLaFenetre(bloc) {
  const r = bloc.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  return r.bottom > 0 && r.top < (window.innerHeight || 0);
}

function pourquoiPas(bloc, maintenant = Date.now()) {
  const reg = PUB.rafraichissement || {};
  if (!reg.actif) return 'désactivé';
  if (APERCU() || !PUB.client) return 'pas de régie';
  if (bloc.classList.contains('vide')) return 'emplacement replié';
  if (document.visibilityState !== 'visible') return 'onglet du navigateur en arrière-plan';
  if (surcouchePresente()) return 'une surcouche masque la page';
  if (!dansLaFenetre(bloc)) return 'hors de la fenêtre';

  const suivi = _suivi.get(bloc);
  if (!suivi) return 'jamais posé';
  if (suivi.demandes >= (reg.maxParVisite || 10)) return 'plafond de la visite atteint';
  const ecoule = (maintenant - suivi.dernier) / 1000;
  if (ecoule < (reg.delaiMin || 60)) return `trop tôt (${Math.round(ecoule)} s)`;
  return null;
}

function rafraichirVisibles() {
  document.querySelectorAll('.pub').forEach(bloc => {
    if (pourquoiPas(bloc)) return;
    const nom = bloc.dataset.pub;
    const emp = PUB.emplacements || {};
    const unite = emp[nom] || (nom === 'bas' ? '' : (nom.startsWith('rail') ? emp.rail || emp.lecture : emp.lecture));
    if (unite) demanderAnnonce(bloc, unite);
  });
}

/* ---------- insertion dans le jeu ---------- */
/* ============================================================
   RETRAIT DU CONSENTEMENT

   La CMP de Google s'affiche toute seule à la première visite : elle est
   livrée par le script de la régie, rien à intégrer. En revanche elle
   n'ajoute aucun moyen de revenir sur son choix — c'est à nous de le poser.

   Ce n'est pas décoratif. Le RGPD exige que retirer son consentement soit
   aussi simple que de le donner, et notre page de confidentialité annonce
   explicitement un lien en bas de page.

   Le lien n'apparaît que si la CMP s'est réellement chargée, ce qui n'arrive
   que pour les visiteurs concernés par la réglementation européenne. Ailleurs,
   il n'y a pas de consentement à retirer, et un lien qui n'ouvrirait rien
   serait pire que pas de lien du tout.
   ============================================================ */
function lienConsentement() {
  const pied = document.querySelector('.pied');
  if (!pied || pied.querySelector('.gestionConsentement')) return;

  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => {
    const sep = document.createElement('span');
    sep.textContent = '·';
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'gestionConsentement';
    a.textContent = 'Gérer mon consentement';
    a.addEventListener('click', e => {
      e.preventDefault();
      if (window.googlefc && typeof googlefc.showRevocationMessage === 'function') {
        googlefc.showRevocationMessage();
      }
    });
    pied.append(sep, a);
  }});
}

function initPub() {
  if (!PUB_ACTIVE()) {
    /* Le cas le plus courant : on regarde la page sans « ?pubs » alors qu'aucun
       identifiant éditeur n'est renseigné. Rien ne s'affiche, et c'est normal —
       autant le dire plutôt que de laisser chercher. */
    if (!PUB.client) console.info(
      'Publicité : aucun identifiant dans js/config.js. Ajoutez « ?pubs » à ' +
      "l'adresse pour visualiser les emplacements.");
    return;
  }
  chargerRegie();
  lienConsentement();
  if (APERCU()) temoinApercu();

  /* Un index.html gardé en cache n'a pas les ancres par onglet : on verrait le
     bandeau du bas et rien dans les vues, sans le moindre message. */
  if (document.querySelector('#tabs') && !document.querySelector('.pubVue')) {
    console.warn('Publicité : aucune ancre .pubVue dans la page. Le HTML servi ' +
                 'est probablement une version en cache — rechargez sans cache.');
  }

  // Le bandeau du bas vit sous le contenu, hors de toute zone de jeu.
  const pied = document.querySelector('#pubBas');
  if (pied) { pied.innerHTML = emplacementHTML('bas', 'bas'); poser(pied.firstElementChild); }

  poserRails();
  majPubVue();

  /* Franchir le seuil en redimensionnant construit ce qui manque, une fois.
     On ne démonte jamais l'autre : détruire un emplacement pour le remettre
     plus tard rachèterait une annonce à chaque aller-retour. Celui qui ne
     sert plus est simplement masqué par la feuille de style.

     On observe la boîte du document plutôt que d'écouter `change` sur la
     media query : l'événement ne se déclenche pas dans tous les contextes, et
     s'en remettre à lui laissait une fenêtre élargie sans aucune annonce dans
     le contenu — les colonnes étaient permises mais jamais construites,
     pendant que la feuille de style masquait l'emplacement qu'elles
     remplacent. Les deux constructeurs sont idempotents, l'observateur ne
     peut donc pas s'entretenir en boucle. */
  if (_seuilRails && _seuilRails.addEventListener) {
    _seuilRails.addEventListener('change', () => { poserRails(); majPubVue(); });
  }
}

/* Vrai quand la fenêtre peut loger les colonnes sans rogner le jeu. La règle
   est écrite deux fois — ici et dans la feuille de style — et les deux doivent
   rester d'accord : construire une annonce dans un élément masqué la ferait
   revenir « unfilled ». */
const _seuilRails = typeof matchMedia === 'function'
  ? matchMedia('(min-width: 1650px) and (min-height: 700px)')
  : null;
const RAILS = () => !!(_seuilRails && _seuilRails.matches);

function poserRails() {
  if (!RAILS() || (PUB.rails === false)) return;
  document.querySelectorAll('.pubRail').forEach(rail => {
    if (rail.firstElementChild) return;               // déjà en place
    rail.innerHTML = emplacementHTML(rail.dataset.pub, 'rail');
    poser(rail.firstElementChild);
  });
}

/* Chaque onglet a son emplacement, posé à un endroit choisi pour lui — jamais
   au-dessus d'un établi de Forge ni contre le bouton « Tirer ».

   Il est construit à la première ouverture de l'onglet, et plus jamais touché
   ensuite. Deux raisons, et la seconde compte davantage que la première :

   1. Une annonce poussée dans un conteneur masqué se dessine en 0×0 et revient
      « unfilled » — il faut donc attendre que l'onglet soit visible.
   2. Détruire puis reconstruire l'emplacement à chaque passage vaudrait une
      nouvelle requête publicitaire par aller-retour. Des impressions que
      personne ne voit, un taux de clic écrasé, et un profil de trafic qui
      ressemble à s'y méprendre à du trafic invalide — le motif de fermeture de
      compte le plus courant après le clic accidentel. On paie donc une
      requête par onglet et par chargement de page, pas une par visite.
   ============================================================ */
function majPubVue() {
  if (!PUB_ACTIVE()) return;
  const onglet = document.querySelector('#tabs button.on');
  if (!onglet) return;                                // page de contenu : rien à faire
  const vue = onglet.dataset.tab;

  // Un changement d'onglet est une navigation : les emplacements déjà en
  // place et toujours visibles peuvent redemander une annonce.
  rafraichirVisibles();

  /* Filet : si la fenêtre a été élargie sans qu'aucun événement ne nous
     parvienne, un simple changement d'onglet rétablit les colonnes. Les deux
     constructeurs sont idempotents, l'appel ne coûte rien. */
  poserRails();

  if (RAILS() && PUB.rails !== false) return;          // les colonnes s'en chargent

  const autorisees = PUB.vues || [];
  if (!autorisees.includes(vue)) return;

  const zone = document.querySelector(`.pubVue[data-vue="${vue}"]`);
  if (!zone || zone.firstElementChild) return;        // absent, ou déjà en place
  /* Une vue qui s'ouvre sur une liste demande un bandeau : un rectangle de
     250 px repousserait tout le contenu sous la ligne de flottaison, et on
     n'ouvre pas sa collection pour regarder une annonce. */
  zone.innerHTML = emplacementHTML(vue, zone.dataset.format || 'lecture');
  poser(zone.firstElementChild);
}

