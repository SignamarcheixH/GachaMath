/* ============================================================
   LA VISITE GUIDÉE DOIT AVOIR QUELQUE CHOSE À MONTRER

   POURQUOI CE SCRIPT EXISTE. Trois fois de suite, un remaniement du plan a
   fait disparaître une cible du tutoriel sans que rien ne le signale :

     — le rempart `.villeMur`, quand le plan est devenu une illustration ;
     — `La Frontière`, quand le bâtiment a été retiré ;
     — `L'Herbier`, quand il est entré dans le quartier du Grand Herbier.

   À chaque fois, l'étape restait dans le tableau, le projecteur ne trouvait
   rien, et la faute n'apparaissait qu'en jouant l'acte 0 en entier. C'est
   exactement le genre de casse qu'un contrôle attrape en une seconde.

   CE QUE CE SCRIPT SAIT FAIRE, ET CE QU'IL NE SAIT PAS. Il ne rend pas la
   page : il ne peut donc pas garantir qu'un élément est visible à l'écran. Il
   vérifie les trois façons dont une cible a réellement disparu :

     1. `.villeLieu[data-lieu="x"]` — x doit être un lieu ou un quartier du
        plan, ET être ouvert à l'acte où l'étape se joue. Un lieu fermé n'est
        plus rendu du tout : viser un bâtiment de l'acte V dans le tutoriel de
        l'acte 0 ne montrerait rien.
     2. `#identifiant` — l'identifiant doit exister dans index.html.
     3. `.classe` — quelque chose, quelque part, doit l'écrire.

   La visite se joue à l'ACTE 0 : c'est donc l'acte 0 qui sert de référence
   pour la visibilité des lieux.

   Usage : node outils/verifier_visite.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RACINE = path.dirname(__dirname);
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');

/* L'acte auquel la visite se joue. Si le tutoriel changeait d'acte, c'est ici
   qu'il faudrait le dire. */
const ACTE_VISITE = 0;

function etapesDeLaVisite() {
  const src = lire('js/visite.js');
  const bloc = src.slice(src.indexOf('const VISITE = ['), src.indexOf('\n];'));
  const out = [];
  /* Une étape par accolade ouvrante en début de ligne. On ne lit que ce dont
     on a besoin — cible, vue, titre — plutôt que d'évaluer le fichier, qui
     appelle des fonctions du jeu. */
  for (const m of bloc.matchAll(/\{\s*vue: '([a-z]+)',\s*cible: (null|'[^']*'|"[^"]*")([\s\S]{0,400}?)titre: (?:'([^']*)'|"([^"]*)")/g)) {
    out.push({
      vue: m[1],
      cible: m[2] === 'null' ? null : m[2].slice(1, -1),
      titre: m[4] || m[5] || '(sans titre)',
    });
  }
  return out;
}

/* Les lieux ouverts à l'acte donné, quartiers compris. Un quartier est ouvert
   dès qu'un de ses membres l'est — même règle que le jeu. */
function lieuxOuvertsA(acte) {
  const actes = lire('js/actes.js');
  const hub = lire('js/hub.js');

  const ouverts = new Set();
  /* Les actes 0..n cumulent leurs lieux. */
  const blocs = [...actes.matchAll(/\{ n: (\d+),[\s\S]*?lieux: \[([^\]]*)\]/g)];
  for (const b of blocs) {
    if (+b[1] > acte) continue;
    for (const q of b[2].matchAll(/'([a-z_0-9]+)'/g)) ouverts.add(q[1]);
  }
  /* Les lieux hors actes — le Port — s'ouvrent dès qu'on est entré dans la
     Cité, c'est-à-dire à partir de l'acte 1. */
  if (acte > 0) {
    const hors = actes.match(/const LIEUX_HORS_ACTES = \[([^\]]*)\]/);
    if (hors) for (const q of hors[1].matchAll(/'([a-z_0-9]+)'/g)) ouverts.add(q[1]);
  }

  /* Les quartiers : ouverts si un membre l'est ; et leurs membres n'ont plus
     de pastille à eux. */
  const blocQ = hub.slice(hub.indexOf('const HUB_QUARTIERS'), hub.indexOf('\n];', hub.indexOf('const HUB_QUARTIERS')));
  const ranges = new Set();
  for (const m of blocQ.matchAll(/\{ id: '([a-z_0-9]+)',[\s\S]{0,400}?membres: \[([^\]]*)\]/g)) {
    const membres = [...m[2].matchAll(/'([a-z_0-9]+)'/g)].map(q => q[1]);
    membres.forEach(x => ranges.add(x));
    if (membres.some(x => ouverts.has(x))) ouverts.add(m[1]);
  }
  ranges.forEach(x => ouverts.delete(x));   // rangé = plus de pastille propre
  return ouverts;
}

function main() {
  const etapes = etapesDeLaVisite();
  const ouverts = lieuxOuvertsA(ACTE_VISITE);
  const html = lire('index.html');
  /* LES COMMENTAIRES SONT RETIRÉS AVANT LA RECHERCHE. Sans ça, le contrôle
     échouait à sa propre raison d'être : ce fichier-ci explique la disparition
     de `.villeMur` en le nommant, et cette seule mention suffisait à faire
     croire que la classe existait encore. Un commentaire qui parle d'un
     élément n'est pas un élément. */
  const sansCommentaires = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
  /* ET js/visite.js EST EXCLU DU CORPUS. C'est le fichier qu'on valide : sa
     propre ligne `cible: '.villeMur'` contient la classe recherchée, donc le
     sélecteur se trouvait lui-même et le contrôle passait toujours. Un fichier
     ne peut pas témoigner de l'existence de ce qu'il réclame. */
  const scripts = fs.readdirSync(path.join(RACINE, 'js'))
    .filter(f => f.endsWith('.js') && f !== 'visite.js')
    .map(f => sansCommentaires(lire('js/' + f))).join('\n');

  if (!etapes.length) {
    console.error("Aucune étape lue dans js/visite.js — le contrôle serait vide.");
    process.exit(1);
  }
  console.log(`${etapes.length} étapes lues dans js/visite.js`);
  console.log(`Lieux sur le plan à l'acte ${ACTE_VISITE} : ${[...ouverts].sort().join(', ')}\n`);

  const fautes = [];
  for (const e of etapes) {
    if (!e.cible) continue;                      // une étape sans cible se centre

    const lieu = e.cible.match(/^\.villeLieu\[data-lieu="([a-z_0-9]+)"\]$/);
    if (lieu) {
      if (!ouverts.has(lieu[1])) {
        fautes.push(`« ${e.titre} » vise « ${lieu[1]} », qui n'est pas sur le plan `
          + `à l'acte ${ACTE_VISITE} (retiré, rangé dans un quartier, ou pas encore ouvert)`);
      }
      continue;
    }

    if (e.cible.startsWith('#')) {
      if (!html.includes(`id="${e.cible.slice(1)}"`)) {
        fautes.push(`« ${e.titre} » vise « ${e.cible} », absent d'index.html`);
      }
      continue;
    }

    if (e.cible.startsWith('.')) {
      const classe = e.cible.slice(1);
      if (!scripts.includes(classe) && !html.includes(classe)) {
        fautes.push(`« ${e.titre} » vise « ${e.cible} », que rien n'écrit`);
      }
      continue;
    }

    fautes.push(`« ${e.titre} » : sélecteur « ${e.cible} » non reconnu par ce contrôle`);
  }

  if (fautes.length) {
    console.log(`VISITE CASSÉE — ${fautes.length} cible${fautes.length > 1 ? 's' : ''} introuvable${fautes.length > 1 ? 's' : ''} :\n`);
    for (const f of fautes) console.log('   • ' + f);
    process.exit(1);
  }
  console.log('Chaque étape a une cible qui existe, et qui est sur le plan quand elle se joue.');
}

main();
