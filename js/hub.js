/* ============================================================
   LE HUB — LE PLAN DE LA CITÉ

   Le jeu avait déjà sa géographie, sans l'avoir jamais dessinée : le vivier
   (1 à 9 999), le mur (10 000), le Grand Large, la Frontière (99 999), les
   expéditions, les camps de base. Ce plan ne fait que rendre visible ce que le
   vocabulaire du code disait depuis le début.

   CE QU'IL MONTRE ET QU'UNE BARRE D'ONGLETS NE POUVAIT PAS MONTRER.
   La Forge et l'Expédition sont les **deux seules façons de franchir le mur**.
   Alignées dans une barre, elles pesaient autant que le Classement. Bâties sur
   le rempart, ce sont les deux portes — et la Frontière est de l'autre côté.

   COMMENT C'EST CONSTRUIT. Le même montage que la carte de l'Expédition, qui a
   fait ses preuves : un SVG pour le terrain — routes et rivière, tracées en
   pourcentages avec `vector-effect` pour que l'épaisseur du trait ne se
   déforme pas — et par-dessus, dans le même repère, de vrais boutons HTML. Les
   bâtiments sont donc du texte cliquable au clavier, pas des zones réactives
   dans une image.

   POURQUOI UN PLAN EN HAUTEUR. Deux colonnes plutôt que trois : c'est ce qui
   tient sur un téléphone de 340 px sans rien cacher ni rien faire défiler. Une
   ville large aurait obligé à pousser la carte du doigt pour trouver un lieu,
   ce qui est exactement ce qu'un hub ne doit pas faire.

   PRÊT POUR LES ACTES. Chaque lieu porte déjà un `ouvert` : le jour où les
   Actes existeront, un bâtiment fermé s'affichera en sourdine, visible, avec
   sa condition d'ouverture — sans rien changer d'autre ici.
   ============================================================ */

/* ---------- les bâtiments ----------
   Dessinés au trait, dans un carré de 24, comme un plan gravé plutôt qu'une
   illustration : c'est ce qui reste lisible à 40 px sur un téléphone. */
const HUB_BATIMENTS = {
  // montagnes, au-delà du rempart
  frontiere: '<path d="M1 20h22M2 20l6-11 3.5 6.5L15 7l7 13"/><path d="M8 9l1.6 2.8M15 7l1.7 3"/>',
  // une forge : toit, cheminée, étincelle
  forge: '<path d="M3 21V11l9-6 9 6v10z"/><path d="M16.5 6.8V3.5h2.6v5"/><path d="M9 21v-5h6v5"/><path d="M12 11.5v2"/>',
  // une porte de rempart, et la route qui s en va
  expedition: '<path d="M4 21V9l8-5 8 5v12z"/><path d="M9 21v-7a3 3 0 0 1 6 0v7"/><path d="M12 21v-4"/>',
  // un bassin et ses ondes
  vivier: '<path d="M3 15a9 5 0 1 0 18 0 9 5 0 1 0-18 0"/><path d="M7 14.4q2.5-1.6 5 0t5 0"/><path d="M9 17q1.5-1 3 0t3 0"/>',
  // une serre
  herbier: '<path d="M3 21V10l9-6 9 6v11z"/><path d="M12 4v17M3 12h18M3 16.5h18"/>',
  // un temple a colonnes
  academie: '<path d="M2 9l10-5 10 5z"/><path d="M4 9v9M9 9v9M15 9v9M20 9v9"/><path d="M2 21h20"/>',
  // une bibliotheque : livres alignes
  bibliotheque: '<path d="M3 20V6h4v14zM9 20V4h4v16zM15 20.5l3.5-14.5 3.4.9L18.5 21z"/><path d="M2 21h20"/>',
  // une rotonde et son cristal
  oracle: '<path d="M4 21v-8a8 8 0 0 1 16 0v8z"/><path d="M12 6.5l2.5 3.5-2.5 4-2.5-4z"/><path d="M2 21h20"/>',
  // un amphitheatre, vu de dessus
  congres: '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M10 18a2 2 0 0 1 4 0"/><path d="M2 21h20"/>',
  // un livre ouvert
  codex: '<path d="M12 6.5C9.5 4.5 6 4.5 3 5.5v13c3-1 6.5-1 9 1 2.5-2 6-2 9-1v-13c-3-1-6.5-1-9 1z"/><path d="M12 6.5v13"/>',
  // un panneau d affichage, en marge
  marge: '<path d="M3 4h18v11H3z"/><path d="M12 15v6M8 21h8"/><path d="M6.5 7.5h11M6.5 11h7"/>',
  // un atelier : toit à redents, et sa roue
  atelier: '<path d="M2 21V13l5-3v3l5-3v3l5-3v11z"/><path d="M2 21h20"/><circle cx="17" cy="6" r="3.2"/><path d="M17 1.6v1.2M17 9.2v1.2M12.6 6h1.2M20.2 6h1.2"/>',
};

/* Les compteurs vivent ici, et pas seulement sur les pastilles de la barre : un
   hub qui perdrait ces signaux rendrait le jeu moins lisible, pas plus.
   `x` et `y` sont en pourcentages du plan — le même repère que les routes. */
const HUB_LIEUX = [
  { id: 'frontiere', zone: 'loin', x: 50, y: 5, xl: 50, yl: 5, nom: 'La Frontière', vue: 'collection',
    desc: 'De 10 000 à 99 999.',
    jauge: () => {
      const n = Object.keys(state.owned).filter(k => +k === 0 || +k >= 10000).length;
      return n ? `${fmt(n)} rapporté${n > 1 ? 's' : ''}` : 'aucun rapporté';
    } },

  { id: 'forge', zone: 'porte', x: 26, y: 20, xl: 32, yl: 27, image: 'images/forge.webp', nom: 'La Forge', vue: 'forge',
    desc: 'Fabriquer ce que le hasard ne donne pas.',
    jauge: () => state.commande && !state.commande.fini ? 'commande en cours' : 'aucune commande' },

  { id: 'expedition', zone: 'porte', x: 74, y: 19, xl: 68, yl: 26, image: 'images/expedition.webp', nom: "L'Expédition", vue: 'minijeux',
    jeu: 'expedition', desc: 'Aller le chercher au loin.',
    jauge: () => {
      const r = state.stats.meilleureCouche || 0;
      return r ? `record : couche ${r}` : 'jamais partie';
    } },

  { id: 'vivier', zone: 'ville', x: 20, y: 35, xl: 14, yl: 51, image: 'images/vivier.webp', nom: 'Le Vivier', vue: 'gacha',
    desc: 'De 1 à 9 999. On y pêche.',
    jauge: () => {
      const n = tiragesPossibles(state.paquet || 10);
      return `${fmt(n)} tirage${n > 1 ? 's' : ''}`;
    } },

  { id: 'herbier', zone: 'ville', x: 72, y: 34, xl: 58, yl: 51, nom: "L'Herbier", vue: 'collection',
    desc: 'Vos spécimens, étiquetés.',
    jauge: () => `${fmt(uniqueCount(state))} nombres` },

  /* L'Atelier est adossé au Vivier : ses machines ne tournent que sur ce qu'on
     y pêche. */
  { id: 'atelier', zone: 'ville', x: 22, y: 50, xl: 36, yl: 54, nom: "L'Atelier", vue: 'atelier',
    desc: 'Dix machines à calculer.',
    jauge: () => {
      const p = typeof poussiereParMinute === 'function' ? Math.round(poussiereParMinute()) : 0;
      if (p) return `${fmt(p)} ✨/min`;
      const n = typeof MACHINES !== 'undefined'
        ? MACHINES.filter(m => niveauMachine(m.id) > 0).length : 0;
      return n ? "à l'arrêt" : 'aucune machine';
    } },

  { id: 'academie', zone: 'ville', x: 74, y: 49, xl: 80, yl: 54, image: 'images/academie.webp', nom: "L'Académie", vue: 'minijeux',
    desc: "« Que nul n'entre ici s'il n'est géomètre. »",
    jauge: () => {
      const n = (state.stats.examens || 0) + (state.stats.appariements || 0)
              + (state.stats.calculs || 0) + (state.stats.expeditions || 0);
      return n ? `${fmt(n)} partie${n > 1 ? 's' : ''}` : 'jamais fréquentée';
    } },

  { id: 'bibliotheque', zone: 'ville', x: 20, y: 64, xl: 8, yl: 82, nom: 'La Bibliothèque', vue: 'bonus',
    desc: 'Les théorèmes démontrés.',
    jauge: () => {
      const du = pendingCollections().length + pendingDefis().length;
      return du ? `${du} prime${du > 1 ? 's' : ''} à prendre`
                : `${state.claimed.length} / ${COLLECTIONS.length} démontrés`;
    } },

  { id: 'oracle', zone: 'ville', x: 72, y: 63, xl: 29, yl: 85, nom: "L'Oracle", vue: 'oracle',
    desc: 'Interroger un entier. Gratuit.',
    jauge: () => 'de 0 à 99 999' },

  { id: 'congres', zone: 'ville', x: 22, y: 78, xl: 50, yl: 82, nom: 'Le Congrès', vue: 'classement',
    desc: 'Comparer ses travaux.',
    jauge: () => (typeof nuage !== 'undefined' && nuage.connecte)
      ? `sous « ${nuage.pseudo} »` : 'pseudo requis' },

  { id: 'codex', zone: 'ville', x: 74, y: 77, xl: 71, yl: 85, nom: 'Le Codex', lien: 'codex.html',
    desc: 'Les 65 traits reconnus.',
    jauge: () => 'salle de référence' },

  /* La Marge est au bord du plan, et ce n'est pas un hasard : c'est la seule
     plaisanterie visuelle que je me suis permise. */
  { id: 'marge', zone: 'ville', x: 47, y: 92, xl: 92, yl: 82, nom: 'La Marge', vue: 'retours',
    desc: 'Trop étroite pour la preuve.',
    jauge: () => 'signaler, soutenir' },
];

/* ---------- le tracé de la ville ----------
   Deux rues descendent des portes et traversent la cité, trois transversales
   les relient, et une place s'ouvre là où elles se croisent. Ce sont des
   POLYLIGNES qui passent par les bâtiments, pas des segments deux à deux : une
   rue se suit, une flèche d'organigramme se lit.

   L'implantation des bâtiments est volontairement irrégulière. Deux colonnes
   parfaitement alignées donnaient un tableau ; le désordre reste borné pour
   que rien ne se chevauche et que tout tienne encore sur un téléphone — c'est
   la même leçon que la carte de l'Expédition. */
const HUB_RUES = [
  ['forge', 'vivier', 'atelier', 'bibliotheque', 'congres', 'marge'],  // la rue du couchant
  ['expedition', 'herbier', 'academie', 'oracle', 'codex', 'marge'],   // la rue du levant
  ['vivier', 'herbier'], ['atelier', 'academie'],
  ['bibliotheque', 'oracle'], ['congres', 'codex'],
];

/* En plan large, la ville s'ordonne en deux grandes rues est-ouest reliées par
   quatre transversales. Les mêmes rues qu'en étroit s'y croiseraient en
   diagonale d'un bout à l'autre — un plan de ville, pas un écheveau. */
const HUB_RUES_L = [
  ['vivier', 'atelier', 'herbier', 'academie'],            // la grande rue
  ['bibliotheque', 'oracle', 'congres', 'codex', 'marge'], // la rue basse
  ['forge', 'vivier'], ['forge', 'atelier'],
  ['expedition', 'herbier'], ['expedition', 'academie'],
  ['vivier', 'bibliotheque'], ['atelier', 'oracle'],
  ['herbier', 'congres'], ['academie', 'codex'],
];


/* La place centrale, là où les deux rues se rapprochent le plus. */
const HUB_PLACE  = { x: 47, y: 57, r: 6 };
const HUB_PLACEL = { x: 50, y: 68, r: 5 };

/* La rivière traverse la ville sous le dernier rang. Une ville sans eau n'a pas
   l'air d'une ville. */
const HUB_RIVIERE  = 'M -2 86 C 16 82, 28 90, 46 87 S 78 80, 102 84';
const HUB_RIVIEREL = 'M -2 69 C 20 65, 34 74, 55 70 S 84 63, 102 67';

/* ---------- deux plans, une seule ville ----------
   Onze bâtiments légendés ne tiennent pas dans la même forme sur un écran de
   bureau et sur un téléphone. Un plan large tient d'un seul coup d'œil sur le
   premier ; un plan en hauteur tient sans rien cacher sur le second. Les
   coordonnées `x,y` valent en étroit, `xl,yl` en large — c'est la même ville,
   pas deux cartes à tenir à jour. */
const HUB_LARGE = () => window.matchMedia('(min-width: 900px)').matches;

/* Les images sont mises en cache un an par nginx, comme le CSS et le JS. Sans
   ce numéro repris des balises `<script>`, remplacer une vignette ne changerait
   pas son adresse — et personne ne verrait la nouvelle avant un an. */
const VERSION_ASSETS = (() => {
  const s = document.querySelector('script[src*="?v="]');
  const v = s && s.src.split('?v=')[1];
  return v ? '?v=' + v : '';
})();

function renderHub() {
  const zone = document.querySelector('#hubZone');
  if (!zone) return;

  const large = HUB_LARGE();
  const ax = l => large && l.xl !== undefined ? l.xl : l.x;
  const ay = l => large && l.yl !== undefined ? l.yl : l.y;

  const par = {};
  HUB_LIEUX.forEach(l => par[l.id] = l);

  const rues = (large ? HUB_RUES_L : HUB_RUES).map(ids => {
    const pts = ids.map(i => par[i]).filter(Boolean).map(l => `${ax(l)},${ay(l)}`).join(' ');
    return pts ? `<polyline points="${pts}" class="villeRue" />` : '';
  }).join('');

  /* La rivière et les rues supportent l'étirement du repère — ce sont des
     lignes. La place, non : un cercle y devenait une ellipse. Elle est donc
     posée en HTML, à taille fixe, comme les bâtiments. */
  const place = large ? HUB_PLACEL : HUB_PLACE;
  const terrain = `<path d="${large ? HUB_RIVIEREL : HUB_RIVIERE}" class="villeRiviere" />`;
  const placeHTML = `<div class="villePlace" aria-hidden="true"
      style="left:${place.x}%;top:${place.y}%"></div>`;

  const batiment = (l) => {
    const ouvert = l.ouvert === undefined ? true : l.ouvert;
    const balise = l.lien ? 'a' : 'button';
    const attrs = l.lien ? `href="${l.lien}"`
                         : `type="button" data-hub="${l.id}"${ouvert ? '' : ' disabled'}`;
    let jauge = '';
    try { jauge = l.jauge ? l.jauge() : ''; } catch (e) { jauge = ''; }
    /* L'agrandissement au survol part du bord le plus proche : une vignette
       posée à 14 % qui grandirait depuis son centre déborderait du plan par la
       gauche. On cale donc le point de fuite selon l'implantation, et l'image
       grandit vers l'intérieur de la ville. */
    const fuite = ax(l) < 30 ? 'left' : ax(l) > 70 ? 'right' : 'center';
    return `<${balise} class="villeLieu ${l.zone}${l.image ? ' vue' : ''}${ouvert ? '' : ' ferme'}"
        style="left:${ax(l)}%;top:${ay(l)}%;--fuite:${fuite}" ${attrs}>
      ${l.image
        ? `<img class="villeVue" src="${l.image}${VERSION_ASSETS}" alt="" loading="lazy"
               decoding="async" width="450" height="254">`
        : `<svg class="villeIcone" viewBox="0 0 24 24" aria-hidden="true">${HUB_BATIMENTS[l.id] || ''}</svg>`}
      <span class="villeNom">${l.nom}</span>
      <span class="villeDesc">${l.desc}</span>
      <span class="villeJauge">${jauge}</span>
    </${balise}>`;
  };

  zone.innerHTML = `
    <div class="villeCadre">
      <div class="villePlan${large ? ' large' : ''}">
        <svg class="villeRoutes" viewBox="0 0 100 100" preserveAspectRatio="none"
             aria-hidden="true">${terrain}${rues}</svg>

        <!-- Le rempart. Il coupe le plan en deux, et c'est tout le propos. -->
        ${placeHTML}
        <div class="villeMur" aria-hidden="true"><span>le mur — 10 000</span></div>

        ${HUB_LIEUX.map(batiment).join('')}
      </div>
    </div>
    <p class="tiny villeLegende">Le rempart se dresse à <b>10 000</b>. Au nord, le tirage
       n'atteint plus rien : seules <b>la Forge</b> et <b>l'Expédition</b> le franchissent.</p>`;

  cablerHub();
}

/* ============================================================
   LA VUE DU LIEU, SUR SA PROPRE PAGE

   Les quatre vues dessinées pour la carte servent deux fois : en vignette sur
   le plan, et en bandeau au-dessus de l'onglet correspondant. Le fichier est
   le même, déjà en cache — la seconde pose ne coûte pas un octet.

   TROIS PRÉCAUTIONS DE RÉGIE, et elles ne sont pas décoratives :
   1. Le bandeau ouvre l'onglet. Les emplacements publicitaires sont posés bien
      plus bas, après l'établi ou après l'exercice ; rien ne les touche.
   2. Il ne prend jamais un emplacement d'annonce ni ne s'y accole : une image
      voisine d'une annonce se prend pour l'annonce, et le clic qui suit est un
      clic invalide — le premier motif de fermeture de compte chez Google.
   3. Sa taille est plafonnée. Un bandeau qui repousse le jeu sous la ligne de
      flottaison ferait remonter l'annonce d'autant, ce qui revient à la poser
      sur les commandes.

    ET SA LARGEUR NE DÉPASSE PAS CELLE DU FICHIER. Un dessin agrandi ne montre
   rien de plus qu'un dessin net — seulement ses pixels. Les vues font 900 px
   de large : le bandeau s'arrête sous cette taille, donc il réduit toujours, et
   réduire n'abîme rien.

   Le nom du lieu n'y figure pas : l'onglet le porte déjà, et le répéter à
   trois centimètres ferait doublon.
   ============================================================ */

/* La taille réelle de chaque fichier. Elles ne sont pas identiques — les
   sources n'ont pas été cadrées au pixel près — et le bandeau les montre
   entières : annoncer une hauteur approchée décalerait la page au chargement. Sur la carte,
   au contraire, les quatre vignettes gardent un cadre commun ; c'est la CSS qui
   l'impose, et c'est voulu. */
const TAILLE_VUE = {
  forge: [905, 514], expedition: [903, 509], vivier: [902, 499], academie: [900, 510],
};

/* Deux lieux partagent l'onglet des mini-jeux. Sans cette variante, la vue de
   l'Expédition n'aurait de place nulle part ailleurs que sur la carte. */
const LIEU_VARIANTE = {
  minijeux: () => (typeof jeuChoisi === 'function' && jeuChoisi() === 'expedition')
    ? 'expedition' : 'academie',
};

function poserBannieresDeLieu() {
  document.querySelectorAll('.lieuBanniere').forEach(cadre => {
    const variante = LIEU_VARIANTE[cadre.dataset.lieuVariante];
    const id = variante ? variante() : cadre.dataset.lieu;
    const lieu = HUB_LIEUX.find(l => l.id === id);
    if (!lieu || !lieu.image) { cadre.innerHTML = ''; return; }

    const src = lieu.image + VERSION_ASSETS;
    let img = cadre.firstElementChild;
    if (!img) {
      const [l, h] = TAILLE_VUE[id] || [450, 254];
      img = document.createElement('img');
      img.className = 'lieuVue';
      img.width = l; img.height = h;
      img.decoding = 'async';
      /* Les vues pèsent 300 Ko à elles quatre depuis qu'elles sont en pleine
         définition. Un onglet masqué n'est jamais dans la fenêtre : son bandeau
         ne se charge donc qu'à l'ouverture, et la première visite ne paie que
         celui du tirage. */
      img.loading = 'lazy';
      cadre.appendChild(img);
    }
    /* On ne réécrit que ce qui change : reposer le même `src` relancerait le
       chargement de l'image à chaque rendu, et ils sont fréquents. */
    if (img.getAttribute('src') !== src) {
      const [l, h] = TAILLE_VUE[id] || [450, 254];
      img.width = l; img.height = h;
      img.setAttribute('src', src);
    }
    if (img.alt !== lieu.nom) img.alt = lieu.nom;
  });
}

/* Basculer d'une forme d'écran à l'autre change d'implantation : sans ce
   redessin, on garderait le plan étroit sur un bureau qu'on vient d'élargir. */
let _hubGuetteur = null;
function surveillerLargeur() {
  if (_hubGuetteur) return;
  _hubGuetteur = window.matchMedia('(min-width: 900px)');
  const relire = () => { if (document.querySelector('#hubZone')) renderHub(); };
  if (_hubGuetteur.addEventListener) _hubGuetteur.addEventListener('change', relire);
  else _hubGuetteur.addListener(relire);          // Safari ancien
}

function cablerHub() {
  surveillerLargeur();
  document.querySelectorAll('#hubZone .villeLieu[data-hub]').forEach(el =>
    el.addEventListener('click', () => {
      const lieu = HUB_LIEUX.find(l => l.id === el.dataset.hub);
      if (!lieu || !lieu.vue) return;
      /* L'Expédition et l'Académie mènent au même onglet : on présélectionne le
         jeu, sinon le raccourci ne raccourcit rien. */
      if (lieu.jeu) { try { localStorage.setItem('gachanombres.minijeu', lieu.jeu); } catch (e) {} }
      ouvrirOnglet(lieu.vue);
    }));
}
