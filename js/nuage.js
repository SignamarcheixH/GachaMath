/* ============================================================
   NUAGE — sauvegarde en ligne.

   Le jeu doit continuer à fonctionner sans serveur : ouvert depuis
   un fichier ou un hébergement purement statique, l'API n'existe
   pas. On la sonde une fois au démarrage ; si elle ne répond pas,
   toute la couche s'efface et personne n'en entend parler.

   Répartition des rôles, imposée par Safari : le navigateur efface
   `localStorage` après sept jours sans visite, mais épargne les
   cookies posés par le serveur. L'identité vit donc dans un cookie
   `HttpOnly` de deux ans, la sauvegarde de référence sur le serveur,
   et `localStorage` n'est plus qu'une copie de travail dont la perte
   est sans conséquence.
   ============================================================ */

const API = '/api';
const CLE_SYNC = 'gachanombres.sync.v1';
const DELAI_POUSSEE = 45000;          // au plus une montée toutes les 45 s

const nuage = {
  dispo: null,        // null = pas encore sondé · false = pas d'API, on joue en local
  connecte: false,
  pseudo: null,
  code: null,
  majLe: null,        // horodatage serveur de la dernière synchro réussie
  versionExigee: 0,   // version de sauvegarde réclamée par le serveur
  etat: 'sonde',      // sonde · absent · anonyme · ok · envoi · erreur · conflit
  detail: '',
};

let _minuteur = null;
let _enVol = false;

/* Y avait-il une sauvegarde locale au démarrage ? La question est décisive :
   sans elle, le jeu écrit très vite un état neuf dans `localStorage`, et la
   réconciliation prendrait cet état vide pour une partie concurrente. C'est
   exactement le cas Safari — stockage effacé, cookie intact — et il doit se
   résoudre en silence, pas par une boîte de dialogue inquiétante. */
let _avaitLocal = false;

/* Signature des seuls faits qui comptent. Le revenu passif fait bouger `coins`
   et `lastTick` à chaque seconde : se fier à l'empreinte de la sauvegarde entière
   déclenchait une montée toutes les 45 s même joueur absent — 33 Mo par heure et
   par joueur pour une partie complète. On ne monte donc que si la progression a
   réellement avancé ; les jetons accumulés en veille partent au moment où
   l'onglet passe en arrière-plan. */
function signatureDe(sauv) {
  const st = (sauv && sauv.stats) || {};
  return [
    uniqueCount(sauv), (sauv.claimed || []).length, (sauv.defis || []).length,
    st.pulls | 0, st.forges | 0, Math.round(st.dustEarned || 0),
    st.bonnesReponses | 0, st.meilleureSerie | 0, st.appariements | 0,
    sauv.commande ? sauv.commande.cible : 0,
  ].join('|');
}
const signatureUtile = () => signatureDe(state);
let _derniereSignature = null;

/* Empreinte bon marché d'une sauvegarde (FNV-1a), pour savoir si le local a
   bougé depuis la dernière montée sans conserver 400 Ko en double. */
function empreinte(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + ':' + s.length;
}

const lireSync = () => { try { return JSON.parse(localStorage.getItem(CLE_SYNC)) || {}; } catch { return {}; } };
const ecrireSync = o => { try { localStorage.setItem(CLE_SYNC, JSON.stringify(o)); } catch {} };

const jetonCsrf = () => (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || '';

async function appel(chemin, options = {}) {
  const r = await fetch(API + chemin, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': jetonCsrf() },
    ...options,
  });
  let corps = {};
  try { corps = await r.json(); } catch {}
  if (!r.ok) throw Object.assign(new Error(corps.erreur || `HTTP ${r.status}`), { statut: r.status });
  return corps;
}

/* ---------- démarrage ---------- */
async function initNuage(avaitLocal = false) {
  _avaitLocal = !!avaitLocal;
  try {
    const moi = await appel('/moi');                 // pose aussi le jeton CSRF
    nuage.dispo = true;
    nuage.versionExigee = +moi.version_sauvegarde || 0;
    nuage.connecte = !!moi.connecte;
    nuage.pseudo = moi.pseudo || null;
    nuage.code = moi.code || null;
    nuage.etat = moi.connecte ? 'ok' : 'anonyme';
  } catch {
    nuage.dispo = false;                              // pas d'API : jeu purement local
    nuage.etat = 'absent';
    renderNuage();
    return;
  }
  renderNuage();

  /* LA PÉREMPTION SE TRANCHE AVANT LA SYNCHRO. Réconcilier une partie qu'on
     s'apprête à jeter n'a pas de sens — et pousserait au passage la version
     périmée vers le serveur. On propose d'abord, on synchronise après. */
  if (partieObsolete()) return proposerObsolete();

  /* La partie est à jour : on inscrit la version qu'elle honore, pour ne plus
     avoir à la déduire au chargement suivant. */
  if (nuage.versionExigee && versionDeLaPartie() !== nuage.versionExigee) {
    state.version = nuage.versionExigee;
    save();
  }

  if (nuage.connecte) await reconcilier();
}

/* ---------- réconciliation ----------
   Trois questions : le serveur a-t-il quelque chose, a-t-il bougé depuis notre
   dernière synchro, et avons-nous bougé de notre côté. Les deux à la fois, c'est
   un conflit — et on ne tranche pas à la place du joueur. */
async function reconcilier() {
  const local = _avaitLocal ? localStorage.getItem(SAVE_KEY) : null;
  const sync = lireSync();

  let distant;
  try { distant = await appel('/partie'); }
  catch (e) { nuage.etat = 'erreur'; nuage.detail = e.message; return renderNuage(); }

  const localBouge = local && empreinte(local) !== sync.empreinte;
  const serveurBouge = distant.maj_le && distant.maj_le !== sync.majLe;

  if (!distant.donnees) return pousser(true);
  if (!local) return adopter(distant);

  if (serveurBouge && localBouge) {
    /* « Les deux ont bougé » ne veut pas dire « les deux diffèrent ».
       `localBouge` compare l'empreinte brute de la sauvegarde, et le revenu
       passif modifie les jetons et l'horodatage à chaque tick : le local a donc
       presque toujours bougé, même quand le joueur n'a rien fait. Résultat, on
       demandait de choisir entre deux versions rigoureusement équivalentes.

       On compare donc la progression réelle. Si elle est la même, il n'y a rien
       à trancher : on garde la version la plus riche en jetons — l'écart ne
       vient que de quelques secondes de veille — et le joueur n'est pas
       dérangé. La question n'est posée que lorsqu'elle a un sens. */
    const l = JSON.parse(local);
    if (signatureDe(l) === signatureDe(distant.donnees)) {
      return (l.coins || 0) >= (distant.donnees.coins || 0) ? pousser(true) : adopter(distant);
    }
    nuage.etat = 'conflit'; renderNuage(); return proposerConflit(distant);
  }
  if (serveurBouge) return adopter(distant);
  if (localBouge) return pousser(true);

  nuage.majLe = distant.maj_le;
  nuage.etat = 'ok';
  renderNuage();
}

function adopter(distant) {
  state = Object.assign(freshState(), distant.donnees);
  state.stats = Object.assign(freshState().stats, distant.donnees.stats || {});
  if (!commandeValide(state.commande)) state.commande = null;
  state.revision = null;        // même raison qu'au chargement local, voir load()
  invalideRevenu();
  const s = JSON.stringify(state);
  try { localStorage.setItem(SAVE_KEY, s); } catch {}
  ecrireSync({ majLe: distant.maj_le, empreinte: empreinte(s) });
  nuage.majLe = distant.maj_le;
  nuage.etat = 'ok';
  renderAll(); renderNuage();
  toast(`☁ Partie en ligne récupérée — ${fmt(uniqueCount(state))} nombres.`, 'good');
}

/* ---------- montée ---------- */
async function pousser(force = false) {
  if (!nuage.dispo || !nuage.connecte || _enVol) return;
  const local = localStorage.getItem(SAVE_KEY);
  if (!local) return;

  const emp = empreinte(local);
  if (!force && emp === lireSync().empreinte) return;   // rien n'a changé

  _enVol = true;
  nuage.etat = 'envoi'; renderNuage();
  try {
    const r = await appel('/partie', { method: 'PUT', body: JSON.stringify({ donnees: JSON.parse(local) }) });
    ecrireSync({ majLe: r.maj_le, empreinte: emp });
    nuage.majLe = r.maj_le;
    _derniereSignature = signatureUtile();
    nuage.etat = 'ok';
    nuage.detail = r.suspect || '';
  } catch (e) {
    nuage.etat = 'erreur';
    nuage.detail = e.message;
  } finally {
    _enVol = false;
    renderNuage();
  }
}

/* Appelé par `save()`. On ne monte pas à chaque action : le débit serait absurde
   pour une sauvegarde de 400 Ko. */
function nuageMarquer() {
  if (!nuage.dispo || !nuage.connecte || _minuteur) return;
  const sig = signatureUtile();
  if (sig === _derniereSignature) return;        // rien n'a avancé : inutile de monter
  _derniereSignature = sig;
  _minuteur = setTimeout(() => { _minuteur = null; pousser(); }, DELAI_POUSSEE);
}

/* ---------- compte ---------- */
async function sInscrire(pseudo) {
  const r = await appel('/inscription', { method: 'POST', body: JSON.stringify({ pseudo }) });
  Object.assign(nuage, { connecte: true, pseudo: r.pseudo, code: r.code, etat: 'ok' });
  ecrireSync({});
  await pousser(true);
  renderNuage();
  return r;
}

async function reprendre(code) {
  const r = await appel('/reprise', { method: 'POST', body: JSON.stringify({ code }) });
  Object.assign(nuage, { connecte: true, pseudo: r.pseudo, code: r.code });
  if (r.donnees) adopter(r);
  else { nuage.etat = 'ok'; await pousser(true); }
  return r;
}

async function delier() {
  await appel('/deconnexion', { method: 'POST' });
  Object.assign(nuage, { connecte: false, pseudo: null, code: null, etat: 'anonyme' });
  ecrireSync({});
  renderNuage();
}

/* ============================================================
   INTERFACE
   ============================================================ */
const ETATS = {
  sonde:   ['◌', 'Connexion…',            'attente'],
  absent:  ['⌁', 'Partie locale',         'absent'],
  anonyme: ['☁', 'Partie non protégée',   'anonyme'],
  ok:      ['☁', 'Sauvegardée en ligne',  'ok'],
  envoi:   ['☁', 'Envoi…',                'attente'],
  erreur:  ['⚠', 'Synchro impossible',    'erreur'],
  conflit: ['⚠', 'Deux versions',         'erreur'],
};

function renderNuage() {
  const b = $('#nuageBtn');
  if (!b) return;
  const [icone, texte, classe] = ETATS[nuage.etat] || ETATS.sonde;
  b.className = 'nuage ' + classe;
  b.innerHTML = `<span class="nIc">${icone}</span><span class="nTxt">${nuage.pseudo || texte}</span>`;
  /* On ne masque plus l'indicateur hors ligne. Sans serveur, le joueur doit
     savoir que sa partie ne tient qu'à ce navigateur — et pouvoir l'emporter. */
  b.title = nuage.detail ? `${texte} — ${nuage.detail}` : texte;
}

function ouvrirNuage() {
  const boite = $('#modalBox');
  boite.style.setProperty('--rc', 'var(--accent)');

  const corps = nuage.dispo === false ? `
    <p>Cette version du jeu tourne <b>sans serveur</b> : il n'y a ni sauvegarde en ligne,
       ni classement. Votre partie n'existe que dans ce navigateur.</p>
    <p class="tiny">Deux choses l'effacent : vider les données du site, et <b>Safari</b>,
       qui purge le stockage local au bout de sept jours sans visite. Téléchargez un
       fichier de temps en temps, c'est le seul filet disponible ici.</p>
    <div class="nBtns"><button class="btn" id="nFichier">Télécharger ma partie</button></div>`
  : nuage.connecte ? `
    <p>Votre partie est sauvegardée en ligne sous le pseudo <b>${nuage.pseudo}</b>.
       Cet appareil la retrouvera tout seul, même si le navigateur efface ses données.</p>
    <div class="nCode">
      <label>Code de reprise</label>
      <div class="nCodeVal">${nuage.code}</div>
      <p class="tiny">Notez-le. Il sert à retrouver votre partie sur un autre appareil,
         ou si vous effacez vos cookies. C'est la seule clé — personne ne peut vous le renvoyer.</p>
    </div>
    <div class="nBtns">
      <button class="btn sm" id="nSync">Synchroniser maintenant</button>
      <button class="btn ghost sm" id="nFichier">Télécharger un fichier</button>
      <button class="btn ghost sm danger" id="nDelier">Délier cet appareil</button>
    </div>
    <p class="tiny">${nuage.majLe ? 'Dernière synchro : ' + new Date(nuage.majLe).toLocaleString('fr-FR') : 'Jamais synchronisée.'}</p>`
  : `
    <p>Votre partie n'existe que dans ce navigateur. <b>Safari l'efface au bout de sept jours</b>
       sans visite, et vider ses données la supprime partout ailleurs.</p>
    <p>Choisissez un pseudo pour la mettre à l'abri et entrer au classement.
       Aucun e-mail, aucun mot de passe.</p>
    <div class="nForm">
      <input type="text" id="nPseudo" maxlength="24" placeholder="Votre pseudo" autocomplete="off">
      <button class="btn" id="nCreer">Protéger ma partie</button>
    </div>
    <hr>
    <p class="tiny">Vous avez déjà une partie ailleurs ? Entrez son code de reprise.</p>
    <div class="nForm">
      <input type="text" id="nCodeIn" maxlength="20" placeholder="GN-XXXX-XXXX-XXXX" autocomplete="off">
      <button class="btn ghost" id="nReprendre">Reprendre</button>
    </div>
    <div class="nBtns"><button class="btn ghost sm" id="nFichier">Télécharger un fichier</button></div>`;

  boite.innerHTML = `<button class="btn ghost sm modalClose">✕</button>
    <h2>☁ Sauvegarde en ligne</h2>
    <div id="nMsg"></div>
    ${corps}`;

  const msg = (t, k = 'bad') => $('#nMsg').innerHTML = `<div class="${k === 'bad' ? 'gErr' : 'indice'}">${t}</div>`;
  const b = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  boite.querySelector('.modalClose').addEventListener('click', closeModal);
  b('#nCreer', async () => {
    const p = $('#nPseudo').value.trim();
    try { const r = await sInscrire(p); closeModal(); ouvrirNuage();
          toast(`☁ Partie protégée. Notez votre code : <b>${r.code}</b>`, 'gold'); }
    catch (e) { msg(e.message); }
  });
  b('#nReprendre', async () => {
    try { await reprendre($('#nCodeIn').value.trim()); closeModal();
          toast('☁ Partie récupérée.', 'good'); }
    catch (e) { msg(e.message); }
  });
  b('#nSync', async () => { await pousser(true); msg(nuage.etat === 'ok' ? 'Synchronisée.' : nuage.detail, nuage.etat === 'ok' ? 'ok' : 'bad'); });
  b('#nDelier', async () => {
    if (!confirm("Délier cet appareil ? La partie reste en ligne, et le code permet de la reprendre.")) return;
    await delier(); closeModal(); ouvrirNuage();
  });
  b('#nFichier', telechargerSauvegarde);

  montrerSurcouche($('#modal'));
}

/* LES MODALES DE CE FICHIER PASSENT PAR `montrerSurcouche`, comme toutes les
   autres. Elles ajoutaient la classe `on` à la main, ce qui saute l'étape qui
   pose `vu` — la surcouche restait alors à opacité zéro : invisible, mais
   posée sur la page et avalant les clics. L'assistant traite en plus le cas de
   l'onglet en arrière-plan, où `requestAnimationFrame` est gelé.
   Voir js/ui.js. */

/* Dernier recours, sans serveur ni compte : le joueur emporte ses données. */
function telechargerSauvegarde() {
  const contenu = localStorage.getItem(SAVE_KEY) || '{}';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
  a.download = `gacha-des-nombres-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ============================================================
   LA SAUVEGARDE OBSOLÈTE

   POURQUOI CE MÉCANISME. Certaines refontes rendent les anciennes parties
   incohérentes plutôt qu'illisibles : le barème de rareté refait, l'acte 0
   réécrit. Rien ne casse — et c'est bien le problème. Le joueur continue sur
   une partie dont les chiffres ne veulent plus dire ce qu'ils disent, et il ne
   verra jamais ce qui a changé au début du jeu.

   POURQUOI PAS UN NUMÉRO DANS LE CODE. Changer `SAVE_KEY` en `…v2` marche une
   fois, exige un déploiement, et ne se défait pas si l'on s'est trompé. Le
   serveur porte donc le numéro : on le change dans l'admin, sans redéployer,
   et on peut revenir en arrière.

   ON N'OFFRE PAS LE CHOIX, ET C'EST DÉLIBÉRÉ. Une partie déclarée périmée
   l'est vraiment : ses scores ne veulent plus dire ce qu'ils disent, et la
   laisser vivre « pour cette session » revient à laisser jouer une version du
   jeu qu'on ne soutient plus. On explique pourquoi, puis on efface. Pas de
   « plus tard » qu'on repousse indéfiniment, pas de téléchargement d'une
   sauvegarde que plus rien ne saura relire.

   LE FILET N'EST PAS CÔTÉ JOUEUR, IL EST CÔTÉ ADMIN. Si le numéro a été monté
   par erreur, on le redescend dans l'admin et tout le monde rejoue
   normalement à la seconde suivante. C'est précisément ce qu'un numéro figé
   dans le code ne permettait pas.

   ET ON EFFACE DES DEUX CÔTÉS. Vider `localStorage` seul ne sert à rien : la
   sauvegarde du nuage redescendrait à la visite suivante. C'est le même piège
   dans l'autre sens que la suppression côté serveur, que la montée locale
   annulerait aussitôt. Les deux, ou rien.
   ============================================================ */
/* Vraie quand une modale ne doit pas pouvoir être refermée. Lue par
   `closeModal()` dans js/ui.js. */
let _modaleImposee = false;

/* La version inscrite dans la partie. Absente — toutes les parties d'avant ce
   mécanisme — vaut zéro. */
const versionDeLaPartie = () => (state && +state.version) || 0;

/* Le serveur a-t-il déclaré cette partie périmée ? On ne demande rien s'il n'y
   a pas de partie : il n'y a rien à effacer. */
function partieObsolete() {
  if (!nuage.dispo || !nuage.versionExigee) return false;
  if (!_avaitLocal) return false;
  return versionDeLaPartie() < nuage.versionExigee;
}

/* Efface la partie ici ET là-bas, puis recharge sur une page neuve. */
async function effacerPartieObsolete() {
  if (nuage.connecte) {
    /* Un échec réseau ne doit pas empêcher la remise à zéro locale : la
       sauvegarde distante sera écrasée à la première montée de la partie
       neuve, qui porte la bonne version. On le signale sans bloquer. */
    try { await appel('/partie', { method: 'DELETE' }); }
    catch (e) { console.warn('Sauvegarde distante non effacée :', e.message); }
  }
  wipe();
  location.reload();
}

function proposerObsolete() {
  const nb = uniqueCount(state);
  const boite = document.querySelector('#modalBox');
  if (!boite) return;
  boite.style.setProperty('--rc', 'var(--r-legendaire)');
  boite.innerHTML = `<h2>⚠ Cette partie n'est plus à jour</h2>
    <p>Le jeu a changé depuis que vous l'avez commencée — le barème de rareté et
       le début de la partie ont été refaits. Votre sauvegarde reste lisible, mais
       ses chiffres ne veulent plus dire la même chose, et vous ne verriez jamais
       ce qui a été ajouté au commencement.</p>
    <p class="nDetail">Votre partie : <b>${fmt(nb)}</b> nombre${nb > 1 ? 's' : ''},
       version ${versionDeLaPartie()} — le jeu en est à la version
       ${nuage.versionExigee}. Elle va être effacée, ici et sur le serveur.</p>
    <div class="nChoix">
      <button class="btn" id="obEffacer" type="button">Repartir de zéro</button>
    </div>
    <p class="tiny">Il n'y a pas d'autre chemin : le jeu ne sait plus jouer cette
       partie correctement.</p>`;
  /* IMPOSÉE : ni la touche Échap, ni le clic à côté ne la referment. Une
     modale qu'on peut fuir n'impose rien, et c'est bien ce qu'on veut ici. */
  _modaleImposee = true;
  montrerSurcouche(document.querySelector('#modal'));

  boite.querySelector('#obEffacer').addEventListener('click', () => effacerPartieObsolete());
}

/* ---------- conflit ---------- */
function proposerConflit(distant) {
  const local = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
  const nb = s => Object.keys((s && s.owned) || {}).length;
  const jetons = s => Math.floor((s && s.coins) || 0);
  const quand = t => t ? new Date(t).toLocaleString('fr-FR') : 'date inconnue';
  const boite = $('#modalBox');
  boite.style.setProperty('--rc', 'var(--r-legendaire)');
  boite.innerHTML = `<h2>⚠ Deux versions de votre partie</h2>
    <p>Cet appareil et le serveur ont tous deux avancé de leur côté. Je ne choisis pas
       à votre place — l'autre version sera écrasée.</p>
    <div class="nChoix">
      <button class="btn ghost" id="nGarderLocal">
        <b>Garder celle-ci</b>
        <small>${fmt(nb(local))} nombres · ${fmt(jetons(local))} 🪙</small>
        <small>sur cet appareil · ${quand(local.lastTick)}</small></button>
      <button class="btn" id="nGarderDistant">
        <b>Garder celle en ligne</b>
        <small>${fmt(nb(distant.donnees))} nombres · ${fmt(jetons(distant.donnees))} 🪙</small>
        <small>en ligne · ${quand(distant.maj_le)}</small></button>
    </div>
    <p class="tiny">Dans le doute, téléchargez d'abord la version locale.</p>
    <div class="nBtns"><button class="btn ghost sm" id="nFichier">Télécharger celle-ci</button></div>`;

  $('#nGarderLocal').addEventListener('click', async () => { closeModal(); await pousser(true); toast('Version locale conservée.', 'good'); });
  $('#nGarderDistant').addEventListener('click', () => { closeModal(); adopter(distant); });
  $('#nFichier').addEventListener('click', telechargerSauvegarde);
  montrerSurcouche($('#modal'));
}
