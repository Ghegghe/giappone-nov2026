// pages-alloggi.js — alloggi.html: striscia della rotta come indice, poi le basi in ordine cronologico (prezzo e pagamento in alto)
// + Logistica (Bagagli · Giorno 1 · Contanti e carte IC) + "Da chiarire" in fondo.
import { fmtDate, fmtEur, todayInTokyo } from './app.js';
import { html, mount, icon, mapsIconBtn, extLink, setupTabs } from './pages.js';

const TYPE = { apartment: 'Appartamento', hotel: 'Hotel', hostel: 'Ostello', ryokan: 'Ryokan', guesthouse: 'Guesthouse', capsule: 'Capsule' };
const jpy = (n) => '¥' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const list = (x) => (Array.isArray(x) ? x : x ? [x] : []);

function payBadge(s) {
  if (s.paid === true) return html`<span class="badge badge--done">pagato</span>`;
  if (s.payment === 'in struttura') return html`<span class="badge badge--todo">si paga in struttura</span>`;
  if (s.paid === false) return html`<span class="badge badge--draft">pagamento da verificare</span>`;
  return '';
}

/** Riga prezzo e pagamento (2° elemento della card): è quella che decide le azioni. */
function priceRow(s, people) {
  const pax = s.costEurPerPerson != null ? s.costEurPerPerson : people && s.costEurTotal != null ? s.costEurTotal / people : null;
  const badge = payBadge(s);
  if (s.costEurTotal == null && !badge) return '';
  return html`<div class="al-price">
    ${s.costEurTotal != null ? html`<p class="al-price__eur"><span class="al-price__tot">${fmtEur(s.costEurTotal)}</span><span class="sr-only"> in tutto</span>${pax != null ? html`<span class="small"> · ${fmtEur(pax)} <span class="muted">a testa</span></span>` : ''}</p>` : ''}
    ${badge}
    ${s.costJpyTotal != null ? html`<p class="small al-price__jpy"><span class="mono">${jpy(s.costJpyTotal)}</span> in contanti</p>` : ''}
  </div>`;
}

const NOTES_SHOWN = 2;
function notesBlock(notes) {
  if (!notes.length) return '';
  const head = notes.slice(0, NOTES_SHOWN), rest = notes.slice(NOTES_SHOWN);
  return html`<ul class="al-notes small">${head.map((x) => html`<li>${x}</li>`)}</ul>
    ${rest.length ? html`<details class="al-more"><summary class="small">${rest.length === 1 ? 'Altra nota' : `Altre ${rest.length} note`}</summary>
      <ul class="al-notes small">${rest.map((x) => html`<li>${x}</li>`)}</ul></details>` : ''}`;
}

function stayCard(s, people) {
  const n = Number(s.nights) || 0;
  const times = [s.checkInTime ? `check-in ${s.checkInTime}` : '', s.checkOutTime ? `check-out ${s.checkOutTime}` : ''].filter(Boolean);
  const place = s.area && s.area !== s.city ? `${s.area}, ${s.city}` : s.city;
  return html`<article class="card stack al-stay" id="${s.id}" tabindex="-1">
    <header class="al-stay__head">
      <div class="al-stay__title">
        <h2 class="h3">${s.name}</h2>
        <p class="small muted">${[place, TYPE[s.type] || ''].filter(Boolean).join(' · ')}</p>
      </div>
      <div class="row al-stay__actions">${s.url ? extLink(s.url, 'Sito', 'btn btn--ghost') : ''}${mapsIconBtn(s.mapsQuery || `${s.name} ${s.city}`, s.name)}</div>
    </header>
    ${priceRow(s, people)}
    <dl class="kv small">
      <dt>Date</dt><dd>${fmtDate(s.checkIn)} → ${fmtDate(s.checkOut)}${n ? ` · ${n} ${n === 1 ? 'notte' : 'notti'}` : ''}</dd>
      ${times.length ? html`<dt>Orari</dt><dd class="mono">${times.join(' · ')}</dd>` : ''}
      ${s.address ? html`<dt>Indirizzo</dt><dd>${s.address}</dd>` : ''}
    </dl>
    ${notesBlock(list(s.notes))}
  </article>`;
}

/** Testo lungo dei passi: le prime frasi (≈3 righe) visibili, il resto in "continua". */
const CLIP = 100;
function clipText(t, cls = 'small') {
  const str = String(t || '');
  if (str.length <= CLIP + 30) return html`<p class="${cls}">${str}</p>`;
  const parts = str.split(/(?<=[.!?»])\s+(?=[A-ZÀ-Ý0-9«"(])/);
  let head = '';
  let i = 0;
  while (i < parts.length && (!head || (head + ' ' + parts[i]).length <= CLIP)) { head = head ? `${head} ${parts[i]}` : parts[i]; i++; }
  const rest = parts.slice(i).join(' ');
  if (!rest) return html`<p class="${cls}">${str}</p>`;
  return html`<div class="al-clip"><p class="${cls}">${head}</p>
    <details class="al-more"><summary class="small">continua</summary><p class="${cls}">${rest}</p></details></div>`;
}

/** Striscia della rotta come indice della pagina (routeStrip di charts.js); senza il modulo, elenco di link. */
function routeIndex(charts, stays, trip) {
  if (!stays.length) return '';
  let strip = '';
  if (charts && typeof charts.routeStrip === 'function') {
    try {
      strip = charts.routeStrip(stays, { today: todayInTokyo(), start: trip && trip.start, end: trip && trip.end, link: true });
    } catch (e) { console.warn('[alloggi] routeStrip', e); strip = ''; }
  }
  if (strip) return html`<nav class="al-route" aria-label="Le basi del viaggio">${strip}</nav>`;
  return html`<nav class="al-route" aria-label="Le basi del viaggio"><ol class="row al-route__list">${stays.map((s) => {
    const n = Number(s.nights) || 0;
    return html`<li><a class="chip" href="#${s.id}">${s.city}${n ? html` <span class="muted">${n}</span>` : ''}</a></li>`;
  })}</ol></nav>`;
}

/** Lista numerata pulita in una card: [{n, title, when, where, details, cost, remember}] */
function steps(arr) {
  if (!arr.length) return '';
  return html`<ol class="list card al-steps">${arr.map((p, i) => html`<li class="list-item">
    <div class="row al-step__head">
      <span class="al-step__n mono" aria-hidden="true">${p.n != null ? p.n : i + 1}</span>
      <div class="stack">
        <h3 class="h3">${p.title}</h3>
        ${p.when ? html`<p class="small muted">${p.when}</p>` : ''}
        ${p.where ? html`<p class="small">${icon('pin')} ${p.where}</p>` : ''}
        ${p.details ? clipText(p.details) : ''}
        ${p.cost ? html`<p class="small">Costo: <span class="mono">${p.cost}</span></p>` : ''}
        ${p.remember ? html`<p class="small al-remember"><strong>Ricorda:</strong> ${p.remember}</p>` : ''}
      </div>
    </div>
  </li>`)}</ol>`;
}

// passi bagagli {phase, what, when, notes} e Giorno 1 {step, title, where, details, cost} → forma comune
const lugStep = (x) => ({ title: x.what, when: [x.phase, x.when].filter(Boolean).join(' · '), details: x.notes });
const day1Step = (x, i) => ({ n: i + 1, title: x.title, where: x.where, details: x.details, cost: x.cost, remember: x.remember });

function luggage(l) {
  if (!l) return html`<p class="empty">Nessun piano bagagli.</p>`;
  const alts = list(l.options).filter((o) => !o.chosen);
  const solved = list(l.openQuestions).filter((q) => q.status === 'resolved');
  return html`<div class="stack">
    ${l.choice ? html`<div class="card card--accent stack"><p class="small muted">Valigie spedite con Yamato</p><h2 class="h3">${l.choice}</h2></div>` : ''}
    ${steps(list(l.steps).map(lugStep))}
    ${l.rules || alts.length || solved.length ? html`<div class="card al-acc">
    ${l.rules ? html`<details class="al-acc__item"><summary class="small">Regole su valigie e treni</summary><p class="small">${l.rules}</p></details>` : ''}
    ${alts.length ? html`<details class="al-acc__item al-lug-alts"><summary class="small">Alternative scartate (${alts.length})</summary>
      <ul class="list">${alts.map((o) => html`<li class="list-item stack">
        <p><strong>${o.name}</strong>${o.eurGroup != null ? html` <span class="mono small muted">${fmtEur(o.eurGroup)} in tutto</span>` : ''}</p>
        ${o.how ? html`<p class="small">${o.how}</p>` : ''}
        ${o.pro ? html`<p class="small">Pro: ${o.pro}</p>` : ''}
        ${o.con ? html`<p class="small muted">Contro: ${o.con}</p>` : ''}
      </li>`)}</ul></details>` : ''}
    ${solved.length ? html`<details class="al-acc__item al-lug-q"><summary class="small">Domande già risolte (${solved.length})</summary>
      <ul class="list">${solved.map((q) => html`<li class="list-item stack"><p><strong>${q.question}</strong></p>${q.answer ? html`<p class="small">${q.answer}</p>` : ''}</li>`)}</ul></details>` : ''}
    </div>` : ''}
  </div>`;
}

function infoBlock(b, title) {
  if (!b) return '';
  const a = b.atArrival;
  return html`<section class="card stack">
    <h2 class="h3">${title}</h2>
    ${b.rule ? html`<p>${b.rule}</p>` : ''}
    ${a ? html`<dl class="kv small">
      <dt>All'arrivo</dt><dd>${a.where || ''}${a.cost ? html` · <span class="mono">${a.cost}</span>` : ''}</dd>
      ${a.details ? html`<dt>Come</dt><dd>${a.details}</dd>` : ''}
    </dl>` : ''}
    ${list(b.reminders).length ? html`<ul class="al-notes small">${list(b.reminders).map((r) => html`<li>${r}</li>`)}</ul>` : ''}
  </section>`;
}

/** Punti ancora aperti (domande bagagli aperte + "da chiudere" del Giorno 1), in fondo alla pagina. */
function openPoints(lg) {
  const qs = list(lg.luggage && lg.luggage.openQuestions).filter((q) => q.status !== 'resolved')
    .map((q) => ({ text: q.question, why: q.why, src: q.who }));
  const d1 = list(lg.day1).filter((p) => p.todo).map((p) => ({ text: p.todo }));
  const all = [...qs, ...d1];
  if (!all.length) return '';
  return html`<section class="stack" aria-labelledby="al-open-h">
    <h2 class="section-title" id="al-open-h">Da chiarire</h2>
    <ul class="list card al-open">${all.map((x) => html`<li class="list-item stack">
      ${clipText(x.text, '')}
      ${x.why || x.src ? html`<p class="small muted">${[x.why, x.src ? `fonte: ${x.src}` : ''].filter(Boolean).join(' · ')}</p>` : ''}
    </li>`)}</ul>
  </section>`;
}

export async function render(root, { trip, loadData }) {
  const [d, charts] = await Promise.all([loadData('lodging'), import('./charts.js').catch(() => null)]);
  if (!d) { mount(root, html`<h1 class="h1">Alloggi</h1><p class="empty">Dati degli alloggi non disponibili.</p>`); return; }
  const people = (trip && trip.people) || null;
  const stays = [...(d.stays || [])].sort((a, b) => String(a.checkIn).localeCompare(String(b.checkIn)));
  const nights = stays.reduce((n, s) => n + (Number(s.nights) || 0), 0);
  const lg = d.logistics || {};
  mount(root, html`
    <h1 class="h1">Alloggi</h1>
    <p class="muted">${stays.length} basi · ${nights} notti</p>
    ${routeIndex(charts, stays, trip)}
    <div class="grid-2 al-stays">${stays.map((s) => stayCard(s, people))}</div>
    <section class="stack al-logistics" aria-labelledby="al-log-h">
      <h2 class="section-title" id="al-log-h">Logistica</h2>
      <div data-tabs></div>
    </section>
    ${openPoints(lg)}`);
  if (charts && typeof charts.wire === 'function') { try { charts.wire(root); } catch (e) { console.warn('[alloggi] wire', e); } }
  // indice (striscia o elenco) → card: scorre e dà il fuoco, senza saltare sotto la topbar
  const toStay = (el) => {
    el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  };
  root.addEventListener('click', (e) => {
    const a = e.target.closest('.al-route a[href^="#"]');
    if (!a) return;
    const el = document.getElementById(a.getAttribute('href').slice(1));
    if (!el) return;
    e.preventDefault();
    toStay(el);
    try { history.replaceState(null, '', '#' + el.id); } catch (err) { /* ignore */ }
  });
  // apertura con #<stay> (link interno "alloggi.html#tokyo", reload dopo un tap sulla striscia)
  const h = decodeURIComponent(location.hash.slice(1));
  const stayEl = h && stays.some((s) => s.id === h) ? root.querySelector(`.al-stay[id="${CSS.escape(h)}"]`) : null;
  if (stayEl) requestAnimationFrame(() => toStay(stayEl)); // dopo le tab sotto, a layout fatto
  const tabs = [];
  if (lg.luggage) tabs.push({ id: 'bagagli', label: 'Bagagli' });
  if (list(lg.day1).length) tabs.push({ id: 'giorno1', label: 'Giorno 1' });
  if (lg.cash || lg.icCard) tabs.push({ id: 'contanti', label: 'Contanti e carte IC' });
  const host = root.querySelector('[data-tabs]');
  if (!tabs.length) { mount(host, html`<p class="empty">Nessuna informazione logistica.</p>`); return; }
  const fromLink = tabs.some((t) => t.id === location.hash.slice(1)); // es. link interno "alloggi.html#bagagli"
  setupTabs(host, tabs, (id) => {
    if (id === 'bagagli') return luggage(lg.luggage);
    if (id === 'giorno1') return steps(list(lg.day1).map(day1Step));
    return html`${infoBlock(lg.cash, 'Contanti')}${infoBlock(lg.icCard, 'Carta IC (ICOCA / Suica)')}`;
  }, { key: 'al' });
  if (fromLink) root.querySelector('.al-logistics').scrollIntoView({ block: 'start' });
}
