/* ============================================================
   LE COMPTOIR — CE QUI N'EST VRAI QU'EN BASE DIX

   LA LEÇON, ET ELLE EST DÉRANGEANTE. Le jeu reconnaît soixante-six traits.
   Dix-neuf d'entre eux — près d'un tiers — ne parlent pas du nombre : ils
   parlent de la façon dont on l'écrit. 121 est un palindrome parce qu'on
   l'écrit « 121 » ; en base 3 il s'écrit 11111, ce qui est encore un
   palindrome, mais en base 4 il s'écrit 1301, et il n'en est plus un. Rien
   n'a changé dans le nombre. Tout a changé dans le regard.

   Un joueur qui collectionne des palindromes sans savoir ça collectionne une
   habitude d'écriture en croyant collectionner une propriété. Le Comptoir est
   l'endroit où on le lui dit — et où il peut le vérifier lui-même, sur ses
   propres nombres, en changeant la base sous ses yeux.

   POURQUOI UN COMPTOIR DE CHANGE. La même valeur, écrite autrement : c'est
   littéralement le métier. Et c'est historiquement le bon lieu — la notation
   de position arrive en Europe par les marchands, avec le Liber Abaci de
   Fibonacci (1202), et la bagarre entre abacistes et algoristes se joue dans
   les comptoirs des villes italiennes, pas dans les universités.

   CE QU'ON N'Y FAIT PAS. On n'y gagne pas de nombres, pas de jetons, pas de
   poussière. Le Comptoir ne distribue rien : il montre. Un lieu dont la seule
   récompense est de comprendre quelque chose est le seul luxe qu'un jeu
   pédagogique doive se permettre.
   ============================================================ */

/* Les traits qui ne tiennent qu'à l'écriture décimale. La liste est écrite à
   la main parce que c'est un JUGEMENT, pas un calcul : « palindrome » dépend
   de la base, « premier » non, et aucune propriété du code ne distingue les
   deux. `outils/verifier_salles.py` vérifie que chaque identifiant existe
   bien dans le moteur — une liste qui pointerait à côté ne se verrait pas. */
const TRAITS_ECRITURE = [
  'palindrome', 'repdigit', 'ondulant', 'armstrong', 'harshad', 'automorphe',
  'dudeney', 'keith', 'zuckerman', 'munchhausen', 'emirp', 'permutable',
  'tronquable', 'lychrel', 'smith', 'autonombre', 'vampire', 'kaprekar',
  'kaprekarC',
];
const EST_ECRITURE = new Set(TRAITS_ECRITURE);

/* Combien le joueur en possède — pour la jauge du plan. */
function traitsDEcriturePossedes() {
  if (typeof state === 'undefined' || !state.owned) return 0;
  const vus = new Set();
  for (const k of Object.keys(state.owned)) {
    const n = +k;
    for (const t of evaluate(n).traits) if (EST_ECRITURE.has(t.id)) vus.add(t.id);
  }
  return vus.size;
}

/* ---------- l'écriture dans une base ---------- */
const CHIFFRES = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function enBase(n, b) {
  if (n === 0) return '0';
  let s = '';
  let v = Math.abs(n);
  while (v > 0) { s = CHIFFRES[v % b] + s; v = Math.floor(v / b); }
  return s;
}

const estPalindrome = (s) => s === s.split('').reverse().join('');
const estRepdigit = (s) => s.length > 1 && new Set(s).size === 1;
/* Ondulant : les chiffres alternent, ababab… et pas tous égaux. */
function estOndulant(s) {
  if (s.length < 3 || new Set(s).size !== 2) return false;
  for (let i = 2; i < s.length; i++) if (s[i] !== s[i - 2]) return false;
  return true;
}
/* Harshad : divisible par la somme de ses chiffres — dans CETTE base. */
function estHarshad(n, b) {
  const som = enBase(n, b).split('')
    .reduce((a, c) => a + CHIFFRES.indexOf(c), 0);
  return som > 0 && n % som === 0;
}

/* Les quatre propriétés qu'on sait recalculer dans n'importe quelle base.
   On ne prétend pas couvrir les dix-neuf : un nombre de Keith ou un vampire
   demanderaient un vrai portage, et une case fausse serait pire qu'une case
   absente. Celles-ci suffisent à faire tomber la leçon. */
const EPREUVES = [
  { id: 'palindrome', nom: 'palindrome', test: (n, b) => estPalindrome(enBase(n, b)) },
  { id: 'repdigit', nom: 'repdigit', test: (n, b) => estRepdigit(enBase(n, b)) },
  { id: 'ondulant', nom: 'ondulant', test: (n, b) => estOndulant(enBase(n, b)) },
  { id: 'harshad', nom: 'harshad', test: (n, b) => estHarshad(n, b) },
];

/* Les bases proposées. Douze est là exprès : c'est celle que les partisans du
   système duodécimal réclament depuis trois siècles, et elle donne des
   résultats très différents de dix sur les mêmes nombres. */
const BASES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 60];

/* ---------- l'état de la vue ---------- */
let _cpNombre = null;      // le nombre au comptoir
let _cpBase = 2;           // la base de comparaison

/* Un nombre par défaut qui a quelque chose à dire : on cherche dans l'herbier
   le premier qui porte un trait d'écriture. À défaut, le plus petit possédé. */
function nombreParDefaut() {
  const cles = Object.keys(state.owned || {}).map(Number).sort((a, b) => a - b);
  for (const n of cles) {
    if (evaluate(n).traits.some(t => EST_ECRITURE.has(t.id))) return n;
  }
  return cles.length ? cles[0] : 121;
}

function comptoirPoser(n) {
  const v = Math.max(0, Math.min(99999, Math.floor(+n || 0)));
  _cpNombre = v;
  renderComptoir();
}
function comptoirBase(b) { _cpBase = +b; renderComptoir(); }

function renderComptoir() {
  const zone = document.querySelector('#cpZone');
  if (!zone) return;
  if (_cpNombre === null) _cpNombre = nombreParDefaut();
  const n = _cpNombre;

  /* ---- la table de change ---- */
  const lignes = BASES.map(b => {
    const ecrit = enBase(n, b);
    const gagne = EPREUVES.filter(e => e.test(n, b));
    return `<tr class="${b === 10 ? 'dix' : ''}${b === _cpBase ? ' vise' : ''}">
      <td class="cpBase">base ${b}</td>
      <td class="cpEcrit">${ecrit}</td>
      <td class="cpChiffres">${ecrit.length} chiffre${ecrit.length > 1 ? 's' : ''}</td>
      <td class="cpTraits">${gagne.length
        ? gagne.map(e => `<span class="cpTrait">${e.nom}</span>`).join('')
        : '<span class="cpRien">—</span>'}</td>
    </tr>`;
  }).join('');

  /* ---- le verdict ---- */
  const en10 = EPREUVES.filter(e => e.test(n, 10)).map(e => e.nom);
  const ailleurs = BASES.filter(b => b !== 10 && EPREUVES.some(e => e.test(n, b)));
  let verdict;
  if (!en10.length && !ailleurs.length) {
    verdict = `<b>${fmt(n)}</b> n'est remarquable dans aucune des bases essayées.
      C'est le cas le plus fréquent, et il vaut d'être vu : la plupart des nombres
      ne doivent leur silence à personne.`;
  } else if (!en10.length) {
    verdict = `<b>${fmt(n)}</b> n'a rien de remarquable en base dix — mais il est
      ${EPREUVES.filter(e => e.test(n, ailleurs[0])).map(e => e.nom).join(' et ')}
      en base ${ailleurs[0]}. Le Codex ne le dira jamais : il ne sait compter que
      sur dix doigts.`;
  } else if (!ailleurs.length) {
    verdict = `<b>${fmt(n)}</b> est ${en10.join(' et ')} <b>en base dix, et nulle part
      ailleurs</b>. Cette propriété ne dit rien de lui : elle dit que nous avons
      dix doigts.`;
  } else {
    verdict = `<b>${fmt(n)}</b> est ${en10.join(' et ')} en base dix, et garde
      quelque chose dans ${ailleurs.length} autre${ailleurs.length > 1 ? 's' : ''}
      base${ailleurs.length > 1 ? 's' : ''} : ${ailleurs.join(', ')}. Une propriété
      qui survit au change en dit un peu plus long qu'une autre — mais elle reste
      une propriété de l'écriture.`;
  }

  /* ---- l'inventaire du joueur ---- */
  const vus = new Set();
  for (const k of Object.keys(state.owned || {})) {
    for (const t of evaluate(+k).traits) if (EST_ECRITURE.has(t.id)) vus.add(t.id);
  }
  const inventaire = TRAITS_ECRITURE.map(id => {
    const t = TRAITS.find(x => x.id === id);
    return `<span class="cpJeton${vus.has(id) ? ' eu' : ''}">${t ? t.label : id}</span>`;
  }).join('');

  zone.innerHTML = `
    <div class="cpBarre">
      <label for="cpIn">Un nombre à changer</label>
      <input type="number" id="cpIn" min="0" max="99999" inputmode="numeric" value="${n}">
      <button class="btn sm" id="cpAller" type="button">Changer</button>
      <span class="cpEspace"></span>
      <button class="btn ghost sm" id="cpHasard" type="button">Au hasard, dans mon herbier</button>
    </div>

    <p class="cpVerdict">${verdict}</p>

    <div class="cpTableCadre">
      <table class="cpTable">
        <thead><tr><th>Base</th><th>Écriture</th><th></th><th>Ce qu'il devient</th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>
    </div>

    <div class="cpBloc">
      <h3 class="cpTitre">Les ${TRAITS_ECRITURE.length} traits qui n'existent qu'en base dix
        <i>${vus.size} / ${TRAITS_ECRITURE.length} dans votre herbier</i></h3>
      <p class="cpNote">Sur les ${TRAITS.length} traits que reconnaît la Cité, ceux-ci
         ne décrivent pas le nombre : ils décrivent son écriture décimale. Ils comptent
         quand même pour la rareté — un nombre qui les porte est bel et bien rare parmi
         les nombres écrits en base dix, et c'est la seule base où vous les lisez.</p>
      <div class="cpJetons">${inventaire}</div>
    </div>`;

  const champ = zone.querySelector('#cpIn');
  const aller = () => comptoirPoser(champ.value);
  zone.querySelector('#cpAller').addEventListener('click', aller);
  champ.addEventListener('keydown', e => { if (e.key === 'Enter') aller(); });
  zone.querySelector('#cpHasard').addEventListener('click', () => {
    const cles = Object.keys(state.owned || {});
    if (!cles.length) return toast("Votre herbier est vide : allez pêcher d'abord.", 'bad');
    comptoirPoser(cles[Math.floor(Math.random() * cles.length)]);
  });
  zone.querySelectorAll('.cpTable tbody tr').forEach((tr, i) =>
    tr.addEventListener('click', () => comptoirBase(BASES[i])));
}
