/* ============================================================
   CALCULER LES POINTS DES TRAITS À PARTIR DE LEUR RARETÉ RÉELLE

   POURQUOI CE SCRIPT EXISTE. Le jeu promet que la rareté se calcule au lieu de
   se décréter. C'était vrai de la LISTE des traits — un nombre est premier ou
   ne l'est pas — mais faux de leur VALEUR : les points étaient posés à la main.
   Ça se voyait. « Puissant » concerne 1,8 % des nombres et valait +3 ; « Pratique »
   en concerne 14,6 % et valait +3 aussi. Et « Fibonacci » (19 nombres) valait
   moins qu'« Idoine d'Euler » (65 nombres) : un trait trois fois plus rare
   rapportait moins.

   LA MESURE HONNÊTE : LA SURPRISE. Un trait porté par n nombres sur N en
   apporte log2(N/n) bits — c'est la quantité d'information que « ce nombre est
   premier » vous donne réellement. On multiplie par un facteur d'échelle pour
   obtenir des entiers lisibles, et c'est tout. Rien n'est arbitraire sauf ce
   facteur, et il ne change que la taille de l'unité.

   LE PLANCHER : UN NOMBRE SUR CINQ. Au-delà, un trait n'est plus une
   distinction. La règle n'est pas un choix esthétique, c'est ce qui évite un
   couperet : à un bit près, « Pair » (49,99 %) aurait valu deux points et
   « Impair » (50,01 %) zéro, et « Abondant » aurait rapporté quand
   « Déficient » — qui partitionne le même ensemble avec lui — ne rapportait
   rien. Deux traits complémentaires doivent tomber du même côté. Ils restent
   affichés, à zéro point : ils décrivent, ils ne distinguent pas.

   CE QUE LE SCRIPT NE TOUCHE PAS : les tests. Les effectifs se mesurent sur
   `test`, jamais sur `pts` — le script est donc IDEMPOTENT : le relancer deux
   fois donne exactement le même fichier.

   Usage :  node outils/calculer_points.js [--ecrire]
   Sans `--ecrire`, il affiche ce qu'il ferait et ne touche à rien.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const NUM = path.join(RACINE, 'js', 'numerology.js');
const DATA = path.join(RACINE, 'js', 'data.js');

const N = 9999;
/* Le facteur d'échelle. À 1,5 le trait le plus rare vaut 20 points et le score
   d'un nombre culmine à 52 — le même ordre de grandeur qu'avant, donc les
   scores records des sauvegardes existantes restent comparables. */
const K = 1.5;

/* LES SEUILS, LUS DANS L'HISTOGRAMME DES SCORES.

   On ne peut pas viser une taille exacte : les scores sont de petits entiers,
   donc massivement ex æquo — 2 295 nombres partagent le score 4. Un quantile
   coupe alors au milieu d'un paquet et rend n'importe quoi. On lit donc la
   distribution et on choisit les coupes, en visant un rapport d'environ trois
   à cinq entre paliers voisins.

   Le palier commun, lui, se définit tout seul : ce sont les nombres qui ne
   portent AUCUNE propriété remarquable, plus ceux qui n'en portent qu'une
   faible. C'est une définition, pas un réglage. */
const SEUILS = {
  commun: 0, peucommun: 5, rare: 12, epique: 17, legendaire: 23, mythique: 30,
};

const W = [1, 0.5, 0.3, 0.15];          // les rendements décroissants d'evaluate()

function charger() {
  const src = [NUM, DATA].map(f => fs.readFileSync(f, 'utf8')).join('\n');
  return new Function(src + '; return { evaluate, TRAITS, RARITIES, CULTE };')();
}

function main() {
  const ecrire = process.argv.includes('--ecrire');
  const M = charger();

  /* 1. les effectifs, mesurés sur les tests */
  const eff = {};
  const profils = [];
  for (let n = 1; n <= N; n++) {
    const ids = (M.evaluate(n).traits || []).map(t => t.id);
    profils.push(ids);
    ids.forEach(id => eff[id] = (eff[id] || 0) + 1);
  }

  const bits = id => Math.log2(N / Math.max(1, eff[id] || 1));
  const PLANCHER = Math.log2(5);              // un nombre sur cinq — 2,32 bits
  const pointsDe = id => { const b = bits(id); return b < PLANCHER ? 0 : Math.round(K * b); };

  const nouveaux = {};
  M.TRAITS.forEach(t => nouveaux[t.id] = pointsDe(t.id));

  /* 2. les surnoms cultes gardent leur hiérarchie, mais changent d'unité.
        Leur valeur n'est pas mathématique — 42 n'est pas rare, il est célèbre —
        donc on ne la recalcule pas : on la remet à l'échelle du nouveau barème,
        plafonnée au trait mathématique le plus fort. Sans quoi « Le Vide » à 29
        écraserait un Taxicab à 20. */
  const maxMath = Math.max(...Object.values(nouveaux));
  const culteAct = Object.values(M.CULTE).map(c => c.pts);
  const cMin = Math.min(...culteAct), cMax = Math.max(...culteAct);
  const culteMin = 3;
  const reechelle = p => Math.round(culteMin + (p - cMin) * (maxMath - culteMin) / (cMax - cMin));

  /* 3. les seuils, déduits des tailles voulues */
  /* Le score d'un nombre, avec la formule d'evaluate() : rendements
     décroissants, le trait dominant seul compte pleinement. `profils[i]`
     décrit le nombre i+1, d'où la lecture de CULTE au même indice. */
  const scores = profils.map((ids, i) => {
    const liste = ids.map(id =>
      id === 'culte' ? reechelle(M.CULTE[i + 1].pts) : nouveaux[id]);
    return Math.round(liste.sort((a, b) => b - a)
      .reduce((acc, p, j) => acc + p * (W[j] ?? 0.08), 0));
  });
  const seuils = SEUILS;

  /* 4. le compte rendu */
  const compte = { commun: 0, peucommun: 0, rare: 0, epique: 0, legendaire: 0, mythique: 0 };
  for (const s of scores) {
    const p = s >= seuils.mythique ? 'mythique' : s >= seuils.legendaire ? 'legendaire'
            : s >= seuils.epique ? 'epique' : s >= seuils.rare ? 'rare'
            : s >= seuils.peucommun ? 'peucommun' : 'commun';
    compte[p]++;
  }

  console.log(`Facteur d'échelle k = ${K} — score maximum ${Math.max(...scores)}\n`);
  console.log('POINTS RECALCULÉS\n');
  const tri = [...M.TRAITS].sort((a, b) => nouveaux[b.id] - nouveaux[a.id] || eff[a.id] - eff[b.id]);
  for (const t of tri) {
    const av = t.pts, ap = nouveaux[t.id];
    const fleche = av === ap ? '  =' : av < ap ? ' ↑ ' : ' ↓ ';
    console.log('  ' + t.label.padEnd(26)
      + String(eff[t.id]).padStart(5) + ' nombres  '
      + (100 * eff[t.id] / N).toFixed(2).padStart(6) + ' %   '
      + String(av).padStart(3) + fleche + String(ap).padStart(3));
  }

  console.log('\nSEUILS ET TAILLES DE PALIERS\n');
  console.log('  palier'.padEnd(16) + 'seuil'.padStart(8) + 'avant'.padStart(9) + 'après'.padStart(9));
  const avant = {}; M.RARITIES.forEach(r => avant[r.key] = 0);
  for (let n = 1; n <= N; n++) avant[M.evaluate(n).rarity.key]++;
  for (const r of M.RARITIES) {
    console.log('  ' + r.key.padEnd(14) + String(seuils[r.key]).padStart(8)
      + String(avant[r.key]).padStart(9) + String(compte[r.key]).padStart(9));
  }

  if (!ecrire) {
    console.log('\n(essai à blanc — relancez avec --ecrire pour appliquer)');
    return;
  }

  /* 5. l'écriture, ligne à ligne : on ne remplace que le nombre après `pts:`
        ou `min:`, jamais la structure. Un fichier source se modifie au
        scalpel, pas à la régénération. */
  let num = fs.readFileSync(NUM, 'utf8');
  for (const t of M.TRAITS) {
    const re = new RegExp(`(\\{\\s*id:'${t.id}',[^\\n]*?pts:)\\d+`);
    if (!re.test(num)) throw new Error('trait introuvable dans la source : ' + t.id);
    num = num.replace(re, `$1${nouveaux[t.id]}`);
  }
  for (const r of M.RARITIES) {
    const re = new RegExp(`(\\{\\s*key:'${r.key}',[^\\n]*?min:)\\d+`);
    if (!re.test(num)) throw new Error('palier introuvable : ' + r.key);
    num = num.replace(re, `$1${seuils[r.key]}`);
  }
  fs.writeFileSync(NUM, num, 'utf8');

  let data = fs.readFileSync(DATA, 'utf8');
  for (const [n, c] of Object.entries(M.CULTE)) {
    const re = new RegExp(`(^\\s*${n}:\\s*\\{[^\\n]*?pts:)\\d+`, 'm');
    if (!re.test(data)) throw new Error('surnom culte introuvable : ' + n);
    data = data.replace(re, `$1${reechelle(c.pts)}`);
  }
  fs.writeFileSync(DATA, data, 'utf8');

  console.log('\njs/numerology.js et js/data.js réécrits.');
}

main();
