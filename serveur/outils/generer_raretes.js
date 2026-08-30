/* ============================================================
   Génère la table nombre → rareté que Django utilise pour bâtir
   le classement, en chargeant directement le moteur du jeu.

   Le serveur n'a pas besoin de rejouer la partie : la complétion
   et les théorèmes se lisent dans la sauvegarde, et la répartition
   par rareté se lit ici. Porter les 65 traits en Python serait à la
   fois inutile et une source de divergence garantie.

   Usage :  node serveur/outils/generer_raretes.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..', '..');
const SORTIE = path.join(__dirname, '..', 'parties', 'data', 'raretes.txt');

const source = ['js/numerology.js', 'js/data.js']
  .map(f => fs.readFileSync(path.join(RACINE, f), 'utf8'))
  .join('\n');

// On évalue le moteur tel quel, puis on récupère ses deux exports utiles.
const moteur = new Function(source + '\nreturn { evaluate, RARITIES };')();

let table = '';
for (let n = 1; n <= 9999; n++) table += moteur.evaluate(n).rarity.idx;

fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
fs.writeFileSync(SORTIE, table, 'utf8');

const compte = {};
for (const c of table) compte[c] = (compte[c] || 0) + 1;

console.log(`${SORTIE}`);
console.log(`${table.length} nombres, ${Buffer.byteLength(table)} octets`);
for (const r of moteur.RARITIES) console.log(`  ${r.label.padEnd(12)} ${compte[r.idx] || 0}`);
console.log(`contrôle : 1=${table[0]} 1729=${table[1728]} 9999=${table[9998]} (attendus 5, 5, 3)`);
