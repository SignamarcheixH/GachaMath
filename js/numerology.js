/* ============================================================
   NUMEROLOGIE — le moteur qui décide de la rareté d'un nombre.
   Un nombre n'est pas rare parce qu'un serveur l'a décidé :
   il est rare parce qu'il EST rare. C'est tout le sel du jeu.
   ============================================================ */

const NMAX = 99999;

/* ---------- primitives ---------- */
const digitsOf  = n => String(n).split('').map(Number);
const digitSum  = n => digitsOf(n).reduce((a, b) => a + b, 0);
const reverseNum = n => parseInt(String(n).split('').reverse().join(''), 10);

const _primeCache = new Map();
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  const hit = _primeCache.get(n);
  if (hit !== undefined) return hit;
  let r = true;
  if (n % 2 === 0) r = (n === 2);
  else for (let i = 3; i * i <= n; i += 2) if (n % i === 0) { r = false; break; }
  _primeCache.set(n, r);
  return r;
}

const _facCache = new Map();
function factorize(n) {
  if (n < 2) return [];
  const hit = _facCache.get(n);
  if (hit) return hit;
  const out = [];
  let m = n;
  while (m % 2 === 0) { m /= 2; out.push(2); }
  for (let p = 3; p * p <= m; p += 2) while (m % p === 0) { m /= p; out.push(p); }
  if (m > 1) out.push(m);
  if (n <= 20000) _facCache.set(n, out);
  return out;
}

function factorPairs(n) {                 // [[premier, exposant], ...]
  const f = factorize(n), out = [];
  for (const p of f) {
    if (out.length && out[out.length - 1][0] === p) out[out.length - 1][1]++;
    else out.push([p, 1]);
  }
  return out;
}

function divisorSum(n) {                  // sigma(n) : somme de TOUS les diviseurs
  if (n < 1) return 0;
  let s = 1;
  for (const [p, e] of factorPairs(n)) s *= (Math.pow(p, e + 1) - 1) / (p - 1);
  return Math.round(s);
}
const aliquot = n => divisorSum(n) - n;   // somme des diviseurs propres

function divisorCount(n) {
  if (n < 1) return n === 0 ? 0 : 1;
  let c = 1;
  for (const [, e] of factorPairs(n)) c *= (e + 1);
  return c;
}

const isSquare      = n => n >= 0 && Number.isInteger(Math.sqrt(n));
const isCube        = n => n >= 0 && Math.round(Math.cbrt(n)) ** 3 === n;
const isPow2        = n => n > 0 && (n & (n - 1)) === 0;
const isTriangular  = n => n >= 0 && isSquare(8 * n + 1);
const isPentagonal  = n => n > 0 && (1 + Math.sqrt(24 * n + 1)) % 6 === 0;

const isPalindrome  = n => n >= 10 && String(n) === String(n).split('').reverse().join('');
const isRepdigit    = n => n >= 11 && new Set(String(n)).size === 1;

function isHappy(n) {
  if (n < 1) return false;
  const seen = new Set();
  let x = n;
  while (x !== 1 && !seen.has(x)) { seen.add(x); x = digitsOf(x).reduce((a, d) => a + d * d, 0); }
  return x === 1;
}

const isHarshad = n => n > 0 && digitSum(n) > 0 && n % digitSum(n) === 0;

function isKaprekar(n) {                  // 45² = 2025 → 20 + 25 = 45
  if (n === 1) return true;
  if (n < 1) return false;
  const s = String(n * n);
  for (let i = 1; i < s.length; i++) {
    const l = parseInt(s.slice(0, i), 10), r = parseInt(s.slice(i), 10);
    if (r > 0 && l + r === n) return true;
  }
  return false;
}

function isArmstrong(n) {                 // narcissique : 153 = 1³ + 5³ + 3³
  if (n < 10) return false;
  const d = digitsOf(n), k = d.length;
  return d.reduce((a, x) => a + Math.pow(x, k), 0) === n;
}

function isSmith(n) {                     // somme des chiffres = somme des chiffres de ses facteurs
  if (n < 4 || isPrime(n)) return false;
  const f = factorize(n);
  if (f.length < 2) return false;
  return digitSum(n) === f.reduce((a, p) => a + digitSum(p), 0);
}

function isEmirp(n) {                     // premier dont l'envers est un AUTRE premier
  if (!isPrime(n) || n < 13) return false;
  const r = reverseNum(n);
  return r !== n && isPrime(r);
}

function isTruncatablePrime(n) {          // 3797 → 379 → 37 → 3, tous premiers
  if (!isPrime(n) || n < 23) return false;
  let x = Math.floor(n / 10);
  while (x > 0) { if (!isPrime(x)) return false; x = Math.floor(x / 10); }
  return true;
}

function isAmicable(n) {                  // 220 et 284 se contiennent l'un l'autre
  if (n < 4) return false;
  const s = aliquot(n);
  return s !== n && s > 1 && s <= 200000 && aliquot(s) === n;
}

/* ---------- outils de la Forge ---------- */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a; }
function lcm(a, b) { if (!a || !b) return 0; return a / gcd(a, b) * b; }
function totient(n) {                       // φ(n) : combien d'entiers < n sont premiers avec n
  if (n < 1) return 0;
  let r = n;
  for (const [p] of factorPairs(n)) r -= r / p;
  return Math.round(r);
}
function nextPrime(n) { let x = Math.max(0, n) + 1; while (!isPrime(x)) x++; return x; }

const isSophieGermain = n => isPrime(n) && isPrime(2 * n + 1);
const isTwinPrime     = n => isPrime(n) && (isPrime(n - 2) || isPrime(n + 2));
const isSexyPrime     = n => isPrime(n) && (isPrime(n - 6) || isPrime(n + 6));

/* ---------- suites tabulées ----------
   Gardées sous forme de listes ordonnées : les démonstrations ont besoin de
   retrouver les termes voisins, pas seulement de tester l'appartenance. */
const S = a => new Set(a);
const FIB_SEQ     = [1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181,6765,10946,17711,28657,46368,75025];
const LUCAS_SEQ   = [2,1,3,4,7,11,18,29,47,76,123,199,322,521,843,1364,2207,3571,5778,9349,15127,24476,39603,64079];
const CATALAN_SEQ = [1,1,2,5,14,42,132,429,1430,4862,16796,58786];
const FIBO        = S(FIB_SEQ);
const LUCAS       = S(LUCAS_SEQ);
const CATALAN     = S(CATALAN_SEQ);
const FACTORIELLE = S([1,2,6,24,120,720,5040,40320]);
const PRIMORIELLE = S([2,6,30,210,2310,30030]);
const MERSENNE    = S([3,7,31,127,8191]);
const FERMAT      = S([3,5,17,257,65537]);
const PARFAIT     = S([6,28,496,8128]);
const HCN         = S([1,2,4,6,12,24,36,48,60,120,180,240,360,720,840,1260,1680,2520,5040,7560,10080,15120,20160,25200,27720,45360,50400,55440,83160]);
const VAMPIRE     = S([1260,1395,1435,1530,1827,2187,6880]);
const BIZARRE     = S([70,836,4030,5830,7192,7912,9272,10430,10570,10792,10990,11410,11690,12110,12530,12670,13370,13510,13790,13930,14770,15610,15890,16030,16310,16730,16870,17272,17570,17990,18410,18830,18970,19390,19670]);

/* ---------- le catalogue des traits ----------
   pts = points de rareté. Un nombre banal totalise 0-1, un mythique 25+.  */
const TRAITS = [
  { id:'parfait',     label:'Parfait',               emoji:'👑', pts:17, desc:"Égal à la somme de ses diviseurs propres. Il n'en existe que quatre sous 10 000.", test:n=>PARFAIT.has(n) },
  { id:'taxicab',     label:'Taxicab',               emoji:'🚕', pts:20, desc:"Le plus petit nombre exprimable de deux façons comme somme de deux cubes. Ramanujan l'a sorti depuis un lit d'hôpital, en parlant d'un taxi.", test:n=>n===1729 },
  { id:'kaprekarC',   label:'Constante de Kaprekar', emoji:'🌀', pts:20, desc:"Presque tout nombre à quatre chiffres finit ici si on le triture assez longtemps. Un trou noir arithmétique.", test:n=>n===6174 },
  { id:'fermat',      label:'Nombre de Fermat',      emoji:'🧿', pts:17, desc:"De la forme 2^(2^k)+1. Fermat pensait qu'ils étaient tous premiers. Fermat avait tort.", test:n=>FERMAT.has(n) },
  { id:'armstrong',   label:'Narcissique',           emoji:'💅', pts:16,  desc:"Égal à la somme de ses chiffres élevés à la puissance de leur nombre. Il se suffit à lui-même.", test:isArmstrong },
  { id:'vampire',     label:'Vampire',               emoji:'🧛', pts:16,  desc:"Produit de deux « crocs » formés de ses propres chiffres. 1260 = 21 × 60.", test:n=>VAMPIRE.has(n) },
  { id:'bizarre',     label:'Bizarre',               emoji:'👽', pts:16,  desc:"Abondant, mais jamais somme exacte d'un sous-ensemble de ses diviseurs. Le premier est 70. Personne ne sait s'il en existe d'impairs.", test:n=>BIZARRE.has(n) },
  { id:'mersenne',    label:'Premier de Mersenne',   emoji:'⛰️', pts:16,  desc:"Un premier de la forme 2^p − 1. Aristocratie absolue.", test:n=>MERSENNE.has(n) },
  { id:'amical',      label:'Amical',                emoji:'🤝', pts:15,  desc:"Il a une âme sœur : chacun est la somme des diviseurs propres de l'autre.", test:isAmicable },
  { id:'primorielle', label:'Primorielle',           emoji:'🧬', pts:16,  desc:"Produit de tous les premiers consécutifs à partir de 2.", test:n=>PRIMORIELLE.has(n) },
  { id:'hcn',         label:'Hautement composé',     emoji:'🏗️', pts:13,  desc:"Il a plus de diviseurs que tout nombre plus petit que lui. Un carrefour.", test:n=>HCN.has(n) },
  { id:'catalan',     label:'Catalan',               emoji:'🌳', pts:15,  desc:"Compte les façons de parenthéser, trianguler, arboriser. Il surgit partout en combinatoire.", test:n=>CATALAN.has(n) },
  { id:'factorielle', label:'Factorielle',           emoji:'❗', pts:16,  desc:"Le produit de tous les entiers jusqu'à un certain point. Croît de façon indécente.", test:n=>FACTORIELLE.has(n) },
  { id:'kaprekar',    label:'Kaprekar',              emoji:'✂️', pts:14,  desc:"Son carré peut être coupé en deux morceaux qui, additionnés, le reforment. 45² = 2025, 20 + 25 = 45.", test:isKaprekar },
  { id:'tronquable',  label:'Premier tronquable',    emoji:'🔪', pts:12,  desc:"Reste premier quand on lui arrache ses chiffres de droite, un par un.", test:isTruncatablePrime },
  { id:'pow2',        label:'Puissance de 2',        emoji:'💾', pts:14,  desc:"La monnaie officielle des ordinateurs.", test:isPow2 },
  { id:'fibo',        label:'Fibonacci',             emoji:'🐚', pts:14,  desc:"La somme des deux précédents. Les lapins, les tournesols, les spirales.", test:n=>FIBO.has(n) },
  { id:'cube',        label:'Cube parfait',          emoji:'🧊', pts:13,  desc:"Un entier au cube. Solide.", test:n=>n>1&&isCube(n) },
  { id:'repdigit',    label:'Repdigit',              emoji:'🔁', pts:13,  desc:"Le même chiffre, encore et encore. Hypnotique.", test:isRepdigit },
  { id:'emirp',       label:'Emirp',                 emoji:'🪞', pts:8,  desc:"Premier à l'endroit, premier à l'envers, et pas le même. (« prime » retourné.)", test:isEmirp },
  { id:'premier',     label:'Premier',               emoji:'🔷', pts:5,  desc:"Indivisible. Une brique de l'univers.", test:isPrime },
  { id:'carre',       label:'Carré parfait',         emoji:'⬛', pts:10,  desc:"Un entier au carré. Rassurant.", test:n=>n>1&&isSquare(n) },
  { id:'palindrome',  label:'Palindrome',            emoji:'🔄', pts:9,  desc:"Se lit pareil dans les deux sens.", test:isPalindrome },
  { id:'lucas',       label:'Lucas',                 emoji:'🌗', pts:13,  desc:"Le cousin discret de Fibonacci : même règle, autre départ.", test:n=>LUCAS.has(n) },
  { id:'smith',       label:'Smith',                 emoji:'🕴️', pts:7,  desc:"La somme de ses chiffres égale celle des chiffres de ses facteurs premiers.", test:isSmith },
  { id:'sophie',      label:'Sophie Germain',        emoji:'🎀', pts:9,  desc:"Un premier p tel que 2p+1 est premier aussi. Elle publiait sous un faux nom d'homme pour être lue.", test:isSophieGermain },
  { id:'triangle',    label:'Triangulaire',          emoji:'🔺', pts:9,  desc:"On peut l'empiler en triangle. 1, 3, 6, 10, 15…", test:n=>n>0&&isTriangular(n) },
  { id:'pentagonal',  label:'Pentagonal',            emoji:'⬟', pts:10,  desc:"Même idée, mais en pentagone.", test:isPentagonal },
  { id:'heureux',     label:'Heureux',               emoji:'😊', pts:4,  desc:"Additionnez le carré de ses chiffres, recommencez : vous finissez sur 1. Sinon vous bouclez à jamais sur 4.", test:isHappy },
  { id:'spheniq',     label:'Sphénique',             emoji:'🪨', pts:4,  desc:"Produit d'exactement trois premiers distincts.", test:n=>{const f=factorize(n);return f.length===3&&new Set(f).size===3;} },
  { id:'jumeau',      label:'Premier jumeau',        emoji:'👯', pts:7,  desc:"Un premier à distance 2 d'un autre premier. On ignore encore s'il y en a une infinité.", test:isTwinPrime },
  { id:'sexy',        label:'Premier sexy',          emoji:'💋', pts:6,  desc:"Vrai terme mathématique, désolé. Deux premiers séparés par 6 — « sex » signifie six en latin.", test:isSexyPrime },
  { id:'harshad',     label:'Harshad',               emoji:'🎁', pts:4,  desc:"Divisible par la somme de ses propres chiffres. « Joie » en sanskrit.", test:isHarshad },
  { id:'semipremier', label:'Semi-premier',          emoji:'🔗', pts:0,  desc:"Produit de deux premiers, exactement. Toute la cryptographie tient là-dessus.", test:n=>factorize(n).length===2 },
  { id:'abondant',    label:'Abondant',              emoji:'🍇', pts:0,  desc:"Ses diviseurs propres dépassent sa propre valeur. Gourmand.", test:n=>n>0&&aliquot(n)>n },
  { id:'deficient',   label:'Déficient',             emoji:'🥀', pts:0,  desc:"Ses diviseurs propres ne suffisent pas à l'atteindre. La majorité silencieuse.", test:n=>n>0&&aliquot(n)<n },
  { id:'pair',        label:'Pair',                  emoji:'⚖️', pts:0,  desc:"Divisible par 2. Sans histoires.", test:n=>n%2===0 },
  { id:'impair',      label:'Impair',                emoji:'🧩', pts:0,  desc:"Non divisible par 2. Légèrement rebelle.", test:n=>n%2!==0 },
];
/* ============================================================
   SECOND CATALOGUE — les classes nommées qui manquaient.

   Aucune liste ne peut être exhaustive : l'OEIS recense quelque
   380 000 suites, et « propriété d'un entier » n'est pas une
   notion finie. Ce qui suit couvre les classes classiques,
   nommées, et calculables sous 99 999.
   ============================================================ */

/* ---------- premiers, suite ---------- */
const isSafePrime    = n => n >= 5 && isPrime(n) && (n - 1) % 2 === 0 && isPrime((n - 1) / 2);
const isCousinPrime  = n => isPrime(n) && (isPrime(n - 4) || isPrime(n + 4));
const isPythPrime    = n => isPrime(n) && n % 4 === 1;   // somme de deux carrés

function isLeftTruncatable(n) {          // 9137 → 137 → 37 → 7, tous premiers
  if (!isPrime(n) || n < 13 || String(n).includes('0')) return false;
  let s = String(n).slice(1);
  while (s.length) { if (!isPrime(+s)) return false; s = s.slice(1); }
  return true;
}

/* Toutes les permutations de ses chiffres sont premières. Le test est coûteux :
   on le réserve aux premiers, soit un nombre sur huit. */
function isPermutablePrime(n) {
  if (!isPrime(n) || n < 13) return false;
  const d = String(n).split('');
  if (d.length > 5) return false;
  const vus = new Set();
  const perm = (reste, acc) => {
    if (!reste.length) { vus.add(+acc); return; }
    for (let i = 0; i < reste.length; i++)
      perm(reste.slice(0, i).concat(reste.slice(i + 1)), acc + reste[i]);
  };
  perm(d, '');
  for (const v of vus) if (String(v).length === d.length && !isPrime(v)) return false;
  return true;
}

/* ---------- structure multiplicative ---------- */
const isSquarefree = n => n > 1 && factorPairs(n).every(([, e]) => e === 1);
const isPowerful   = n => n > 1 && factorPairs(n).every(([, e]) => e >= 2);
const isPerfectPower = n => {
  if (n < 4) return false;
  for (let k = 2; k <= 17; k++) { const r = Math.round(Math.pow(n, 1 / k)); if (r > 1 && Math.pow(r, k) === n) return true; }
  return false;
};
/* Puissant sans être une puissance parfaite : 72 = 2³ × 3², et pourtant 72
   n'est ni un carré, ni un cube, ni rien d'autre. */
const isAchilles = n => isPowerful(n) && !isPerfectPower(n);

/* Critère de Stewart : tout entier inférieur à n est somme de diviseurs
   distincts de n. Se teste sur la factorisation, sans énumérer les sommes. */
function isPractical(n) {
  if (n === 1) return true;
  if (n < 1 || n % 2 !== 0) return false;
  const f = factorPairs(n);
  let sigma = 1;
  for (let i = 0; i < f.length; i++) {
    const [p, e] = f[i];
    if (i > 0 && p > sigma + 1) return false;
    sigma *= (Math.pow(p, e + 1) - 1) / (p - 1);
  }
  return true;
}

/* ---------- figurés ---------- */
const isHexagonal = n => n > 0 && (1 + Math.sqrt(8 * n + 1)) % 4 === 0;
const suiteFigure = (f, max) => { const s = new Set(); for (let k = 1; ; k++) { const v = f(k); if (v > max) break; s.add(v); } return s; };
const TETRA    = suiteFigure(k => k * (k + 1) * (k + 2) / 6, NMAX);
const PYRAMIDE = suiteFigure(k => k * (k + 1) * (2 * k + 1) / 6, NMAX);

/* ---------- suites nommées ---------- */
const PELL    = S([1,2,5,12,29,70,169,408,985,2378,5741,13860,33461,80782]);
const MOTZKIN = S([1,2,4,9,21,51,127,323,835,2188,5798,15511,41835]);
const BELL    = S([1,2,5,15,52,203,877,4140,21147]);

/* ---------- pseudo-premiers & raretés ---------- */
const CARMICHAEL = S([561,1105,1729,2465,2821,6601,8911,10585,15841,29341,41041,46657,52633,62745,63973,75361]);
const WIEFERICH  = S([1093,3511]);
const IDONEAL    = S([1,2,3,4,5,6,7,8,9,10,12,13,15,16,18,21,22,24,25,28,30,33,37,40,42,45,48,57,58,60,70,72,78,85,88,93,102,105,112,120,130,133,165,168,177,190,210,232,240,253,273,280,312,330,345,357,385,408,462,520,760,840,1320,1365,1848]);

/* ---------- chiffres ---------- */
const isAutomorphe = n => n >= 1 && String(n * n).endsWith(String(n));
const isDudeney    = n => n >= 1 && Math.pow(digitSum(n), 3) === n;
const isMunchhausen = n => n >= 1 && digitsOf(n).reduce((a, d) => a + (d === 0 ? 0 : Math.pow(d, d)), 0) === n;

function isZuckerman(n) {                // divisible par le produit de ses chiffres
  if (n < 10) return false;
  const d = digitsOf(n);
  if (d.includes(0)) return false;
  const p = d.reduce((a, x) => a * x, 1);
  return n % p === 0;
}

function isOndulant(n) {                 // ababab…, deux chiffres qui alternent
  const s = String(n);
  if (s.length < 3 || s[0] === s[1]) return false;
  for (let i = 2; i < s.length; i++) if (s[i] !== s[i - 2]) return false;
  return true;
}

/* Aucun m ne vérifie m + somme de ses chiffres = n. La somme des chiffres d'un
   nombre à cinq chiffres plafonne à 45 : inutile de remonter plus loin. */
function isAutoNombre(n) {
  if (n < 1) return false;
  for (let m = Math.max(1, n - 50); m < n; m++) if (m + digitSum(m) === n) return false;
  return true;
}

/* Suite à la Fibonacci amorcée par ses propres chiffres, qui le retrouve. */
function isKeith(n) {
  if (n < 10) return false;
  const d = digitsOf(n), k = d.length;
  const suite = [...d];
  let v = 0;
  while (v < n) {
    v = suite.slice(-k).reduce((a, b) => a + b, 0);
    suite.push(v);
  }
  return v === n;
}

/* Crible de Josephus : on raye un élément sur deux, puis un sur trois parmi les
   survivants, et ainsi de suite. Ce qui reste est « chanceux ». */
let _lucky = null;
function luckySet() {
  if (_lucky) return _lucky;
  let l = [];
  for (let n = 1; n <= NMAX; n += 2) l.push(n);
  let i = 1;
  while (i < l.length && l[i] <= l.length) {
    const k = l[i];
    l = l.filter((_, idx) => (idx + 1) % k !== 0);
    i++;
  }
  _lucky = new Set(l);
  return _lucky;
}

/* ---------- les nouveaux traits ---------- */
TRAITS.push(
  { id:'wieferich',  label:'Premier de Wieferich',   emoji:'🛸', pts:18, desc:"Un premier p tel que p² divise 2^(p−1) − 1. On n'en connaît que deux sous 10^17, et l'on ignore s'il en existe une infinité.", test:n=>WIEFERICH.has(n) },
  { id:'munchhausen',label:'Münchhausen',            emoji:'🎩', pts:18, desc:"Égal à la somme de ses chiffres élevés à eux-mêmes. Comme le baron, il se soulève par ses propres bottes. Il n'en existe que deux.", test:isMunchhausen },
  { id:'lychrel',    label:'Candidat de Lychrel',    emoji:'🔂', pts:20, desc:"Ajoutez-lui son miroir, recommencez : tout le monde finit palindrome, sauf lui. Plus d'un milliard d'itérations n'ont rien donné, et personne n'a su le démontrer.", test:n=>n===196 },
  { id:'carmichael', label:'Carmichael',             emoji:'🎭', pts:16, desc:"Composé, mais il réussit le test de primalité de Fermat pour toute base. Un menteur absolu — 1729 en fait partie.", test:n=>CARMICHAEL.has(n) },
  { id:'automorphe', label:'Automorphe',             emoji:'🪆', pts:15, desc:"Son carré se termine par lui-même. 76² = 5776.", test:isAutomorphe },
  { id:'dudeney',    label:'Dudeney',                emoji:'🧩', pts:17, desc:"Cube de la somme de ses propres chiffres. Six exemplaires connus, tous sous 20 000.", test:isDudeney },
  { id:'keith',      label:'Keith',                  emoji:'🪜', pts:14,  desc:"Amorcez une suite de Fibonacci avec ses chiffres : elle retombe exactement sur lui.", test:isKeith },
  { id:'idoneal',    label:"Idoine d'Euler",         emoji:'🗝️', pts:11,  desc:"Euler s'en servait pour repérer les grands premiers. Il en a trouvé 65 et personne n'en a jamais trouvé un 66ᵉ.", test:n=>IDONEAL.has(n) },
  { id:'achille',    label:'Achille',                emoji:'🦶', pts:11,  desc:"Puissant sans être une puissance : chaque facteur premier y est au carré au moins, et pourtant il n'est ni carré, ni cube, ni rien. Fort mais vulnérable.", test:isAchilles },
  { id:'permutable', label:'Premier permutable',     emoji:'🔀', pts:14,  desc:"Toutes les permutations de ses chiffres sont premières. 337, 373, 733 : tous premiers.", test:isPermutablePrime },
  { id:'bell',       label:'Bell',                   emoji:'🔔', pts:15,  desc:"Compte les façons de partitionner un ensemble. 5 objets se rangent de 52 manières.", test:n=>BELL.has(n) },
  { id:'motzkin',    label:'Motzkin',                emoji:'🎪', pts:15,  desc:"Compte les façons de relier des points sur un cercle par des cordes qui ne se croisent pas. Le cousin discret de Catalan.", test:n=>MOTZKIN.has(n) },
  { id:'gauche',     label:'Tronquable à gauche',    emoji:'🪓', pts:9,  desc:"Reste premier quand on lui arrache ses chiffres de gauche, un par un.", test:isLeftTruncatable },
  { id:'pell',       label:'Pell',                   emoji:'⛵', pts:15,  desc:"Chaque terme vaut deux fois le précédent plus celui d'avant. Ses rapports approchent la racine de deux.", test:n=>PELL.has(n) },
  { id:'pyramidal',  label:'Pyramidal carré',        emoji:'🗿', pts:13,  desc:"Un empilement de carrés. 4900 est le seul, hormis 1, à être lui-même un carré — le fameux problème des boulets de canon.", test:n=>PYRAMIDE.has(n) },
  { id:'tetraedrique',label:'Tétraédrique',          emoji:'🔻', pts:12,  desc:"Un empilement de triangles. La version en volume des nombres triangulaires.", test:n=>TETRA.has(n) },
  { id:'puissant',   label:'Puissant',               emoji:'💪', pts:9,  desc:"Si un premier le divise, son carré le divise aussi. Aucun facteur ne s'y promène seul.", test:isPowerful },
  { id:'chanceux',   label:'Chanceux',               emoji:'🍀', pts:5,  desc:"Survivant d'un crible qui raye un nombre sur deux, puis un sur trois, et ainsi de suite. Il en reste à peu près autant que de premiers.", test:n=>luckySet().has(n) },
  { id:'pratique',   label:'Pratique',               emoji:'🧰', pts:4,  desc:"Tout entier plus petit que lui s'écrit comme une somme de ses diviseurs. Fibonacci s'en servait pour décomposer les fractions.", test:isPractical },
  { id:'ondulant',   label:'Ondulant',               emoji:'〰️', pts:9,  desc:"Deux chiffres qui alternent sans fin. 1717, 2020, 45454.", test:isOndulant },
  { id:'hexagonal',  label:'Hexagonal',              emoji:'🔶', pts:11,  desc:"On peut l'empiler en hexagone. Tout hexagonal est aussi triangulaire.", test:isHexagonal },
  { id:'sur',        label:'Premier sûr',            emoji:'🛡️', pts:10,  desc:"Un premier p tel que (p−1)/2 soit premier aussi. Le miroir de Sophie Germain, et la clé de voûte de la cryptographie Diffie-Hellman.", test:isSafePrime },
  { id:'autonombre', label:'Auto-nombre',            emoji:'🪞', pts:5,  desc:"Aucun nombre, augmenté de la somme de ses chiffres, ne le produit. Il n'a pas de générateur : il ne descend de personne.", test:isAutoNombre },
  { id:'zuckerman',  label:'Zuckerman',              emoji:'✖️', pts:11,  desc:"Divisible par le produit de ses propres chiffres.", test:isZuckerman },
  { id:'cousin',     label:'Premier cousin',         emoji:'👪', pts:7,  desc:"Un premier à distance 4 d'un autre premier. Entre les jumeaux (2) et les sexy (6), il fallait bien quelqu'un.", test:isCousinPrime },
  { id:'pythagore',  label:'Premier de Pythagore',   emoji:'📐', pts:6,  desc:"Un premier de la forme 4k+1. Fermat a montré qu'ils sont exactement ceux qui s'écrivent comme somme de deux carrés.", test:isPythPrime },
  { id:'sansCarre',  label:'Sans facteur carré',     emoji:'🧼', pts:0,  desc:"Aucun carré ne le divise. Trois nombres sur cinq sont dans ce cas.", test:isSquarefree },
);

/* Le catalogue reste trié du plus précieux au plus banal. */
TRAITS.sort((a, b) => b.pts - a.pts);

const NIVEAUX_SUP = {
  ondulant:2, sansCarre:2,
  hexagonal:3, sur:3, autonombre:3, zuckerman:3, cousin:3, pythagore:3,
  pell:3, pyramidal:3, tetraedrique:3, puissant:3, chanceux:3, pratique:3,
  gauche:4, motzkin:4, bell:4, permutable:4, achille:4, idoneal:4,
  keith:4, dudeney:4, automorphe:4, carmichael:4, lychrel:4, munchhausen:4, wieferich:4,
};

const TRAIT_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));

/* Difficulté de reconnaissance, pour le mode Révision. Elle n'a rien à voir
   avec la rareté : « pair » ne vaut aucun point mais se repère au premier
   coup d'œil, tandis que « Harshad » en vaut un seul et demande un calcul. */
const NIVEAUX = {
  pair:1, impair:1, premier:1, carre:1, palindrome:1, repdigit:1, pow2:1, cube:1,
  triangle:2, fibo:2, semipremier:2, harshad:2, heureux:2, hcn:2, factorielle:2, deficient:2, abondant:2,
  spheniq:3, lucas:3, pentagonal:3, jumeau:3, sexy:3, sophie:3, emirp:3, smith:3, catalan:3, primorielle:3, kaprekar:3,
  parfait:4, mersenne:4, fermat:4, armstrong:4, vampire:4, bizarre:4, amical:4, tronquable:4, taxicab:4, kaprekarC:4,
};
Object.assign(NIVEAUX, NIVEAUX_SUP);
TRAITS.forEach(t => t.niveau = NIVEAUX[t.id] || 3);

/* ============================================================
   DÉMONSTRATIONS — pourquoi CE nombre porte CE trait.
   Chaque entrée renvoie soit une chaîne (un calcul posé, rendu en
   chasse fixe), soit { note } quand aucun calcul n'a de sens et
   qu'une phrase vaut mieux.
   Elles sont appelées à l'affichage seulement, jamais pendant
   l'évaluation des 10 000 nombres du vivier.
   ============================================================ */

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = k => String(k).split('').map(d => SUP[+d]).join('');
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = k => String(k).split('').map(d => SUB[+d]).join('');

function properDivisors(n) {
  const out = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i !== 0) continue;
    if (i < n) out.push(i);
    const j = n / i;
    if (j !== i && j < n) out.push(j);
  }
  return out.sort((a, b) => a - b);
}

/* Une somme lisible, tronquée quand les diviseurs sont trop nombreux. */
function sumLine(ds, max = 8) {
  if (!ds.length) return '0';
  if (ds.length <= max) return ds.join(' + ');
  return ds.slice(0, max).join(' + ') + ` + … (${ds.length} termes)`;
}

const happyChain = n => { const c = [n], seen = new Set(); let x = n;
  while (x !== 1 && !seen.has(x)) { seen.add(x); x = digitsOf(x).reduce((a, d) => a + d * d, 0); c.push(x); } return c; };

const truncChain = n => { const c = [n]; let x = Math.floor(n / 10);
  while (x > 0) { c.push(x); x = Math.floor(x / 10); } return c; };

const kaprekarSplit = n => {
  const s = String(n * n);
  for (let i = 1; i < s.length; i++) {
    const l = +s.slice(0, i), r = +s.slice(i);
    if (r > 0 && l + r === n) return [s, l, r];
  }
  return null;
};

/* Les sept vampires à quatre chiffres et leurs crocs. */
const CROCS = { 1260:'21 × 60', 1395:'15 × 93', 1435:'35 × 41', 1530:'30 × 51', 1827:'21 × 87', 2187:'27 × 81', 6880:'80 × 86' };

const PROOFS = {
  culte:      () => ({ note: "Aucune démonstration : ce trait ne vient pas des mathématiques, mais de la culture. Il ne se prouve pas, il se reconnaît." }),

  parfait:    n => `${n} = ${sumLine(properDivisors(n))}`,
  taxicab:    () => `1729 = 1³ + 12³ = 9³ + 10³`,
  kaprekarC:  () => `7641 − 1467 = 6174 (chiffres triés en décroissant moins croissant : 6174 se redonne lui-même)`,

  fermat:     n => { const m = Math.round(Math.log2(n - 1)); return `${n} = 2${sup(m)} + 1, et ${m} = 2${sup(Math.round(Math.log2(m)))}`; },
  armstrong:  n => { const d = digitsOf(n), k = d.length; return `${n} = ${d.map(x => `${x}${sup(k)}`).join(' + ')}`; },
  vampire:    n => `${n} = ${CROCS[n]} — les chiffres des deux facteurs sont exactement ceux de ${n}`,
  bizarre:    n => { const d = properDivisors(n); return { note: `Ses diviseurs propres totalisent ${d.reduce((a, b) => a + b, 0)}, donc plus que ${n} — pourtant aucune de leurs combinaisons ne fait exactement ${n}.` }; },
  mersenne:   n => `${n} = 2${sup(Math.round(Math.log2(n + 1)))} − 1, et ${Math.round(Math.log2(n + 1))} est premier`,
  amical:     n => { const s = aliquot(n); return `diviseurs propres de ${n} → ${s}, et diviseurs propres de ${s} → ${n}`; },
  primorielle: n => `${n} = ${[...new Set(factorize(n))].join(' × ')} (tous les premiers jusqu'à ${Math.max(...factorize(n))})`,
  hcn:        n => ({ note: `${n} possède ${divisorCount(n)} diviseurs. Aucun entier plus petit que lui n'en a autant.` }),
  catalan:    n => `${n} = C${sub(CATALAN_SEQ.indexOf(n))}`,
  factorielle: n => { let k = 1, f = 1; while (f < n) { k++; f *= k; } return `${n} = ${k}! = ${Array.from({ length: k }, (_, i) => i + 1).join(' × ')}`; },
  kaprekar:   n => { const s = kaprekarSplit(n); return s ? `${n}² = ${s[0]}, et ${s[1]} + ${s[2]} = ${n}` : `${n}² = ${n * n}`; },
  tronquable: n => `${truncChain(n).join(' → ')} — tous premiers`,
  pow2:       n => `${n} = 2${sup(Math.round(Math.log2(n)))}`,
  fibo:       n => { const i = FIB_SEQ.indexOf(n); return i >= 2 ? `${n} = ${FIB_SEQ[i - 2]} + ${FIB_SEQ[i - 1]}` : { note: "Terme initial de la suite : il n'a rien derrière lui." }; },
  cube:       n => `${n} = ${Math.round(Math.cbrt(n))}³`,
  repdigit:   n => ({ note: `Le chiffre ${String(n)[0]} répété ${String(n).length} fois.` }),
  emirp:      n => `${n} et ${reverseNum(n)} sont premiers tous les deux`,
  premier:    n => ({ note: `${n} n'est divisible que par 1 et par ${n}. Rien d'autre ne le découpe.` }),
  carre:      n => `${n} = ${Math.sqrt(n)}²`,
  palindrome: n => ({ note: `${n} se lit ${n} dans l'autre sens.` }),
  lucas:      n => { const i = LUCAS_SEQ.indexOf(n); return i >= 2 ? `${n} = ${LUCAS_SEQ[i - 2]} + ${LUCAS_SEQ[i - 1]}` : { note: "Terme initial de la suite (elle démarre sur 2, 1)." }; },
  smith:      n => { const f = factorize(n);
                     const dev = f.map(p => p < 10 ? String(p) : `(${digitsOf(p).join(' + ')})`).join(' + ');
                     return `${digitsOf(n).join(' + ')} = ${digitSum(n)} — et ${n} = ${f.join(' × ')}, dont les chiffres font ${dev} = ${digitSum(n)}`; },
  sophie:     n => `${n} est premier, et 2 × ${n} + 1 = ${2 * n + 1} l'est aussi`,
  triangle:   n => { const k = (Math.sqrt(8 * n + 1) - 1) / 2;
                     return `${n} = ${k <= 5 ? Array.from({ length: k }, (_, i) => i + 1).join(' + ') : `1 + 2 + … + ${k}`}`; },
  pentagonal: n => { const k = (1 + Math.sqrt(24 * n + 1)) / 6; return `${n} = ${k} × (3 × ${k} − 1) / 2`; },
  heureux:    n => `${happyChain(n).join(' → ')} (somme des carrés des chiffres, jusqu'à tomber sur 1)`,
  spheniq:    n => `${n} = ${factorize(n).join(' × ')} — trois premiers, tous différents`,
  jumeau:     n => `${isPrime(n - 2) ? `${n - 2} et ${n}` : `${n} et ${n + 2}`} sont premiers, à 2 d'écart`,
  sexy:       n => `${isPrime(n - 6) ? `${n - 6} et ${n}` : `${n} et ${n + 6}`} sont premiers, à 6 d'écart`,
  harshad:    n => n < 10
                ? ({ note: `À un seul chiffre, la somme vaut le nombre lui-même : ${n} se divise par ${n}. Tous les chiffres sont Harshad, c'est le seul cas gratuit.` })
                : `${digitsOf(n).join(' + ')} = ${digitSum(n)}, et ${n} = ${digitSum(n)} × ${n / digitSum(n)}`,
  semipremier: n => `${n} = ${factorize(n).join(' × ')}`,
  abondant:   n => { const d = properDivisors(n); return `${sumLine(d)} = ${d.reduce((a, b) => a + b, 0)} > ${n}`; },
  deficient:  n => { const d = properDivisors(n);
                     if (d.length === 1) return { note: `Un premier n'a qu'un seul diviseur propre — 1 — et 1 est très loin de ${n}. Les premiers sont les plus déficients de tous.` };
                     return `${sumLine(d)} = ${d.reduce((a, b) => a + b, 0)} < ${n}`; },
  pair:       n => `${n} = 2 × ${n / 2}`,
  impair:     n => `${n} = 2 × ${(n - 1) / 2} + 1 — il reste toujours 1`,
};

/* Démonstrations du second catalogue. */
const PROOFS_SUP = {
  wieferich:  n => ({ note: `${n} est premier, et ${n}² divise 2^(${n}−1) − 1. Seuls 1093 et 3511 réussissent cela sous 10¹⁷.` }),
  munchhausen: n => `${n} = ${digitsOf(n).map(d => d === 0 ? '0' : `${d}${sup(d)}`).join(' + ')}`,
  lychrel:    () => `196 → 887 → 1675 → 7436 → 13783 → … : plus d'un milliard d'étapes, toujours pas de palindrome`,
  carmichael: n => ({ note: `${n} = ${factorize(n).join(' × ')} — composé, et pourtant a^${n} ≡ a pour tout a. Un faux premier parfait.` }),
  automorphe: n => `${n}² = ${n * n}, qui se termine par ${n}`,
  dudeney:    n => `${digitsOf(n).join(' + ')} = ${digitSum(n)}, et ${digitSum(n)}³ = ${n}`,
  keith:      n => {
    const d = digitsOf(n), k = d.length, s = [...d];
    let v = 0;
    while (v < n) { v = s.slice(-k).reduce((a, b) => a + b, 0); s.push(v); }
    return `${s.join(' → ')} — la suite part de ses chiffres et retombe sur ${n}`;
  },
  idoneal:    n => ({ note: `${n} fait partie des 65 nombres idoines d'Euler. Il n'y en a probablement pas d'autre, mais nul ne l'a démontré.` }),
  achille:    n => `${n} = ${factorPairs(n).map(([p, e]) => `${p}${sup(e)}`).join(' × ')} — tous les exposants valent 2 ou plus, et pourtant ${n} n'est aucune puissance exacte`,
  permutable: n => {
    const d = String(n).split(''), vus = new Set();
    const perm = (r, a) => { if (!r.length) { vus.add(+a); return; } for (let i = 0; i < r.length; i++) perm(r.slice(0, i).concat(r.slice(i + 1)), a + r[i]); };
    perm(d, '');
    const l = [...vus].sort((a, b) => a - b);
    return `${l.slice(0, 8).join(', ')}${l.length > 8 ? '…' : ''} — toutes premières`;
  },
  bell:       n => ({ note: `${n} compte les façons de répartir ${BELL_INDEX[n] ?? '?'} objets en groupes, sans en laisser aucun dehors.` }),
  motzkin:    n => ({ note: `${n} compte les façons de tracer des cordes qui ne se croisent pas entre des points d'un cercle.` }),
  gauche:     n => { const c = [String(n)]; let s = String(n).slice(1); while (s.length) { c.push(s); s = s.slice(1); } return `${c.join(' → ')} — tous premiers`; },
  pell:       n => { const i = PELL_SEQ.indexOf(n); return i >= 2 ? `${n} = 2 × ${PELL_SEQ[i - 1]} + ${PELL_SEQ[i - 2]}` : { note: "Terme initial de la suite." }; },
  pyramidal:  n => { let k = 1; while (k * (k + 1) * (2 * k + 1) / 6 < n) k++; return `${n} = 1² + 2² + … + ${k}²`; },
  tetraedrique: n => { let k = 1; while (k * (k + 1) * (k + 2) / 6 < n) k++; return `${n} = 1 + 3 + 6 + … (${k} étages triangulaires)`; },
  puissant:   n => `${n} = ${factorPairs(n).map(([p, e]) => `${p}${sup(e)}`).join(' × ')} — aucun exposant ne vaut 1`,
  chanceux:   n => ({ note: `${n} a survécu au crible : on raye un nombre sur deux, puis un sur trois parmi les restants, puis un sur sept, et ainsi de suite.` }),
  pratique:   n => ({ note: `Tout entier de 1 à ${n - 1} s'écrit comme une somme de diviseurs distincts de ${n}, qui en compte ${divisorCount(n)}.` }),
  ondulant:   n => ({ note: `${String(n)[0]} et ${String(n)[1]} alternent sur ${String(n).length} chiffres.` }),
  hexagonal:  n => { const k = (1 + Math.sqrt(8 * n + 1)) / 4; return `${n} = ${k} × (2 × ${k} − 1)`; },
  sur:        n => `${n} est premier, et (${n} − 1) / 2 = ${(n - 1) / 2} l'est aussi`,
  autonombre: n => ({ note: `Aucun entier augmenté de la somme de ses chiffres ne donne ${n} : il n'a pas de générateur.` }),
  zuckerman:  n => `${digitsOf(n).join(' × ')} = ${digitsOf(n).reduce((a, x) => a * x, 1)}, et ${n} = ${digitsOf(n).reduce((a, x) => a * x, 1)} × ${n / digitsOf(n).reduce((a, x) => a * x, 1)}`,
  cousin:     n => `${isPrime(n - 4) ? `${n - 4} et ${n}` : `${n} et ${n + 4}`} sont premiers, à 4 d'écart`,
  pythagore:  n => `${n} = 4 × ${(n - 1) / 4} + 1, et ${n} = ${sommeDeuxCarres(n)}`,
  sansCarre:  n => `${n} = ${factorize(n).join(' × ')} — aucun facteur répété`,
};

const PELL_SEQ = [1,2,5,12,29,70,169,408,985,2378,5741,13860,33461,80782];
const BELL_INDEX = {1:1, 2:2, 5:3, 15:4, 52:5, 203:6, 877:7, 4140:8, 21147:9};

/* Tout premier 4k+1 est somme de deux carrés, d'une seule façon (Fermat). */
function sommeDeuxCarres(n) {
  for (let a = 1; a * a * 2 <= n; a++) {
    const b = Math.sqrt(n - a * a);
    if (Number.isInteger(b)) return `${a}² + ${b}²`;
  }
  return '…';
}

Object.assign(PROOFS, PROOFS_SUP);
TRAITS.forEach(t => t.proof = PROOFS[t.id]);

/* Pour le Codex : le plus petit nombre qui illustre chaque trait. */
function computeTraitExamples() {
  for (const t of TRAITS) {
    for (let n = 2; n <= 9999; n++) if (t.test(n)) { t.example = n; break; }
  }
}

/* ---------- paliers de rareté ----------
   Les seuils sont recalibrés sur la distribution réelle des scores : passer de
   38 à 65 traits enrichissait mécaniquement tout le monde, et le palier Commun
   s'était vidé de deux mille nombres.
   forgeMult : la Forge facture ce qu'elle produit, pas l'effort fourni.
   Fabriquer un Mythique coûte soixante fois le prix d'un Commun. */
const RARITIES = [
  { key:'commun',    label:'Commun',     min:0,  color:'#8a93a6', idx:0, coin:1,   dust:1,   forgeMult:1 },
  { key:'peucommun', label:'Peu commun', min:5,  color:'#4ec97a', idx:1, coin:3,   dust:3,   forgeMult:1.5 },
  { key:'rare',      label:'Rare',       min:12,  color:'#4aa3ff', idx:2, coin:9,   dust:8,   forgeMult:3 },
  { key:'epique',    label:'Épique',     min:17, color:'#b567ff', idx:3, coin:26,  dust:22,  forgeMult:8 },
  { key:'legendaire',label:'Légendaire', min:23, color:'#ffb02e', idx:4, coin:70,  dust:60,  forgeMult:25 },
  { key:'mythique',  label:'Mythique',   min:30, color:'#ff4d6d', idx:5, coin:190, dust:160, forgeMult:60 },
];
const RARITY_BY_KEY = Object.fromEntries(RARITIES.map(r => [r.key, r]));
const rarityFromScore = s => [...RARITIES].reverse().find(r => s >= r.min);

/* ---------- évaluation complète ---------- */
function factorString(n) {
  if (n < 2) return String(n);
  if (isPrime(n)) return `${n} · premier`;
  return factorPairs(n).map(([p, e]) => e > 1 ? `${p}^${e}` : `${p}`).join(' × ');
}

const _evalCache = new Map();
function evaluate(n) {
  const hit = _evalCache.get(n);
  if (hit) return hit;

  const traits = [];
  const culte = CULTE[n];
  if (culte) traits.push({ id:'culte', label:culte.nom, emoji:culte.emoji, pts:culte.pts, desc:culte.desc, culte:true, proof:PROOFS.culte });

  for (const t of TRAITS) {
    let ok = false;
    try { ok = t.test(n); } catch { ok = false; }
    // `proof` n'est qu'une référence de fonction : elle n'est exécutée qu'au rendu.
    if (ok) traits.push({ id:t.id, label:t.label, emoji:t.emoji, pts:t.pts, desc:t.desc, proof:t.proof });
  }

  /* Rendements décroissants. En additionnant bêtement, les tout petits nombres
     écraseraient tout : 1 ouvre Fibonacci ET Catalan ET les factorielles ET
     Kaprekar ET les puissances de 2 à lui seul. Seul le trait dominant compte
     pleinement ; les suivants n'ajoutent qu'un vernis. */
  const W = [1, 0.5, 0.3, 0.15];
  const score = Math.round(
    [...traits].sort((a, b) => b.pts - a.pts)
               .reduce((acc, t, i) => acc + t.pts * (W[i] ?? 0.08), 0)
  );

  /* Affichage : le surnom culte d'abord, puis du plus précieux au plus banal. */
  traits.sort((a, b) => (b.culte ? 1 : 0) - (a.culte ? 1 : 0) || b.pts - a.pts);

  const res = {
    n, traits, score,
    rarity:   rarityFromScore(score),
    nickname: culte ? culte.nom : null,
    factors:  factorString(n),
    divisors: divisorCount(n),
  };
  _evalCache.set(n, res);
  return res;
}
