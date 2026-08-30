/* ============================================================
   Navigation des pages de contenu.

   La ruse : ces pages sont de vraies pages HTML, à de vraies
   adresses, avec leur contenu dans le document servi — c'est ce
   que le robot d'indexation vient chercher, et ce dont dépend
   toute la demande AdSense.

   Mais pour un visiteur, on ne recharge rien : on récupère la page
   suivante, on remplace le contenu, et l'historique suit. Si le
   script est absent ou échoue, les liens restent des liens et la
   navigation se fait normalement. Le référencement ne dépend
   jamais du JavaScript ; seul le confort en dépend.
   ============================================================ */

(function () {
  const interne = a =>
    a && a.getAttribute('href') &&
    !a.hasAttribute('target') &&
    /^[\w-]+\.html(#|$)/.test(a.getAttribute('href')) &&
    !a.getAttribute('href').startsWith('index.html');   // le jeu est une autre application

  /* On précharge au survol : la page est en cache avant même le clic. */
  const precharges = new Set();
  function precharger(url) {
    if (precharges.has(url)) return;
    precharges.add(url);
    const l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = url;
    document.head.appendChild(l);
  }

  async function aller(url, pousser = true) {
    let html;
    try {
      const r = await fetch(url, { credentials: 'same-origin' });
      if (!r.ok) throw new Error(r.status);
      html = await r.text();
    } catch {
      location.href = url;                     // en cas d'échec, navigation normale
      return;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const neuf = doc.querySelector('main.page');
    const nav = doc.querySelector('.navDoc');
    if (!neuf || !nav) { location.href = url; return; }

    document.querySelector('main.page').replaceWith(neuf);
    document.querySelector('.navDoc').replaceWith(nav);
    document.title = doc.title;
    const d = doc.querySelector('meta[name=description]');
    const dLocal = document.querySelector('meta[name=description]');
    if (d && dLocal) dLocal.setAttribute('content', d.getAttribute('content'));

    // On conserve la requête (?pubs) : sinon l'aperçu s'éteint à la
    // première navigation, ce qui est déroutant.
    if (pousser) history.pushState({ doc: url }, '', url + location.search);
    window.scrollTo(0, 0);
    cabler();
    if (typeof majPubVue === 'function') majPubVue();
  }

  function cabler() {
    document.querySelectorAll('a').forEach(a => {
      if (!interne(a) || a.dataset.cable) return;
      a.dataset.cable = '1';
      a.addEventListener('mouseenter', () => precharger(a.getAttribute('href')), { once: true });
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        aller(a.getAttribute('href'));
      });
    });
  }

  window.addEventListener('popstate', e => {
    if (e.state && e.state.doc) aller(e.state.doc, false);
  });

  /* La page d'arrivée n'a pas d'état d'historique : sans ça, revenir en arrière
     depuis la deuxième page changeait l'adresse sans remettre le contenu. */
  const ici = location.pathname.split('/').pop() || 'index.html';
  history.replaceState({ doc: ici }, '', location.href);

  cabler();
})();
