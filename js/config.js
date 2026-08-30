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

  /* Les vues qui reçoivent un rectangle dans leur contenu.

     L'emplacement est ancré dans le HTML de chaque onglet (`.pubVue`), à un
     endroit choisi pour cet onglet : jamais au-dessus de l'établi de la Forge,
     jamais contre le bouton « Tirer », jamais au milieu d'un quiz chronométré.
     Retirer une vue de cette liste suffit à la laisser sans annonce. */
  vues: ['gacha', 'collection', 'forge', 'theoremes',
         'defis', 'revision', 'classement', 'oracle'],

  // Mettre à true pour visualiser les emplacements sans charger AdSense.
  apercu: false,
};
