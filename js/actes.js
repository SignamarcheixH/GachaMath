/* ============================================================
   LES ACTES — LA PROGRESSION, ET CE QU'ELLE NE FAIT PAS

   CE QUE LES ACTES NE TOUCHENT PAS : le vivier. Les 9 999 nombres restent
   tirables du premier jour au dernier, à taux constants. On a mesuré ce que
   coûterait un découpage du vivier par époque — toute l'Antiquité ne porte que
   19 des 514 nombres rares, et dater un seul trait déplaçait 225 d'entre eux.
   La chronologie ne peut pas porter le rythme du tirage.

   CE QU'ILS TOUCHENT : les lieux, les instruments, les quêtes. Un acte ouvre
   un quartier de la Cité, un instrument de l'Atelier, et la série de quêtes
   que ses nombres peuvent déclencher.

   ET LA RARETÉ, ELLE, NE BOUGE JAMAIS. 1729 est Mythique dès le premier
   tirage, que vous sachiez ou non ce qu'il a de particulier. Une quête ne
   donne pas sa valeur à un nombre — elle vous donne le NOM de ce qu'il est.
   C'est la promesse du jeu : la rareté se démontre, elle ne se révèle pas au
   bon vouloir d'un scénario. Techniquement, c'est aussi ce qui garde `POOL`
   précalculable et le classement comparable d'un joueur à l'autre.
   ============================================================ */

const ACTES = [
  { n: 0, nom: 'Le Seuil', epoque: '',
    titre: "Vous arrivez",
    resume: "Un herbier vide, et personne pour vous dire ce que vaut un nombre.",
    /* La visite guidée emmène pêcher PUIS constater : l'Herbier doit donc être
       ouvert dès le seuil, sinon l'onglet retombe sur le Vivier sans un mot.
       La Place, elle, est là parce que c'est de là que part la visite. */
    lieux: ['vivier', 'place', 'herbier'], instruments: [] },

  { n: 1, nom: 'Compter', epoque: '−2700',
    titre: "Ce qu'on voit sur des cailloux",
    resume: "Aligner, doubler, ranger en carrés. Avant la preuve, il y a le geste.",
    /* Le quipu est ici, et non à l'acte « Écrire » : c'est un compteur, pas une
       écriture. Ça remet aussi l'ordre d'ouverture des instruments dans l'ordre
       où l'Atelier les affiche — un joueur ne devrait pas voir la troisième
       machine s'ouvrir avant la deuxième. */
    lieux: ['atelier', 'codex'], instruments: ['abaque', 'quipu'] },

  { n: 2, nom: 'Démontrer', epoque: '−240',
    titre: "La preuve, et ce qu'elle révèle",
    resume: "Ératosthène raye les multiples. Ce qui survit est premier — et il peut le prouver.",
    /* La Bibliothèque est ici : les théorèmes sont des preuves, et c'est
       précisément l'acte où l'on apprend qu'une preuve existe. */
    lieux: ['academie', 'bibliotheque', 'congres'], instruments: ['crible'] },

  { n: 3, nom: 'Écrire', epoque: '628',
    titre: "Le zéro devient un nombre",
    resume: "La notation de position rend pensable ce qui ne l'était pas — et la Forge ouvre.",
    /* La Forge fabrique le 0 et ce qui dépasse le mur. Le zéro comme nombre,
       c'est Brahmagupta : l'ouverture est méritée, pas administrative. */
    /* Le Comptoir est ici et pas ailleurs : l'acte de la notation de position
       est exactement celui où l'on doit apprendre que « palindrome » parle de
       l'écriture, pas du nombre. */
    lieux: ['forge', 'comptoir'], instruments: [] },

  { n: 4, nom: 'Calculer', epoque: '1617',
    titre: "Multiplier en additionnant",
    resume: "Napier passe vingt ans à transformer les produits en sommes.",
    /* L'acte IV n'ouvrait aucun lieu — le Carnet devait écrire « rien de
       nouveau sur la Carte ». L'Observatoire le comble, et il est à sa place :
       les logarithmes ont été taillés pour les tables astronomiques. */
    lieux: ['observatoire'], instruments: ['napier', 'regle'] },

  { n: 5, nom: 'Mécaniser', epoque: '1642',
    titre: "La retenue se propage toute seule",
    resume: "Pascal a dix-neuf ans. Le difficile n'est pas d'additionner.",
    /* Le Casino avec la Pascaline : c'est le même homme. Pascal règle le
       problème des partis avec Fermat en 1654, douze ans après la machine. */
    lieux: ['expedition', 'casino'], instruments: ['pascaline'] },

  { n: 6, nom: 'Programmer', epoque: '1837',
    titre: "La machine traite autre chose que des nombres",
    resume: "Ada Lovelace le comprend avant tout le monde, sur une machine qui n'existera jamais.",
    lieux: [], instruments: ['jacquard', 'differences', 'analytique', 'arithmometre'] },
];

/* ============================================================
   CE QU'IL FAUT AVOIR FAIT POUR ENTRER

   PRINCIPE : la condition d'entrée d'un acte exerce CE QUE L'ACTE PRÉCÉDENT
   A DONNÉ. On ne passe pas à « Démontrer » parce qu'on a assez de jetons, mais
   parce qu'on a fait marcher l'abaque de ses mains et rempli un début
   d'herbier. La porte est la leçon, pas un péage.

   C'est aussi ce qui permet de corser une mécanique en connaissance de cause :
   un joueur à l'acte V a nécessairement mis Napier et la règle en service, on
   sait donc ce qu'il sait.

   ON N'AVANCE JAMAIS TOUT SEUL. Les conditions remplies allument un bouton sur
   la Carte ; c'est le joueur qui franchit. Un acte qui bascule pendant qu'on
   regarde ailleurs vole le moment.
   ============================================================ */
const CONDITIONS = {
  /* L'ACTE 0 NE SE FRANCHIT PLUS AU BOUT DU TUTORIEL. Il durait le temps d'un
     tour guidé — quatre minutes — et le joueur entrait dans l'acte I sans
     avoir rien pêché de ses mains. Il lui faut maintenant une vraie première
     récolte et le tour de la Place : les trois personnes qui y sont apprennent
     chacune une chose dont il aura besoin, et rien ne garantissait qu'il leur
     parle. */
  1: [
    { texte: "Trente nombres à l'Herbier",
      atteint: () => uniqueCount(state), requis: 30 },
    { texte: "Parler aux trois personnes de la Place",
      atteint: () => typeof pnjRencontres === 'function' ? pnjRencontres() : 0, requis: 3 },
  ],

  2: [
    { texte: "Faire marcher l'Abaque de vos mains",
      atteint: () => niveauMachine('abaque'), requis: 1 },
    { texte: "Cinquante nombres à l'Herbier",
      atteint: () => uniqueCount(state), requis: 50 },
  ],

  3: [
    { texte: "Faire tourner le Crible d'Ératosthène",
      atteint: () => niveauMachine('crible'), requis: 1 },
    { texte: "Démontrer deux théorèmes",
      atteint: () => state.claimed.length, requis: 2 },
  ],

  4: [
    { texte: "Forger trois nombres au-delà du mur",
      atteint: () => state.stats.forges || 0, requis: 3 },
    { texte: "Trois cents nombres à l'Herbier",
      atteint: () => uniqueCount(state), requis: 300 },
  ],

  5: [
    { texte: "Mettre les Bâtons de Napier en service",
      atteint: () => niveauMachine('napier'), requis: 1 },
    { texte: "Mettre la Règle à calcul en service",
      atteint: () => niveauMachine('regle'), requis: 1 },
    { texte: "Mille nombres à l'Herbier",
      atteint: () => uniqueCount(state), requis: 1000 },
  ],

  6: [
    { texte: "Faire propager une retenue à la Pascaline",
      atteint: () => niveauMachine('pascaline'), requis: 1 },
    { texte: "Revenir vivant d'une Expédition",
      atteint: () => state.stats.expeditions || 0, requis: 1 },
  ],
};

/* L'état de la porte, prêt à afficher. `atteint` peut lever si un module
   n'est pas encore chargé : une condition illisible vaut zéro, jamais une
   page cassée. */
function conditionsPour(n) {
  return (CONDITIONS[n] || []).map(c => {
    let v = 0;
    try { v = c.atteint() || 0; } catch (e) { v = 0; }
    return { texte: c.texte, requis: c.requis, atteint: v, ok: v >= c.requis };
  });
}

const acteSuivant = () => acteCourant() + 1;
const peutFranchir = () =>
  acteSuivant() <= ACTE_MAX && conditionsPour(acteSuivant()).every(c => c.ok);

/* Le franchissement est un geste du joueur, et il revérifie : le bouton peut
   avoir été peint avant qu'une condition ne redevienne fausse. */
function franchirActe() {
  if (!peutFranchir()) return null;
  return ouvrirActe(acteSuivant());
}

/* Le Port n'appartient à aucun acte : ce sont les quêtes qui le font exister,
   et son quai peut être désert. Il est donc exclu du contrôle
   ci-dessous, qui vérifie que TOUT AUTRE lieu de la Cité s'ouvre quelque part.
   Sans ce garde-fou, ajouter un bâtiment au plan le rendrait inaccessible à
   jamais, et rien ne le signalerait. */
const LIEUX_HORS_ACTES = ['gare'];   // le Port, ouvert dès qu'on entre dans la Cité

function verifierCouvertureDesLieux() {
  if (typeof HUB_LIEUX === 'undefined') return [];
  const ouverts = new Set(ACTES.flatMap(a => a.lieux));
  const orphelins = HUB_LIEUX
    .map(l => l.id)
    .filter(id => !ouverts.has(id) && !LIEUX_HORS_ACTES.includes(id));
  if (orphelins.length) {
    console.error('Lieux jamais ouverts par un acte : ' + orphelins.join(', '));
  }
  return orphelins;
}

const ACTE_MAX = ACTES.length - 1;
const acteCourant = () => Math.max(0, Math.min(ACTE_MAX, state.acte || 0));
const acteDe = (n) => ACTES[Math.max(0, Math.min(ACTE_MAX, n))];

/* Un acte est atteint : tout ce qu'il ouvre le reste. On ne redescend jamais,
   sauf par la remise à zéro de test. */
function ouvrirActe(n) {
  const vise = Math.max(0, Math.min(ACTE_MAX, n));
  if (vise <= acteCourant()) return null;
  state.acte = vise;
  /* Passer un acte peut rendre disponibles des quêtes dont le nombre
     déclencheur dormait déjà dans l'herbier. */
  if (typeof reveillerQuetes === 'function') reveillerQuetes();
  save();
  return acteDe(vise);
}

const acteOuvre = (quoi, liste) =>
  ACTES.slice(0, acteCourant() + 1).some(a => (a[liste] || []).includes(quoi));

/* Le verrou est POSITIF : un lieu n'est ouvert que si un acte atteint le
   nomme. L'inverse — tout ouvert sauf mention contraire — laisserait passer
   silencieusement le prochain bâtiment qu'on ajoutera. */
const lieuOuvert = (id) =>
  LIEUX_HORS_ACTES.includes(id) ? acteCourant() > 0 : acteOuvre(id, 'lieux');
const instrumentOuvert = (id) => acteOuvre(id, 'instruments');

/* La vue d'un onglet s'ouvre avec le lieu qui y mène. Deux lieux mènent aux
   mini-jeux — l'Académie puis l'Expédition : le premier des deux suffit. */
/* LES RETOURS N'ONT PLUS DE LIEU, ET C'EST VOULU. « La Marge » n'était qu'un
   lien de plus vers un onglet déjà dans la barre — une pastille sur le plan
   pour une boîte à idées, ça ne se justifiait que par la plaisanterie du
   « trop étroite pour la contenir ». Le lieu est retiré ; l'onglet reste, et
   il doit rester joignable à tous les actes : signaler un problème ne se
   mérite pas. */
const VUE_HORS_ACTES = ['hub', 'frise', 'retours'];
function vueOuverte(vue) {
  if (VUE_HORS_ACTES.includes(vue)) return true;
  if (typeof HUB_LIEUX === 'undefined') return true;
  return HUB_LIEUX.some(l => l.vue === vue && lieuOuvert(l.id));
}

/* ============================================================
   ⚠ AIDE DE TEST — REMISE À ZÉRO DE LA PROGRESSION

   Elle ramène à l'acte 0 et efface l'avancement des quêtes. Elle NE TOUCHE
   PAS à la collection : on veut pouvoir rejouer le tutoriel et les quêtes sur
   une partie déjà fournie, sinon on ne teste que le cas du débutant.

   Délibérément voyante, comme celles de l'Atelier : une aide de test discrète
   finit en production. Elle disparaît entièrement avec ce drapeau.
   ============================================================ */
const ACTES_TEST = true;

function reinitialiserProgression() {
  state.acte = 0;
  state.quetes = {};
  state.traitsConnus = [];
  /* Le tour de la Place et la visite guidée sont de l'avancement d'acte 0 :
     une remise à zéro doit les rendre à refaire, sinon on ne peut plus tester
     le début du jeu. */
  state.rencontres = [];
  state.visiteFaite = false;
  /* Les curiosités sont le butin des quêtes : les quêtes remises à zéro, les
     pièces rapportées doivent l'être aussi. Sinon le Carnet annonce « 1 / 8 »
     sans qu'aucune quête ait été faite, et la Frise décore d'une pièce que le
     joueur n'a jamais gagnée. */
  state.objets = [];
  invalideRevenu();
  save();
}

/* ============================================================
   L'ACTE 0 — QUI L'ON INCARNE

   LE PARTI PRIS. Le jeu emploie déjà le mot « herbier » pour la collection, et
   la Cité a un Vivier, une Forge, une Académie. On ne cherche donc pas une
   fiction à plaquer par-dessus : on nomme celle qui est déjà là.

   VOUS TENEZ LE GRAND HERBIER. La Cité des Nombres cultive les entiers ; le
   Grand Herbier est le registre de ce qu'on a PROUVÉ sur chacun. Il est
   incomplet — il l'a toujours été, il le sera toujours. Votre charge est de
   pêcher au Vivier et d'établir ce que chaque prise est réellement.

   POURQUOI ÇA MARCHE, ET POURQUOI CE N'EST PAS DÉCORATIF :
   — ça justifie le gacha : on ne choisit pas ce qu'on pêche ;
   — ça justifie les théorèmes : ce sont les pages démontrées de l'Herbier ;
   — ça justifie que Pascal et Ramanujan soient dans la même ville : la Cité
     est le lieu où les mathématiques gardent leurs gens ;
   — ça justifie les quêtes : un nombre qu'on ne sait pas nommer envoie
     chercher qui saura ;
   — et le rempart à 10 000 devient la limite des terres cultivées.

   LE TUTORIEL N'APPREND PAS À CLIQUER. Il apprend la thèse du jeu : un nombre
   n'est pas rare parce qu'on l'a décidé. On tire, on ne sait rien dire, on
   apprend à regarder — et l'Herbier s'ouvre.

   Le texte évite les accords de genre : on ne sait pas qui joue.
   ============================================================ */
const SEUIL_SCENES = [
  { texte: "La Cité des Nombres tient dans une boucle de rempart, et le rempart porte un chiffre : <b>10 000</b>. En deçà, tout se pêche. Au-delà, plus rien ne vient tout seul." },
  { texte: "On vous remet un registre relié, très épais, et presque vide. C'est le <b>Grand Herbier</b> : la liste de ce que la Cité a démontré sur chaque entier. Personne ne l'a jamais fini. Personne ne le finira." },
  { texte: "Votre charge tient en une phrase : <b>pêcher au Vivier, et établir ce que chaque prise est réellement.</b> Pas ce qu'on voudrait qu'elle soit — ce qu'elle est." },
  { texte: "Un dernier mot avant qu'on vous laisse. Ici, <b>la rareté ne se décrète pas</b>. Un nombre est précieux parce qu'il a une propriété, et cette propriété se prouve. Si vous ne savez pas dire pourquoi une prise est rare, c'est qu'il vous manque quelqu'un à rencontrer.", fin: true },
];

/* Le tutoriel se rejoue : il est court, et la remise à zéro de test doit
   pouvoir le redonner sur une partie déjà fournie. */
let _seuilScene = 0;

function renderSeuil() {
  const boite = document.querySelector('#seuilBoite');
  if (!boite) return;
  /* Quatre raisons de ne rien montrer : l'acte est passé, la visite a pris la
     main, le joueur est encore sur l'accueil — ou la visite est déjà faite.
     Cette dernière est nouvelle : depuis que l'acte 0 dure, on y reste après
     le tour, et sans elle le Seuil se rejouerait à chaque rendu. */
  if (acteCourant() !== 0 || !state.entree || state.visiteFaite
      || (typeof visiteEnCours === 'function' && visiteEnCours())) {
    cacherSurcouche(boite); boite.innerHTML = ''; return;
  }

  const i = Math.min(_seuilScene, SEUIL_SCENES.length - 1);
  const sc = SEUIL_SCENES[i];
  const dernier = i === SEUIL_SCENES.length - 1;

  montrerSurcouche(boite);
  boite.innerHTML = `<div class="slCadre" role="dialog" aria-modal="true" aria-label="Le Seuil">
    <span class="slActe">Acte 0 · Le Seuil</span>
    <p class="slTexte">${sc.texte}</p>
    <div class="slPied">
      <span class="qtPerles">${SEUIL_SCENES.map((_, k) =>
        `<i class="${k < i ? 'bon' : k === i ? 'encours' : 'avenir'}"></i>`).join('')}</span>
      <button class="btn" id="slSuivant" type="button">${dernier ? 'Faire le tour' : 'Continuer'}</button>
    </div>
  </div>`;

  const bouton = boite.querySelector('#slSuivant');
  bouton.addEventListener('click', () => {
    if (_seuilScene < SEUIL_SCENES.length - 1) { _seuilScene++; return renderSeuil(); }
    _seuilScene = 0;
    /* Le lore posé, on passe la main à la visite guidée : elle montre les
       mêmes choses sur la vraie page, et c'est elle qui ouvrira l'acte I. */
    cacherSurcouche(boite); boite.innerHTML = '';
    demarrerVisite();
  });
}


/* ============================================================
   L'ACCUEIL — AVANT LA VILLE

   La toute première chose qu'on voit, et la seule page du jeu qui ne demande
   rien. Elle dit ce qu'est le jeu en trois lignes et ouvre la porte.

   POURQUOI ELLE EXISTE. Tomber directement sur une ville de douze bâtiments,
   un portefeuille et onze onglets ne dit pas ce qu'on est venu faire. Une
   page vide qui pose la thèse — la rareté se calcule — vaut mieux qu'un
   tutoriel qui la démontre pendant vingt minutes.

   ELLE EST VIDE PAR DESIGN. Pas de compteur, pas de bouton secondaire, pas
   d'options : un titre, une phrase, une entrée. Tout le reste attend derrière.

   `state.entree` est vrai dès qu'on a poussé la porte une fois. La remise à
   neuf l'efface, et on retombe ici — c'est exactement ce qu'on veut vérifier
   quand on teste l'arrivée d'un nouveau joueur.
   ============================================================ */
function renderAccueil() {
  const boite = document.querySelector('#accueilBoite');
  if (!boite) return;

  if (state.entree) {
    if (boite.classList.contains('on')) { cacherSurcouche(boite); boite.innerHTML = ''; }
    document.body.classList.remove('surAccueil');
    return;
  }

  document.body.classList.add('surAccueil');
  montrerSurcouche(boite);
  boite.innerHTML = `<div class="acCadre">
    <span class="acMarque"><b>GACHA</b><i>des nombres</i></span>

    <h1 class="acTitre">La rareté ne se décide pas.<br>Elle se démontre.</h1>

    <p class="acMot">Ici, un nombre n'est pas précieux parce qu'un serveur l'a voulu.
       Il l'est parce qu'il est premier, parfait, palindrome — et parce qu'on peut
       le prouver.</p>

    <p class="acMot">Neuf mille neuf cent quatre-vingt-dix-neuf à pêcher, et tout
       le reste à fabriquer. Personne n'a jamais fini.</p>

    <button class="btn big gold" id="acEntrer" type="button">Entrer dans la Cité</button>
    <span class="acPied">Aucun compte. Rien à installer. Votre partie reste sur cet appareil.</span>
  </div>`;

  boite.querySelector('#acEntrer').addEventListener('click', () => {
    state.entree = true;
    save();
    document.body.classList.remove('surAccueil');
    renderAll();
  });
}
