/* ============================================================
   L'OBSERVATOIRE — LA STATISTIQUE, C'EST-À-DIRE LE PASSÉ

   LE PARTAGE AVEC LE CASINO, et il est net : le Casino dit ce qui VA arriver
   — les taux, les garanties, l'espérance. L'Observatoire dit ce qui EST
   arrivé — votre herbier, mesuré contre la vérité du vivier. L'un est de la
   probabilité, l'autre de la statistique, et c'est exactement la distinction
   qu'un joueur de gacha ne fait jamais.

   CE QU'IL MONTRE QUE PERSONNE NE MONTRE. Un herbier bien rempli donne
   l'impression d'avancer. La mesure dit autre chose : à 3 000 nombres sur
   9 999, il ne reste pas 70 % du chemin, il en reste beaucoup plus — parce
   que les derniers nombres coûtent bien plus cher que les premiers. Le
   problème du collectionneur de coupons donne le chiffre exact, et il est
   brutal. Le donner est plus honnête que de le taire.

   POURQUOI ICI. L'acte IV est celui du calcul : Napier passe vingt ans sur
   ses logarithmes pour que les astronomes cessent de multiplier à la main.
   Un observatoire est un lieu où l'on mesure, où l'on tient des tables, et où
   l'on accepte que le résultat ne soit pas celui qu'on espérait.

   ON N'Y GAGNE RIEN NON PLUS. Comme au Comptoir : ni jeton, ni poussière, ni
   nombre. On y regarde.
   ============================================================ */

/* ---------- le collectionneur de coupons ----------
   Pour tirer les N nombres d'un ensemble uniforme, il faut en moyenne
   N·H(N) tirages, où H est la série harmonique. Quand on en possède déjà k,
   il en reste N·H(N−k) : la série porte sur CE QUI MANQUE.

   Le tirage du jeu N'EST PAS uniforme : il passe d'abord par un palier, puis
   tire uniformément dedans. L'estimation est donc faite PALIER PAR PALIER,
   avec la probabilité réelle de chacun — sinon elle sous-estimerait
   grossièrement le coût des Mythiques, qu'on ne voit qu'une fois sur sept
   cents. On rend la plus longue des six attentes : c'est elle qui commande. */
function harmonique(n) {
  /* Somme exacte pour les petits n, développement d'Euler-Maclaurin au-delà —
     sommer dix mille termes à chaque rendu serait payé pour rien. */
  if (n <= 0) return 0;
  if (n < 2000) { let s = 0; for (let i = 1; i <= n; i++) s += 1 / i; return s; }
  const g = 0.5772156649015329;
  return Math.log(n) + g + 1 / (2 * n) - 1 / (12 * n * n);
}

function tiragesRestants() {
  let pire = 0, pireCle = null;
  for (const r of RARITIES) {
    const pool = POOL[r.key] || [];
    const N = pool.length;
    if (!N) continue;
    const eus = pool.filter(v => state.owned[v]).length;
    if (eus >= N) continue;
    /* Espérance de tirages DANS CE PALIER pour compléter, ramenée en tirages
       tout court par la probabilité d'y tomber.

       LA FORMULE, et elle se trompe facilement de sens : quand on possède
       déjà k coupons sur N, il reste en moyenne N·H(N−k) tirages — la série
       harmonique porte sur CE QUI MANQUE, pas sur ce qu'on a. Le premier jet
       écrivait N·(H(N)−H(N−k)), qui est la queue de la série : il annonçait
       1 484 tirages là où il en faut près de cent mille, et il rendait zéro
       pour un herbier vide. Deux contrôles suffisent à trancher : à k = 0 la
       formule doit rendre N·H(N), et à k = N−1 elle doit rendre N. */
    const dansLePalier = N * harmonique(N - eus);
    const p = Object.fromEntries(PULL_ODDS)[r.key] || 1;
    const total = dansLePalier / p;
    if (total > pire) { pire = total; pireCle = r; }
  }
  return { tirages: Math.round(pire), palier: pireCle };
}

/* ---------- la vue ---------- */
function renderObservatoire() {
  const zone = document.querySelector('#obZone');
  if (!zone) return;

  const eus = uniqueCount(state);
  const part = eus / POOL_MAX;

  /* ---- la couverture, palier par palier ---- */
  const rangs = [...RARITIES].reverse().map(r => {
    const pool = POOL[r.key] || [];
    const k = pool.filter(v => state.owned[v]).length;
    const pc = pool.length ? k / pool.length : 0;
    return `<div class="obRang">
      <span class="obRNom"><i style="background:${r.color}"></i>${r.label}</span>
      <span class="obRBarre"><i style="width:${(pc * 100).toFixed(1)}%;background:${r.color}"></i></span>
      <span class="obRVal">${fmt(k)} / ${fmt(pool.length)}</span>
      <span class="obRPc">${(pc * 100).toFixed(1)} %</span>
    </div>`;
  }).join('');

  /* ---- ce qu'il reste à payer ---- */
  const reste = tiragesRestants();
  const cout = typeof pullCost === 'function' ? Math.round(pullCost(10) / 10 * reste.tirages) : 0;

  /* ---- les traits qui vous manquent, du plus rare au plus commun ----
     On ne compte QUE sur le vivier : un trait qui n'existe qu'au-delà du mur
     ne se reproche pas à un joueur qui n'a pas encore ouvert la Forge. */
  const compte = {}, eusParTrait = {};
  for (const r of RARITIES) for (const v of (POOL[r.key] || [])) {
    for (const t of evaluate(v).traits) {
      compte[t.id] = (compte[t.id] || 0) + 1;
      if (state.owned[v]) eusParTrait[t.id] = (eusParTrait[t.id] || 0) + 1;
    }
  }
  const manquants = Object.keys(compte)
    .filter(id => !eusParTrait[id])
    .map(id => ({ id, n: compte[id], t: TRAITS.find(x => x.id === id) }))
    .sort((a, b) => a.n - b.n)
    .slice(0, 12);

  /* ---- une mesure qu'on ne fait jamais : la densité des premiers ----
     π(9999) = 1229. Si votre herbier était un échantillon honnête du vivier,
     votre part de premiers vaudrait la sienne. Le tirage penche vers le rare,
     et les premiers sont sur-représentés dans les hauts paliers : l'écart se
     voit, et il s'explique. */
  const premiersVivier = 1229;
  const mesPremiers = Object.keys(state.owned)
    .filter(k => +k <= POOL_MAX && evaluate(+k).traits.some(t => t.id === 'premier')).length;
  const densiteMoi = eus ? mesPremiers / eus : 0;
  const densiteVrai = premiersVivier / POOL_MAX;

  zone.innerHTML = `
    <section class="obBloc">
      <h3 class="obTitre">Votre couverture du vivier</h3>
      <div class="obGrandChiffre">
        <b>${(part * 100).toFixed(2)} %</b>
        <span>${fmt(eus)} nombres sur ${fmt(POOL_MAX)}</span>
      </div>
      <div class="obRangs">${rangs}</div>
    </section>

    <section class="obBloc">
      <h3 class="obTitre">Ce qu'il reste à payer</h3>
      ${reste.tirages > 0 ? `
        <p class="obNote">Le problème du collectionneur de coupons donne le compte
          exact : plus l'herbier se remplit, plus chaque manque coûte cher, parce
          qu'on retombe sans cesse sur ce qu'on a déjà. Le calcul est fait palier
          par palier, avec les probabilités réelles du tirage.</p>
        <div class="obGrandChiffre sombre">
          <b>≈ ${fmt(reste.tirages)}</b>
          <span>tirages pour tout avoir${reste.palier
            ? `, commandés par le palier <b>${reste.palier.label}</b>` : ''}</span>
        </div>
        <p class="obNote">Soit environ <b>${fmt(cout)}</b> jetons au tarif du paquet
          de dix. Ce chiffre n'est pas là pour décourager : il est là pour que
          « bientôt fini » veuille dire quelque chose. La Forge et l'Expédition,
          elles, ne tirent pas au hasard — c'est tout leur intérêt.</p>`
        : `<p class="obNote">Le vivier est complet. Il ne reste rien à tirer :
             ce qui manque est au-delà du mur.</p>`}
    </section>

    <section class="obBloc">
      <h3 class="obTitre">La densité des premiers</h3>
      <div class="obDeux">
        <div class="obMesure">
          <span class="obMEtiq">Dans votre herbier</span>
          <b>${(densiteMoi * 100).toFixed(2)} %</b>
          <span class="obMDetail">${fmt(mesPremiers)} premiers sur ${fmt(eus)}</span>
        </div>
        <div class="obMesure">
          <span class="obMEtiq">Dans le vivier entier</span>
          <b>${(densiteVrai * 100).toFixed(2)} %</b>
          <span class="obMDetail">π(${fmt(POOL_MAX)}) = ${fmt(premiersVivier)}</span>
        </div>
      </div>
      <p class="obNote">${densiteMoi > densiteVrai
        ? `Vous en avez <b>plus</b> que le hasard n'en donnerait. Ce n'est pas de la
           chance : le tirage penche vers les paliers rares, et un premier a plus de
           chances d'y être qu'un nombre quelconque. Votre herbier n'est pas un
           échantillon honnête du vivier — aucun herbier de gacha ne l'est.`
        : `Vous en avez moins que la densité du vivier. Avec peu de nombres, l'écart
           est du bruit ; il se resserrera tout seul.`}</p>
    </section>

    <section class="obBloc">
      <h3 class="obTitre">Les traits qui vous manquent <i>les plus rares d'abord</i></h3>
      ${manquants.length ? `<div class="obManques">${manquants.map(m => `
        <div class="obManque">
          <b>${m.t ? m.t.label : m.id}</b>
          <span class="obMCompte">${fmt(m.n)} nombre${m.n > 1 ? 's' : ''} au vivier</span>
          <span class="obMChance">1 chance sur ${fmt(Math.round(POOL_MAX / m.n))} par nombre tiré</span>
        </div>`).join('')}</div>`
        : `<p class="obNote">Vous possédez au moins un nombre de chaque trait du
             vivier. C'est déjà rare.</p>`}
    </section>`;
}
