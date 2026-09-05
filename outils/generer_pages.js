/* ============================================================
   Génère les pages de contenu à partir du moteur du jeu.

   Pourquoi : le jeu est une application monopage. Le robot
   d'indexation n'y voit qu'un squelette vide — tout est fabriqué
   en JavaScript après le chargement. Or le contenu existe : 65
   définitions de traits, 50 notices de nombres, 14 théorèmes,
   tous rédigés. Il suffit qu'ils existent aussi dans le HTML servi.

   Ce qu'on ne fait PAS : une page par nombre. Dix mille pages
   engendrées mécaniquement, c'est du « contenu à grande échelle »
   au sens de Google, et un motif de rejet plutôt qu'un remède.
   On ne publie que ce qui a été écrit.

   Usage :  node outils/generer_pages.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const V = 231;                                   // version des assets, cf. index.html

const source = ['js/numerology.js', 'js/data.js']
  .map(f => fs.readFileSync(path.join(RACINE, f), 'utf8'))
  .join('\n');

const M = new Function(source + `
  computeTraitExamples();
  return { evaluate, TRAITS, TRAIT_BY_ID, RARITIES, CULTE, COLLECTIONS, factorString, digitSum };`)();

/* ---------- utilitaires ---------- */
const ech = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = n => Number(n).toLocaleString('fr-FR');

function preuve(trait, n) {
  if (!trait || !trait.proof) return null;
  try { const p = trait.proof(n); return typeof p === 'object' ? p.note : p; }
  catch { return null; }
}

const PAGES = [
  ['index.html', 'Le jeu'],
  ['codex.html', 'Codex des traits'],
  ['nombres.html', 'Nombres remarquables'],
  ['theoremes.html', 'Théorèmes'],
  ['regles.html', 'Règles'],
  ['a-propos.html', 'À propos'],
];

function page(fichier, titre, description, corps) {
  const nav = PAGES.map(([f, nom]) =>
    f === fichier
      ? `<span class="navOn">${ech(nom)}</span>`
      : `<a href="${f}">${ech(nom)}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ech(titre)} — Gacha des Nombres</title>
<meta name="description" content="${ech(description)}">
<meta property="og:title" content="${ech(titre)} — Gacha des Nombres">
<meta property="og:description" content="${ech(description)}">
<meta property="og:type" content="article">
<link rel="stylesheet" href="css/style.css?v=${V}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔢</text></svg>">
<!-- AdSense. La balise est posée en dur, et pas seulement injectée par
     js/pub.js, parce que la validation du site par Google se fait sur le HTML
     servi : dépendre du JavaScript pour être vérifié, c'est risquer un refus
     dont la cause serait invisible. pub.js détecte cette balise et n'en
     ajoute pas une seconde. -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8735036143518614"
        crossorigin="anonymous"></script>
</head>
<body>

<header class="topbar">
  <a class="brand" href="index.html">
    <span class="brandIcon">🔢</span>
    <span class="brandText"><b>GACHA</b><i>DES NOMBRES</i></span>
  </a>
  <a class="btn sm" href="index.html">Jouer</a>
</header>

<nav class="navDoc">${nav}</nav>

<main class="page">
${corps}
<p class="retour"><a href="index.html">← Retour au jeu</a></p>
</main>

<div id="pubBas"></div>

<footer class="pied">
  <a href="index.html">Le jeu</a><span>·</span>
  <a href="codex.html">Codex</a><span>·</span>
  <a href="a-propos.html">À propos</a><span>·</span>
  <a href="confidentialite.html">Confidentialité</a><span>·</span>
  <a href="https://github.com/SignamarcheixH/GachaMath" rel="noopener" target="_blank">Code source</a>
</footer>

<script src="js/config.js?v=${V}"></script>
<script src="js/pub.js?v=${V}"></script>
<script src="js/doc.js?v=${V}"></script>
<script src="js/retour.js?v=${V}"></script>
<script>if (typeof initPub === 'function') initPub();</script>
</body>
</html>
`;
}

/* ============================================================
   CODEX — les 65 traits
   ============================================================ */
const FAMILLES = [
  ['Primalité', "Ce qui touche aux nombres premiers, à leurs voisinages et à leurs formes particulières.",
   ['premier','jumeau','cousin','sexy','sophie','sur','pythagore','emirp','tronquable','gauche','permutable','mersenne','fermat','wieferich','semipremier','spheniq']],
  ['Diviseurs', "Ce qu'un nombre devient quand on le décompose, et ce que la somme de ses diviseurs raconte.",
   ['parfait','amical','abondant','deficient','hcn','pratique','puissant','achille','sansCarre','bizarre','primorielle']],
  ['Figurés', "Les nombres qui s'empilent en formes : triangles, carrés, pyramides.",
   ['carre','cube','triangle','pentagonal','hexagonal','tetraedrique','pyramidal','pow2']],
  ['Suites', "Les termes de suites célèbres, croisés au détour d'un tirage.",
   ['fibo','lucas','pell','catalan','motzkin','bell','factorielle']],
  ['Chiffres', "Ce qui ne dépend pas du nombre mais de son écriture décimale — donc de notre choix d'avoir dix doigts.",
   ['palindrome','repdigit','ondulant','harshad','zuckerman','heureux','armstrong','munchhausen','dudeney','keith','automorphe','kaprekar','smith','autonombre','lychrel']],
  ['Curiosités', "Les cas isolés, ceux qui n'appartiennent à aucune famille et qu'on a nommés pour eux-mêmes.",
   ['taxicab','kaprekarC','vampire','carmichael','idoneal','chanceux','pair','impair']],
];

/* ============================================================
   COMBIEN DE NOMBRES PORTENT CHAQUE TRAIT

   Le vivier fait 9 999 nombres et le jeu applique 65 tests à chacun : 650 000
   évaluations, faites UNE fois au moment de générer les pages, jamais chez le
   visiteur. Une page statique n'a pas à calculer ce qu'on peut lui écrire.

   Le compte est la meilleure définition qui soit d'une rareté : dire qu'il
   n'existe que quatre nombres parfaits sous dix mille en apprend davantage que
   n'importe quelle phrase sur les nombres parfaits. */
const EFFECTIFS = (() => {
  const c = {};
  M.TRAITS.forEach(t => c[t.id] = 0);
  for (let n = 1; n <= 9999; n++) {
    for (const t of M.evaluate(n).traits || []) {
      if (c[t.id] !== undefined) c[t.id]++;
    }
  }
  return c;
})();

/* Le gras porte le compte, l'italique la part — toujours, sans exception. Un
   seuil qui basculait les petits effectifs sur « 4 sur 9 999 » donnait deux
   voisins écrits différemment : Mersenne en pourcentage, Fermat en fraction.
   Deux décimales suffisent : le plus petit effectif possible, 1 sur 9 999,
   vaut encore 0,01 %. Virgule décimale, on écrit en français. */
function effectifHTML(t) {
  const n = EFFECTIFS[t.id] || 0;
  const pc = 100 * n / 9999;
  const part = (pc >= 1 ? pc.toFixed(1) : pc.toFixed(2)).replace('.', ',') + ' %';
  return `<span class="docCompte"><b>${n.toLocaleString('fr-FR')}</b>
    <i>${part}</i></span>`;
}

function pageCodex() {
  const vus = new Set();
  let corps = `<h1>Codex des traits</h1>
<p class="chapo">Un nombre n'est pas rare parce qu'un serveur l'a décidé : il est rare
parce qu'il <b>est</b> rare. Ces ${M.TRAITS.length} propriétés sont celles que le moteur
du jeu sait reconnaître, et leur cumul détermine la valeur d'un nombre. Chacune indique
<b>combien de nombres la portent sous 10 000</b> — c'est la mesure la plus honnête de sa
rareté. Dépliez une ligne pour la définition et une démonstration calculée sur le plus
petit nombre qui l'illustre.</p>`;

  for (const [nom, intro, ids] of FAMILLES) {
    const traits = ids.map(id => M.TRAIT_BY_ID[id]).filter(Boolean);
    traits.forEach(t => vus.add(t.id));
    corps += `\n<h2>${ech(nom)}</h2>\n<p>${ech(intro)}</p>\n<div class="docListe">\n`;
    for (const t of traits.sort((a, b) => b.pts - a.pts)) corps += traitHTML(t);
    corps += `</div>\n`;
  }

  const restants = M.TRAITS.filter(t => !vus.has(t.id));
  if (restants.length) {
    corps += `\n<h2>Divers</h2>\n<div class="docListe">\n`;
    for (const t of restants) corps += traitHTML(t);
    corps += `</div>\n`;
  }
  return page('codex.html', 'Codex des traits',
    `Les ${M.TRAITS.length} propriétés mathématiques qui déterminent la rareté d'un nombre : parfait, narcissique, vampire, taxicab, Carmichael… chacune définie et démontrée.`,
    corps);
}

/* Une ligne par trait, dépliable. `<details>` plutôt qu'un accordéon en
   JavaScript : ça marche sans script, c'est accessible au clavier d'origine,
   et la recherche du navigateur (Ctrl+F) trouve le texte replié — trois choses
   qu'aucune réimplémentation ne rend gratuitement.

   Ce qui reste VISIBLE replié est ce qu'on vient chercher : le nom, les points,
   et combien de nombres portent le trait. La définition, elle, se déplie. */
function traitHTML(t) {
  const p = preuve(t, t.example);
  return `  <details class="docTrait">
    <summary>
      <span class="docEmoji">${t.emoji}</span>
      <span class="docNom">${ech(t.label)}</span>
      ${effectifHTML(t)}
      <span class="docPts">${t.pts > 0 ? '+' + t.pts : '—'}</span>
    </summary>
    <div class="docCorps">
      <p>${ech(t.desc)}</p>
      ${p ? `<p class="docPreuve"><b>Exemple.</b> ${ech(p)}</p>` : ''}
    </div>
  </details>\n`;
}

/* ============================================================
   NOMBRES REMARQUABLES — les notices rédigées
   ============================================================ */
function pageNombres() {
  const nums = Object.keys(M.CULTE).map(Number).sort((a, b) => a - b);
  let corps = `<h1>Nombres remarquables</h1>
<p class="chapo">Certains nombres portent un nom. Pas toujours pour des raisons
mathématiques — 42 ne doit rien à l'arithmétique, 404 non plus. Voici les
${nums.length} que le jeu reconnaît, avec ce que les mathématiques en disent par ailleurs.</p>
<div class="docListe">\n`;

  for (const n of nums) {
    const c = M.CULTE[n];
    const ev = M.evaluate(n);
    const traits = ev.traits.filter(t => t.id !== 'culte');
    const forts = traits.filter(t => t.pts > 0).slice(0, 6);
    corps += `  <article class="docNombre" id="n${n}">
    <h3><span class="docNum">${fmt(n)}</span> ${c.emoji} ${ech(c.nom)}
        <span class="docRar" style="color:var(--r-${ev.rarity.key})">${ech(ev.rarity.label)}</span></h3>
    <p>${ech(c.desc)}</p>
    <p class="docFiche"><b>${ech(ev.factors)}</b> · ${ev.divisors} diviseur${ev.divisors > 1 ? 's' : ''}
       · somme des chiffres ${M.digitSum(n)}${forts.length ? ` · ${forts.map(t => ech(t.label.toLowerCase())).join(', ')}` : ''}</p>
`;
    const remarquable = traits.find(t => t.pts >= 8);
    const p = remarquable && preuve(remarquable, n);
    if (p) corps += `    <p class="docPreuve"><b>${ech(remarquable.label)}.</b> ${ech(p)}</p>\n`;
    corps += `  </article>\n`;
  }
  corps += `</div>\n`;
  return page('nombres.html', 'Nombres remarquables',
    `${nums.length} nombres qui portent un nom : 1729 le taxi de Ramanujan, 6174 la constante de Kaprekar, 3435 le Münchhausen, 42 la Réponse. Leur histoire et leurs propriétés.`,
    corps);
}

/* ============================================================
   THÉORÈMES
   ============================================================ */
function pageTheoremes() {
  let corps = `<h1>Théorèmes</h1>
<p class="chapo">Réunir un ensemble complet le « démontre » et débloque un bonus permanent.
Les ${M.COLLECTIONS.length} ensembles ci-dessous ne sont pas arbitraires : chacun est une
famille mathématique close, ou un clin d'œil assumé.</p>
<div class="docListe">\n`;

  for (const c of M.COLLECTIONS) {
    corps += `  <article class="docTheo">
    <h3>${c.emoji} ${ech(c.nom)}</h3>
    <p>${ech(c.desc)}</p>
    <p class="docFiche"><b>Récompense :</b> ${ech(c.bonusLabel)}</p>\n`;
    if (c.nums) {
      corps += `    <p class="docNums">${c.nums.map(n => {
        const ev = M.evaluate(n);
        return `<span style="color:var(--r-${ev.rarity.key})">${fmt(n)}</span>`;
      }).join(' · ')}</p>\n`;
    } else if (c.pred) {
      corps += `    <p class="docNums">${c.pred.n} nombres au-delà de 9 999, à gagner à la Forge.</p>\n`;
    }
    corps += `  </article>\n`;
  }
  corps += `</div>\n`;
  return page('theoremes.html', 'Théorèmes',
    `Les ${M.COLLECTIONS.length} collections du jeu : les quatre nombres parfaits, la suite de Fibonacci, les puissances de deux, le Panthéon des nombres cultes.`,
    corps);
}

/* ============================================================
   RÈGLES
   ============================================================ */
function pageRegles() {
  const r = M.RARITIES.map(x =>
    `<tr><td style="color:var(--r-${x.key})"><b>${ech(x.label)}</b></td><td>${x.min} points et plus</td></tr>`).join('\n');

  const corps = `<h1>Comment la rareté est calculée</h1>
<p class="chapo">Dans la plupart des jeux de collection, la rareté d'une carte est une
décision commerciale. Ici, c'est le résultat d'un calcul — et vous pouvez le vérifier.</p>

<h2>Le principe</h2>
<p>À chaque entier, le jeu applique ${M.TRAITS.length} tests mathématiques. Est-il premier ?
Palindrome ? Égal à la somme de ses diviseurs propres ? Chaque propriété trouvée vaut un
certain nombre de points, et le total détermine le palier.</p>
<p>Il n'existe que quatre nombres parfaits sous dix mille — 6, 28, 496 et 8128. Ils sont donc
Mythiques, et il n'y a rien à négocier : c'est une propriété du nombre, pas une décision.</p>

<h2>Les rendements décroissants</h2>
<p>Additionner bêtement les points ne marche pas. Les tout petits nombres ouvrent toutes les
suites à la fois : 1 est à lui seul Fibonacci, Catalan, factorielle, Kaprekar et puissance de
deux. En addition simple, il écrasait tout le classement.</p>
<p>Le score applique donc des rendements décroissants : le trait dominant compte pleinement,
le deuxième pour moitié, le troisième pour trois dixièmes, le quatrième pour un sixième, et
tous les suivants pour presque rien. Un nombre vaut ce que vaut sa propriété la plus rare,
et non le nombre de cases qu'il coche.</p>

<h2>Les paliers</h2>
<table class="cook">
<tr><th>Palier</th><th>Score</th></tr>
${r}
</table>
<p>Les seuils sont recalibrés à chaque ajout de traits, sur la distribution réelle des
scores : passer de 38 à 65 propriétés enrichissait mécaniquement tout le monde et avait vidé
le palier Commun de deux mille nombres.</p>

<h2>Les deux territoires</h2>
<p>Le tirage règne sur <b>1 à 9 999</b> : c'est le domaine de la chance. La Forge règne sur
le reste — <b>0</b>, et <b>10 000 à 99 999</b> : c'est le domaine de l'adresse. On n'y choisit
pas ce qu'on fabrique : la Forge tire six nombres de votre collection, annonce une cible, et
vous laisse chercher, à la manière du Compte est Bon.</p>
<p>Toute commande est solvable par construction. La Forge n'invente pas une cible en croisant
les doigts : elle explore d'abord l'intégralité de ce que la main peut produire, puis choisit
la cible là-dedans.</p>

<h2>Et la révision</h2>
<p>Savoir reconnaître un nombre parfait quand la fiche vous le dit est une chose. Sans la
fiche, c'en est une autre. Deux exercices s'en chargent : retrouver le trait parmi quatre
nombres anonymes, ou remettre dix traits face à leur définition.</p>`;

  return page('regles.html', 'Règles',
    "Comment la rareté d'un nombre est calculée : 65 propriétés mathématiques, des rendements décroissants, et six paliers. Rien n'est décidé, tout est vérifiable.",
    corps);
}

/* ============================================================
   À PROPOS
   ============================================================ */
function pageAPropos() {
  const corps = `<h1>À propos</h1>
<p class="chapo">Gacha des Nombres est un jeu de collection gratuit, sans achat, sans compte
et sans publicité intrusive, où l'on collectionne des entiers.</p>

<h2>L'idée</h2>
<p>Les jeux de collection distribuent des cartes dont la rareté a été décidée par quelqu'un.
Ici, on collectionne les entiers de 0 à 99 999, et leur rareté vient de leurs propriétés
mathématiques réelles. C'est volontairement absurde, et c'est aussi honnête : chaque carte
peut justifier son prix, démonstration à l'appui.</p>

<h2>Ce qu'on y trouve</h2>
<ul>
  <li><b>Le tirage</b> — ${M.TRAITS.length} propriétés évaluées sur les 9 999 premiers entiers.</li>
  <li><b>La Forge</b> — un Compte est Bon dont les cibles vivent au-delà du mur des dix mille.</li>
  <li><b>La Révision</b> — deux exercices pour apprendre à reconnaître les traits sans l'aide de la fiche.</li>
  <li><b>Le Codex</b> — les 65 propriétés reconnues, définies et démontrées. La fiche d'un
      nombre, elle, refait la démonstration sur ce nombre-là : le Codex dit ce qu'un trait
      <i>est</i>, la fiche dit ce que <i>ce</i> nombre est.</li>
</ul>

<h2>Technique</h2>
<p>Le jeu est écrit en JavaScript sans dépendance ni compilation, et fonctionne entièrement
hors ligne. Un serveur Django facultatif ajoute la sauvegarde en ligne et le classement, sans
jamais demander d'adresse e-mail ni de mot de passe. Le code est ouvert et lisible :
<a href="https://github.com/SignamarcheixH/GachaMath" rel="noopener" target="_blank">SignamarcheixH/GachaMath</a>.</p>

<h2>Nous écrire</h2>
<p>Une remarque, un trait mathématique qui manque, une démonstration fausse ?
Écrivez à <a href="mailto:contact@gachamath.fr">contact@gachamath.fr</a>.</p>`;

  return page('a-propos.html', 'À propos',
    "Un jeu de collection gratuit où l'on collectionne des entiers, et où la rareté d'une carte se démontre au lieu de se décréter.",
    corps);
}

/* ---------- écriture ---------- */
const sorties = [
  ['codex.html', pageCodex()],
  ['nombres.html', pageNombres()],
  ['theoremes.html', pageTheoremes()],
  ['regles.html', pageRegles()],
  ['a-propos.html', pageAPropos()],
];

let mots = 0;
for (const [nom, html] of sorties) {
  fs.writeFileSync(path.join(RACINE, nom), html, 'utf8');
  const texte = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const n = texte.split(' ').length;
  mots += n;
  console.log(`${nom.padEnd(18)} ${(html.length / 1024).toFixed(0).padStart(4)} Ko   ${String(n).padStart(5)} mots`);
}
console.log(`${''.padEnd(18)} ${''.padStart(4)}      ${String(mots).padStart(5)} mots au total`);
