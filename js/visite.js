/* ============================================================
   LA VISITE GUIDÉE — L'ACTE 0, POUR DE BON

   Le tutoriel ne raconte plus, il MONTRE. On assombrit la page, on découpe un
   trou autour de ce dont on parle, et on parle à côté. Le joueur regarde le
   vrai bouton, pas une capture d'écran de bouton.

   COMMENT LE TROU EST FAIT. Pas de masque SVG ni de `clip-path` : un simple
   bloc posé aux dimensions de la cible, avec une ombre portée gigantesque qui
   noircit tout le reste de l'écran. `box-shadow: 0 0 0 9999px` est le seul
   procédé qui marche partout, y compris sur les vieux Safari qui font le gros
   du parc mobile de ce jeu, et il ne coûte pas une couche de composition de
   plus.

   POURQUOI LA VISITE NE SE PERSISTE PAS OUVERTE. `state.acte` suffit à savoir
   qu'elle reste à faire ; rouvrir une surcouche modale par-dessus la page au
   rechargement serait une agression. On recommence l'étape en cours.

   DEUX FAÇONS D'AVANCER :
   — le bouton « Continuer », pour ce qui se lit ;
   — un SIGNAL, pour ce qui se fait. `visiteSignal('tirage')` est appelé par le
     tirage lui-même : l'étape qui attend ce signal ne propose pas de bouton,
     elle attend que le joueur ait vraiment tiré. Un tutoriel qu'on traverse en
     cliquant « suivant » n'apprend rien.
   ============================================================ */

/* UN JOUEUR NEUF A DÉJÀ DE QUOI TIRER : `freshState()` lui donne 1 000 jetons,
   et un ×10 au tarif de départ en coûte 720. L'avance n'est donc PAS un cadeau
   de bienvenue — c'est un filet, versé seulement si le portefeuille ne suffit
   pas (partie reprise à sec, tarif monté avec la collection). Offrir par-dessus
   ce qui est déjà là aurait appris au joueur que les jetons tombent du ciel. */
function completerPourUnTirage() {
  const cout = typeof pullCost === 'function' ? pullCost(10) : 720;
  if (state.coins >= cout) return;
  state.coins = cout;
  save(); renderWallet();
}

const VISITE = [
  /* ---------- la ville ---------- */
  /* DEUX ÉTAPES N'EN FONT PLUS QU'UNE. La seconde pointait le rempart, puis la
     Frontière : le premier était un trait que le plan dessinait lui-même — il
     est maintenant peint dans l'illustration — et la seconde n'est plus un
     bâtiment. Surtout, un lieu fermé ne figure plus sur le plan : à l'acte 0
     il n'y a que trois pastilles, et aucune ne peut illustrer le mur. Ce qu'il
     y avait à dire tient dans le cadre. */
  { vue: 'hub', cible: '.villeCadre', place: 'centre',
    titre: 'La Cité',
    texte: "Voici la Cité des Nombres. Elle s'arrête à un rempart qui porte un chiffre : <b>10 000</b>. En deçà, les nombres se pêchent ; au-delà, plus rien ne vient tout seul. Vous ne voyez pour l'instant que ce qui vous est ouvert — la ville s'agrandira acte après acte." },

  { vue: 'hub', cible: '.villeLieu[data-lieu="vivier"]',
    titre: 'Le Vivier',
    texte: "C'est ici qu'on pêche, de 1 à 9 999. On ne choisit pas sa prise — et c'est bien tout l'intérêt." },

  /* L'étape vise le QUARTIER, pas l'Herbier : depuis que la Bibliothèque l'a
     rejoint sous « Le Grand Herbier », le lieu n'a plus de pastille à lui et le
     projecteur ne trouvait plus rien. C'est la troisième fois qu'une cible de
     visite s'évapore sous un remaniement du plan — d'où
     `outils/verifier_visite.js`, qui refuse désormais de laisser passer ça. */
  { vue: 'hub', cible: '.villeLieu[data-lieu="q_grandherbier"]',
    titre: 'Le Grand Herbier',
    texte: "Vos spécimens, étiquetés. Chaque nombre y garde sa fiche : ce qu'il est, et pourquoi il vaut ce qu'il vaut. C'est aussi là que se referment les pages démontrées — mais ça, ce sera pour plus tard." },

  { vue: 'hub', cible: '.villeLieu[data-lieu="place"]',
    titre: 'La Place',
    texte: "Et me voici. On y trouve les gens de la Cité — pour l'instant moi seul, mais d'autres arriveront avec les âges. Revenez quand vous voudrez." },

  { vue: 'hub', cible: '.porte',
    titre: 'La porte de l\'acte',
    texte: "Et voilà ce qui ouvre la suite. Chaque acte demande d'avoir fait quelque chose, pas d'avoir attendu." },

  /* ---------- le tirage ---------- */
  { vue: 'gacha', cible: '#wCoins', avant: completerPourUnTirage,
    titre: 'De quoi commencer',
    texte: "Vos jetons. Il y en a de quoi lancer votre première pêche — c'est la mise de départ de la Cité. Ensuite, ce sont vos nombres qui en produiront : chaque spécimen de l'Herbier rapporte, et les rares rapportent davantage." },

  { vue: 'gacha', cible: '#packSizes',
    titre: 'La taille du filet',
    texte: "Un nombre à la fois, ou dix. Plus le paquet est gros, plus il est avantageux : le ×10 vous fait dix pour le prix de neuf." },

  { vue: 'gacha', cible: '#btnPull', signal: 'tirage', consigne: 'Lancez votre premier ×10.',
    titre: 'À vous',
    texte: "Allez-y. Dix nombres, tirés au hasard dans le vivier — et pas un seul dont la valeur ait été décidée d'avance." },

  /* ---------- la récapitulation ----------
     `garderRecap` verrouille la fermeture : tant que la visite parle de la
     prise, refermer l'écran ferait disparaître ce qu'elle montre. C'est
     l'étape « Refermez » qui rend la main — elle attend justement ce geste,
     et elle ne porte donc pas le verrou. */
  { vue: 'gacha', cible: '#revealGrid', place: 'bas', garderRecap: true,
    titre: 'Votre prise',
    texte: "Dix nombres. La couleur dit la rareté, et la rareté n'a pas été tirée au sort : elle est <b>calculée</b> à partir des propriétés du nombre. Un premier vaut plus qu'un nombre quelconque parce qu'il est premier." },

  { vue: 'gacha', cible: '#revealSummary', place: 'haut', garderRecap: true,
    titre: 'Ce que ça rapporte',
    texte: "Chaque prise rapporte des jetons et de la poussière. Un doublon n'est pas perdu : il rend davantage de poussière, et l'Atelier en vit." },

  { vue: 'gacha', cible: '#revealClose', signal: 'revelationFermee', consigne: 'Fermez la récapitulation.',
    titre: 'Refermez',
    texte: "Quand vous avez vu ce que vous vouliez, refermez." },

  /* ---------- l'herbier ---------- */
  { vue: 'collection', cible: '#colGrid', place: 'haut',
    titre: 'Vos spécimens',
    texte: "Les voilà rangés. Cliquez sur n'importe lequel pour voir sa fiche : ses propriétés, leur démonstration, et ce qu'elles lui valent." },

  /* Le mot de la fin n'a rien à montrer : pas de cible, la page s'assombrit
     entièrement et la bulle se centre. */
  { vue: 'collection', cible: null, place: 'centre', libre: true,
    titre: "L'Herbier ne se remplit jamais",
    texte: "Neuf mille neuf cent quatre-vingt-dix-neuf pêchables, et le reste à fabriquer. Personne n'a jamais fini — c'est la seule chose que je puisse vous promettre.<br><br>Allez pêcher. Quand vous aurez fait marcher l'abaque, revenez me voir sur la Place." },
];

let _visitePas = -1;              // -1 : la visite n'est pas en cours
let _visiteAncrage = null;        // le rafraîchissement du trou au défilement

const visiteEnCours = () => _visitePas >= 0 && _visitePas < VISITE.length;

/* Vrai tant que la visite a besoin que la récapitulation reste ouverte. */
const visiteRetientRecap = () =>
  visiteEnCours() && !!VISITE[_visitePas].garderRecap;

function demarrerVisite() {
  _visitePas = 0;
  posterEtape();
}

function visiteSignal(nom) {
  if (!visiteEnCours()) return;
  if (VISITE[_visitePas].signal !== nom) return;
  etapeSuivante();
}

function etapeSuivante() {
  _visitePas++;
  if (_visitePas >= VISITE.length) return finirVisite();
  posterEtape();
}

/* LA VISITE N'OUVRE PLUS L'ACTE I, ET C'EST TOUT LE CHANGEMENT DE L'ACTE 0.
   Elle le franchissait à sa dernière étape : le tutoriel finissait, l'acte
   suivant commençait, et le Seuil n'aura duré que le temps d'un tour guidé.
   L'acte 0 a maintenant ses propres conditions — trente nombres, et le tour
   de la Place — que le joueur remplit à son rythme avant de pousser la porte
   lui-même. La visite se contente de dire qu'elle est passée.

   `visiteFaite` est indispensable : sans lui, rester à l'acte 0 relancerait
   les scènes du Seuil au premier rendu, puis la visite, en boucle. */
function finirVisite() {
  _visitePas = -1;
  arreterAncrage();
  const b = document.querySelector('#visiteBoite');
  if (b) { b.classList.remove('on'); b.innerHTML = ''; }
  state.visiteFaite = true;
  save();
  toast("📖 Le tour est fait. <b>Il reste à mériter l'acte I</b> — la porte est sur la Carte.", 'gold');
  renderAll();
}

function arreterAncrage() {
  if (!_visiteAncrage) return;
  window.removeEventListener('scroll', _visiteAncrage, true);
  window.removeEventListener('resize', _visiteAncrage);
  _visiteAncrage = null;
}

/* Ouvre la bonne vue, laisse le rendu se faire, puis dessine le trou. Le
   `requestAnimationFrame` n'est pas une superstition : la cible n'existe pas
   encore quand on change d'onglet, et sa position n'est juste qu'après la
   mise en page. */
function posterEtape() {
  const e = VISITE[_visitePas];
  if (!e) return finirVisite();
  if (e.avant) { try { e.avant(); } catch (err) { console.error('visite :', err); } }
  if (e.vue && vueCourante() !== e.vue) ouvrirOnglet(e.vue, false);
  requestAnimationFrame(() => requestAnimationFrame(() => dessinerEtape()));
}

function dessinerEtape() {
  const boite = document.querySelector('#visiteBoite');
  const e = VISITE[_visitePas];
  if (!boite || !e) return;

  const cible = e.cible ? document.querySelector(e.cible) : null;
  if (cible && !e.libre) cible.scrollIntoView({ block: 'center', behavior: 'auto' });

  boite.classList.add('on');
  boite.innerHTML = `
    <div class="vsTrou" id="vsTrou"></div>
    <div class="vsBulle" id="vsBulle" data-pas="${_visitePas}" role="dialog" aria-live="polite">
      <span class="vsPas">Étape ${_visitePas + 1} / ${VISITE.length}</span>
      <h4 class="vsTitre">${e.titre}</h4>
      <p class="vsTexte">${e.texte}</p>
      <div class="vsPied">
        ${e.signal
          ? `<span class="vsConsigne">${e.consigne}</span>`
          : `<button class="btn sm" id="vsSuivant" type="button">${
              _visitePas === VISITE.length - 1 ? "Ouvrir l'Herbier" : 'Continuer'}</button>`}
        <button class="btn ghost sm" id="vsPasser" type="button">Passer la visite</button>
      </div>
    </div>`;

  const suivant = boite.querySelector('#vsSuivant');
  if (suivant) suivant.addEventListener('click', etapeSuivante);
  boite.querySelector('#vsPasser').addEventListener('click', () => {
    /* Sauter la visite ne doit pas laisser à sec : on garantit un premier
       tirage, comme l'aurait fait l'étape qu'on vient de passer. */
    completerPourUnTirage();
    finirVisite();
  });

  placerTrou();
  arreterAncrage();
  _visiteAncrage = () => placerTrou();
  window.addEventListener('scroll', _visiteAncrage, true);
  window.addEventListener('resize', _visiteAncrage);
}

/* Le trou suit la cible, et la bulle suit le trou. Tout est en coordonnées de
   fenêtre : la surcouche est `fixed`, donc rien à corriger du défilement. */
function placerTrou() {
  const e = VISITE[_visitePas];
  const trou = document.querySelector('#vsTrou');
  const bulle = document.querySelector('#vsBulle');
  if (!e || !trou || !bulle) return;

  const cible = e.cible ? document.querySelector(e.cible) : null;
  const r = cible ? cible.getBoundingClientRect() : null;

  /* Sans cible utilisable, on assombrit tout et on centre la bulle : mieux
     vaut une étape sans trou qu'une étape qui pointe le coin de l'écran. */
  if (!r || (!r.width && !r.height)) {
    trou.style.display = 'none';
    bulle.style.top = '50%'; bulle.style.left = '50%';
    bulle.style.transform = 'translate(-50%, -50%)';
    return;
  }

  const m = 8;                                   // la marge autour de la cible
  trou.style.display = 'block';
  trou.style.top = (r.top - m) + 'px';
  trou.style.left = (r.left - m) + 'px';
  trou.style.width = (r.width + m * 2) + 'px';
  trou.style.height = (r.height + m * 2) + 'px';

  /* La bulle se pose au-dessus ou en dessous, selon la place. `place` force le
     côté quand le contenu qu'on explique s'étale (une grille de dix cartes
     n'a pas de « dessous » raisonnable). */
  bulle.style.transform = 'none';
  const h = bulle.offsetHeight || 190, w = bulle.offsetWidth || 320;
  const dessous = e.place === 'bas' ? true
                : e.place === 'haut' ? false
                : (r.bottom + h + 24 < innerHeight);

  let top = dessous ? r.bottom + m + 12 : r.top - m - 12 - h;
  top = Math.max(12, Math.min(innerHeight - h - 12, top));

  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(12, Math.min(innerWidth - w - 12, left));

  if (e.place === 'centre') { left = innerWidth / 2 - w / 2; top = innerHeight / 2 - h / 2; }

  bulle.style.top = top + 'px';
  bulle.style.left = left + 'px';
}

/* Rejouée à chaque rendu : un changement d'onglet ou un redessin de la Carte
   remplace les éléments, et le trou pointerait dans le vide. */
function renderVisite() {
  if (!visiteEnCours()) {
    const b = document.querySelector('#visiteBoite');
    if (b && b.classList.contains('on')) { b.classList.remove('on'); b.innerHTML = ''; }
    return;
  }
  /* `requestAnimationFrame` est GELÉ quand l'onglet passe en arrière-plan :
     une étape postée à cet instant n'est jamais dessinée. Le joueur retrouve
     alors soit un écran vide, soit — pire — la bulle de l'étape PRÉCÉDENTE,
     qui répète indéfiniment la même chose à chaque « Continuer ». On compare
     donc ce qui est affiché à l'étape courante, et on redessine si l'un ne
     correspond plus à l'autre. */
  const bulle = document.querySelector('#vsBulle');
  if (!bulle || +bulle.dataset.pas !== _visitePas) return dessinerEtape();
  placerTrou();
}
