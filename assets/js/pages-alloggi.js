// pages-alloggi.js — alloggi.html: le basi in ordine cronologico (info nell'ordine utile in viaggio)
// + Logistica (Bagagli · Giorno 1 · Contanti e carte IC) + "Da chiarire" in fondo.
import { fmtDate, fmtEur, photoHtml } from './app.js';
import { html, mount, raw, mapsBtn, extLink, setupTabs } from './pages.js';

const TYPE = { apartment: 'Appartamento', hotel: 'Hotel', hostel: 'Ostello', ryokan: 'Ryokan', guesthouse: 'Guesthouse', capsule: 'Capsule' };
const jpy = (n) => '¥' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const list = (x) => (Array.isArray(x) ? x : x ? [x] : []);

/** Stato del pagamento: una parola nel testo; badge solo se c'è da verificare. */
function payText(s) {
  if (s.paid === true) return 'Pagato.';
  if (s.payment === 'in struttura') return 'Si paga in struttura.';
  if (s.paid === false) return html`<span class="badge badge--todo">pagamento da verificare</span>`;
  return '';
}

function stayCard(s, people, trip) {
  const n = Number(s.nights) || 0;
  const times = [s.checkInTime ? `check-in dalle ${s.checkInTime}` : '', s.checkOutTime ? `check-out entro le ${s.checkOutTime}` : ''].filter(Boolean);
  const pax = s.costEurPerPerson != null ? s.costEurPerPerson : people && s.costEurTotal != null ? s.costEurTotal / people : null;
  return html`<article class="card al-stay" id="${s.id}">
    ${raw(photoHtml(s.id, s.city, trip))}
    <div class="stack al-stay__body">
    <header class="al-stay__head">
      <h2 class="h2">${s.name}</h2>
      <p class="small muted">${[s.area && s.area !== s.city ? `${s.city}, ${s.area}` : s.city, TYPE[s.type] || ''].filter(Boolean).join(' · ')}</p>
    </header>
    <dl class="kv">
      <dt>Date</dt><dd>${fmtDate(s.checkIn)} → ${fmtDate(s.checkOut)}${n ? ` · ${n} ${n === 1 ? 'notte' : 'notti'}` : ''}</dd>
      ${times.length ? html`<dt>Orari</dt><dd class="mono">${times.join(', ')}</dd>` : ''}
      ${s.address ? html`<dt>Indirizzo</dt><dd>${s.address}</dd>` : ''}
    </dl>
    <div class="row">${mapsBtn(s.mapsQuery || `${s.name} ${s.city}`)}${s.url ? extLink(s.url, 'Sito', 'btn btn--ghost') : ''}</div>
    ${list(s.notes).length ? html`<ul class="al-notes small">${list(s.notes).map((x) => html`<li>${x}</li>`)}</ul>` : ''}
    ${s.costEurTotal != null ? html`<p class="small muted"><span class="mono">${fmtEur(s.costEurTotal)}</span> in tutto${pax != null ? html`, <span class="mono">${fmtEur(pax)}</span> a testa` : ''}${s.costJpyTotal != null ? html`, <span class="mono">${jpy(s.costJpyTotal)}</span> in contanti` : ''}. ${payText(s)}</p>` : html`<p class="small">${payText(s)}</p>`}
    </div>
  </article>`;
}

/** Passi numerati, tipografici (niente card): [{n, title, when, where, details, cost, remember}] */
function steps(arr) {
  if (!arr.length) return '';
  return html`<ol class="al-steps prose">${arr.map((p, i) => html`<li>
      <span class="al-step__n" aria-hidden="true">${p.n != null ? p.n : i + 1}</span>
      <div class="stack al-step__body">
        <h3 class="h3">${p.title}</h3>
        ${p.when ? html`<p class="small muted">${p.when}</p>` : ''}
        ${p.where ? html`<p class="small">${p.where}</p>` : ''}
        ${p.details ? html`<p class="small">${p.details}</p>` : ''}
        ${p.cost ? html`<p class="small muted">Costo: <span class="mono">${p.cost}</span></p>` : ''}
        ${p.remember ? html`<p class="small"><strong>Ricordate:</strong> ${p.remember}</p>` : ''}
      </div>
  </li>`)}</ol>`;
}

// passi bagagli {phase, what, when, notes} e Giorno 1 {step, title, where, details, cost} → forma comune
const lugStep = (x) => ({ title: x.what, when: [x.phase, x.when].filter(Boolean).join(', '), details: x.notes });
const day1Step = (x, i) => ({ n: i + 1, title: x.title, where: x.where, details: x.details, cost: x.cost, remember: x.remember });

function luggage(l) {
  if (!l) return html`<p class="empty">Nessun piano bagagli.</p>`;
  const alts = list(l.options).filter((o) => !o.chosen);
  const solved = list(l.openQuestions).filter((q) => q.status === 'resolved');
  return html`<div class="stack">
    ${l.choice ? html`<p class="al-choice prose">Le valigie viaggiano con Yamato: ${l.choice.charAt(0).toLowerCase() + l.choice.slice(1)}.</p>` : ''}
    ${steps(list(l.steps).map(lugStep))}
    <div>
    ${l.rules ? html`<details class="fold"><summary>Regole su valigie e treni</summary><p class="small prose">${l.rules}</p></details>` : ''}
    ${alts.length ? html`<details class="fold al-lug-alts"><summary>Alternative scartate (${alts.length})</summary>
      <ul class="rule-list prose">${alts.map((o) => html`<li class="stack">
        <p><strong>${o.name}</strong>${o.eurGroup != null ? html` <span class="mono small muted">${fmtEur(o.eurGroup)} in tutto</span>` : ''}</p>
        ${o.how ? html`<p class="small">${o.how}</p>` : ''}
        ${o.pro ? html`<p class="small">Pro: ${o.pro}</p>` : ''}
        ${o.con ? html`<p class="small muted">Contro: ${o.con}</p>` : ''}
      </li>`)}</ul></details>` : ''}
    ${solved.length ? html`<details class="fold al-lug-q"><summary>Domande già risolte (${solved.length})</summary>
      <ul class="rule-list prose">${solved.map((q) => html`<li class="stack"><p><strong>${q.question}</strong></p>${q.answer ? html`<p class="small">${q.answer}</p>` : ''}</li>`)}</ul></details>` : ''}
    </div>
  </div>`;
}

function infoBlock(b, title) {
  if (!b) return '';
  const a = b.atArrival;
  return html`<section class="stack al-info">
    <h2 class="h3">${title}</h2>
    ${b.rule ? html`<p>${b.rule}</p>` : ''}
    ${a ? html`<dl class="kv small">
      <dt>All'arrivo</dt><dd>${a.where || ''}${a.cost ? html` Costo: <span class="mono">${a.cost}</span>.` : ''}</dd>
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
    <ul class="rule-list prose">${all.map((x) => html`<li class="stack">
      <p>${x.text}</p>
      ${x.why || x.src ? html`<p class="small muted">${x.why || ''}${x.src ? ` Fonte: ${x.src}.` : ''}</p>` : ''}
    </li>`)}</ul>
  </section>`;
}

export async function render(root, { trip, loadData }) {
  const d = await loadData('lodging');
  if (!d) { mount(root, html`<h1 class="h1">Alloggi</h1><p class="empty">Dati degli alloggi non disponibili.</p>`); return; }
  const people = (trip && trip.people) || null;
  const stays = [...(d.stays || [])].sort((a, b) => String(a.checkIn).localeCompare(String(b.checkIn)));
  const nights = stays.reduce((n, s) => n + (Number(s.nights) || 0), 0);
  const lg = d.logistics || {};
  mount(root, html`
    <h1 class="h1">Alloggi</h1>
    <p class="muted">${stays.length} basi, ${nights} notti.</p>
    <div class="grid-2 al-stays">${stays.map((s) => stayCard(s, people, trip))}</div>
    <section class="stack al-logistics" aria-labelledby="al-log-h">
      <h2 class="section-title" id="al-log-h">Logistica</h2>
      <div data-tabs></div>
    </section>
    ${openPoints(lg)}`);
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
    return html`${infoBlock(lg.cash, 'Contanti')}${infoBlock(lg.icCard, 'Carta IC: ICOCA o Suica')}`;
  }, { key: 'al' });
  if (fromLink) root.querySelector('.al-logistics').scrollIntoView({ block: 'start' });
}
