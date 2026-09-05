/* ============================================================
   APPLIQUER UN PLACEMENT AU CODE SOURCE

   Le mode placement du jeu (js/hub.js, drapeau CARTE_EDITION) laisse déplacer
   les bâtiments à la souris et rend un bloc JSON. Ce script écrit ce bloc dans
   HUB_LIEUX, à la place des coordonnées actuelles.

   POURQUOI UN SCRIPT ET PAS UN COPIER-COLLER À LA MAIN. Dix-sept bâtiments,
   quatre nombres chacun : soixante-huit valeurs à reporter sans se tromper de
   ligne. C'est exactement le genre de tâche où l'on introduit une faute qu'on
   ne verra que trois semaines plus tard, sur un plan devenu illisible.

   IL NE TOUCHE À RIEN D'AUTRE. Seules les quatre coordonnées de chaque lieu
   sont remplacées ; les noms, les jauges, les commentaires et l'ordre du
   fichier restent tels quels. Un identifiant que le fichier ne connaît pas est
   signalé et ignoré, jamais ajouté.

   Usage :
     node outils/poser_carte.js placement.json
     node outils/poser_carte.js               (lit l'entrée standard)
     node outils/poser_carte.js … --essai     (montre sans écrire)

   Deux formats acceptés :
     { "vivier": [x, y, xl, yl], … }                    — coordonnées seules
     { "lieux": { … }, "quartiers": [ … ] }             — avec les quartiers
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RACINE = path.dirname(__dirname);
const CIBLE = path.join(RACINE, 'js', 'hub.js');

function lireEntree(args) {
  const fichier = args.find(a => !a.startsWith('--'));
  if (fichier) return fs.readFileSync(fichier, 'utf8');
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (e) {
    console.error("Rien à lire. Passez un fichier, ou collez le bloc sur l'entrée standard.");
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const essai = args.includes('--essai');

  let place;
  try {
    place = JSON.parse(lireEntree(args));
  } catch (e) {
    console.error('Le bloc n\'est pas du JSON valide :\n   ' + e.message);
    process.exit(1);
  }

  /* L'ancien format — une simple table d'identifiants — reste valable : un
     bloc copié avant l'arrivée des quartiers doit continuer de s'appliquer.
     On reconnaît le nouveau à la présence d'une de ses deux clés ; sans ce
     test, un bloc ne contenant QUE des quartiers était pris pour l'ancien
     format et le script réclamait « quatre nombres » pour le tableau. */
  const nouveau = ('lieux' in place) || ('quartiers' in place);
  const lieux = nouveau ? (place.lieux || {}) : place;
  const quartiers = Array.isArray(place.quartiers) ? place.quartiers : null;

  let src = fs.readFileSync(CIBLE, 'utf8');
  const changes = [];
  const inconnus = [];

  for (const [id, v] of Object.entries(lieux)) {
    if (!Array.isArray(v) || v.length !== 4 || v.some(n => typeof n !== 'number')) {
      console.error(`« ${id} » : quatre nombres attendus, reçu ${JSON.stringify(v)}`);
      process.exit(1);
    }
    const [x, y, xl, yl] = v;
    if (v.some(n => n < 0 || n > 100)) {
      console.error(`« ${id} » : une coordonnée sort du plan (${v.join(', ')})`);
      process.exit(1);
    }

    const re = new RegExp(
      "(id: '" + id + "'[\\s\\S]{0,260}?)" +
      "x: -?[\\d.]+, y: -?[\\d.]+, xl: -?[\\d.]+, yl: -?[\\d.]+");
    const avant = src.match(re);
    if (!avant) { inconnus.push(id); continue; }

    const neuf = `x: ${x}, y: ${y}, xl: ${xl}, yl: ${yl}`;
    const ancien = avant[0].slice(avant[1].length);
    if (ancien !== neuf) changes.push(`${id.padEnd(14)} ${ancien}\n${''.padEnd(15)}${neuf}`);
    src = src.replace(re, (m, tete) => tete + neuf);
  }

  if (inconnus.length) {
    console.log('Identifiants absents de js/hub.js, ignorés : ' + inconnus.join(', ') + '\n');
  }

  /* ---------- les quartiers ----------
     On réécrit le tableau entier : un quartier supprimé dans le navigateur
     doit disparaître du fichier, ce qu'une fusion ligne à ligne ne ferait
     pas. Les identifiants de membres sont contrôlés : un quartier qui
     nommerait un lieu inexistant laisserait un trou sur le plan. */
  let motQuartiers = null;
  if (quartiers) {
    /* Les identifiants sont lus dans le SEUL bloc HUB_LIEUX : les chercher
       dans tout le fichier ramènerait les clés de HUB_BATIMENTS et celles des
       quartiers eux-mêmes, et le contrôle ne contrôlerait plus rien. */
    const blocLieux = src.slice(src.indexOf('const HUB_LIEUX'), src.indexOf('/* ---------- ce qui a été retiré'));
    const idsLieux = new Set([...blocLieux.matchAll(/\{ id: '([a-z_0-9]+)'/g)].map(m => m[1]));
    if (!idsLieux.size) {
      console.error('Aucun lieu lu dans HUB_LIEUX — le contrôle des membres serait faux.');
      process.exit(1);
    }
    const vus = new Set();
    for (const q of quartiers) {
      if (!q.id || !q.nom) { console.error('Un quartier sans id ni nom.'); process.exit(1); }
      for (const m of (q.membres || [])) {
        if (!idsLieux.has(m)) {
          console.error(`Le quartier « ${q.nom} » range « ${m} », qui n'est pas un lieu.`);
          process.exit(1);
        }
        if (vus.has(m)) {
          console.error(`« ${m} » est rangé dans deux quartiers : il n'a qu'une adresse.`);
          process.exit(1);
        }
        vus.add(m);
      }
    }
    const corps = quartiers.map(q => [
      `  { id: '${q.id}', nom: ${JSON.stringify(q.nom)},`
        + (q.desc ? ` desc: ${JSON.stringify(q.desc)},` : ''),
      `    x: ${q.x}, y: ${q.y}, xl: ${q.xl}, yl: ${q.yl},`,
      `    membres: [${(q.membres || []).map(m => `'${m}'`).join(', ')}] },`,
    ].join('\n')).join('\n');

    const re = /(const HUB_QUARTIERS = \[)[\s\S]*?(\n\];)/;
    if (!re.test(src)) {
      console.error('HUB_QUARTIERS introuvable dans js/hub.js.');
      process.exit(1);
    }
    const avant = src.match(re)[0];
    const vide = [
      'const HUB_QUARTIERS = [',
      '  /* Rempli par outils/poser_carte.js depuis le mode placement.',
      "     Forme : { id, nom, desc, x, y, xl, yl, membres: ['forge', 'atelier'] } */",
      '];',
    ].join('\n');
    const neuf = quartiers.length
      ? ['const HUB_QUARTIERS = [', corps, '];'].join('\n')
      : vide;
    if (avant !== neuf) {
      src = src.replace(re, () => neuf);
      motQuartiers = quartiers.length
        ? `${quartiers.length} quartier(s) : `
          + quartiers.map(q => `${q.nom} [${(q.membres || []).join(', ')}]`).join(' · ')
        : 'quartiers vidés';
    }
  }

  if (!changes.length && !motQuartiers) {
    console.log('Rien ne change. Le fichier est déjà à jour.');
    return;
  }
  if (motQuartiers) console.log(motQuartiers + '\n');
  if (!changes.length) {
    if (essai) { console.log("--essai : rien n'a été écrit."); return; }
    fs.writeFileSync(CIBLE, src);
    console.log('js/hub.js écrit.');
    return;
  }

  console.log(changes.length + ' lieu(x) déplacé(s) :\n');
  for (const c of changes) console.log('   ' + c + '\n');

  if (essai) { console.log('--essai : rien n\'a été écrit.'); return; }

  fs.writeFileSync(CIBLE, src);
  console.log('js/hub.js écrit.\n'
    + 'Contrôlez le plan : node outils/verifier_carte.js');
}

main();
