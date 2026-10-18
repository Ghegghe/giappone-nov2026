// pages-luogo.js — luogo.html?id=<placeId> (SPEC §12): scheda di un locale da consultare sul posto (menu, prenotazione,
// frasi da mostrare). Senza id (o id sconosciuto): elenco delle schede. Il corpo `html` arriva convertito e sanificato
// dall'exporter (export_site_places.py, stesso convertitore delle guide): qui si inserisce così com'è, con il controllo
// difensivo delle guide. Tutto il resto è escapato da html``.
import { fmtDate } from './app.js';
import { html, raw, mount, icon, pageUrl, mapsBtn } from './pages.js';
import { longDate, UNSAFE, keepDataLinks } from './pages-guide.js';

const wantedId = () => { try { return new URLSearchParams(location.search).get('id') || ''; } catch (e) { return ''; } };

/** "dom 8 nov · 13:00-14:20" → link alla tappa nel giorno. */
function visitChip(v) {
  const t = v.time ? ` · ${v.time}${v.end ? `-${v.end}` : ''}` : '';
  return html`<a class="chip" href="${pageUrl(`giorno.html#${v.itemId || ''}`, { d: v.date })}">${icon('calendar')} ${fmtDate(v.date)}${t}</a>`;
}

function backLink() {
  return html`<nav class="g-back" aria-label="Percorso"><a class="btn btn--ghost btn--sm" href="${pageUrl('luoghi.html')}" data-back>${icon('chevron-left')}<span>Indietro</span></a></nav>`;
}

// "Indietro" torna alla pagina da cui si è arrivati (giorno, agenda, Luoghi); aperta da un link esterno → Luoghi
function bindBack(root) {
  const a = root.querySelector('[data-back]');
  let same = false;
  try { same = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) { /* ignore */ }
  if (a && same && history.length > 1) a.addEventListener('click', (e) => { e.preventDefault(); history.back(); });
}

// frasi da mostrare (<figure class="l-phrase">): tocco = grande a tutto schermo, di nuovo tocco o Esc = chiudi
function bindPhrases(root) {
  const close = (f) => { f.classList.remove('l-phrase--big'); f.setAttribute('aria-pressed', 'false'); document.body.classList.remove('l-noscroll'); };
  root.querySelectorAll('.prose figure.l-phrase').forEach((f) => {
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    f.setAttribute('aria-pressed', 'false');
    f.setAttribute('title', 'Tocca per ingrandire (da mostrare al cuoco)');
    const toggle = () => {
      const on = !f.classList.contains('l-phrase--big');
      root.querySelectorAll('.l-phrase--big').forEach(close);
      if (on) { f.classList.add('l-phrase--big'); f.setAttribute('aria-pressed', 'true'); document.body.classList.add('l-noscroll'); }
    };
    f.addEventListener('click', (e) => { if (!e.target.closest('a')) toggle(); });
    f.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape') close(f);
    });
  });
}

// tabelle larghe (menu: 4+ colonne): su telefono diventano schede impilate; l'etichetta di colonna va su ogni cella
function cardTables(root) {
  root.querySelectorAll('.prose .g-table table').forEach((t) => {
    const heads = [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    if (heads.length < 4) return;
    t.closest('.g-table').classList.add('l-cards');
    t.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (heads[i]) td.dataset.label = heads[i]; }));
  });
}

function renderDetail(root, x, trip) {
  const safe = !UNSAFE.test(x.html || '');
  if (!safe) console.warn('[luogo] corpo scartato: contenuto non sicuro in', x.id);
  const upd = longDate(x.updated);
  const visits = x.visits || [];
  const days = visits.length ? [] : (x.dates || []);   // date senza tappa in agenda: chip al giorno
  mount(root, html`
    ${backLink()}
    <article class="g-article l-article" aria-labelledby="l-title">
      <header class="stack l-head">
        <h1 class="h1" id="l-title">${x.title}</h1>
        ${x.summary ? html`<p class="g-lede">${x.summary}</p>` : ''}
        <p class="small muted">${upd ? html`Aggiornata il <time datetime="${x.updated}">${upd}</time>` : ''}</p>
        ${x.address || x.access ? html`<dl class="kv l-facts">
          ${x.address ? html`<dt>Indirizzo</dt><dd>${x.address}</dd>` : ''}
          ${x.access ? html`<dt>Come arrivare</dt><dd>${x.access}</dd>` : ''}
        </dl>` : ''}
        ${visits.length || days.length ? html`<p class="row l-when" aria-label="In agenda">
          ${visits.map(visitChip)}${days.map((d) => html`<a class="chip" href="${pageUrl('giorno.html', { d })}">${icon('calendar')} ${fmtDate(d)}</a>`)}</p>` : ''}
        ${x.mapsQuery ? html`<p class="row">${mapsBtn(x.mapsQuery, 'Apri in Google Maps')}</p>` : ''}
      </header>
      <div class="prose l-prose">${safe ? raw(x.html || '') : html`<p class="empty">Questa scheda non si può mostrare. Rigenerare i dati del sito.</p>`}</div>
    </article>`);
  keepDataLinks(root.querySelector('.prose'));
  bindBack(root);
  bindPhrases(root);
  cardTables(root);
  document.title = [x.title, (trip && trip.title) || ''].filter(Boolean).join(' · ');
}

function renderIndex(root, list, missing) {
  mount(root, html`
    <header class="g-head">
      <h1 class="h1">Schede dei locali</h1>
      <p class="muted">Menu, prenotazione e frasi pronte dei locali dove andremo.</p>
    </header>
    ${missing ? html`<p class="empty g-missing">La scheda «${missing}» non c'è: ecco tutte le schede.</p>` : ''}
    ${list.length ? html`<ul class="g-index" role="list">${list.map((x) => html`
      <li><a class="card g-card" href="${pageUrl('luogo.html', { id: x.id })}">
        <span class="g-tile" aria-hidden="true">${icon('book')}</span>
        <span class="g-card__body">
          <span class="g-card__title">${x.title}</span>
          ${x.summary ? html`<span class="g-card__summary">${x.summary}</span>` : ''}
          ${(x.dates || []).length ? html`<span class="small muted">${x.dates.map((d) => fmtDate(d)).join(' · ')}</span>` : ''}
        </span>
        ${icon('chevron-right')}
      </a></li>`)}</ul>` : html`<p class="empty">Ancora nessuna scheda.</p>`}
    <p><a class="btn btn--ghost" href="${pageUrl('luoghi.html')}">${icon('chevron-left')}<span>Tutti i luoghi</span></a></p>`);
}

export async function render(root, { trip, loadData }) {
  const d = await loadData('place-details');
  if (!d) { mount(root, html`<h1 class="h1">Scheda</h1><p class="empty">Le schede non sono disponibili. Ricarica la pagina.</p>`); return; }
  const list = (d.details || []).filter((x) => x && x.id);
  const id = wantedId();
  const x = list.find((y) => y.id === id || y.placeId === id);
  if (x) renderDetail(root, x, trip);
  else renderIndex(root, list, id);
}
