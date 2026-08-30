/* ============================================================
   CLASSEMENT.

   Les colonnes ne viennent pas du client : le serveur les recalcule
   depuis la sauvegarde reçue, et écarte les parties incohérentes.
   Un joueur peut trafiquer la sienne, il ne peut pas se déclarer
   premier sans que sa sauvegarde le montre.
   ============================================================ */

const TRIS = [
  ['completion', '🗃️', 'Collection',  'nombres'],
  ['mythiques',  '🌠', 'Mythiques',   'mythiques'],
  ['theoremes',  '📐', 'Théorèmes',   'théorèmes'],
  ['forges',     '⚒️', 'Forgés',      'forgés'],
  ['examen',     '🎓', 'Examen',      'réussites'],
];

let triClassement = 'completion';
let _classement = null;      // dernier résultat reçu, pour ne pas re-télécharger à chaque onglet

async function chargerClassement(force = false) {
  if (!nuage.dispo) return null;
  if (_classement && _classement.tri === triClassement && !force) return _classement;
  _classement = await appel(`/classement?tri=${triClassement}`);
  return _classement;
}

function renderClassement() {
  const zone = $('#clZone');
  if (!zone) return;

  if (nuage.dispo === false) {
    zone.innerHTML = `<div class="forgeAccueil">
      <div class="forgeAccueilArt">⌁</div><h3>Hors ligne</h3>
      <p>Cette version du jeu tourne sans serveur : il n'y a pas de classement à afficher.
         Votre collection reste entière, elle vit simplement dans ce navigateur.</p></div>`;
    return;
  }

  const unite = (TRIS.find(t => t[0] === triClassement) || TRIS[0])[3];
  const c = _classement;

  zone.innerHTML = `
    <div class="chips clTris">${TRIS.map(([id, ic, nom]) =>
      `<button class="chip ${id === triClassement ? 'on' : ''}" data-tri="${id}"
         style="--cc:var(--accent)">${ic} ${nom}</button>`).join('')}</div>

    ${!nuage.connecte ? `<div class="clAvis">
      Vous n'apparaissez pas encore : votre partie n'est pas liée à un pseudo.
      <button class="btn sm" id="clLier">Choisir un pseudo</button></div>` : ''}

    ${!c ? `<div class="empty">Chargement…</div>` : !c.lignes.length
      ? `<div class="empty">Personne n'est encore classé. À vous de jouer.</div>`
      : `<table class="clTable">
          <tbody>${c.lignes.map(l => ligneHTML(l, unite)).join('')}
          ${c.moi ? `<tr class="clSep"><td colspan="3">…</td></tr>` + ligneHTML(c.moi, unite) : ''}
          </tbody></table>
         <p class="tiny clPied">${c.total} joueur${c.total > 1 ? 's' : ''} classé${c.total > 1 ? 's' : ''}.
            Les colonnes sont recalculées par le serveur à partir des sauvegardes ;
            les parties incohérentes en sont écartées.</p>`}`;

  cablerClassement();
}

function ligneHTML(l, unite) {
  const medaille = { 1: '🥇', 2: '🥈', 3: '🥉' }[l.rang] || l.rang;
  return `<tr class="${l.moi ? 'moi' : ''}">
    <td class="clRang">${medaille}</td>
    <td class="clNom">${echapper(l.pseudo)}${l.moi ? ' <span class="tiny">— vous</span>' : ''}</td>
    <td class="clVal"><b>${fmt(l.valeur)}</b> <span class="tiny">${unite}</span></td>
  </tr>`;
}

/* Les pseudos viennent d'autres joueurs : jamais insérés tels quels. */
function echapper(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function cablerClassement() {
  $$('#clZone .chip[data-tri]').forEach(el => el.addEventListener('click', async () => {
    triClassement = el.dataset.tri;
    _classement = null;
    renderClassement();
    try { await chargerClassement(); } catch {}
    renderClassement();
  }));
  const lier = $('#clLier');
  if (lier) lier.addEventListener('click', ouvrirNuage);
}

/* Appelé à l'ouverture de l'onglet : on ne télécharge que si nécessaire. */
async function ouvrirClassement() {
  renderClassement();
  if (!nuage.dispo) return;
  try { await chargerClassement(); } catch (e) { _classement = null; }
  renderClassement();
}
