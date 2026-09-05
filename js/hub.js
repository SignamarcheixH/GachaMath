/* ============================================================
   LE HUB — LE PLAN DE LA CITÉ

   Le jeu avait déjà sa géographie, sans l'avoir jamais dessinée : le vivier
   (1 à 9 999), le mur (10 000), le Grand Large, la Frontière (99 999), les
   expéditions, les camps de base. Ce plan ne fait que rendre visible ce que le
   vocabulaire du code disait depuis le début.

   CE QU'IL MONTRE ET QU'UNE BARRE D'ONGLETS NE POUVAIT PAS MONTRER.
   La Forge et l'Expédition sont les **deux seules façons de franchir le mur**.
   Alignées dans une barre, elles pesaient autant que le Classement. Bâties sur
   le rempart, ce sont les deux portes.

   IL Y AVAIT UN BÂTIMENT « LA FRONTIÈRE », posé au-delà du rempart et menant à
   l'Herbier. Il ne montrait rien que l'Herbier ne montre déjà, et il occupait
   le haut du dessin — c'est-à-dire le ciel de la ville. Retiré ; l'Herbier
   reste l'endroit où l'on voit ce qu'on a rapporté du Grand Large.

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

   UN LIEU FERMÉ N'EST PAS SUR LE PLAN. Il y figurait d'abord en sourdine,
   pour qu'on sache qu'il existe et qu'il se mérite. Sur une illustration, ce
   raisonnement s'inverse : dix pastilles éteintes posées sur un dessin le
   couvrent sans rien apprendre, et le joueur ne distingue plus ce qui l'attend
   de ce qui lui est ouvert. C'est le Carnet qui dit ce que chaque acte
   apportera — un texte le dit mieux qu'une icône grise.
   ============================================================ */

/* ---------- les bâtiments ----------
   Dessinés au trait, dans un carré de 24, comme un plan gravé plutôt qu'une
   illustration : c'est ce qui reste lisible à 40 px sur un téléphone. */
const HUB_BATIMENTS = {
  // une place : un arbre, un banc, des pavés
  place: '<path d="M3 20h18"/><path d="M8 20v-3h8v3"/><circle cx="12" cy="9" r="4.2"/><path d="M12 13.2V17"/>',
  // un port : le quai, l'eau, un mât et sa vergue
  gare: '<path d="M2 17h20"/><path d="M3 20.5q2-1.4 4 0t4 0 4 0 4 0 3-.6"/><path d="M12 17V4"/><path d="M7.5 8h9"/><path d="M12 4.2h4.5L15 6h-3"/>',
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
  // un amphitheatre, vu de dessus
  congres: '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M10 18a2 2 0 0 1 4 0"/><path d="M2 21h20"/>',
  // un livre ouvert
  codex: '<path d="M12 6.5C9.5 4.5 6 4.5 3 5.5v13c3-1 6.5-1 9 1 2.5-2 6-2 9-1v-13c-3-1-6.5-1-9 1z"/><path d="M12 6.5v13"/>',
  // un comptoir de change : la table, ses tringles, ses jetons
  comptoir: '<path d="M2 21h20"/><path d="M3.5 16.5h17V21h-17z"/><path d="M6.5 16.5V7M12 16.5V7M17.5 16.5V7"/><circle cx="6.5" cy="10" r="1.2"/><circle cx="12" cy="13" r="1.2"/><circle cx="17.5" cy="8.6" r="1.2"/>',
  // un de, et les faces qu il montre
  casino: '<path d="M12 2.6l8.5 4.7v9.4L12 21.4 3.5 16.7V7.3z"/><circle cx="12" cy="8.4" r="1.15"/><circle cx="8.3" cy="14.2" r="1.15"/><circle cx="15.7" cy="14.2" r="1.15"/>',
  // une coupole, sa lunette, et ce qu elle vise
  observatoire: '<path d="M2 21h20"/><path d="M5 21v-5.4a7 7 0 0 1 14 0V21"/><path d="M9.6 12.6 18.4 6.6"/><path d="M19.6 2.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
  // un quartier : plusieurs toits sous une seule adresse
  quartier: '<path d="M2 21h20"/><path d="M3.5 21v-6.5l4-3 4 3V21"/><path d="M13 21v-8.5l4-3 4 3V21"/><path d="M6 21v-2.6h3V21"/><path d="M15.5 21v-2.6h3V21"/>',
  // un atelier : toit à redents, et sa roue
  atelier: '<path d="M2 21V13l5-3v3l5-3v3l5-3v11z"/><path d="M2 21h20"/><circle cx="17" cy="6" r="3.2"/><path d="M17 1.6v1.2M17 9.2v1.2M12.6 6h1.2M20.2 6h1.2"/>',
};

/* Les compteurs vivent ici, et pas seulement sur les pastilles de la barre : un
   hub qui perdrait ces signaux rendrait le jeu moins lisible, pas plus.
   `x` et `y` sont en pourcentages du plan — le même repère que les routes. */
const HUB_LIEUX = [
  { id: 'forge', zone: 'rempart', x: 22, y: 16, xl: 35, yl: 26, image: 'images/forge.webp', nom: 'La Forge', vue: 'forge',
    desc: 'Fabriquer ce que le hasard ne donne pas.',
    jauge: () => state.commande && !state.commande.fini ? 'commande en cours' : 'aucune commande' },

  { id: 'expedition', zone: 'rempart', x: 78, y: 16, xl: 65, yl: 26, image: 'images/expedition.webp', nom: "L'Expédition", vue: 'minijeux',
    jeu: 'expedition', desc: 'Aller le chercher au loin.',
    jauge: () => {
      const r = state.stats.meilleureCouche || 0;
      return r ? `record : couche ${r}` : 'jamais partie';
    } },

  { id: 'vivier', zone: 'ville', x: 22, y: 27, xl: 10, yl: 48, image: 'images/vivier.webp', nom: 'Le Vivier', vue: 'gacha',
    desc: 'De 1 à 9 999. On y pêche.',
    jauge: () => {
      const n = tiragesPossibles(state.paquet || 10);
      return `${fmt(n)} tirage${n > 1 ? 's' : ''}`;
    } },

  { id: 'herbier', image: 'images/herbier.webp', zone: 'ville', x: 78, y: 27, xl: 70, yl: 48, nom: "L'Herbier", vue: 'collection',
    desc: 'Vos spécimens, étiquetés.',
    jauge: () => `${fmt(uniqueCount(state))} nombres` },

  /* L'Atelier est adossé au Vivier : ses machines ne tournent que sur ce qu'on
     y pêche. */
  { id: 'atelier', zone: 'ville', x: 22, y: 38, xl: 30, yl: 48, nom: "L'Atelier", vue: 'atelier',
    desc: 'Dix machines à calculer.',
    jauge: () => {
      const p = typeof poussiereParMinute === 'function' ? Math.round(poussiereParMinute()) : 0;
      if (p) return `${fmt(p)} ✨/min`;
      const n = typeof MACHINES !== 'undefined'
        ? MACHINES.filter(m => niveauMachine(m.id) > 0).length : 0;
      return n ? "à l'arrêt" : 'aucune machine';
    } },

  { id: 'academie', zone: 'ville', x: 78, y: 38, xl: 90, yl: 48, image: 'images/academie.webp', nom: "L'Académie", vue: 'minijeux',
    desc: "« Que nul n'entre ici s'il n'est géomètre. »",
    jauge: () => {
      const n = (state.stats.examens || 0) + (state.stats.appariements || 0)
              + (state.stats.calculs || 0) + (state.stats.expeditions || 0);
      return n ? `${fmt(n)} partie${n > 1 ? 's' : ''}` : 'jamais fréquentée';
    } },

  { id: 'bibliotheque', zone: 'ville', x: 22, y: 60, xl: 10, yl: 66, nom: 'La Bibliothèque', vue: 'bonus',
    desc: 'Les théorèmes démontrés.',
    jauge: () => {
      const du = pendingCollections().length + pendingDefis().length;
      return du ? `${du} prime${du > 1 ? 's' : ''} à prendre`
                : `${state.claimed.length} / ${COLLECTIONS.length} démontrés`;
    } },

  { id: 'congres', zone: 'ville', x: 78, y: 82, xl: 30, yl: 84, nom: 'Le Congrès', vue: 'classement',
    desc: 'Comparer ses travaux.',
    jauge: () => (typeof nuage !== 'undefined' && nuage.connecte)
      ? `sous « ${nuage.pseudo} »` : 'pseudo requis' },

  { id: 'codex', zone: 'ville', x: 22, y: 93, xl: 10, yl: 84, nom: 'Le Codex', lien: 'codex.html',
    desc: 'Les 65 traits reconnus.',
    jauge: () => 'salle de référence' },

  /* La Place, au centre de la ville et au centre du propos : c'est le seul
     lieu ouvert dès l'acte 0, parce que c'est de là que part la visite. */
  { id: 'place', zone: 'ville', x: 22, y: 49, xl: 50, yl: 48, nom: 'La Place', pnj: true,
    desc: 'On y parle aux gens.',
    jauge: () => {
      const n = typeof pnjPresents === 'function' ? pnjPresents().length : 0;
      return n ? `${n} personne${n > 1 ? 's' : ''}` : 'déserte';
    } },

  /* LE PORT. Il n'ouvre aucun onglet : il porte les quêtes. Son identifiant
     reste `gare` — c'est celui que les quêtes, les actes et le vérificateur
     nomment, et le renommer partout n'apporterait rien qu'un risque. Seul ce
     qui se lit a changé. */
  { id: 'gare', zone: 'ville', x: 78, y: 49, xl: 30, yl: 66, nom: 'Le Port', quetes: true,
    desc: 'On y croise du monde.',
    jauge: () => {
      const n = typeof quetesOuvertes === 'function'
        ? quetesOuvertes().filter(q => q.batiment === 'gare').length : 0;
      return n ? `${n} quête${n > 1 ? 's' : ''}` : 'quai désert';
    } },

  /* ---------- LE COMPTOIR, LE CASINO, L'OBSERVATOIRE ----------
     Trois lieux qui adoptent des traits que le jeu calculait sans leur donner
     d'adresse. Un trait qui n'existe que comme ligne du Codex n'apprend rien ;
     il lui faut un endroit où l'on s'en sert. */

  /* LE COMPTOIR — ce qui n'est vrai qu'en base dix.
     Un palindrome, un repdigit, un nombre d'Armstrong : ce ne sont pas des
     propriétés du nombre, ce sont des accidents de son écriture. Dix-neuf des
     traits du jeu sont dans ce cas, soit près d'un tiers. Un comptoir de
     change — la même valeur, écrite autrement — est l'endroit exact pour
     l'apprendre. Ouvert à l'acte III, celui de la notation. */
  { id: 'comptoir', zone: 'ville', x: 22, y: 71, xl: 50, yl: 66, nom: 'Le Comptoir', vue: 'comptoir',
    desc: 'La même valeur, écrite autrement.',
    jauge: () => {
      const n = typeof traitsDEcriturePossedes === 'function' ? traitsDEcriturePossedes() : 0;
      return `${n} / ${typeof TRAITS_ECRITURE !== 'undefined' ? TRAITS_ECRITURE.length : 19} traits d'écriture`;
    } },

  /* LE CASINO — les probabilités, là où elles sont nées.
     Le problème des partis, posé à Pascal par le chevalier de Méré, réglé avec
     Fermat à l'été 1654 : la maison de jeu n'est pas un habillage, c'est le
     lieu de naissance. ON N'Y GAGNE JAMAIS DE NOMBRES — la Cité tient que la
     rareté se démontre, et une salle qui distribuerait des tirages vendrait la
     thèse pour un décor. On y gagne de savoir ses chances. Acte V, celui de
     Pascal. */
  { id: 'casino', zone: 'ville', x: 22, y: 82, xl: 50, yl: 84, nom: 'Le Casino', vue: 'casino',
    desc: 'Le hasard, mis en chiffres.',
    jauge: () => 'vos chances, calculées' },

  /* L'OBSERVATOIRE — la statistique, c'est-à-dire le passé.
     Le Casino dit ce qui va arriver ; l'Observatoire dit ce qui est arrivé.
     On y mesure son propre herbier contre la vérité du vivier : ce qu'on a,
     ce qui manque, et ce que ça coûtera encore. Acte IV, celui du calcul. */
  { id: 'observatoire', zone: 'ville', x: 78, y: 71, xl: 70, yl: 66, nom: "L'Observatoire", vue: 'observatoire',
    desc: "Ce qu'on a, et ce qui manque.",
    jauge: () => {
      const n = uniqueCount(state);
      return `${(n / 99.99).toFixed(1)} % du vivier`;
    } },

];

/* ---------- ce qui a été retiré ----------
   Le plan portait ses propres rues, sa rivière, sa place ronde et son rempart,
   tracés en SVG. C'était juste tant que le plan était un schéma ; sur une
   illustration, ces traits doublonnent avec ce qui est déjà dessiné — deux
   villes superposées qui ne se recouvrent jamais tout à fait. Ils sont donc
   supprimés, avec les constantes qui les décrivaient (HUB_RUES, HUB_RUES_L,
   HUB_RIVIERE, HUB_RIVIEREL, HUB_PLACE, HUB_PLACEL) et leurs règles de style.
   Ne reste que ce que le dessin ne peut pas dire : les bâtiments cliquables.
   ---------------------------------------- */

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

/* LA PORTE DE L'ACTE. Elle vit sur la Carte parce que c'est le tableau de
   bord du jeu, et parce qu'un acte ouvre des lieux : on voit la condition
   juste au-dessus du plan qu'elle va changer. */
function porteHTML() {
  if (typeof conditionsPour !== 'function') return '';
  const a = acteCourant(), suiv = acteSuivant();
  const ici = acteDe(a);

  if (suiv > ACTE_MAX) {
    return `<div class="porte finie">
      <span class="porteActe">Acte ${a} · ${ici.nom}</span>
      <p class="porteMot">Le dernier acte. L'Herbier, lui, n'est pas fini — il ne le sera jamais.</p>
    </div>`;
  }

  const cs = conditionsPour(suiv);
  const cible = acteDe(suiv);
  const pret = cs.every(c => c.ok);

  return `<div class="porte${pret ? ' prete' : ''}">
    <div class="porteTete">
      <span class="porteActe">Acte ${a} · ${ici.nom}</span>
      <span class="porteVers">pour entrer dans l'acte ${suiv} — <b>${cible.nom}</b>${
        cible.epoque ? ` <i>${cible.epoque}</i>` : ''}</span>
    </div>

    <ul class="porteListe">${cs.map(c => `<li class="${c.ok ? 'ok' : ''}">
      <span class="porteCoche">${c.ok ? '✓' : '○'}</span>
      <span class="porteTexte">${c.texte}</span>
      <span class="porteCompte">${c.requis > 1 ? `${fmt(Math.min(c.atteint, c.requis))} / ${fmt(c.requis)}` : ''}</span>
    </li>`).join('')}</ul>

    ${pret
      ? `<button class="btn" id="porteFranchir" type="button">Entrer dans l'acte ${suiv}</button>`
      : `<p class="porteMot">${cible.resume}</p>`}
  </div>`;
}

/* ============================================================
   LES QUARTIERS — PLUSIEURS LIEUX SOUS UN SEUL TOIT

   POURQUOI. Dix-sept bâtiments sur un plan dessiné, c'est dix-sept pastilles
   qui couvrent le dessin. Certains vont naturellement ensemble — la Forge et
   l'Atelier sont le même quartier industriel, on y bat le fer et on y fait
   tourner des machines. Un quartier les remplace par UNE pastille, et le clic
   ouvre le choix.

   CE N'EST PAS UN DOSSIER, C'EST UNE ADRESSE. Un quartier ne change rien aux
   actes, aux quêtes ni aux onglets : ses membres restent des lieux à part
   entière partout ailleurs dans le jeu. Il ne change que la façon dont on les
   atteint depuis la carte.

   UN QUARTIER EST OUVERT DÈS QU'UN DE SES MEMBRES L'EST. L'inverse — attendre
   que tout soit ouvert — cacherait la Forge derrière un Atelier pas encore
   mérité. Les membres encore fermés apparaissent dans le choix, en sourdine,
   avec l'acte qui les ouvrira.

   ILS SE DESSINENT À LA SOURIS. Double-clic sur le plan pour en créer un,
   glisser un bâtiment dessus pour l'y ranger, et le tout s'exporte avec les
   coordonnées — voir le mode placement plus bas.
   ============================================================ */
const HUB_QUARTIERS = [
  /* LE GRAND HERBIER. Ce n'est pas un regroupement de commodité : le jeu dit
     déjà, dans la scène du Seuil et dans la justification de l'acte 0, que les
     théorèmes « sont les pages démontrées de l'Herbier ». La Bibliothèque est
     donc une partie de l'Herbier, pas sa voisine — et sûrement pas une annexe
     de l'Académie, où l'on s'exerce.

     Le critère, pour les prochains : deux lieux vont ensemble quand ils
     répondent à la MÊME QUESTION. « Qu'est-ce que j'ai ? » et « qu'est-ce que
     j'ai fini de prouver ? » sont la même question à deux étapes. « Comment je
     m'entraîne ? » est ailleurs.

     Les autres entrées viennent du mode placement, par outils/poser_carte.js.
     Forme : { id, nom, desc, x, y, xl, yl, membres: ['forge', 'atelier'] } */
  { id: 'q_grandherbier', nom: 'Le Grand Herbier',
    desc: "Le registre de ce que la Cité a démontré.",
    x: 78, y: 27, xl: 70, yl: 48,
    membres: ['herbier', 'bibliotheque'] },
];

/* L'index membre → quartier, refait à chaque rendu : le mode placement le
   modifie en cours de route. */
let _quartierDe = {};
function indexerQuartiers() {
  _quartierDe = {};
  for (const q of HUB_QUARTIERS) for (const m of (q.membres || [])) _quartierDe[m] = q;
}
const quartierDuLieu = (id) => _quartierDe[id] || null;
const membresDuQuartier = (q) => (q.membres || [])
  .map(id => HUB_LIEUX.find(l => l.id === id)).filter(Boolean);

/* Un quartier vaut ce que valent ses membres : ouvert dès le premier, et
   porteur de la somme de leurs quêtes en attente. */
function quartierOuvert(q) {
  if (typeof lieuOuvert !== 'function') return true;
  return membresDuQuartier(q).some(l => lieuOuvert(l.id));
}
function quetesDuQuartier(q) {
  if (typeof quetesOuvertes !== 'function') return 0;
  const ids = new Set(q.membres || []);
  return quetesOuvertes().filter(x => ids.has(x.batiment)).length;
}

/* ---------- la fenêtre de choix ----------
   ELLE EST POSÉE SUR LA CARTE, PAS DEVANT. Un voile noir plein écran coupe le
   joueur du plan : il ne voit plus d'où il vient et le retour se fait à
   l'aveugle. La fenêtre s'ancre donc À CÔTÉ du quartier cliqué — à droite s'il
   est dans la moitié gauche du plan, à gauche sinon — avec un bec qui pointe
   dessus. On garde le lieu sous les yeux pendant qu'on choisit.

   DEUX COLONNES. À gauche, la liste des lieux : c'est le choix, et il tient en
   un coup d'œil. À droite, le lieu retenu : son image en bandeau, puis ce
   qu'il est et où il en est. Une liste qui porterait déjà les images obligeait
   à parcourir trois cartes pour en comparer deux. */
let _quartierOuvert = null;
let _quartierChoix = null;      // le membre affiché à droite

function ouvrirQuartier(id) {
  const q = HUB_QUARTIERS.find(x => x.id === id);
  if (!q) return;
  _quartierOuvert = id;
  /* On ouvre sur le premier lieu accessible : montrer d'emblée un lieu fermé
     ferait croire que le quartier entier l'est. */
  const dispo = membresDuQuartier(q).find(l => !lieuVerrouille(l.id));
  _quartierChoix = (dispo || membresDuQuartier(q)[0] || {}).id || null;
  renderQuartier();
}
function fermerQuartier() {
  _quartierOuvert = null; _quartierChoix = null;
  const b = document.querySelector('#quartierBoite');
  if (b) { cacherSurcouche(b); b.innerHTML = ''; }
  window.removeEventListener('resize', placerQuartier);
  window.removeEventListener('scroll', placerQuartier, true);
}
function choisirDansQuartier(id) { _quartierChoix = id; renderQuartier(); }

const lieuVerrouille = (id) => typeof lieuOuvert === 'function' ? !lieuOuvert(id) : false;

function etatDuLieu(l) {
  if (lieuVerrouille(l.id) && typeof ACTES !== 'undefined') {
    const a = ACTES.find(x => (x.lieux || []).includes(l.id));
    return a ? `acte ${a.n} · ${a.nom}` : 'plus tard';
  }
  try { return l.jauge ? l.jauge() : ''; } catch (e) { return ''; }
}

function renderQuartier() {
  const boite = document.querySelector('#quartierBoite');
  if (!boite) return;
  const q = HUB_QUARTIERS.find(x => x.id === _quartierOuvert);
  if (!q) { cacherSurcouche(boite); boite.innerHTML = ''; return; }

  const edition = (typeof CARTE_EDITION !== 'undefined' && CARTE_EDITION);
  const membres = membresDuQuartier(q);
  const choisi = membres.find(l => l.id === _quartierChoix) || membres[0] || null;

  const liste = membres.map(l => `<button class="qrChoix${l.id === (choisi || {}).id ? ' on' : ''}${
      lieuVerrouille(l.id) ? ' ferme' : ''}" type="button" data-qr-choix="${l.id}">
    <svg class="qrPicto" viewBox="0 0 24 24" aria-hidden="true">${HUB_BATIMENTS[l.id] || ''}</svg>
    <span class="qrCNom">${l.nom}</span>
    ${lieuVerrouille(l.id) ? '<span class="qrCadenas" aria-hidden="true">🔒</span>' : ''}
  </button>`).join('');

  const droite = choisi ? `
    <div class="qrBandeau">${choisi.image
      ? `<img src="${choisi.image}${VERSION_ASSETS}" alt="" loading="lazy" decoding="async"
             width="450" height="254">`
      : `<svg viewBox="0 0 24 24" aria-hidden="true">${HUB_BATIMENTS[choisi.id] || ''}</svg>`}</div>
    <div class="qrInfos">
      <b class="qrINom">${choisi.nom}</b>
      <p class="qrIDesc">${choisi.desc || ''}</p>
      <span class="qrIEtat">${etatDuLieu(choisi)}</span>
      ${lieuVerrouille(choisi.id)
        ? `<p class="qrIFerme">Ce lieu n'est pas encore ouvert.</p>`
        : `<button class="btn sm" id="qrAller" type="button">Y aller</button>`}
      ${edition ? `<button class="btn ghost sm danger" id="qrSortir" type="button">
          Sortir du quartier</button>` : ''}
    </div>` : `<p class="qrMot">Ce quartier est vide.</p>`;

  boite.innerHTML = `<div class="qtCadre qrCadre" role="dialog" aria-modal="true"
      aria-label="${q.nom}">
    <i class="qrBec" aria-hidden="true"></i>
    <div class="qtTete">
      <span class="qtTitre">${q.nom}</span>
      <span class="qtLieu">${membres.length} lieu${membres.length > 1 ? 'x' : ''}</span>
      <button class="btn ghost sm" id="qrFermer" type="button">Fermer</button>
    </div>
    ${q.desc ? `<p class="qrMot">${q.desc}</p>` : ''}
    <div class="qrCorps">
      <nav class="qrListe">${liste}</nav>
      <div class="qrVolet">${droite}</div>
    </div>
    ${edition ? `<div class="qrEdit">
      <button class="btn ghost sm" id="qrRenommer" type="button">Renommer le quartier</button>
      <button class="btn ghost sm danger" id="qrSupprimer" type="button">Supprimer le quartier</button>
    </div>` : ''}
  </div>`;

  montrerSurcouche(boite);
  placerBientot(placerQuartier);
  window.addEventListener('resize', placerQuartier);
  /* En capture : le plan défile avec la page, donc l'ancre bouge. */
  window.addEventListener('scroll', placerQuartier, true);

  boite.querySelector('#qrFermer').addEventListener('click', fermerQuartier);
  /* Un clic à côté referme. Le fond est transparent : c'est le seul moyen de
     sortir sans viser un bouton. */
  boite.addEventListener('click', ev => { if (ev.target === boite) fermerQuartier(); });
  boite.querySelectorAll('[data-qr-choix]').forEach(b =>
    b.addEventListener('click', () => choisirDansQuartier(b.dataset.qrChoix)));
  const aller = boite.querySelector('#qrAller');
  if (aller) aller.addEventListener('click', () => { const id = choisi.id; fermerQuartier(); allerAuLieu(id); });

  if (!edition) return;
  const sortir = boite.querySelector('#qrSortir');
  if (sortir) sortir.addEventListener('click', () => {
    sortirDuQuartier(choisi.id);
    _quartierChoix = null;
    renderQuartier(); renderHub();
  });
  boite.querySelector('#qrRenommer').addEventListener('click', () => {
    const n = prompt('Nom du quartier', q.nom);
    if (!n) return;
    q.nom = n.trim(); enregistrerQuartiers();
    renderQuartier(); renderHub();
  });
  boite.querySelector('#qrSupprimer').addEventListener('click', () => {
    if (!confirm(`Supprimer « ${q.nom} » ? Ses lieux reviennent sur le plan.`)) return;
    supprimerQuartier(q.id);
    fermerQuartier(); renderHub();
  });
}

/* Colle la fenêtre au nœud cliqué. Recalculée à chaque rendu, à chaque
   défilement et à chaque redimensionnement : une fenêtre ancrée qui reste en
   place pendant que sa cible s'en va est pire qu'une fenêtre centrée. */
/* ============================================================
   ANCRER UNE FENÊTRE SUR UN NŒUD DE LA CARTE

   TOUTES LES FENÊTRES DE LA CARTE SUIVENT LE MÊME MODÈLE : posées à côté du
   bâtiment qu'on vient de toucher, sans voile noir, avec un bec qui dit
   lequel. Le plan reste visible pendant qu'on choisit — c'est ce qui
   distingue « déplier une adresse » de « interrompre le joueur ».

   Le calcul est ici et pas dans chaque appelant : le Quartier, la Place et le
   Port le partagent, et une fenêtre qui se placerait autrement que les deux
   autres se remarquerait tout de suite.

   Le cadre doit être `position: fixed`, porter un `.<prefixe>Bec` et accepter
   un `data-cote`. Voir `.qrCadre` dans la feuille de style.
   ============================================================ */
function ancrerSurNoeud(cadre, idNoeud, secteurBec = '.qrBec') {
  const noeud = document.querySelector(`.villeLieu[data-lieu="${idNoeud}"]`);
  if (!cadre || !noeud) return;

  const n = noeud.getBoundingClientRect();
  /* LA TAILLE SE LIT SUR `offsetWidth`, PAS SUR LE RECTANGLE. Le cadre entre en
     scène avec un `transform: scale(.97)`, et `getBoundingClientRect()` rend la
     boîte TRANSFORMÉE : on calculait donc la place avec une largeur inférieure
     à la vraie, et la fenêtre débordait de l'écran une fois l'animation finie.
     `offsetWidth` est la boîte de mise en page, insensible au transform. */
  const c = { width: cadre.offsetWidth, height: cadre.offsetHeight };
  const M = 12;                                   // marge au bord de l'écran
  const ECART = 14;                               // entre le nœud et la fenêtre
  const W = window.innerWidth, H = window.innerHeight;

  /* Le côté : on se place du côté où il y a de la place. À défaut des deux,
     on retombe sous le nœud — un écran étroit n'a pas de « à côté ». */
  const placeDroite = W - n.right - ECART - M;
  const placeGauche = n.left - ECART - M;
  let x, cote;
  if (placeDroite >= c.width) { x = n.right + ECART; cote = 'droite'; }
  else if (placeGauche >= c.width) { x = n.left - ECART - c.width; cote = 'gauche'; }
  else { x = Math.max(M, Math.min(W - c.width - M, n.left + n.width / 2 - c.width / 2)); cote = 'dessous'; }

  let y = cote === 'dessous'
    ? n.bottom + ECART
    : n.top + n.height / 2 - c.height / 2;
  y = Math.max(M, Math.min(H - c.height - M, y));

  cadre.style.left = Math.round(x) + 'px';
  cadre.style.top = Math.round(y) + 'px';
  cadre.dataset.cote = cote;

  /* Le bec suit le nœud, sans jamais sortir des coins arrondis. */
  const bec = cadre.querySelector(secteurBec);
  if (!bec) return;
  if (cote === 'dessous') {
    bec.style.top = '';
    bec.style.left = Math.round(Math.max(20, Math.min(c.width - 20,
      n.left + n.width / 2 - x))) + 'px';
  } else {
    bec.style.left = '';
    bec.style.top = Math.round(Math.max(22, Math.min(c.height - 22,
      n.top + n.height / 2 - y))) + 'px';
  }
}

/* PLACER DEUX FOIS, ET CE N'EST PAS UNE PRÉCAUTION SUPERSTITIEUSE. Au premier
   appel, le cadre vient d'être inséré : sa largeur définitive dépend de son
   contenu, des polices en cours de chargement et de la requête média qui
   s'applique. On place tout de suite — pour qu'il n'apparaisse jamais au
   mauvais endroit — puis on replace à la frame suivante, quand tout est
   mesuré. Sans le second passage, une fenêtre trop large pour l'écran restait
   calée sur une largeur sous-estimée et débordait par la droite. */
function placerBientot(placer) {
  placer();
  if (document.hidden) return setTimeout(placer, 0);
  requestAnimationFrame(() => requestAnimationFrame(placer));
}

/* Le suivi : une fenêtre ancrée doit rester collée quand la page défile ou
   que la fenêtre change de taille. `arreter` rend la fonction de retrait. */
function suivreNoeud(placer) {
  window.addEventListener('resize', placer);
  window.addEventListener('scroll', placer, true);   // capture : le plan défile
  return () => {
    window.removeEventListener('resize', placer);
    window.removeEventListener('scroll', placer, true);
  };
}

function placerQuartier() {
  const boite = document.querySelector('#quartierBoite');
  ancrerSurNoeud(boite && boite.querySelector('.qrCadre'), _quartierOuvert);
}

/* Le geste que le joueur attendait en cliquant : aller au lieu. C'est le même
   aiguillage que sur le plan, sorti de `cablerHub` pour être partagé. */
function allerAuLieu(id) {
  const l = HUB_LIEUX.find(x => x.id === id);
  if (!l) return;
  if (l.pnj) return ouvrirPlace();
  if (l.quetes) return ouvrirGare();
  if (l.lien) { window.location.href = l.lien; return; }
  if (!l.vue) return;
  if (l.jeu) { try { localStorage.setItem('gachanombres.minijeu', l.jeu); } catch (e) {} }
  ouvrirOnglet(l.vue);
}


/* ============================================================
   ⚠ MODE PLACEMENT — POSER LES BÂTIMENTS À LA SOURIS

   À QUOI ÇA SERT. Le plan est désormais une illustration, pas un schéma : les
   bâtiments doivent tomber sur les toits qui y sont dessinés, et aucun calcul
   ne peut deviner où ils sont. On les pose donc à la main, et ce mode rend
   chaque emprise déplaçable.

   IL PERSISTE, SINON IL NE SERT À RIEN. Une heure de placement perdue au
   premier rechargement n'aurait aucun intérêt : les positions sont écrites
   dans `localStorage` à chaque relâchement, et relues au chargement. Ce n'est
   PAS la sauvegarde de partie — c'est un brouillon d'auteur, et il ne part
   jamais au nuage.

   ET IL TIENT L'INTERRUPTEUR ÉTEINT. C'est la raison d'être du mode : on
   affine les positions POUR QU'ELLES RESTENT. Éteindre le placement retire
   les poignées, le panneau et le double-clic — pas le travail. Ce qu'on voit
   alors est exactement ce qu'on a laissé.

   DEUX ÉTAGES, ET IL FAUT LES DISTINGUER. Le brouillon vit dans ce
   navigateur ; il suffit pour travailler, il ne suffit pas pour le site.
   « Copier le bloc » puis `node outils/poser_carte.js` écrit les positions
   dans js/hub.js — c'est là qu'un placement devient définitif pour tout le
   monde.

   ET IL REND SON TRAVAIL. Le bouton « Copier » rend un bloc JSON que
   `node outils/poser_carte.js` réécrit directement dans HUB_LIEUX. Sans cette
   sortie, le placement resterait dans un navigateur et il faudrait le refaire.

   DEUX PLANS, DEUX JEUX DE COORDONNÉES. Le plan large et le plan étroit n'ont
   pas la même forme, donc pas les mêmes positions : on déplace celles du plan
   ACTUELLEMENT affiché, et le panneau dit lequel c'est. Redimensionner la
   fenêtre fait basculer d'un jeu à l'autre.

   Il disparaît entièrement avec le drapeau ci-dessous.
   ============================================================ */
/* LA GARDE EST L'ADRESSE, PAS UN DRAPEAU. Un drapeau se laisse à `true` et
   part en production ; une adresse ne s'oublie pas. Hors localhost, le mode
   placement n'existe pas : ni bouton, ni glissement, ni panneau.

   ET IL S'ALLUME À LA DEMANDE. Les positions sont figées dans le code — le
   plan est posé. On ne veut plus des poignées de déplacement à chaque visite
   de la Carte, mais on veut pouvoir les rappeler pour retoucher un bâtiment.
   D'où un interrupteur dans l'en-tête, visible seulement sur la Carte et
   seulement en local. Son état vit dans `localStorage` : on ne le rallume pas
   à chaque rechargement au milieu d'un placement. */
const CARTE_DEV = (typeof EN_DEV !== 'undefined') && EN_DEV;
const CARTE_EDITION_CLE = 'gachanombres.carteEditionActive';

let CARTE_EDITION = (() => {
  if (!CARTE_DEV) return false;
  try { return localStorage.getItem(CARTE_EDITION_CLE) === '1'; } catch (e) { return false; }
})();

function basculerPlacement() {
  if (!CARTE_DEV) return;
  CARTE_EDITION = !CARTE_EDITION;
  try { localStorage.setItem(CARTE_EDITION_CLE, CARTE_EDITION ? '1' : '0'); } catch (e) {}
  if (!CARTE_EDITION) {
    const p = document.querySelector('#carteEdit');
    if (p) p.remove();
  }
  renderAll();
  toast(CARTE_EDITION
    ? '⚠ Placement <b>actif</b> — les bâtiments se déplacent.'
    : 'Placement arrêté. Les positions du code font foi.', CARTE_EDITION ? 'gold' : '');
}

const CARTE_BROUILLON = 'gachanombres.carteEdition';

/* Le brouillon : { etroit: {id: [x, y]}, large: {id: [xl, yl]} } */
function lireBrouillon() {
  try {
    const b = JSON.parse(localStorage.getItem(CARTE_BROUILLON) || '{}');
    return { etroit: b.etroit || {}, large: b.large || {}, quartiers: b.quartiers || null };
  } catch (e) { return { etroit: {}, large: {}, quartiers: null }; }
}
function ecrireBrouillon(b) {
  try { localStorage.setItem(CARTE_BROUILLON, JSON.stringify(b)); } catch (e) {}
}

/* Le brouillon est appliqué à HUB_LIEUX au chargement : le reste du jeu —
   les rues, la rivière, le vérificateur de chevauchement — lit les mêmes
   coordonnées, et voit donc ce que l'auteur est en train de faire. */
function appliquerBrouillon() {
  /* LE PLACEMENT TIENT QUAND MÊME L'INTERRUPTEUR ÉTEINT, et c'est tout son
     intérêt : on affine les positions à la main POUR QU'ELLES RESTENT. Le
     mode placement ne décide pas d'où sont les bâtiments, il décide si on
     peut les bouger. Éteint, on voit exactement le plan qu'on a laissé.

     La garde est donc `CARTE_DEV` et non `CARTE_EDITION` : en production il
     n'y a pas de brouillon — les coordonnées du code, écrites par
     `outils/poser_carte.js`, sont les seules qui existent. C'est ce passage
     par le code qui rend un placement définitif ; le brouillon, lui, ne vit
     que dans ce navigateur. */
  if (!CARTE_DEV) return;
  const b = lireBrouillon();
  if (Array.isArray(b.quartiers)) {
    HUB_QUARTIERS.length = 0;
    for (const q of b.quartiers) HUB_QUARTIERS.push(q);
  }
  for (const l of HUB_LIEUX) {
    const e = b.etroit[l.id], g = b.large[l.id];
    if (e) { l.x = e[0]; l.y = e[1]; }
    if (g) { l.xl = g[0]; l.yl = g[1]; }
  }
}

/* ---------- ⚠ les quartiers, à la souris ---------- */

/* Un identifiant lisible tiré du nom, préfixé pour ne jamais entrer en
   collision avec un identifiant de lieu. */
function idDeQuartier(nom) {
  const base = 'q_' + nom.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '').slice(0, 18);
  let id = base, n = 2;
  while (HUB_QUARTIERS.some(q => q.id === id)) id = base + n++;
  return id;
}

function creerQuartier(x, y) {
  const nom = prompt('Nom du quartier', 'Quartier');
  if (!nom || !nom.trim()) return null;
  const q = { id: idDeQuartier(nom), nom: nom.trim(), desc: '',
              x, y, xl: x, yl: y, membres: [] };
  HUB_QUARTIERS.push(q);
  enregistrerQuartiers();
  renderHub();
  toast(`Quartier « ${q.nom} » créé. Glissez-y des bâtiments.`, 'gold');
  return q;
}

function rangerDansQuartier(idLieu, idQuartier) {
  if (idLieu === idQuartier) return;
  sortirDuQuartier(idLieu);                      // un lieu n'a qu'une adresse
  const q = HUB_QUARTIERS.find(x => x.id === idQuartier);
  if (!q) return;
  q.membres = q.membres || [];
  if (!q.membres.includes(idLieu)) q.membres.push(idLieu);
  enregistrerQuartiers();
}

function sortirDuQuartier(idLieu) {
  for (const q of HUB_QUARTIERS) {
    const i = (q.membres || []).indexOf(idLieu);
    if (i >= 0) q.membres.splice(i, 1);
  }
  enregistrerQuartiers();
}

function supprimerQuartier(id) {
  const i = HUB_QUARTIERS.findIndex(q => q.id === id);
  if (i >= 0) HUB_QUARTIERS.splice(i, 1);
  enregistrerQuartiers();
}

function enregistrerQuartiers() {
  const b = lireBrouillon();
  b.quartiers = HUB_QUARTIERS;
  ecrireBrouillon(b);
}

/* Le quartier sous un point, s'il y en a un : c'est ce qui décide qu'un
   bâtiment lâché là y entre. On compare aux emprises RENDUES, pas aux
   coordonnées : c'est ce que l'auteur voit. */
function quartierSousLePoint(x, y, sauf) {
  const plan = document.querySelector('.villePlan');
  if (!plan) return null;
  for (const el of plan.querySelectorAll('.villeLieu[data-quartier]')) {
    if (el.dataset.quartier === sauf) continue;
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return HUB_QUARTIERS.find(q => q.id === el.dataset.quartier) || null;
    }
  }
  return null;
}

/* ---------- le déplacement ---------- */
let _glisse = null;

function cablerPlacement() {
  if (!CARTE_EDITION) return;
  const plan = document.querySelector('.villePlan');
  if (!plan) return;
  plan.classList.add('enEdition');

  plan.querySelectorAll('.villeLieu').forEach(el => {
    /* `pointerdown` plutôt que `mousedown` : la même écriture sert la souris,
       le doigt et le stylet, et la capture garantit qu'on ne perd pas le
       bâtiment si le curseur sort du plan en cours de route. */
    el.addEventListener('pointerdown', ev => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      ev.preventDefault();
      const r = plan.getBoundingClientRect();
      const c = el.getBoundingClientRect();
      _glisse = {
        el, plan,
        /* L'écart entre le point saisi et le centre de l'emprise : sans lui,
           le bâtiment sauterait sous le curseur au premier pixel. */
        dx: ev.clientX - (c.left + c.width / 2),
        dy: ev.clientY - (c.top + c.height / 2),
        r, bouge: false,
      };
      el.setPointerCapture(ev.pointerId);
      el.classList.add('saisi');
    });

    el.addEventListener('pointermove', ev => {
      if (!_glisse || _glisse.el !== el) return;
      _glisse.bouge = true;
      const r = _glisse.r;
      let x = (ev.clientX - _glisse.dx - r.left) / r.width * 100;
      let y = (ev.clientY - _glisse.dy - r.top) / r.height * 100;
      /* Au demi-pour-cent près, sauf en tenant Maj : un plan posé au centième
         de pour-cent donne des nombres illisibles dans le code source pour un
         écart d'un pixel à l'écran. */
      const pas = ev.shiftKey ? 0.1 : 0.5;
      x = Math.round(Math.max(0, Math.min(100, x)) / pas) * pas;
      y = Math.round(Math.max(0, Math.min(100, y)) / pas) * pas;
      el.style.left = x + '%';
      el.style.top = y + '%';
      majPanneauPlacement(el.dataset.lieu, x, y);
      /* La cible de rangement s'allume sous le bâtiment : sans ce retour, on
         ne sait pas si le lâcher va ranger ou simplement poser. */
      const vise = el.dataset.quartier ? null
        : quartierSousLePoint(ev.clientX, ev.clientY, el.dataset.lieu);
      plan.querySelectorAll('.villeLieu.cible').forEach(c => c.classList.remove('cible'));
      if (vise) {
        const n = plan.querySelector(`.villeLieu[data-quartier="${vise.id}"]`);
        if (n) n.classList.add('cible');
      }
    });

    const lacher = ev => {
      if (!_glisse || _glisse.el !== el) return;
      el.classList.remove('saisi');
      try { el.releasePointerCapture(ev.pointerId); } catch (e) {}
      const bougé = _glisse.bouge;
      _glisse = null;
      plan.querySelectorAll('.villeLieu.cible').forEach(c => c.classList.remove('cible'));
      if (!bougé) return;                    // un simple clic reste un clic
      const id = el.dataset.lieu;

      /* LÂCHÉ SUR UN QUARTIER : le bâtiment y entre au lieu de se poser. On
         garde quand même ses coordonnées — il les retrouvera intactes le jour
         où on le ressort, plutôt que de réapparaître dans un coin. */
      const q = el.dataset.quartier ? null : quartierSousLePoint(ev.clientX, ev.clientY, id);
      const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
      poserLieu(id, x, y);
      if (q) {
        rangerDansQuartier(id, q.id);
        toast(`<b>${(HUB_LIEUX.find(l => l.id === id) || {}).nom || id}</b> rangé dans « ${q.nom} ».`, 'gold');
        renderHub();
      }
    };
    el.addEventListener('pointerup', lacher);
    el.addEventListener('pointercancel', lacher);

    /* Le clavier aussi : les flèches déplacent d'un demi-pour-cent, et c'est
       souvent le seul moyen d'ajuster proprement les derniers pixels. */
    el.addEventListener('keydown', ev => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (!d) return;
      ev.preventDefault();
      const pas = ev.shiftKey ? 0.1 : 0.5;
      const l = HUB_LIEUX.find(o => o.id === el.dataset.lieu);
      if (!l) return;
      const large = HUB_LARGE();
      const x = Math.max(0, Math.min(100, (large ? l.xl : l.x) + d[0] * pas));
      const y = Math.max(0, Math.min(100, (large ? l.yl : l.y) + d[1] * pas));
      poserLieu(l.id, +x.toFixed(1), +y.toFixed(1));
      renderHub();
      const rendu = document.querySelector(`.villeLieu[data-lieu="${l.id}"]`);
      if (rendu) rendu.focus();
    });
  });

  /* DOUBLE-CLIC SUR LE VIDE : un quartier naît là. Sur un bâtiment, non —
     sinon un double-clic malheureux sur la Forge créerait un quartier par-
     dessus elle. */
  plan.addEventListener('dblclick', ev => {
    if (ev.target.closest('.villeLieu')) return;
    const r = plan.getBoundingClientRect();
    const x = Math.round((ev.clientX - r.left) / r.width * 200) / 2;
    const y = Math.round((ev.clientY - r.top) / r.height * 200) / 2;
    creerQuartier(x, y);
  });

  posePanneauPlacement();
  /* Le panneau survit au redimensionnement, mais pas l'étiquette du plan : sans
     cette remise à jour, il annonçait « plan large » alors qu'on déplaçait les
     coordonnées du plan étroit — et on posait la ville dans le mauvais jeu de
     valeurs sans s'en apercevoir. */
  majPanneauPlacement();
}

/* Écrit la position dans le lieu ET dans le brouillon, pour le plan courant. */
function poserLieu(id, x, y) {
  /* Un quartier se déplace comme un bâtiment, mais il vit dans son propre
     tableau : ses coordonnées partent avec lui dans `quartiers`, pas dans la
     table des lieux. */
  const q = HUB_QUARTIERS.find(o => o.id === id);
  const l = q || HUB_LIEUX.find(o => o.id === id);
  if (!l) return;
  const large = HUB_LARGE();
  if (large) { l.xl = x; l.yl = y; } else { l.x = x; l.y = y; }
  if (q) { enregistrerQuartiers(); majPanneauPlacement(id, x, y); return; }
  const b = lireBrouillon();
  (large ? b.large : b.etroit)[id] = [x, y];
  ecrireBrouillon(b);
  majPanneauPlacement(id, x, y);
}

/* ---------- le panneau ---------- */
function posePanneauPlacement() {
  if (document.querySelector('#carteEdit')) return;
  const p = document.createElement('aside');
  p.id = 'carteEdit';
  p.innerHTML = `
    <div class="ceTete">
      <b>⚠ Placement</b>
      <span id="ceQuel"></span>
    </div>
    <p class="ceMot">Faites glisser un bâtiment. <b>Maj</b> pour le pas fin,
       les <b>flèches</b> au clavier une fois qu'il a le focus.<br>
       Chaque dépôt est gardé : le plan reste ainsi, interrupteur éteint.
       <b>Copier le bloc</b> sert à le graver dans le code, pour le site.</p>
    <output id="ceLu">—</output>
    <div class="cePied">
      <button class="btn sm" id="ceCopier" type="button">Copier le bloc</button>
      <button class="btn ghost sm danger" id="ceVider" type="button">Tout remettre</button>
    </div>
    <textarea id="ceSortie" readonly spellcheck="false"></textarea>`;
  document.body.appendChild(p);

  p.querySelector('#ceCopier').addEventListener('click', () => {
    const t = blocDePlacement();
    const sortie = p.querySelector('#ceSortie');
    sortie.value = t;
    console.log(t);
    /* LE PRESSE-PAPIERS REFUSE EN PROMESSE, PAS EN EXCEPTION. Un try/catch ne
       l'attrape donc pas : le premier jet annonçait « copié » alors que rien
       ne l'était — le navigateur refuse dès que la page n'a pas le focus. On
       n'annonce le succès que dans le `.then`, et l'échec sélectionne le texte
       pour qu'un Ctrl+C prenne le relais. */
    const replier = () => {
      sortie.focus(); sortie.select();
      toast('Copie refusée par le navigateur — le texte est sélectionné, Ctrl+C.', 'bad');
    };
    if (!navigator.clipboard) return replier();
    navigator.clipboard.writeText(t).then(
      () => toast('Bloc copié. <code>node outils/poser_carte.js</code> pour l\'appliquer.', 'gold'),
      replier);
  });
  p.querySelector('#ceVider').addEventListener('click', () => {
    if (!confirm('Effacer tout le placement et revenir aux positions du code ?')) return;
    try { localStorage.removeItem(CARTE_BROUILLON); } catch (e) {}
    location.reload();
  });
}

function majPanneauPlacement(id, x, y) {
  const quel = document.querySelector('#ceQuel');
  const lu = document.querySelector('#ceLu');
  if (quel) quel.textContent = HUB_LARGE() ? 'plan large (xl / yl)' : 'plan étroit (x / y)';
  if (lu && id) {
    const l = HUB_LIEUX.find(o => o.id === id);
    lu.textContent = `${l ? l.nom : id} — ${x} , ${y}`;
  }
}

/* Le rendu final : tout HUB_LIEUX, dans les deux plans, prêt à être appliqué
   au fichier source. On rend TOUT et pas seulement ce qui a bougé — un bloc
   partiel obligerait à fusionner à la main. */
function blocDePlacement() {
  /* Une ligne par bâtiment. `JSON.stringify` avec indentation éclate chaque
     tableau sur quatre lignes : soixante-huit lignes de chiffres qu'on ne peut
     ni relire ni comparer d'un coup d'œil. */
  const lieux = HUB_LIEUX.map(l =>
    `    "${l.id}": [${l.x}, ${l.y}, ${l.xl}, ${l.yl}]`).join(',\n');
  /* Les quartiers partent avec, dans le même bloc : les séparer obligerait à
     coller deux morceaux au bon endroit, et c'est là qu'on se trompe. */
  const quartiers = HUB_QUARTIERS.map(q =>
    `    {"id": "${q.id}", "nom": ${JSON.stringify(q.nom)}, "desc": ${JSON.stringify(q.desc || '')}, `
    + `"x": ${q.x}, "y": ${q.y}, "xl": ${q.xl}, "yl": ${q.yl}, `
    + `"membres": ${JSON.stringify(q.membres || [])}}`).join(',\n');
  return ['{',
    '  "lieux": {', lieux, '  },',
    '  "quartiers": [', quartiers, '  ]',
    '}'].join('\n') + '\n';
}


function renderHub() {
  const zone = document.querySelector('#hubZone');
  if (!zone) return;

  /* Le placement en cours écrase les coordonnées du code : tout ce qui les lit
     — rues, rivière, contrôle de chevauchement — voit ce que l'auteur fait. */
  appliquerBrouillon();

  const large = HUB_LARGE();
  const ax = l => large && l.xl !== undefined ? l.xl : l.x;
  const ay = l => large && l.yl !== undefined ? l.yl : l.y;

  const par = {};
  HUB_LIEUX.forEach(l => par[l.id] = l);

  indexerQuartiers();

  const batiment = (l) => {
    /* Le verrou des actes : voir l'en-tête. En jeu, un lieu fermé n'arrive pas
       jusqu'ici — il est écarté par le filtrage. En mode placement il arrive
       quand même, en sourdine : il faut pouvoir poser un bâtiment avant de
       l'avoir mérité, sinon il faudrait finir le jeu pour dessiner la carte. */
    const ouvert = typeof lieuOuvert === 'function' ? lieuOuvert(l.id) : true;
    /* Le Port reste sur le plan dès qu'on est entré dans la Cité, quête ou
       non. Il disparaissait quand le quai était vide ; un lieu qui s'efface se
       cherche, et le joueur finit par croire qu'il l'a rêvé. */
    const enQuete = l.quetes && typeof quetesOuvertes === 'function'
      ? quetesOuvertes().filter(q => q.batiment === l.id) : [];
    /* Un <a> ne se désactive pas : un lien fermé doit devenir un bouton,
       sinon `disabled` est ignoré et le Codex reste accessible à l'acte 0. */
    const balise = (l.lien && ouvert) ? 'a' : 'button';
    const attrs = !ouvert ? 'type="button" disabled'
                 : l.lien ? `href="${l.lien}"`
                 : l.pnj ? 'type="button" data-place="1"'
                 : l.quetes ? 'type="button" data-gare="1"'
                 : `type="button" data-hub="${l.id}"`;
    let jauge = '';
    if (!ouvert && typeof ACTES !== 'undefined') {
      /* Annoncer QUAND ça s'ouvre vaut mieux qu'un cadenas muet : le joueur
         sait ce qu'il poursuit. */
      const a = ACTES.find(x => (x.lieux || []).includes(l.id));
      jauge = a ? `acte ${a.n} · ${a.nom}` : 'plus tard';
    } else {
      try { jauge = l.jauge ? l.jauge() : ''; } catch (e) { jauge = ''; }
    }
    /* L'agrandissement au survol part du bord le plus proche : une vignette
       posée à 14 % qui grandirait depuis son centre déborderait du plan par la
       gauche. On cale donc le point de fuite selon l'implantation, et l'image
       grandit vers l'intérieur de la ville. */
    const fuite = ax(l) < 30 ? 'left' : ax(l) > 70 ? 'right' : 'center';
    /* `data-lieu` est posé sur TOUS les bâtiments, ouverts ou non : `data-hub`
       disparaît avec le verrou, et sans repère stable la visite guidée ne
       peut pas montrer un lieu qu'elle veut justement présenter. */
    /* SUR LA CARTE, TOUJOURS LE PICTO — jamais la vignette photographique.
       Le plan était un schéma : cinq grandes images y situaient les lieux
       importants. C'est maintenant une illustration, et les mêmes images
       posées dessus cachent justement ce qu'elles prétendaient montrer. Les
       vignettes n'ont pas disparu pour autant : `l.image` sert au bandeau du
       volet d'un quartier, où elle est à sa place — grande, seule, et
       regardée. */
    return `<${balise} class="villeLieu ${l.zone}${ouvert ? '' : ' ferme'}"
        data-lieu="${l.id}"
        style="left:${ax(l)}%;top:${ay(l)}%;--fuite:${fuite}" ${attrs}>
      <svg class="villeIcone" viewBox="0 0 24 24" aria-hidden="true">${HUB_BATIMENTS[l.id] || ''}</svg>
      <span class="villeNom">${l.nom}</span>
      <span class="villeDesc">${l.desc}</span>
      <span class="villeJauge">${jauge}</span>
      ${enQuete.length ? `<span class="villeBulle" aria-hidden="true">${enQuete.length}</span>` : ''}
    </${balise}>`;
  };

  /* ---- le nœud d'un quartier ----
     Même emprise qu'un bâtiment, pour que le déplacement et le contrôle de
     chevauchement les traitent pareil. Il porte `data-quartier` en plus de
     `data-lieu` : c'est ce qui permet de reconnaître une cible de rangement
     pendant le placement. */
  const noeudQuartier = (q) => {
    /* Hors placement, un quartier fermé n'est pas rendu du tout ; en
       placement il l'est, en sourdine, pour pouvoir le poser. */
    const ouvert = quartierOuvert(q);
    const n = (q.membres || []).length;
    const quetes = quetesDuQuartier(q);
    const fuite = ax(q) < 30 ? 'left' : ax(q) > 70 ? 'right' : 'center';
    return `<button class="villeLieu ville quartier${ouvert ? '' : ' ferme'}"
        data-lieu="${q.id}" data-quartier="${q.id}" type="button"
        ${ouvert ? '' : 'disabled'}
        style="left:${ax(q)}%;top:${ay(q)}%;--fuite:${fuite}">
      <svg class="villeIcone" viewBox="0 0 24 24" aria-hidden="true">${HUB_BATIMENTS.quartier}</svg>
      <span class="villeNom">${q.nom}</span>
      <span class="villeDesc">${q.desc || ''}</span>
      <span class="villeJauge">${n} lieu${n > 1 ? 'x' : ''}</span>
      ${quetes ? `<span class="villeBulle" aria-hidden="true">${quetes}</span>` : ''}
    </button>`;
  };

  /* Un lieu rangé dans un quartier n'a plus de pastille à lui : c'est tout
     l'intérêt. Il reste dans HUB_LIEUX, donc les actes, les quêtes et les
     onglets continuent de le connaître. */
  /* Ce qui se pose sur le plan : les lieux OUVERTS et hors quartier, plus les
     quartiers dont au moins un membre est ouvert. Le reste n'existe pas
     encore — pas même en sourdine. Le mode placement, lui, montre tout. */
  const tout = (typeof CARTE_EDITION !== 'undefined' && CARTE_EDITION);
  const estOuvert = (id) => tout || (typeof lieuOuvert === 'function' ? lieuOuvert(id) : true);
  const noeuds = HUB_LIEUX
      .filter(l => !quartierDuLieu(l.id) && estOuvert(l.id))
      .map(batiment).join('')
    + HUB_QUARTIERS.filter(q => tout || quartierOuvert(q)).map(noeudQuartier).join('');

  zone.innerHTML = `
    ${porteHTML()}
    <div class="villeCadre">
      <!-- Chemin ABSOLU, et ce n'est pas un détail : une url() portée par une
           variable CSS se résout depuis la feuille de style qui la consomme,
           pas depuis la page. En relatif, le navigateur allait chercher
           « css/images/ville.webp » et rendait un 404 silencieux — le plan
           restait noir sans qu'aucune erreur ne le dise. -->
      <div class="villePlan${large ? ' large' : ''}"
           style="--villeFond:url('/images/ville.webp${VERSION_ASSETS}')">
        ${noeuds}
      </div>
    </div>`;

  cablerHub();
  cablerPlacement();
}

/* ============================================================
   LA VUE DU LIEU, EN FOND DE PAGE

   Elle était en bandeau au-dessus du contenu ; elle est maintenant DERRIÈRE
   lui, sur toute la page. Un bandeau se regarde une fois puis se saute ; un
   fond installe le lieu et se tait.

   TROIS CONTRAINTES QUI DÉCIDENT DE TOUT :

   1. LA LISIBILITÉ D'ABORD. Une image sous du texte, c'est du texte illisible.
      Un voile épais la couvre — assez pour que le contraste du corps de texte
      ne bouge pas d'un pouce, assez peu pour qu'on reconnaisse le lieu.

   2. LES ANNONCES NE FLOTTENT PAS DESSUS. Un emplacement publicitaire posé sur
      une illustration se confond avec elle, et un clic sur une image prise pour
      une annonce est un clic invalide. Les cadres d'annonce gardent donc un
      fond opaque — voir `.pub` dans la feuille de style.

   3. ELLE NE DÉFILE PAS. Le fond est fixe : le contenu glisse dessus. Un fond
      qui défile avec la page se répète ou se coupe, et sur un onglet long il
      finit par montrer du vide.

   Le fond est posé sur `<html>` plutôt que sur `<body>` : le corps de page est
   peint en opaque, une couche en z-index négatif serait passée derrière lui.
   ============================================================ */

/* Deux lieux partagent l'onglet des mini-jeux : le fond suit l'exercice. */
const LIEU_VARIANTE = {
  minijeux: () => (typeof jeuChoisi === 'function' && jeuChoisi() === 'expedition')
    ? 'expedition' : 'academie',
};

/* La vue montrée sur un onglet, s'il y en a une. */
function lieuDeLaVue(vue) {
  const variante = LIEU_VARIANTE[vue];
  if (variante) return variante();
  const l = (typeof HUB_LIEUX !== 'undefined')
    ? HUB_LIEUX.find(x => x.vue === vue && x.image) : null;
  return l ? l.id : null;
}

function poserFondDeLieu() {
  const fond = document.querySelector('#fondLieu');
  if (!fond || typeof vueCourante !== 'function') return;

  const id = lieuDeLaVue(vueCourante());
  const lieu = (typeof HUB_LIEUX !== 'undefined') && id
    ? HUB_LIEUX.find(l => l.id === id) : null;

  if (!lieu || !lieu.image) {
    fond.style.backgroundImage = '';
    fond.classList.remove('on');
    poserCurseurFond(false);
    return;
  }

  /* On ne réécrit que ce qui change, mais on le mesure SUR L'ÉLÉMENT, pas dans
     un `dataset` tenu à côté. Un cache parallèle finit toujours par mentir :
     celui-ci gardait le nom du dernier lieu même après qu'on eut effacé
     l'image, si bien qu'en revenant sur l'onglet le fond restait vide. */
  const url = `url("${lieu.image}${VERSION_ASSETS}")`;
  if (fond.style.backgroundImage !== url) fond.style.backgroundImage = url;
  fond.classList.add('on');
  poserCurseurFond(true);
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
      /* Pendant le placement, un bâtiment se déplace ; il n'ouvre rien. Sans
         ça, chaque dépôt changerait d'onglet et on ne poserait jamais rien. */
      if (typeof CARTE_EDITION !== 'undefined' && CARTE_EDITION) return;
      allerAuLieu(el.dataset.hub);
    }));

  const enPlacement = () => (typeof CARTE_EDITION !== 'undefined' && CARTE_EDITION);

  /* Le quartier s'ouvre TOUJOURS, y compris en mode placement : c'est par sa
     modale qu'on sort un lieu, qu'on le renomme et qu'on le supprime. Sans ça,
     une erreur de rangement n'aurait aucun recours. */
  document.querySelectorAll('#hubZone [data-quartier]').forEach(el =>
    el.addEventListener('click', () => ouvrirQuartier(el.dataset.quartier)));
  document.querySelectorAll('#hubZone [data-gare]').forEach(el =>
    el.addEventListener('click', () => { if (!enPlacement()) ouvrirGare(); }));

  document.querySelectorAll('#hubZone [data-place]').forEach(el =>
    el.addEventListener('click', () => { if (!enPlacement()) ouvrirPlace(); }));

  const porte = document.querySelector('#porteFranchir');
  if (porte) porte.addEventListener('click', () => {
    const a = franchirActe();
    if (!a) return toast("Il manque encore quelque chose.", 'bad');
    toast(`▸ <b>Acte ${a.n} — ${a.nom}.</b> ${a.titre}.`, 'gold');
    renderAll();
  });
}


/* ============================================================
   LE CURSEUR D'OPACITÉ DU FOND

   UN SEUL RÉGLAGE POUR TOUT LE JEU. Il vit dans `localStorage` et non dans la
   sauvegarde : c'est une préférence d'affichage, elle n'a rien à faire dans ce
   qu'on synchronise au nuage ni dans ce qui alimente le classement.

   LE CURSEUR SE DÉPLACE AVEC LE JOUEUR. Un exemplaire par onglet aurait voulu
   dire quatre copies à tenir d'accord ; comme un seul onglet est visible à la
   fois, on déplace le même. Il n'apparaît que là où il y a une vue à régler.

   POURQUOI 50 % PAR DÉFAUT, ET PAS 100 %. Le réglage est mesuré, pas choisi :
   les panneaux du jeu sont transparents à 4,5 %, donc c'est le fond de page
   qui porte toute la lisibilité. Sur les zones les plus claires d'une
   illustration, le texte le plus pâle (--dim2) vaut 4,1 de contraste sans
   image, 3,1 à mi-curseur, et 2,1 à fond. La moitié est le point où l'on voit
   l'illustration sans que rien ne devienne pénible à lire ; au-delà, c'est un
   choix assumé du joueur, et c'est très bien ainsi — c'est sa partie.
   ============================================================ */
const CLE_FOND_OPACITE = 'gachanombres.fondOpacite';
const FOND_OPACITE_DEFAUT = 50;

function fondOpacite() {
  try {
    const v = parseInt(localStorage.getItem(CLE_FOND_OPACITE), 10);
    if (Number.isFinite(v) && v >= 0 && v <= 100) return v;
  } catch (e) {}
  return FOND_OPACITE_DEFAUT;
}

function reglerFondOpacite(v) {
  const n = Math.max(0, Math.min(100, Math.round(v)));
  try { localStorage.setItem(CLE_FOND_OPACITE, String(n)); } catch (e) {}
  appliquerFondOpacite();
  return n;
}

/* La valeur est posée sur la racine : la couche la lit, et tout exemplaire du
   curseur affiché ailleurs la relit au même endroit. */
function appliquerFondOpacite() {
  const v = fondOpacite();
  document.documentElement.style.setProperty('--fond-op', (v / 100).toFixed(3));
  document.querySelectorAll('.fondReglage input[type="range"]').forEach(i => {
    if (+i.value !== v) i.value = v;
  });
  document.querySelectorAll('.fondReglage .fondVal').forEach(s => s.textContent = v + ' %');
}

/* Pose le curseur en tête de l'onglet courant, s'il y a une vue à régler.

   ON NE LE RECONSTRUIT PAS S'IL EST DÉJÀ LÀ. `renderAll()` passe ici à chaque
   tirage, chaque gain, chaque changement d'onglet ; remplacer l'élément à
   chaque fois arracherait le curseur des doigts du joueur en plein glissement,
   et lui volerait le focus au clavier. */
function poserCurseurFond(actif) {
  const section = actif ? document.querySelector('.tab.on') : null;
  document.querySelectorAll('.fondReglage').forEach(el => {
    if (el.parentElement !== section) el.remove();
  });
  if (!section) return;
  if (section.querySelector(':scope > .fondReglage')) { appliquerFondOpacite(); return; }

  const bloc = document.createElement('div');
  bloc.className = 'fondReglage';
  bloc.innerHTML = `
    <label for="fondOp" title="Opacité de la vue du lieu, en fond de page">🖼️ Fond</label>
    <input type="range" id="fondOp" min="0" max="100" step="5"
           aria-label="Opacité de l’image de fond">
    <span class="fondVal"></span>`;
  section.insertBefore(bloc, section.firstChild);

  const curseur = bloc.querySelector('input');
  curseur.value = fondOpacite();
  curseur.addEventListener('input', () => reglerFondOpacite(curseur.value));
  appliquerFondOpacite();
}
