/* ============================================================
   LE PLAN DE LA CITÉ NE DOIT JAMAIS SE CHEVAUCHER

   POURQUOI CE SCRIPT EXISTE. Les emprises des bâtiments étaient posées à
   l'œil, en pourcentages. Le jour où l'on en a ajouté trois, la mesure a
   montré que quatre paires se recouvraient DÉJÀ en plan étroit et deux en
   plan large — sans que rien ne le signale, parce qu'un chevauchement de
   quinze pixels sur un plan sombre ne se voit pas, il se devine.

   COMMENT ON MESURE. Le vrai plan est du HTML mis en page par le navigateur ;
   on ne peut donc pas le mesurer sans navigateur. Ce script REFAIT le calcul
   de mise en page à partir des mêmes règles que la feuille de style : la
   largeur d'une emprise en pourcentage du plan, sa hauteur en pixels, et le
   fait qu'elle est centrée sur son point (translate(-50%, -50%)).

   C'est une reproduction, donc elle peut dériver de la vraie feuille de
   style. Les constantes ci-dessous portent chacune la règle CSS dont elles
   viennent : si l'une change là-bas, elle doit changer ici, et la mesure en
   navigateur reste l'arbitre. Ce script n'est pas la vérité — il est le
   garde-fou qui empêche d'ajouter un dix-huitième bâtiment sans y penser.

   Usage : node outils/verifier_carte.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RACINE = path.dirname(__dirname);

/* ---------- ce que dit css/style.css ----------
   Chaque valeur cite sa règle. Une largeur est un pourcentage du plan ; une
   hauteur est en pixels, parce que le contenu d'une emprise (icône, nom,
   jauge) ne se met pas à l'échelle du plan. */
/* UNE SEULE LARGEUR NE SUFFIT PAS, et c'est la leçon de la première mesure :
   le plan était sain à 390 px et à 1250 px, et cassé partout entre les deux.
   La bascule vers le plan large se fait à 900 px, les plafonds de largeur
   mordent ailleurs : on contrôle donc plusieurs largeurs par format, dont
   celles qui encadrent chaque seuil. */
const FORMATS = {
  etroit: {
    nom: 'plan étroit',
    hauteur: 1300,         // .villePlan { min-height }
    partIcone: 0.42,       // .villeLieu { width }
    maxIcone: 178,         // .villeLieu { max-width }
    partVue: 0.42,         // .villeLieu.vue { width }
    maxVue: 120,           // .villeLieu.vue { max-width }
    /* Au-dessus de 560 px la description réapparaît sous chaque nom et l'icône
       repasse de 44 à 56 px : on prend toujours le cas le plus haut, sinon le
       contrôle passe sur un téléphone et rate la tablette. Ces deux valeurs
       ont été MESURÉES dans le navigateur, pas déduites — le premier jet les
       sous-estimait de dix-sept pixels, et laissait passer un recouvrement. */
    hautIcone: 115,
    hautVueSup: 60,
    /* Le plan occupe la largeur de fenêtre moins les marges du cadre. */
    largeurs: [302, 352, 480, 560, 622, 740, 860],
  },
  large: {
    nom: 'plan large',
    hauteur: 810,          // .villePlan.large { min-height }
    partIcone: 0.18,
    maxIcone: 150,
    partVue: 0.18,
    maxVue: 155,
    /* Mêmes valeurs mesurées qu'en plan étroit : le contenu d'une emprise ne
       change pas de taille avec le plan, seule sa largeur le fait. */
    hautIcone: 115,
    hautVueSup: 60,
    largeurs: [795, 900, 1000, 1100, 1145, 1300],
  },
};

/* Une vignette respecte le format des images du jeu : 450 × 254. */
const FORMAT_VUE = 254 / 450;

/* Les quartiers : leurs membres n'ont plus de pastille à eux, et le quartier
   en a une. Le contrôle doit voir le plan tel qu'il est rendu, sinon il
   vérifie des emprises qui n'existent pas et ignore celles qui existent. */
function lireQuartiers() {
  const src = fs.readFileSync(path.join(RACINE, 'js', 'hub.js'), 'utf8');
  const i = src.indexOf('const HUB_QUARTIERS');
  if (i < 0) return [];
  const bloc = src.slice(i);
  const fin = bloc.indexOf('\n];');
  const corps = bloc.slice(0, fin < 0 ? 600 : fin);
  const out = [];
  const re = /\{ id: '([a-z_0-9]+)', nom:[\s\S]{0,240}?x: (-?[\d.]+), y: (-?[\d.]+), xl: (-?[\d.]+), yl: (-?[\d.]+),[\s\S]{0,240}?membres: \[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(corps))) {
    out.push({
      id: m[1], x: +m[2], y: +m[3], xl: +m[4], yl: +m[5], vue: false,
      membres: [...m[6].matchAll(/'([a-z_0-9]+)'/g)].map(q => q[1]),
    });
  }
  return out;
}

function lireLieux() {
  const src = fs.readFileSync(path.join(RACINE, 'js', 'hub.js'), 'utf8');
  const bloc = src.slice(src.indexOf('const HUB_LIEUX'), src.indexOf("/* ---------- ce qui a été retiré"));
  /* LES COORDONNÉES PEUVENT ÊTRE DÉCIMALES. Le mode placement pose au demi
     pour-cent, et au dixième en tenant Maj : un motif qui n'accepte que des
     entiers ne reconnaît plus la moitié des lieux. Il ne se plaignait pas —
     il en lisait cinq sur quatorze et contrôlait un plan imaginaire. */
  const re = /id: '([a-z_0-9]+)',[\s\S]{0,260}?x: (-?[\d.]+), y: (-?[\d.]+), xl: (-?[\d.]+), yl: (-?[\d.]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(bloc))) {
    const avant = bloc.slice(Math.max(0, m.index), m.index + 300);
    out.push({
      id: m[1],
      x: +m[2], y: +m[3], xl: +m[4], yl: +m[5],
      vue: /image:\s*'/.test(avant),
    });
  }

  /* ET ON VÉRIFIE QU'ON A TOUT LU. C'est la leçon de la panne ci-dessus : un
     analyseur qui rate des entrées rend un contrôle vert sur un plan qu'il
     n'a pas vu. On compte les identifiants déclarés et on refuse d'avancer
     s'il en manque un. */
  const declares = [...bloc.matchAll(/\{ id: '([a-z_0-9]+)'/g)].map(x => x[1]);
  const lus = new Set(out.map(o => o.id));
  const rates = declares.filter(id => !lus.has(id));
  if (rates.length) {
    console.error('Lieux déclarés mais non analysés : ' + rates.join(', ')
      + '\n   Le contrôle serait faux. Vérifiez le motif de lecture.');
    process.exit(1);
  }
  return out;
}

function emprise(l, p, large) {
  const x = large ? l.xl : l.x;
  const y = large ? l.yl : l.y;
  let w = (l.vue ? p.partVue : p.partIcone) * p.largeur;
  const plafond = l.vue ? p.maxVue : p.maxIcone;
  if (plafond) w = Math.min(w, plafond);
  const h = l.vue ? Math.round(w * FORMAT_VUE) + p.hautVueSup : p.hautIcone;
  const cx = x / 100 * p.largeur;
  const cy = y / 100 * p.hauteur;
  /* translate(-50%, -50%) : le point est le CENTRE de l'emprise. */
  return { id: l.id, x: cx - w / 2, y: cy - h / 2, w, h };
}

/* LA MARGE. Ce script reproduit la mise en page, il ne la calcule pas : la
   hauteur d'une emprise dépend de la police, du retour à la ligne d'un nom
   long, de l'arrondi d'une image. La mesure en navigateur a montré des écarts
   de dix pixels. On exige donc un jeu de MARGE pixels entre deux emprises —
   un plan qui ne tient qu'au pixel près est un plan qui cassera. */
const MARGE = 10;

function controler(lieux, p, large) {
  const boites = lieux.map(l => emprise(l, p, large));
  const fautes = [];

  for (let i = 0; i < boites.length; i++) {
    for (let k = i + 1; k < boites.length; k++) {
      const a = boites[i], b = boites[k];
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (dx > -MARGE && dy > -MARGE) {
        const quoi = (dx > 0 && dy > 0) ? 'se recouvrent de' : 'passent à moins de la marge :';
        fautes.push(`${a.id} × ${b.id} ${quoi} ${Math.round(dx)}×${Math.round(dy)} px`);
      }
    }
  }
  /* Un bâtiment à moitié dehors est aussi grave qu'un chevauchement : on ne
     peut plus le lire, et sur un téléphone on ne peut même plus le viser. */
  for (const b of boites) {
    if (b.x < -10 || b.y < -6 || b.x + b.w > p.largeur + 10 || b.y + b.h > p.hauteur + 6) {
      fautes.push(`${b.id} déborde du plan `
        + `(x ${Math.round(b.x)}…${Math.round(b.x + b.w)} sur ${p.largeur}, `
        + `y ${Math.round(b.y)}…${Math.round(b.y + b.h)} sur ${p.hauteur})`);
    }
  }
  return fautes;
}

function main() {
  const tous = lireLieux();
  const quartiers = lireQuartiers();
  const ranges = new Set(quartiers.flatMap(q => q.membres));
  /* Ce qui porte réellement une emprise sur le plan. */
  const lieux = tous.filter(l => !ranges.has(l.id)).concat(quartiers);

  console.log(`${tous.length} lieux lus dans js/hub.js`
    + (quartiers.length
        ? `, ${ranges.size} rangés dans ${quartiers.length} quartier(s)`
          + ` → ${lieux.length} emprises sur le plan`
        : ` (${tous.filter(l => l.vue).length} avec vignette)`) + '\n');

  let total = 0;
  for (const [cle, f] of Object.entries(FORMATS)) {
    console.log(f.nom + ' :');
    for (const largeur of f.largeurs) {
      const p = Object.assign({}, f, { largeur });
      const fautes = controler(lieux, p, cle === 'large');
      if (fautes.length) {
        total += fautes.length;
        console.log(`   ${largeur}×${f.hauteur} — ${fautes.length} faute(s)`);
        for (const x of fautes) console.log('      • ' + x);
      } else {
        console.log(`   ${largeur}×${f.hauteur} — rien ne se touche, rien ne déborde`);
      }
    }
    console.log('');
  }

  /* Un lieu qu'aucun acte n'ouvre serait invisible à jamais. Le jeu le
     signale déjà dans la console au chargement ; ici on refuse de passer. */
  const actes = fs.readFileSync(path.join(RACINE, 'js', 'actes.js'), 'utf8');
  const ouverts = new Set();
  for (const m of actes.matchAll(/lieux: \[([^\]]*)\]/g)) {
    for (const q of m[1].matchAll(/'([a-z]+)'/g)) ouverts.add(q[1]);
  }
  const HORS = ['gare'];   // cf. LIEUX_HORS_ACTES dans js/actes.js
  /* Un quartier ne s'ouvre pas par un acte : ce sont ses membres qui le font.
     On contrôle donc la couverture sur les LIEUX, quartiers exclus. */
  const orphelins = tous.filter(l => !ouverts.has(l.id) && !HORS.includes(l.id));
  if (orphelins.length) {
    total += orphelins.length;
    console.log("Lieux qu'aucun acte n'ouvre — ils seraient sur le plan sans jamais s'allumer :");
    for (const o of orphelins) console.log('   • ' + o.id);
  } else {
    console.log('Chaque lieu est ouvert par un acte.');
  }

  if (total) {
    console.log(`\nPLAN INCOHÉRENT — ${total} faute${total > 1 ? 's' : ''}.`);
    process.exit(1);
  }
  console.log('\nLe plan tient à toutes les largeurs contrôlées.');
}

main();
