/* ============================================================
   LE MUR DES RETOURS

   Ce que les joueurs ont écrit, et ce que les autres en pensent. Une seule
   voix par retour et par joueur, et il n'existe pas de voix contre : « moi
   aussi, ça me gêne » est une information, « ton idée est mauvaise » est un
   jugement sur quelqu'un. Le refus d'une idée se dit par son statut, posé
   dans l'admin.

   RIEN N'EST PUBLIC PAR DÉFAUT. L'envoi est un POST ouvert, sans compte : si
   ce qui arrive s'affichait d'office, n'importe qui pourrait faire écrire ce
   qu'il veut sur le site. Le serveur ne renvoie donc que les retours publiés
   — plus les siens, quel que soit leur état.

   POURQUOI LES SIENS AUSSI. Sans cela, quelqu'un qui vient d'envoyer trois
   remarques n'a aucun moyen de savoir si elles sont arrivées, ni ce qu'elles
   sont devenues : il les réécrit, ou il conclut que personne ne lit. La
   modération a priori ne doit pas se payer d'un silence envers celui qui a
   pris la peine d'écrire.

   SÉCURITÉ. Tout ce qui vient du serveur a été écrit par un visiteur : rien
   n'entre dans la page par innerHTML. Le message, le pseudo et la date sont
   posés en texte, via `textContent`. C'est la même règle que le panneau
   d'envoi, et elle vaut d'autant plus ici que le texte affiché vient
   maintenant de quelqu'un d'autre.
   ============================================================ */

const RETOURS_OBJETS = {
  bug:         { emoji: '🐞', nom: 'Bug' },
  idee:        { emoji: '💡', nom: 'Idée' },
  maths:       { emoji: '🧮', nom: 'Erreur mathématique' },
  equilibrage: { emoji: '⚖️', nom: 'Équilibrage' },
  autre:       { emoji: '💬', nom: 'Autre' },
};

const RETOURS_STATUTS = {
  recu:   { nom: 'Reçu',       classe: 'recu' },
  retenu: { nom: 'Retenu',     classe: 'retenu' },
  fait:   { nom: 'Fait',       classe: 'fait' },
  refuse: { nom: 'Non retenu', classe: 'refuse' },
};

let _retours = null;          // { connecte, publies[], miens[] }
let _retoursCharges = false;
let triRetours = 'votes';     // 'votes' ou 'recents'

/* Chargé à la première ouverture de l'onglet, pas au démarrage : la plupart
   des visites ne passeront jamais par là. */
async function chargerRetours(force = false) {
  if (_retoursCharges && !force) return;
  _retoursCharges = true;
  try {
    const rep = await fetch('/api/retours', { credentials: 'same-origin' });
    _retours = await rep.json();
  } catch (e) {
    _retours = { erreur: true };
  }
  renderRetours();
}

function ouvrirRetours() { chargerRetours(); }

/* ---------- rendu ----------
   Le balisage est construit ici, mais AUCUN texte de visiteur n'y est
   interpolé : les chaînes variables sont posées ensuite, en textContent, par
   `retGarnir`. Un message contenant du script s'affiche donc tel quel. */
function renderRetours() {
  const zone = document.querySelector('#retZone');
  if (!zone) return;

  if (!_retours) {
    zone.innerHTML = `<div class="empty">Chargement…</div>`;
    return;
  }
  if (_retours.erreur) {
    zone.innerHTML = `<div class="forgeAccueil">
      <div class="forgeAccueilArt">⌁</div><h3>Hors ligne</h3>
      <p>Cette version du jeu tourne sans serveur : il n'y a pas de mur des retours.
         Le bouton ✉️ reste utilisable dès que la connexion revient.</p></div>`;
    return;
  }

  const publies = _retours.publies || [];
  const miens = _retours.miens || [];
  const tries = publies.slice().sort((a, b) => triRetours === 'recents'
    ? b.cree_le.localeCompare(a.cree_le)
    : (b.votes - a.votes) || b.cree_le.localeCompare(a.cree_le));

  zone.innerHTML = `
    <div class="chips clTris">
      <button class="chip ${triRetours === 'votes' ? 'on' : ''}" data-triret="votes">▲ Les plus soutenus</button>
      <button class="chip ${triRetours === 'recents' ? 'on' : ''}" data-triret="recents">🕒 Les plus récents</button>
    </div>

    ${!_retours.connecte ? `<div class="clAvis">
      Choisissez un pseudo pour soutenir un retour et retrouver les vôtres.
      <button class="btn sm" id="retLier">Choisir un pseudo</button></div>` : ''}

    ${miens.length ? `<h3 class="retSection">Vos retours en attente</h3>
      <p class="tiny retAide">Ils ne sont pas encore sur le mur : chaque retour est relu avant
         d'être publié. Vous êtes seul à les voir ici.</p>
      <div class="retListe" id="retMiens"></div>` : ''}

    <h3 class="retSection">Le mur${publies.length ? ` <span class="tiny">${publies.length}</span>` : ''}</h3>
    ${tries.length
      ? `<div class="retListe" id="retMur"></div>`
      : `<div class="empty">Rien n'est encore publié. Le vôtre y sera peut-être le premier.</div>`}`;

  if (miens.length) retGarnir(document.querySelector('#retMiens'), miens, false);
  if (tries.length) retGarnir(document.querySelector('#retMur'), tries, true);

  cablerRetours();
}

/* Construit les cartes une par une, et pose chaque valeur variable en texte. */
function retGarnir(hote, liste, votable) {
  for (const r of liste) {
    const objet = RETOURS_OBJETS[r.objet] || RETOURS_OBJETS.autre;
    const statut = RETOURS_STATUTS[r.statut] || RETOURS_STATUTS.recu;

    const carte = document.createElement('article');
    carte.className = 'retCarte' + (r.mien ? ' mien' : '');

    // --- la colonne de soutien ---
    const voix = document.createElement('button');
    voix.className = 'retVoix' + (r.vote ? ' donne' : '');
    voix.type = 'button';
    voix.dataset.retour = r.id;
    if (!votable) voix.disabled = true;
    voix.title = !votable ? 'En attente de publication'
               : r.vote ? 'Retirer votre soutien' : 'Soutenir ce retour';
    const fleche = document.createElement('span');
    fleche.className = 'retFleche';
    fleche.textContent = '▲';
    const compte = document.createElement('b');
    compte.textContent = String(r.votes);
    voix.append(fleche, compte);

    // --- le corps ---
    const corps = document.createElement('div');
    corps.className = 'retCorps';

    const tete = document.createElement('div');
    tete.className = 'retTete';
    const etiq = document.createElement('span');
    etiq.className = 'retObjet ' + r.objet;
    etiq.textContent = `${objet.emoji} ${objet.nom}`;
    const pastille = document.createElement('span');
    pastille.className = 'retStatut ' + statut.classe;
    pastille.textContent = r.publie ? statut.nom : 'En attente';
    tete.append(etiq, pastille);
    if (r.mien) {
      const mien = document.createElement('span');
      mien.className = 'retMien';
      mien.textContent = 'le vôtre';
      tete.append(mien);
    }

    const texte = document.createElement('p');
    texte.className = 'retMessage';
    texte.textContent = r.message;              // du texte, jamais du balisage

    const pied = document.createElement('div');
    pied.className = 'retPied';
    const auteur = document.createElement('span');
    auteur.textContent = r.auteur || 'Anonyme';
    const quand = document.createElement('span');
    quand.textContent = retDateCourte(r.cree_le);
    pied.append(auteur, quand);

    corps.append(tete, texte, pied);
    carte.append(voix, corps);
    hote.append(carte);
  }
}

function retDateCourte(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function cablerRetours() {
  document.querySelectorAll('#retZone [data-triret]').forEach(el =>
    el.addEventListener('click', () => { triRetours = el.dataset.triret; renderRetours(); }));

  const lier = document.querySelector('#retLier');
  if (lier && typeof ouvrirNuage === 'function') lier.addEventListener('click', ouvrirNuage);

  document.querySelectorAll('#retZone .retVoix[data-retour]').forEach(el =>
    el.addEventListener('click', () => voterRetour(+el.dataset.retour, el)));
}

async function voterRetour(id, bouton) {
  if (bouton.dataset.envoi === 'oui') return;
  bouton.dataset.envoi = 'oui';
  try {
    const rep = await fetch(`/api/retours/${id}/voix`, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': jetonCsrf() },
    });
    const corps = await rep.json().catch(() => ({}));
    if (!rep.ok) return toast(corps.erreur || 'Vote impossible pour le moment.', 'bad');

    /* On met à jour la ligne en place plutôt que de recharger : le classement
       se réordonnerait sous le doigt du joueur, qui perdrait de vue ce qu'il
       vient de soutenir. Le nouvel ordre s'appliquera à la prochaine visite. */
    const r = (_retours.publies || []).find(x => x.id === id);
    if (r) { r.votes = corps.votes; r.vote = corps.vote; }
    bouton.classList.toggle('donne', corps.vote);
    bouton.title = corps.vote ? 'Retirer votre soutien' : 'Soutenir ce retour';
    const b = bouton.querySelector('b');
    if (b) b.textContent = String(corps.votes);
  } catch (e) {
    toast('Vote impossible pour le moment.', 'bad');
  } finally {
    bouton.dataset.envoi = '';
  }
}
