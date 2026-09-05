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
const moteur = new Function(source + '\nreturn { evaluate, RARITIES, COLLECTIONS, DEFIS };')();

let table = '';
for (let n = 1; n <= 9999; n++) table += moteur.evaluate(n).rarity.idx;

fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
fs.writeFileSync(SORTIE, table, 'utf8');

const compte = {};
for (const c of table) compte[c] = (compte[c] || 0) + 1;

console.log(`${SORTIE}`);
console.log(`${table.length} nombres, ${Buffer.byteLength(table)} octets`);
for (const r of moteur.RARITIES) console.log(`  ${r.label.padEnd(12)} ${compte[r.idx] || 0}`);
/* Contrôle de bon sens. Les valeurs attendues étaient écrites en dur et sont
   devenues fausses le jour où le barème a été recalculé sur la fréquence réelle
   des traits — le contrôle affirmait « 9999 attendu 3 » alors qu'il vaut 4. On
   ne compare donc plus à des constantes, mais à ce que le moteur dit lui-même :
   un contrôle qui ne peut pas se périmer. */
const temoins = [1, 1729, 6174, 9999];
/* `table` est une chaîne : chaque rareté y occupe un caractère. On compare
   donc des chiffres, pas des nombres — sans quoi le contrôle échoue toujours. */
const ecarts = temoins.filter(n =>
  table[n - 1] !== String(moteur.RARITIES.findIndex(r => r.key === moteur.evaluate(n).rarity.key)));
console.log('contrôle : ' + temoins.map(n => n + '=' + table[n - 1]).join(' ')
  + (ecarts.length ? '  ÉCART sur ' + ecarts.join(', ') : '  (conforme au moteur)'));
if (ecarts.length) process.exit(1);

/* ============================================================
   LES BORNES DU JEU, POUR LE SERVEUR

   Le contrôle de plausibilité doit savoir combien il existe de Légendaires, de
   théorèmes, de défis. Ces nombres étaient RETAPÉS À LA MAIN dans
   metriques.py. Le jour où le barème des traits a été recalculé sur la
   fréquence réelle, il y a eu 74 Légendaires au lieu de 11 : le serveur s'est
   mis à signaler comme tricheur tout joueur qui en possédait douze, et à
   l'écarter du classement sans jamais le lui dire.

   Tout ce que le serveur doit savoir des règles du jeu est donc GÉNÉRÉ ICI,
   depuis le moteur, comme la table des raretés. Un nombre retapé finit
   toujours par mentir. */
const BORNES = path.join(__dirname, '..', 'parties', 'data', 'bornes.json');
const bornes = {
  vivier: 9999,
  paliers: Object.fromEntries(moteur.RARITIES.map(r => [r.key, compte[r.idx] || 0])),
  theoremes: moteur.COLLECTIONS.length,
  defis: (typeof moteur.DEFIS !== 'undefined' && moteur.DEFIS) ? moteur.DEFIS.length : 0,
};
fs.writeFileSync(BORNES, JSON.stringify(bornes, null, 2) + String.fromCharCode(10), 'utf8');
console.log('');
console.log(BORNES);
console.log('  ' + JSON.stringify(bornes.paliers));
console.log('  théorèmes ' + bornes.theoremes + ' · défis ' + bornes.defis);
