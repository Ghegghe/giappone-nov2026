// pages-alloggi.js — alloggi.html: le basi in ordine cronologico + Logistica (Bagagli · Giorno 1 · Contanti e carte IC).
import { fmtDate, fmtEur, fmtJpy } from './app.js';
import { html, mount, icon, mapsBtn, extLink, setupTabs, fxRate } from './pages.js';

const TYPE = { apartment: 'Appartamento', hotel: 'Hotel', hostel: 'Ostello', ryokan: 'Ryokan', guesthouse: 'Guesthouse', capsule: 'Capsule' };
const STATUS = { booked: 'prenotato', todo: 'da prenotare', option: 'opzione' };
const jpy = (n) => '¥' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const list = (x) => (Array.isArray(x) ? x : x ? [x] : []);

function stayCard(s, rate, people) {
  const nights = s.nights != null ? s.nights : '';
  return html`<article class="card stack al-stay" id="${s.id}">
    <header class="al-stay__head">
      <p class="small muted al-stay__city">${s.city}${s.area ? ` · ${s.area}` : ''}</p>
      <h2 class="h2">${s.name}</h2>
      <div class="row">
        ${s.type ? html`<span class="badge">${TYPE[s.type] || s.type}</span>` : ''}
        ${s.status ? html`<span class="badge ${s.status === 'booked' ? 'badge--done' : 'badge--todo'}">${STATUS[s.status] || s.status}</span>` : ''}
        ${s.paid === true ? html`<span class="badge badge--done">pagato</span>` : s.paid === false ? html`<span class="badge badge--todo">da pagare / in loco</span>` : ''}
      </div>
    </header>
    <dl class="kv">
      <dt>Date</dt><dd>${fmtDate(s.checkIn)} → ${fmtDate(s.checkOut)}${nights !== '' ? html` · <strong>${nights} ${nights === 1 ? 'notte' : 'notti'}</strong>` : ''}</dd>
      <dt>Check-in</dt><dd class="mono">${s.checkInTime || '—'}</dd>
      <dt>Check-out</dt><dd class="mono">${s.checkOutTime || '—'}</dd>
      ${s.address ? html`<dt>Indirizzo</dt><dd>${s.address}</dd>` : ''}
      ${s.costEurTotal != null ? html`<dt>Costo</dt><dd><span class="mono">${fmtEur(s.costEurTotal)}</span> gruppo${s.costEurPerPerson != null || people ? html` · <span class="mono">${fmtEur(s.costEurPerPerson != null ? s.costEurPerPerson : s.costEurTotal / people)}</span>/pax` : ''}${s.costJpyTotal != null ? html` <span class="mono muted small">(${jpy(s.costJpyTotal)} in struttura)</span>` : rate ? html` <span class="mono muted small">(${fmtJpy(s.costEurTotal, rate)})</span>` : ''}</dd>` : ''}
      ${s.payment ? html`<dt>Pagamento</dt><dd>${s.payment}</dd>` : ''}
    </dl>
    ${list(s.notes).length ? html`<ul class="al-notes small">${list(s.notes).map((n) => html`<li>${n}</li>`)}</ul>` : ''}
    <div class="row">${mapsBtn(s.mapsQuery || `${s.name} ${s.city}`)}${s.url ? extLink(s.url, 'Sito', 'btn btn--ghost') : ''}</div>
  </article>`;
}

function steps(arr) {
  return html`<ol class="al-steps stack">${arr.map((p, i) => html`<li class="card al-step">
    <div class="row al-step__head">
      <span class="al-step__n mono" aria-hidden="true">${p.step != null ? p.step : i + 1}</span>
      <div class="stack">
        ${p.when ? html`<p class="small muted mono">${p.when}</p>` : ''}
        <h3 class="h3">${p.title}</h3>
      </div>
    </div>
    ${p.where ? html`<p class="small"><strong>Dove:</strong> ${p.where}</p>` : ''}
    ${p.details ? html`<p class="small">${p.details}</p>` : ''}
    ${p.cost && p.cost !== '—' ? html`<p class="small"><strong>Costo:</strong> <span class="mono">${p.cost}</span></p>` : ''}
    ${p.open && p.open !== '—' ? html`<p class="small muted"><strong>Da chiudere:</strong> ${p.open}</p>` : ''}
    ${p.mapsQuery || p.url ? html`<div class="row">${p.mapsQuery ? mapsBtn(p.mapsQuery, 'Maps', 'btn') : ''}${p.url ? extLink(p.url, null, 'btn btn--ghost') : ''}</div>` : ''}
  </li>`)}</ol>`;
}

// passi bagagli dell'exporter {phase, what, when, notes} → forma comune di steps()
const lugStep = (x, i) => (x.title ? x : { step: i + 1, when: [x.phase, x.when].filter(Boolean).join(' · '), title: x.what, details: x.notes });

function lugOptions(opts) {
  if (!opts.length) return '';
  return html`<details class="card al-lug-alts"><summary class="small">Opzioni valutate (${opts.length})</summary>
    <ul class="list">${opts.map((o) => html`<li class="list-item stack">
      <p><strong>${o.name}</strong>${o.chosen ? html` <span class="badge badge--done">scelta</span>` : ''}${o.eurGroup != null ? html` <span class="mono small muted">${fmtEur(o.eurGroup)} gruppo</span>` : ''}</p>
      ${o.how ? html`<p class="small">${o.how}</p>` : ''}
      ${o.pro && o.pro !== '—' ? html`<p class="small"><strong>Pro:</strong> ${o.pro}</p>` : ''}
      ${o.con && o.con !== '—' ? html`<p class="small muted"><strong>Contro:</strong> ${o.con}</p>` : ''}
    </li>`)}</ul></details>`;
}

function lugQuestions(qs) {
  if (!qs.length) return '';
  const open = qs.filter((q) => q.status !== 'resolved');
  return html`<details class="card al-lug-q"${open.length ? ' open' : ''}><summary class="small">Domande verificate${open.length ? ` · ${open.length} aperta` + (open.length > 1 ? 'e' : '') : ''}</summary>
    <ul class="list">${qs.map((q) => html`<li class="list-item stack">
      <p><span class="badge ${q.status === 'resolved' ? 'badge--done' : 'badge--todo'}">${q.status === 'resolved' ? 'risolta' : 'aperta'}</span> <strong>${q.question}</strong></p>
      ${q.answer ? html`<p class="small">${q.answer}</p>` : html`<p class="small muted">${q.why || ''}${q.who && q.who !== '—' ? ` · fonte: ${q.who}` : ''}</p>`}
    </li>`)}</ul></details>`;
}

function luggage(l) {
  if (!l) return html`<p class="empty">Nessun piano bagagli.</p>`;
  return html`<div class="stack">
    <div class="card card--accent stack">
      ${l.choice ? html`<h2 class="h3">${l.choice}</h2>` : ''}
      ${l.summary ? html`<p>${l.summary}</p>` : ''}
      ${l.costNote ? html`<p class="small mono">${l.costNote}</p>` : ''}
      ${l.url ? html`<p class="small">${extLink(l.url, 'Tracking Yamato')}</p>` : ''}
    </div>
    ${steps(list(l.steps).map(lugStep))}
    ${list(l.notes).length ? html`<ul class="small muted al-notes">${list(l.notes).map((n) => html`<li>${n}</li>`)}</ul>` : ''}
    ${l.rules ? html`<p class="small muted">${l.rules}</p>` : ''}
    ${lugOptions(list(l.options))}
    ${lugQuestions(list(l.openQuestions))}
  </div>`;
}

function infoBlock(b, fallbackTitle) {
  if (!b) return '';
  const a = b.atArrival;
  return html`<section class="card stack">
    <h2 class="h3">${b.title || fallbackTitle}</h2>
    ${b.summary || b.rule ? html`<p>${b.summary || b.rule}</p>` : ''}
    ${list(b.rules).length ? html`<ul class="al-notes small">${list(b.rules).map((r) => html`<li>${r}</li>`)}</ul>` : ''}
    ${a ? html`<div class="stack"><p class="small muted">All'arrivo (giorno 1, passo ${a.step != null ? a.step : ''})</p>${steps([a])}</div>` : ''}
    ${list(b.reminders).length ? html`<ul class="al-notes small">${list(b.reminders).map((r) => html`<li>${r}</li>`)}</ul>` : ''}
  </section>`;
}

export async function render(root, { trip, loadData }) {
  const d = await loadData('lodging');
  if (!d) { mount(root, html`<h1 class="h1">Alloggi</h1><p class="empty">Dati alloggi non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const people = (trip && trip.people) || null;
  const stays = [...(d.stays || [])].sort((a, b) => String(a.checkIn).localeCompare(String(b.checkIn)));
  const nights = stays.reduce((n, s) => n + (Number(s.nights) || 0), 0);
  const lg = d.logistics || {};
  mount(root, html`
    <h1 class="h1">Alloggi</h1>
    <p class="muted">${stays.length} basi · ${nights} notti</p>
    <div class="grid-2 al-stays">${stays.map((s) => stayCard(s, rate, people))}</div>
    <section class="stack al-logistics" aria-labelledby="al-log-h">
      <h2 class="section-title" id="al-log-h">Logistica</h2>
      <div data-tabs></div>
    </section>`);
  const tabs = [];
  if (lg.luggage) tabs.push({ id: 'bagagli', label: 'Bagagli' });
  if (list(lg.day1).length) tabs.push({ id: 'giorno1', label: 'Giorno 1' });
  if (lg.cash || lg.icCard) tabs.push({ id: 'contanti', label: 'Contanti e carte IC' });
  const host = root.querySelector('[data-tabs]');
  if (!tabs.length) { mount(host, html`<p class="empty">Nessuna informazione logistica.</p>`); return; }
  setupTabs(host, tabs, (id) => {
    if (id === 'bagagli') return luggage(lg.luggage);
    if (id === 'giorno1') return steps(list(lg.day1));
    return html`${infoBlock(lg.cash, 'Contanti')}${infoBlock(lg.icCard, 'Carta IC')}`;
  }, { key: 'al' });
}
