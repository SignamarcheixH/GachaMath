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
  // Identifiant éditeur, de la forme "ca-pub-1234567890123456".
  client: '',

  // Identifiants des blocs créés dans la console AdSense.
  // Laissez vide pour qu'un emplacement reste inactif.
  emplacements: {
    bas: '',        // bandeau en bas de page, sur toutes les vues
    lecture: '',    // rectangle sur les vues de lecture (Oracle, Défis, Classement)
  },

  /* Les vues où une annonce est tolérable : on lit, on ne joue pas.
     Jamais le Tirage ni la Forge — on n'interrompt pas une partie, et une
     annonce près du bouton « Tirer » ferait des clics accidentels. */
  vuesLecture: ['oracle', 'defis', 'classement', 'theoremes'],

  // Mettre à true pour visualiser les emplacements sans charger AdSense.
  apercu: false,
};
