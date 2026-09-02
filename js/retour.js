/* ============================================================
   BOUTON DE RETOUR

   Un bouton flottant, présent sur toutes les pages, qui ouvre un panneau
   latéral : un objet, une description, et c'est parti vers le back office.

   SÉCURITÉ. Rien de ce que le visiteur écrit n'est jamais réinjecté dans une
   page. Tout ce qui vient de lui passe par `textContent`, jamais par
   `innerHTML` : le panneau est construit à partir de balisage figé, et les
   seules valeurs variables sont posées comme du texte. Un message contenant
   du script est donc affiché comme du script, pas exécuté.

   Le serveur ne fait pas davantage confiance : l'objet est vérifié contre une
   liste fermée et la longueur est bornée. Voir parties/views.py.
   ============================================================ */

const RETOUR = {
  objets: [
    ['bug',         '🐞 Un bug',                  'Quelque chose ne marche pas comme prévu.'],
    ['idee',        '💡 Une idée',                'Une mécanique, un écran, une amélioration.'],
    ['maths',       '🧮 Une erreur mathématique', "Un trait mal attribué, une démonstration fausse."],
    ['equilibrage', '⚖️ Équilibrage',             'Trop facile, trop lent, trop cher.'],
    ['autre',       '💬 Autre',                   'Tout le reste.'],
  ],
  messageMax: 2000,
};

(function () {
  let panneauOuvert = false;
  let envoiEnCours = false;

  /* ---------- construction, une seule fois ---------- */
  const bouton = document.createElement('button');
  bouton.className = 'retourBouton';
  bouton.type = 'button';
  bouton.setAttribute('aria-label', 'Envoyer un retour');
  bouton.innerHTML = '<span aria-hidden="true">✉️</span>';

  const voile = document.createElement('div');
  voile.className = 'retourVoile';

  const panneau = document.createElement('aside');
  panneau.className = 'retourPanneau';
  panneau.setAttribute('role', 'dialog');
  panneau.setAttribute('aria-modal', 'true');
  panneau.setAttribute('aria-labelledby', 'retourTitre');

  /* Le balisage est figé : aucune donnée venant du visiteur ne s'y trouve. */
  panneau.innerHTML = `
    <div class="retourTete">
      <h2 id="retourTitre">Envoyer un retour</h2>
      <button type="button" class="retourFermer" aria-label="Fermer">✕</button>
    </div>
    <form class="retourForm" novalidate>
      <label for="retourObjet">Objet</label>
      <select id="retourObjet" required>
        ${RETOUR.objets.map(([cle, nom]) => `<option value="${cle}">${nom}</option>`).join('')}
      </select>
      <p class="retourAide" id="retourAide"></p>

      <label for="retourMessage">Description</label>
      <textarea id="retourMessage" rows="8" maxlength="${RETOUR.messageMax}"
                placeholder="Décrivez ce que vous avez vu, ou ce que vous imaginez."></textarea>
      <div class="retourCompteur"><span id="retourReste">${RETOUR.messageMax}</span> caractères restants</div>

      <label class="retourCase">
        <input type="checkbox" id="retourAnonyme">
        <span>Signer « Anonyme » si ce retour est publié
          <i>— votre pseudo reste connu de l'auteur du jeu</i></span>
      </label>

      <p class="retourEtat" id="retourEtat" role="status"></p>

      <div class="retourActions">
        <button type="submit" class="btn" id="retourEnvoyer">Envoyer</button>
        <button type="button" class="btn ghost retourFermer">Annuler</button>
      </div>
      <p class="tiny retourNote">Votre pseudo est joint s'il en existe un, ainsi que la page
         d'où vous écrivez. Aucune adresse ni aucun contenu de votre partie n'est transmis.
         Les retours retenus sont publiés sur le <b>mur des retours</b> ; les vôtres vous y
         sont visibles dès l'envoi.</p>
    </form>`;

  const $$$ = sel => panneau.querySelector(sel);
  const champObjet = $$$('#retourObjet');
  const champMessage = $$$('#retourMessage');
  const aide = $$$('#retourAide');
  const reste = $$$('#retourReste');
  const etat = $$$('#retourEtat');
  const envoyer = $$$('#retourEnvoyer');
  const champAnonyme = $$$('#retourAnonyme');

  /* ---------- comportement ---------- */
  function majAide() {
    const trouve = RETOUR.objets.find(o => o[0] === champObjet.value);
    aide.textContent = trouve ? trouve[2] : '';     // texte, jamais du balisage
  }

  function majCompteur() {
    reste.textContent = String(RETOUR.messageMax - champMessage.value.length);
  }

  function dire(texte, genre = '') {
    etat.textContent = texte;                        // idem : du texte
    etat.className = 'retourEtat' + (genre ? ' ' + genre : '');
  }

  function ouvrir() {
    if (panneauOuvert) return;
    panneauOuvert = true;
    document.body.classList.add('retourOuvert');
    voile.classList.add('on');
    panneau.classList.add('on');
    dire('');
    majAide(); majCompteur();
    /* Le jeton anti-falsification est posé par une réponse du serveur. Les
       pages de contenu n'appellent jamais l'API : sans cette visite, leur
       envoi serait refusé. */
    fetch('/api/moi', { credentials: 'same-origin' }).catch(() => {});
    setTimeout(() => champMessage.focus(), 120);
  }

  function fermer() {
    if (!panneauOuvert) return;
    panneauOuvert = false;
    document.body.classList.remove('retourOuvert');
    voile.classList.remove('on');
    panneau.classList.remove('on');
    bouton.focus();
  }

  const jeton = () => (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || '';

  async function soumettre(ev) {
    ev.preventDefault();
    if (envoiEnCours) return;

    const message = champMessage.value.trim();
    if (message.length < 4) return dire('Décrivez un peu plus, en quelques mots.', 'mauvais');

    envoiEnCours = true;
    envoyer.disabled = true;
    dire('Envoi…');

    try {
      const r = await fetch('/api/retour', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': jeton() },
        body: JSON.stringify({
          objet: champObjet.value,
          message,
          anonyme: champAnonyme.checked,
          page: location.pathname + location.hash,
          version: (document.querySelector('script[src*="?v="]') || {}).src?.split('?v=')[1] || '',
        }),
      });
      const rep = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(rep.erreur || 'Envoi impossible pour le moment.');

      champMessage.value = '';
      majCompteur();
      dire('Merci — c\'est bien arrivé.', 'bon');
      setTimeout(fermer, 1400);
    } catch (e) {
      dire(e.message, 'mauvais');
    } finally {
      envoiEnCours = false;
      envoyer.disabled = false;
    }
  }

  /* ---------- branchements ---------- */
  bouton.addEventListener('click', ouvrir);
  voile.addEventListener('click', fermer);
  panneau.querySelectorAll('.retourFermer').forEach(b => b.addEventListener('click', fermer));
  panneau.querySelector('.retourForm').addEventListener('submit', soumettre);
  champObjet.addEventListener('change', majAide);
  champMessage.addEventListener('input', majCompteur);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panneauOuvert) fermer(); });

  document.body.append(voile, panneau, bouton);
  majAide(); majCompteur();
})();
