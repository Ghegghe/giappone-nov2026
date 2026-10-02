// pages-trasporti.js — trasporti.html: tab Tratte · Aeroporti · Prenotazioni · Scadenze.
// Card tratta = vista breve (opzione scelta, durata, €/¥, una riga di nota, prenotazione ripiegata);
// la tab Prenotazioni è la vista estesa con tutti i dettagli aperti.
import { fmtDate, fmtEur, fmtJpy, todayInTokyo } from './app.js';
import { html, mount, icon, extLink, safeUrl, setupTabs, monthLabel, fxRate, internalLinks, deadlineLabel, deadlineState } from './pages.js';

const money = (eur, rate) => (eur == null || eur === '' ? '' : html`<span class="mono">${fmtEur(eur)}</span>${rate ? html` <span class="mono muted small">${fmtJpy(eur, rate)}</span>` : ''}`);
const BOOK = { todo: ['badge--todo', 'da prenotare'], done: ['badge--done', 'prenotato'] };

function opensText(b) {
  if (!b) return '';
  if (b.opensApprox) return b.opensNote ? `quando: ${b.opensNote}` : '';
  if (b.opens) return `apre ${fmtDate(b.opens)}${b.opensNote ? ` · ${b.opensNote}` : ''}`;
  return b.opensNote || '';
}

/** <details> "Come si prenota e si ritira": Prenota · Pagamento · Ritiro (+ come funziona / pro-contro / altre note). */
function howTo(o) {
  const b = o.booking;
  const d = o.details && typeof o.details === 'object' ? o.details : (o.details ? { how: o.details } : null);
  const rows = [];
  if (b) {
    const site = b.url ? extLink(b.url, b.site || null) : b.site;
    const when = opensText(b);
    if (site || when) rows.push(['Prenota', html`${site || ''}${b.siteNote ? html` <span class="muted">(${b.siteNote})</span>` : ''}${when ? html`${site ? html`<br>` : ''}<span class="muted">${when}</span>` : ''}`]);
    if (b.howToPay) rows.push(['Pagamento', b.howToPay]);
    if (b.howToCollect) rows.push(['Ritiro', b.howToCollect]);
  }
  if (d) {
    if (d.how) rows.push(['Come funziona', d.how]);
    if (d.proCon) rows.push(['Pro e contro', d.proCon]);
  } else if ((o.noteMore || []).length) {
    rows.push(['Altre note', html`<ul class="al-notes">${o.noteMore.map((n) => html`<li>${n}</li>`)}</ul>`]);
  }
  if (!rows.length) return '';
  return html`<details class="tr-opt__details"><summary class="small">${b ? 'Come si prenota e si ritira' : 'Dettagli'}</summary>
    <dl class="kv small">${rows.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl></details>`;
}

function meta(o, rate) {
  const b = o.booking;
  const st = b && BOOK[b.status];
  return html`<div class="tr-opt__meta row small">
    ${o.duration ? html`<span>${icon('clock')} <span class="mono">${o.duration}</span></span>` : ''}
    ${o.costEur != null ? html`<span>${money(o.costEur, rate)} <span class="muted">a testa</span></span>` : ''}
    ${st ? html`<span class="badge ${st[0]}">${st[1]}</span>` : ''}
    ${b && b.status === 'todo' && opensText(b) ? html`<span class="muted">${opensText(b)}</span>` : ''}
  </div>`;
}

/** Opzione scelta, sulla card. */
function chosen(o, leg, rate) {
  const line = leg.summary || o.noteShort || '';
  return html`<div class="tr-opt tr-opt--chosen">
    <div class="tr-opt__head row"><span class="tr-opt__name">${icon('check', 'scelta')} ${o.name}</span></div>
    ${meta(o, rate)}
    ${line ? html`<p class="small">${line}</p>` : ''}
    ${howTo(o)}
  </div>`;
}

/** Alternativa (ripiegata): nota completa. */
function alternative(o, rate) {
  return html`<li class="list-item tr-opt">
    <div class="tr-opt__head row"><span class="tr-opt__name">${o.name}</span></div>
    ${meta(o, rate)}
    ${o.note ? html`<p class="small muted">${o.note}</p>` : ''}
    ${o.details ? howTo({ details: o.details }) : ''}
  </li>`;
}

function legCard(l, rate) {
  const opts = l.options || [];
  const ch = opts.filter((o) => o.chosen);
  const others = opts.filter((o) => !o.chosen);
  return html`<article class="card tr-leg stack" id="${l.id}">
    <header class="tr-leg__head">
      <h3 class="h3">${l.title || `${l.from} → ${l.to}`}</h3>
      ${l.subtitle ? html`<p class="small muted">${l.subtitle}</p>` : ''}
    </header>
    ${ch.map((o) => chosen(o, l, rate))}
    ${others.length ? html`<details class="tr-leg__alts">
      <summary class="small">${others.length === 1 ? '1 alternativa' : `${others.length} alternative`}</summary>
      <ul class="list">${others.map((o) => alternative(o, rate))}</ul>
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
  return html`<p class="small muted tr-total">Totale delle opzioni scelte (tratte e aeroporti): ${money(sum, rate)} a testa</p>`;
}

/** Vista estesa: una card per prenotazione, tutto visibile. */
function guide(t) {
  const g = t.bookingGuide || [];
  if (!g.length) return html`<p class="empty">Nessuna prenotazione da fare.</p>`;
  return html`<div class="grid-2">${g.map((x) => html`<article class="card stack tr-guide"${x.id ? html` id="${x.id}"` : ''}>
    <h3 class="h3">${x.what}</h3>
    <dl class="kv small">
      ${x.site || x.url ? html`<dt>Dove</dt><dd>${x.url ? extLink(x.url, x.site || null) : x.site}${x.siteNote ? html` <span class="muted">(${x.siteNote})</span>` : ''}</dd>` : ''}
      ${x.when ? html`<dt>Quando</dt><dd>${x.when}</dd>` : ''}
      ${x.payment ? html`<dt>Pagamento</dt><dd>${x.payment}</dd>` : ''}
      ${x.collect ? html`<dt>Biglietto</dt><dd>${x.collect}</dd>` : ''}
    </dl>
    ${x.notes ? html`<p class="small muted">${x.notes}</p>` : ''}
    ${internalLinks(x.links)}
  </article>`)}</div>`;
}

// primo dominio nel testo "dove" (es. "japanbusonline.com") → link
const urlIn = (s) => { const m = /((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s·]*)?)/i.exec(s || ''); return m ? safeUrl(m[1]) : ''; };

// "westjr.co.jp/travel-information/en/…" → "westjr.co.jp" (il link completo resta nell'href)
const shortUrls = (s) => String(s || '').replace(/((?:[a-z0-9-]+\.)+[a-z]{2,})\/\S+/gi, '$1');

function chkRow(c, todayIt) {
  const st = deadlineState(c, todayIt);
  const u = safeUrl(c.url) || urlIn(c.where);
  const lab = { done: ['badge--done', 'fatto'], late: ['badge--todo', 'in ritardo'], today: ['badge--draft', 'oggi'], todo: ['badge--todo', 'da fare'] }[st];
  return html`<li class="list-item tr-chk${st === 'done' ? ' tr-chk--done' : ''}">
    <div class="row tr-chk__head">
      <span class="small"><span class="mono">${deadlineLabel(c)}</span>${c.whenDetail ? html` <span class="muted">· ${c.whenDetail}</span>` : ''}</span>
      <span class="badge ${lab[0]}">${lab[1]}</span>
    </div>
    <p class="tr-chk__what">${c.what}</p>
    ${c.where ? html`<p class="small muted">${u ? extLink(u, shortUrls(c.where)) : c.where}</p>` : ''}
    ${internalLinks(c.links)}
  </li>`;
}

function checklist(t, todayIt) {
  const items = [...(t.checklist || [])].sort((a, b) => String(a.sortDate || '9999').localeCompare(String(b.sortDate || '9999')));
  if (!items.length) return html`<p class="empty">Nessuna scadenza.</p>`;
  const todo = items.filter((c) => c.status !== 'done');
  const done = items.filter((c) => c.status === 'done');
  const groups = new Map();
  todo.forEach((c) => { const k = monthLabel(c.sortDate); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); });
  return html`<p class="small muted">${todo.length} da fare · ${done.length} già fatte</p>
  ${[...groups].map(([m, cs]) => html`<section class="stack">
    <h2 class="section-title">${m}</h2>
    <ul class="list card">${cs.map((c) => chkRow(c, todayIt))}</ul>
  </section>`)}
  ${done.length ? html`<details class="card tr-done"><summary class="small">Già fatte (${done.length})</summary>
    <ul class="list">${done.map((c) => chkRow(c, todayIt))}</ul></details>` : ''}`;
}

export async function render(root, { trip, loadData }) {
  const t = await loadData('transport');
  if (!t) { mount(root, html`<h1 class="h1">Trasporti</h1><p class="empty">Dati dei trasporti non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const todayIt = todayInTokyo('Europe/Rome'); // scadenze di prenotazione = azioni da fare dall'Italia
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
    return checklist(t, todayIt);
  }, { key: 'tr' });
}
