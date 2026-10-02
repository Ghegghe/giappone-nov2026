// pages-home.js — index.html: conto alla rovescia con la striscia della rotta, oggi/primo giorno, 3 scadenze, mappa e voli.
// Ibrido 2 ott: via la griglia "Sezioni" (duplicava la nav) e il tasso di cambio (sta nel budget).
// PLAN_PRESENTAZIONE §2.1: routeStrip da charts.js (import dinamico, fallback = rotta scritta).
import { fmtDate, fmtTime, todayInTokyo } from './app.js';
import { html, mount, icon, pageUrl, safeUrl, daysBetween, deadlineLabel, deadlineState } from './pages.js';

const nowMinutesTokyo = (tz) => {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = (t) => +p.find((x) => x.type === t).value;
    return (g('hour') % 24) * 60 + g('minute');
  } catch (e) { return 0; }
};
const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };

/** Stato del viaggio rispetto a oggi (fuso del viaggio). */
export function tripStatus(trip, today) {
  const total = daysBetween(trip.start, trip.end) + 1;
  if (today < trip.start) return { phase: 'before', days: daysBetween(today, trip.start), total };
  if (today > trip.end) return { phase: 'after', days: daysBetween(trip.end, today), total };
  return { phase: 'during', dayN: daysBetween(trip.start, today) + 1, total };
}

function countdown(trip, st, routeHtml) {
  // il numero hero ha cifre proporzionali (.hero-fig), mai tabulari; la frase resta nell'h1 con il numero
  let big, small;
  if (st.phase === 'before') {
    big = html`<span class="hero-fig home-count__n">${st.days}</span> <span class="home-count__unit">${st.days === 1 ? 'giorno' : 'giorni'} alla partenza</span>`;
  } else if (st.phase === 'during') {
    big = html`<span class="home-count__unit">Giorno</span> <span class="hero-fig home-count__n">${st.dayN}</span> <span class="home-count__unit">di ${st.total}</span>`;
  } else {
    big = html`<span class="home-count__unit">Viaggio concluso</span>`;
  }
  small = `${fmtDate(trip.start)} → ${fmtDate(trip.end)}`;
  const people = Number(trip.people) > 0 ? `${trip.people} ${Number(trip.people) === 1 ? 'persona' : 'persone'}` : '';
  return html`<section class="card card--accent home-count" aria-labelledby="home-count-h" aria-live="polite">
    <h1 class="home-count__big" id="home-count-h">${big}</h1>
    <p class="small muted home-count__when">${small}${people ? ` · ${people}` : ''}</p>
    ${trip.title ? html`<p class="home-count__title">${trip.title}</p>` : ''}
    <div class="home-route">${routeHtml}</div>
  </section>`;
}

/** Rotta scritta (fallback se charts.js non c'è): basi in ordine con le notti, senza catene di punti. */
function routeText(stays) {
  const list = (stays || []).filter((s) => s && s.city).slice().sort((a, b) => String(a.checkIn).localeCompare(String(b.checkIn)));
  if (!list.length) return '';
  return html`<ol class="home-route__text" aria-label="Rotta">${list.map((s) => html`
    <li><span>${s.city}</span> <span class="muted">${s.nights}</span></li>`)}</ol>`;
}

function dayCard(agenda, trip, st, today) {
  const days = (agenda && agenda.days) || [];
  if (!days.length) return html`<section class="card"><h2 class="h3">Agenda</h2><p class="empty">Agenda non disponibile.</p></section>`;
  let day, label, items;
  if (st.phase === 'during') {
    day = days.find((d) => d.date === today) || days[0];
    label = 'Oggi';
    const now = nowMinutesTokyo(trip.timezone || 'Asia/Tokyo');
    const its = day.items || [];
    // dal primo item non ancora finito (fine = end, altrimenti inizio + 60')
    const idx = its.findIndex((it) => {
      const s = toMin(it.time); const e = toMin(it.end) ?? (s == null ? null : s + 60);
      return e == null || e > now;
    });
    items = its.slice(idx < 0 ? its.length : idx, (idx < 0 ? its.length : idx) + 3);
    if (!items.length) { const next = days.find((d) => d.date > today); if (next) { day = next; label = 'Domani'; items = (next.items || []).slice(0, 3); } }
  } else if (st.phase === 'before') {
    day = days[0]; label = 'Primo giorno'; items = (day.items || []).slice(0, 3);
  } else {
    day = days[days.length - 1]; label = 'Ultimo giorno'; items = (day.items || []).slice(0, 3);
  }
  const href = pageUrl('giorno.html', { d: day.date });
  // titolo e base su una riga (2 elementi): "Arrivo e prima sera · Osaka"; la gita va con la base
  const where = day.base ? (day.dayTrip ? `${day.base}, gita a ${day.dayTrip}` : day.base) : (day.dayTrip ? `gita a ${day.dayTrip}` : '');
  return html`<section class="card home-day stack" aria-labelledby="home-day-h">
    <div class="home-day__head">
      <h2 class="h3" id="home-day-h">${label} · ${fmtDate(day.date)}</h2>
      ${day.title || where ? html`<p class="small home-day__sub">${day.title || ''}${day.title && where ? html`<span class="muted"> · ${where}</span>` : where ? html`<span class="muted">${where}</span>` : ''}</p>` : ''}
    </div>
    ${items.length ? html`<ul class="list">${items.map((it) => html`
      <li class="list-item home-day__item">
        <span class="mono home-day__time">${it.time ? fmtTime(it.time) : '—'}</span>
        <span class="home-day__title">${it.title}${it.optional ? html` <span class="muted small">facoltativo</span>` : ''}</span>
      </li>`)}</ul>` : html`<p class="empty">Nessuna attività in programma.</p>`}
    <a class="btn btn--ghost home-more" href="${href}"><span>Apri il giorno</span> ${icon('chevron-right')}</a>
  </section>`;
}

/** "oggi" · "domani" · "tra 9 giorni" · "in ritardo" (fuso italiano: sono azioni da fare dall'Italia). */
function relLabel(c, todayIt) {
  const st = deadlineState(c, todayIt);
  if (st === 'late') return { st, text: 'in ritardo' };
  if (st === 'today') return { st, text: 'oggi' };
  if (c.dateApprox || !c.sortDate) return { st, text: '' };
  const n = daysBetween(todayIt, c.sortDate);
  return { st, text: n === 1 ? 'domani' : `tra ${n} giorni` };
}

const DL_SHOWN = 3;
function deadlines(transport, todayIt) {
  if (!transport) return html`<section class="card stack"><h2 class="h3">Prossime scadenze</h2><p class="empty">Scadenze non disponibili.</p></section>`;
  const all = ((transport && transport.checklist) || [])
    .filter((c) => c.status !== 'done')
    .sort((a, b) => String(a.sortDate || '9999').localeCompare(String(b.sortDate || '9999')));
  const todo = all.slice(0, DL_SHOWN);
  return html`<section class="card stack home-dls" aria-labelledby="home-dl-h">
    <h2 class="h3" id="home-dl-h">Prossime scadenze</h2>
    ${todo.length ? html`<ul class="list">${todo.map((c) => {
      const r = relLabel(c, todayIt);
      return html`<li class="list-item home-dl">
        <span class="small home-dl__when"><span class="mono">${deadlineLabel(c)}</span>${r.text
          ? (r.st === 'late' ? html` <span class="badge badge--todo">${r.text}</span>`
            : r.st === 'today' ? html` <strong class="home-dl__today">${r.text}</strong>`
              : html` <span class="home-dl__rel">${r.text}</span>`) : ''}</span>
        <span class="home-dl__what">${c.what}</span>
      </li>`;
    })}</ul>` : html`<p class="empty">Niente da fare: tutto prenotato.</p>`}
    <a class="btn btn--ghost home-more" href="${pageUrl('trasporti.html#scadenze')}"><span>${all.length > DL_SHOWN ? `Tutte le scadenze (${all.length})` : 'Tutte le scadenze'}</span> ${icon('chevron-right')}</a>
  </section>`;
}

function infoCard(trip) {
  const map = safeUrl(trip.mapsLink);
  const f = trip.flights || {};
  return html`<section class="card home-info" aria-labelledby="home-info-h">
    <h2 class="h3" id="home-info-h">In tasca</h2>
    ${map ? html`<a class="btn btn--primary" href="${map}" target="_blank" rel="noopener noreferrer">${icon('pin')}<span>Mappa del viaggio</span> ${icon('external', 'apre in una nuova scheda')}</a>` : ''}
    ${f.out || f.back ? html`<dl class="kv">
      ${f.out ? html`<dt>Andata</dt><dd>${fmtDate(f.out.date)} · arrivo ${f.out.to} <span class="mono">${f.out.arr || ''}</span></dd>` : ''}
      ${f.back ? html`<dt>Ritorno</dt><dd>${fmtDate(f.back.date)} · da ${f.back.from} <span class="mono">${f.back.dep || ''}</span></dd>` : ''}
    </dl>` : ''}
  </section>`;
}

// charts.js lo scrive un altro agente: import dinamico con fallback testuale (la rotta scritta)
const loadCharts = () => import('./charts.js').catch(() => null);

export async function render(root, { trip, loadData }) {
  if (!trip) { mount(root, html`<p class="empty">Dati del viaggio non disponibili.</p>`); return; }
  const today = todayInTokyo(trip.timezone || 'Asia/Tokyo');
  const st = tripStatus(trip, today);
  const [agenda, transport, lodging, charts] = await Promise.all([loadData('agenda'), loadData('transport'), loadData('lodging'), loadCharts()]);
  const stays = (lodging && lodging.stays) || [];
  let route = '';
  try {
    if (charts && typeof charts.routeStrip === 'function') route = charts.routeStrip(stays, { today, start: trip.start, end: trip.end });
  } catch (e) { console.warn('[home] routeStrip', e); route = ''; }
  if (!route || !String(route)) route = routeText(stays);
  mount(root, html`
    ${countdown(trip, st, route)}
    <div class="grid-2 home-grid">
      ${dayCard(agenda, trip, st, today)}
      ${deadlines(transport, todayInTokyo('Europe/Rome'))}
    </div>
    ${infoCard(trip)}`);
  try { if (charts && typeof charts.wire === 'function') charts.wire(root); } catch (e) { console.warn('[home] wire', e); }
}
