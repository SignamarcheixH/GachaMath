/* ============================================================
   SOMMES-NOUS EN DÉVELOPPEMENT ?

   UNE SEULE RÉPONSE POUR TOUT LE JEU, ET C'EST L'ADRESSE QUI RÉPOND. Les
   aides de développement étaient gardées par des drapeaux qu'il fallait
   penser à baisser avant chaque mise en ligne. C'est exactement ce qui s'est
   produit : le bouton « repartir de zéro » est parti en production, à portée
   de clic de n'importe quel joueur.

   Un drapeau se laisse à `true` ; une adresse ne s'oublie pas. La liste vit
   ici, dans le premier fichier chargé, parce qu'elle était déjà recopiée à
   deux endroits — et deux copies d'une même liste finissent toujours par
   diverger.
   ============================================================ */
const EN_DEV = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname)
            || location.protocol === 'file:';

/* ============================================================
   CONFIGURATION PUBLICITAIRE

   Tant que `client` est vide, aucune publicité n'est chargée et
   aucun script tiers n'est appelé : le jeu reste exactement ce
   qu'il était. Renseignez l'identifiant après validation du compte
   AdSense, et les emplacements s'activent.

   ⚠ Trois obligations avant de mettre ceci en service :

   1. Un CMP certifié Google est OBLIGATOIRE pour diffuser en
      Europe depuis janvier 2024. Il s'active dans la console
      AdSense (« Confidentialité et messages ») — sans lui, la
      diffusion aux visiteurs européens est en infraction.
   2. La page confidentialite.html doit être accessible et son
      adresse de contact renseignée.
   3. Ne jamais placer d'annonce contre un bouton de jeu. Un clic
      accidentel est un « clic invalide » : c'est le motif de
      fermeture de compte le plus courant.
   ============================================================ */

const PUB = {
  // Identifiant éditeur. Public par nature : il figure dans le code source
  // de tout site diffusant AdSense. Ce n'est pas un secret.
  client: 'ca-pub-8735036143518614',

  /* Identifiants des blocs créés dans la console AdSense.

     Deux suffisent pour démarrer : « bas » et « lecture ». Toute vue sans
     identifiant propre retombe sur « lecture ». Ajouter la clé d'une vue —
     collection: 'xxxx' — lui donne son propre bloc, et donc sa propre ligne
     dans les rapports, sans rien changer au code. */
  emplacements: {
    bas: '',        // bandeau en bas de page, sur toutes les vues
    lecture: '',    // rectangle dans le corps d'une vue, par défaut
    rail: '',       // colonnes latérales 160×600 ; à défaut, « lecture » sert
  },

  /* Colonnes latérales. Elles n'apparaissent qu'au-delà de 1650×700, seule
     taille de fenêtre où elles tiennent dans les marges sans rogner le jeu —
     soit une minorité de visiteurs. En dessous, l'emplacement dans le contenu
     prend le relais ; les deux ne coexistent jamais. Mettre à false pour
     revenir à l'emplacement dans le contenu partout. */
  rails: true,

  /* Rafraîchissement des annonces.

     Le jeu est une application d'une seule page : sans cela, les annonces se
     chargent une fois par visite et ne bougent plus, qu'on joue deux minutes
     ou deux heures. Le changement d'onglet est une vraie navigation — il a
     même sa propre adresse — donc un déclencheur honnête.

     Les trois garde-fous ne sont pas décoratifs. Un rafraîchissement au
     minuteur sur une page que personne ne regarde gonfle les impressions sans
     audience : c'est exactement ce que la détection de trafic invalide
     cherche, et c'est un motif de fermeture de compte. Les valeurs ci-dessous
     suivent les règles que Google documente pour Ad Manager.

     Mettre `actif: false` pour revenir à une seule demande par visite. */
  rafraichissement: {
    actif: true,
    delaiMin: 60,       // secondes minimum entre deux demandes, sur un même emplacement
    maxParVisite: 10,   // plafond par emplacement, pour une visite
  },

  /* Les vues qui reçoivent un rectangle dans leur contenu.

     L'emplacement est ancré dans le HTML de chaque onglet (`.pubVue`), à un
     endroit choisi pour cet onglet : jamais au-dessus de l'établi de la Forge,
     jamais contre le bouton « Tirer », jamais au milieu d'un quiz chronométré.
     Retirer une vue de cette liste suffit à la laisser sans annonce. */
  vues: ['gacha', 'collection', 'forge', 'bonus',
         'minijeux', 'classement'],

  // Mettre à true pour visualiser les emplacements sans charger AdSense.
  apercu: false,
};
