// pages-trasporti.js — trasporti.html: tab Tratte · Aeroporti · Prenotazioni · Scadenze.
import { fmtDate, fmtEur, fmtJpy, todayInTokyo } from './app.js';
import { html, mount, icon, extLink, safeUrl, setupTabs, monthLabel, fxRate } from './pages.js';

const money = (eur, rate) => (eur == null || eur === '' ? '' : html`<span class="mono">${fmtEur(eur)}</span>${rate ? html` <span class="mono muted small">${fmtJpy(eur, rate)}</span>` : ''}`);

function bookingBlock(b) {
  if (!b) return '';
  return html`<div class="tr-booking stack">
    <p class="small"><strong>Prenota:</strong> ${b.url ? extLink(b.url, b.site) : b.site || ''}
      ${b.opens ? html` · apre <span class="mono">${fmtDate(b.opens)}</span>` : ''}${b.opensNote ? html` <span class="muted">(${b.opensNote})</span>` : ''}</p>
    ${b.howToPay ? html`<p class="small"><strong>Pagamento:</strong> ${b.howToPay}</p>` : ''}
    ${b.howToCollect ? html`<p class="small"><strong>Ritiro:</strong> ${b.howToCollect}</p>` : ''}
  </div>`;
}

// details: oggetto dell'exporter {cost, how, booking, proCon} (le fixture vecchie avevano una stringa)
function detailsBlock(d) {
  if (!d) return '';
  if (typeof d === 'string') d = { how: d };
  const rows = [['Costo', d.cost], ['Come', d.how], ['Prenotazione', d.booking], ['Pro / contro', d.proCon]].filter((r) => r[1]);
  if (!rows.length) return '';
  return html`<details class="tr-opt__details"><summary class="small">Come funziona</summary>
    <dl class="kv small">${rows.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl></details>`;
}

function option(o, rate) {
  const need = o.bookingNeeded || (o.details && typeof o.details === 'object' ? o.details.booking : '');
  return html`<li class="list-item tr-opt${o.chosen ? ' tr-opt--chosen' : ''}">
    <div class="tr-opt__head row">
      <span class="tr-opt__name">${o.chosen ? html`${icon('check', 'scelta')} ` : ''}${o.name}</span>
      ${o.chosen ? html`<span class="badge badge--done">scelta</span>` : ''}
    </div>
    <div class="tr-opt__meta row small">
      ${o.duration ? html`<span>${icon('clock')} <span class="mono">${o.duration}</span></span>` : ''}
      ${o.costEur != null ? html`<span>${money(o.costEur, rate)} <span class="muted">/pax</span></span>` : ''}
      ${need ? html`<span class="muted">Prenotare: ${need}</span>` : ''}
    </div>
    ${o.note ? html`<p class="small muted">${o.note}</p>` : ''}
    ${detailsBlock(o.details)}
    ${o.chosen ? bookingBlock(o.booking) : (o.booking && o.booking.url ? html`<p class="small">${extLink(o.booking.url, o.booking.site)}</p>` : '')}
  </li>`;
}

function legCard(l, rate) {
  const opts = l.options || [];
  const chosen = opts.filter((o) => o.chosen);
  const others = opts.filter((o) => !o.chosen);
  return html`<article class="card tr-leg stack" id="${l.id}">
    <header class="tr-leg__head">
      <h3 class="h3">${l.title || `${l.from} → ${l.to}`}</h3>
      ${l.subtitle ? html`<p class="small muted">${l.subtitle}</p>` : ''}
    </header>
    <ul class="list">${chosen.map((o) => option(o, rate))}</ul>
    ${others.length ? html`<details class="tr-leg__alts">
      <summary class="small">${others.length === 1 ? '1 alternativa' : `${others.length} alternative`}</summary>
      <ul class="list">${others.map((o) => option(o, rate))}</ul>
    </details>` : ''}
  </article>`;
}

/** Raggruppa per data, in ordine. */
function byDate(list, rate) {
  const groups = new Map();
  [...list].sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((l) => {
    if (!groups.has(l.date)) groups.set(l.date, []);
    groups.get(l.date).push(l);
  });
  if (!groups.size) return html`<p class="empty">Nessuna tratta.</p>`;
  return [...groups].map(([d, ls]) => html`<section class="stack tr-day">
    <h2 class="section-title">${fmtDate(d)}</h2>
    ${ls.map((l) => legCard(l, rate))}
  </section>`);
}

function totalChosen(t, rate) {
  const all = [...(t.legs || []), ...(t.transfers || [])];
  const sum = t.totalChosenEur != null ? Number(t.totalChosenEur) : all.reduce((s, l) => s + (l.options || []).filter((o) => o.chosen).reduce((a, o) => a + (Number(o.costEur) || 0), 0), 0);
  return html`<p class="small muted tr-total">Totale opzioni scelte (tratte + aeroporti): ${money(sum, rate)} a testa</p>`;
}

function guide(t) {
  const g = t.bookingGuide || [];
  if (!g.length) return html`<p class="empty">Nessuna guida prenotazioni.</p>`;
  return html`<div class="grid-2">${g.map((x) => html`<article class="card stack tr-guide">
    <h3 class="h3">${x.what}</h3>
    <dl class="kv">
      ${x.site || x.url ? html`<dt>Dove</dt><dd>${x.url ? extLink(x.url, x.site) : x.site}</dd>` : ''}
      ${x.when ? html`<dt>Quando apre</dt><dd>${x.when}</dd>` : ''}
      ${x.payment ? html`<dt>Pagamento</dt><dd>${x.payment}</dd>` : ''}
      ${x.collect ? html`<dt>Ritiro / in mano</dt><dd>${x.collect}</dd>` : ''}
    </dl>
    ${x.notes ? html`<p class="small muted">${x.notes}</p>` : ''}
  </article>`)}</div>`;
}

// primo dominio nel testo "dove" (es. "japanbusonline.com") → link
const urlIn = (s) => { const m = /((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s·]*)?)/i.exec(s || ''); return m ? safeUrl(m[1]) : ''; };

function checklist(t, today) {
  const items = [...(t.checklist || [])].sort((a, b) => String(a.sortDate || '9999').localeCompare(String(b.sortDate || '9999')));
  if (!items.length) return html`<p class="empty">Nessuna scadenza.</p>`;
  const todo = items.filter((c) => c.status !== 'done').length;
  const groups = new Map();
  items.forEach((c) => { const k = monthLabel(c.sortDate); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); });
  return html`<p class="small muted">${todo} da fare · ${items.length - todo} fatte</p>
  ${[...groups].map(([m, cs]) => html`<section class="stack">
    <h2 class="section-title">${m}</h2>
    <ul class="list card">${cs.map((c) => {
      const done = c.status === 'done';
      const late = !done && c.sortDate && c.sortDate < today;
      const u = safeUrl(c.url) || urlIn(c.where);
      return html`<li class="list-item tr-chk${done ? ' tr-chk--done' : ''}">
        <div class="row tr-chk__head">
          <span class="badge ${done ? 'badge--done' : 'badge--todo'}">${done ? 'fatto' : late ? 'in ritardo' : 'da fare'}</span>
          <span class="mono small">${c.when || ''}</span>
        </div>
        <p class="tr-chk__what">${c.what}</p>
        ${c.where && c.where !== '—' ? html`<p class="small muted">${u ? extLink(u, c.where) : c.where}</p>` : ''}
      </li>`;
    })}</ul>
  </section>`)}`;
}

export async function render(root, { trip, loadData }) {
  const t = await loadData('transport');
  if (!t) { mount(root, html`<h1 class="h1">Trasporti</h1><p class="empty">Dati trasporti non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const today = todayInTokyo((trip && trip.timezone) || 'Asia/Tokyo');
  mount(root, html`<h1 class="h1">Trasporti</h1><div data-tabs></div>`);
  const todoN = (t.checklist || []).filter((c) => c.status !== 'done').length;
  setupTabs(root.querySelector('[data-tabs]'), [
    { id: 'tratte', label: 'Tratte' },
    { id: 'aeroporti', label: 'Aeroporti' },
    { id: 'prenotazioni', label: 'Prenotazioni' },
    { id: 'scadenze', label: 'Scadenze', count: todoN || null },
  ], (id) => {
    if (id === 'tratte') return html`${byDate(t.legs || [], rate)}${totalChosen(t, rate)}`;
    if (id === 'aeroporti') return byDate(t.transfers || [], rate);
    if (id === 'prenotazioni') return guide(t);
    return checklist(t, today);
  }, { key: 'tr' });
}
