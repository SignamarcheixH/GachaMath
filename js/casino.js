/* ============================================================
   LE CASINO — LES PROBABILITÉS, LÀ OÙ ELLES SONT NÉES

   L'HISTOIRE EST VRAIE, ET ELLE COMMENCE PAR UNE PERTE D'ARGENT. Antoine
   Gombaud, chevalier de Méré, joueur, écrit à Pascal en 1654 : comment
   partager équitablement les mises d'une partie interrompue ? Pascal écrit à
   Fermat, ils échangent six lettres, et la théorie des probabilités existe.
   Avant eux, Cardan avait rédigé le « Liber de ludo aleae » — un manuel de
   joueur qui est le premier texte probabiliste connu, publié un siècle après
   sa mort. La maison de jeu n'est pas un décor plaqué sur les mathématiques :
   c'est le lieu où elles sont nées.

   ON N'Y GAGNE JAMAIS DE NOMBRES. C'est la règle du lieu, et elle n'est pas
   négociable. Toute la Cité repose sur une phrase — la rareté se démontre,
   elle ne se décrète pas. Une salle où l'on miserait pour obtenir un tirage
   vendrait cette phrase pour une mécanique. On y gagne autre chose, et c'est
   plus rare dans un gacha : LE JEU Y MONTRE SES PROPRES CHANCES. Les taux
   réels, les garanties, l'espérance. Aucun autre écran ne les donne.

   CE QU'IL RÉPARE. Huit traits du jeu — Catalan, Bell, Motzkin, factorielle,
   primorielle, Fibonacci, Lucas, Pell — sont des nombres qui COMPTENT quelque
   chose : des parenthésages, des partitions, des chemins, des pavages. Le
   Codex disait leur formule sans jamais dire ce qu'ils dénombrent. Ici, si.
   ============================================================ */

/* ---------- ce que comptent les nombres du dénombrement ----------
   Chaque énoncé est vérifiable à la main sur les petits cas, et
   `outils/verifier_salles.py` recalcule chaque suite depuis sa définition. */
const DENOMBRE = [
  { id: 'catalan', quoi: "les façons de parenthéser un produit",
    exemple: "Avec 4 facteurs, 5 parenthésages : ((ab)c)d, (a(bc))d, (ab)(cd), a((bc)d), a(b(cd)). C₃ = 5.",
    suite: [1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862] },
  { id: 'bell', quoi: "les façons de répartir n objets en paquets",
    exemple: "Trois personnes à répartir en tables : 5 façons. B₃ = 5.",
    suite: [1, 1, 2, 5, 15, 52, 203, 877, 4140] },
  { id: 'motzkin', quoi: "les chemins qui montent, descendent ou restent plats sans passer sous zéro",
    exemple: "Aussi : les façons de tracer des cordes sans croisement entre n points d'un cercle.",
    suite: [1, 1, 2, 4, 9, 21, 51, 127, 323, 835, 2188] },
  { id: 'factorielle', quoi: "les ordres possibles de n objets",
    exemple: "Cinq livres sur une étagère : 120 rangements. 5! = 120.",
    suite: [1, 1, 2, 6, 24, 120, 720, 5040] },
  { id: 'primorielle', quoi: "le produit des premiers jusqu'à p",
    exemple: "2×3×5×7 = 210. Euclide s'en sert pour prouver qu'il y a une infinité de premiers.",
    suite: [2, 6, 30, 210, 2310, 30030] },
  { id: 'fibo', quoi: "les façons de monter n marches par pas de une ou deux",
    exemple: "Quatre marches : 5 façons. Aussi les pavages d'un couloir 2×n par des dominos.",
    suite: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89] },
  { id: 'lucas', quoi: "la même récurrence que Fibonacci, partie de 2 et 1",
    exemple: "Elle compte les colliers de perles à n places, à rotation près.",
    suite: [2, 1, 3, 4, 7, 11, 18, 29, 47, 76] },
  { id: 'pell', quoi: "les meilleures approximations rationnelles de √2",
    exemple: "577/408 approche √2 à un millionième près. Les Pell donnent la suite de ces fractions.",
    suite: [0, 1, 2, 5, 12, 29, 70, 169, 408, 985] },
];

/* ---------- le problème des partis ----------
   Deux joueurs, mises égales, jeu à pile ou face. Le premier à `but` points
   emporte tout. La partie s'arrête alors qu'il manque `ra` points à l'un et
   `rb` à l'autre. Quelle part revient à chacun ?

   LA RÉPONSE DE PASCAL, et c'est là qu'est le saut : on ne partage pas selon
   les points DÉJÀ marqués, mais selon les parties QU'ON AURAIT JOUÉES. Il
   reste au plus ra+rb−1 coups à jouer ; on énumère les 2^(ra+rb−1) issues,
   et on compte celles où le premier joueur atteint son but.

   C'est le premier calcul de l'histoire qui donne une valeur à un futur qui
   n'aura pas lieu. */
function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}

function partsDuJeu(ra, rb) {
  const coups = ra + rb - 1;
  const total = Math.pow(2, coups);
  let gagnantes = 0;
  for (let k = ra; k <= coups; k++) gagnantes += binom(coups, k);
  return { coups, total, gagnantes, part: gagnantes / total };
}

/* ---------- l'état de la vue ---------- */
let _csBut = 5, _csA = 4, _csB = 2;

function casinoRegler(quoi, v) {
  const n = Math.max(0, Math.min(12, Math.floor(+v || 0)));
  if (quoi === 'but') _csBut = Math.max(1, n);
  if (quoi === 'a') _csA = n;
  if (quoi === 'b') _csB = n;
  /* Les scores ne peuvent pas atteindre le but : la partie serait finie, et
     il n'y aurait rien à partager. */
  _csA = Math.min(_csA, _csBut - 1);
  _csB = Math.min(_csB, _csBut - 1);
  renderCasino();
}

function renderCasino() {
  const zone = document.querySelector('#csZone');
  if (!zone) return;

  /* ---- les chances de la Cité, telles que le moteur les applique ---- */
  const parCle = Object.fromEntries(PULL_ODDS);
  const rangs = [...RARITIES].reverse().map(r => {
    const p = parCle[r.key] || 0;
    const naturel = (POOL[r.key] || []).length / POOL_MAX;
    return `<tr>
      <td><span class="csPastille" style="background:${r.color}"></span>${r.label}</td>
      <td class="csNum">${fmt((POOL[r.key] || []).length)}</td>
      <td class="csNum">${(naturel * 100).toFixed(2)} %</td>
      <td class="csNum fort">${(p * 100).toFixed(2)} %</td>
      <td class="csNum">${naturel > 0 ? (p / naturel).toFixed(2) + '×' : '—'}</td>
      <td class="csNum">${p > 0 ? '1 sur ' + Math.round(1 / p) : '—'}</td>
    </tr>`;
  }).join('');

  /* ---- vos garanties, et ce qu'elles valent ---- */
  const pE = parCle.epique + parCle.legendaire + parCle.mythique;
  const pL = parCle.legendaire + parCle.mythique;
  const resteE = Math.max(0, PITY_EPIQUE - state.pity.epic);
  const resteL = Math.max(0, PITY_LEGENDAIRE - state.pity.legend);

  /* ---- le problème des partis ---- */
  const ra = _csBut - _csA, rb = _csBut - _csB;
  const j = partsDuJeu(ra, rb);
  const naif = (_csA + _csB) > 0 ? _csA / (_csA + _csB) : 0.5;

  const suites = DENOMBRE.map(d => {
    const t = TRAITS.find(x => x.id === d.id);
    const eus = d.suite.filter(v => v >= 1 && v <= POOL_MAX && state.owned[v]).length;
    const dans = d.suite.filter(v => v >= 1 && v <= POOL_MAX).length;
    return `<div class="csSuite">
      <div class="csSTete">
        <b>${t ? t.label : d.id}</b>
        <span class="csSCompte">${eus} / ${dans} au vivier</span>
      </div>
      <p class="csSQuoi">Ils comptent ${d.quoi}.</p>
      <p class="csSEx">${d.exemple}</p>
      <div class="csSSuite">${d.suite.map(v =>
        `<span class="csTerme${v <= POOL_MAX && state.owned[v] ? ' eu' : ''}${v > POOL_MAX ? ' hors' : ''}">${fmt(v)}</span>`).join('')}</div>
    </div>`;
  }).join('');

  zone.innerHTML = `
    <section class="csBloc">
      <h3 class="csTitre">Les chances de la Cité</h3>
      <p class="csNote">Ce tableau n'est affiché nulle part ailleurs. La colonne
        « part naturelle » est celle qu'aurait un entier tiré au hasard entre 1 et
        ${fmt(POOL_MAX)} ; la colonne « annoncée » est celle que le tirage applique
        vraiment. L'écart est la part de gacha assumée — jamais en dessous de 1,00×,
        et fixée à 1,00× pile sur le palier le plus haut.</p>
      <div class="csTableCadre">
        <table class="csTable">
          <thead><tr><th>Palier</th><th>Nombres</th><th>Part naturelle</th>
            <th>Annoncée</th><th>Écart</th><th>Espérance</th></tr></thead>
          <tbody>${rangs}</tbody>
        </table>
      </div>
    </section>

    <section class="csBloc">
      <h3 class="csTitre">Vos garanties</h3>
      <div class="csGaranties">
        <div class="csGar">
          <b>Épique</b>
          <span class="csGVal">${state.pity.epic} / ${PITY_EPIQUE}</span>
          <p>Un Épique ou mieux sort tout seul en <b>${Math.round(1 / pE)}</b> tirages
             en moyenne ; la garantie tombe à ${PITY_EPIQUE}, soit
             ${(PITY_EPIQUE / (1 / pE)).toFixed(2)}× l'espérance. Il vous en reste
             <b>${resteE}</b> avant qu'elle ne se déclenche.</p>
        </div>
        <div class="csGar">
          <b>Légendaire</b>
          <span class="csGVal">${state.pity.legend} / ${PITY_LEGENDAIRE}</span>
          <p>Un Légendaire ou mieux sort tout seul en <b>${Math.round(1 / pL)}</b> tirages ;
             la garantie tombe à ${PITY_LEGENDAIRE}, soit
             ${(PITY_LEGENDAIRE / (1 / pL)).toFixed(2)}× l'espérance. Il vous en reste
             <b>${resteL}</b>.</p>
        </div>
        <div class="csGar">
          <b>Mythique</b>
          <span class="csGVal">aucune</span>
          <p>Les ${fmt(POOL.mythique.length)} Mythiques n'ont pas de filet, et c'est
             délibéré : à ${(parCle.mythique * 100).toFixed(2)} %, une garantie les
             distribuerait plus vite que le hasard. Ils se tirent, ou ils se forgent.</p>
        </div>
      </div>
    </section>

    <section class="csBloc">
      <h3 class="csTitre">Le problème des partis <i>Pascal &amp; Fermat, 1654</i></h3>
      <p class="csNote">Deux joueurs misent la même somme. Le premier à
        <b>${_csBut}</b> manches emporte tout. La partie est interrompue à
        <b>${_csA}</b> contre <b>${_csB}</b>. Comment partager les mises ?</p>

      <div class="csReglages">
        <label>Partie en <input type="number" id="csBut" min="1" max="12" value="${_csBut}"> manches</label>
        <label>Le premier a <input type="number" id="csA" min="0" max="11" value="${_csA}"></label>
        <label>Le second a <input type="number" id="csB" min="0" max="11" value="${_csB}"></label>
      </div>

      <div class="csPartis">
        <div class="csFaux">
          <span class="csEtiq">La réponse fausse</span>
          <b>${(naif * 100).toFixed(1)} % / ${(100 - naif * 100).toFixed(1)} %</b>
          <p>Au prorata des manches gagnées. C'est ce que tout le monde répondait
             avant 1654 — et c'est faux : ça juge le passé, alors que la mise
             appartient à l'avenir.</p>
        </div>
        <div class="csVrai">
          <span class="csEtiq">La réponse de Pascal</span>
          <b>${(j.part * 100).toFixed(1)} % / ${(100 - j.part * 100).toFixed(1)} %</b>
          <p>Il reste au plus <b>${j.coups}</b> manche${j.coups > 1 ? 's' : ''} à jouer, donc
             <b>${fmt(j.total)}</b> avenirs possibles, tous aussi probables.
             <b>${fmt(j.gagnantes)}</b> d'entre eux donnent la victoire au premier.
             La mise se partage dans ce rapport — même si ces manches ne seront
             jamais jouées.</p>
        </div>
      </div>
    </section>

    <section class="csBloc">
      <h3 class="csTitre">Ce que comptent vos nombres</h3>
      <p class="csNote">Huit traits du Codex ne décrivent pas une forme ni une
        divisibilité : ce sont des <b>dénombrements</b>. Chacun est la réponse à une
        question qui commence par « combien de façons ». Le Codex donnait la formule ;
        voici la question.</p>
      <div class="csSuites">${suites}</div>
    </section>`;

  /* Les identifiants sont écrits en toutes lettres : les dériver du nom du
     réglage donnait « #csBUT » là où le champ s'appelle « csBut », et les trois
     curseurs restaient morts sans le moindre message. */
  [['but', '#csBut'], ['a', '#csA'], ['b', '#csB']].forEach(([quoi, sel]) => {
    const el = zone.querySelector(sel);
    if (el) el.addEventListener('change', () => casinoRegler(quoi, el.value));
  });
}
