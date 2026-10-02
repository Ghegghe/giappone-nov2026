// pages-home.js — index.html: una pagina, non una dashboard (DIRECTION 2 ott 2026).
// Titolo · una riga (date, persone, quanto manca) · "Prossimo giorno" come lista semplice · le 3 scadenze più vicine. Fine.
import { fmtDate, fmtTime, todayInTokyo } from './app.js';
import { html, mount, pageUrl, daysBetween, deadlineLabel, deadlineState } from './pages.js';

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

/** "sab 7 → mar 24 nov · 4 persone · tra 36 giorni" */
export function tripLine(trip, st) {
  const sameMonth = String(trip.start).slice(0, 7) === String(trip.end).slice(0, 7);
  const from = sameMonth ? fmtDate(trip.start).split(' ').slice(0, 2).join(' ') : fmtDate(trip.start);
  const when = st.phase === 'before' ? (st.days === 0 ? 'si parte oggi' : st.days === 1 ? 'si parte domani' : `tra ${st.days} giorni`)
    : st.phase === 'during' ? `giorno ${st.dayN} di ${st.total}` : 'viaggio concluso';
  return [`${from} → ${fmtDate(trip.end)}`, trip.people ? `${trip.people} persone` : '', when].filter(Boolean).join(' · ');
}

/** Giorno da mostrare: prima del viaggio il primo, durante oggi (dalle attività non ancora finite) o domani, dopo l'ultimo. */
function pickDay(days, trip, st, today) {
  if (st.phase === 'before') return { day: days[0], label: 'Prossimo giorno', items: days[0].items || [] };
  if (st.phase === 'after') { const d = days[days.length - 1]; return { day: d, label: 'Ultimo giorno', items: d.items || [] }; }
  const day = days.find((d) => d.date === today) || days[0];
  const now = nowMinutesTokyo(trip.timezone || 'Asia/Tokyo');
  const its = day.items || [];
  const idx = its.findIndex((it) => {
    const s = toMin(it.time); const e = toMin(it.end) ?? (s == null ? null : s + 60);
    return e == null || e > now;
  });
  if (idx >= 0) return { day, label: 'Oggi', items: its.slice(idx) };
  const next = days.find((d) => d.date > today);
  return next ? { day: next, label: 'Domani', items: next.items || [] } : { day, label: 'Oggi', items: [] };
}

function nextDay(agenda, trip, st, today) {
  const days = (agenda && agenda.days) || [];
  if (!days.length) return html`<section class="home-sec"><h2 class="section-title">Prossimo giorno</h2><p class="empty">Agenda non disponibile.</p></section>`;
  const { day, label, items } = pickDay(days, trip, st, today);
  const where = [day.base, day.dayTrip ? `gita a ${day.dayTrip}` : ''].filter(Boolean).join(', ');
  return html`<section class="home-sec home-day" aria-labelledby="home-day-h">
    <h2 class="section-title" id="home-day-h">${label}<span class="home-sec__date">${fmtDate(day.date)}</span></h2>
    <p class="home-day__title">${day.title || ''}${where ? html`<span class="muted">. ${where}</span>` : ''}</p>
    ${items.length ? html`<ol class="home-list">${items.map((it) => html`
      <li class="home-day__item${it.optional ? ' home-day__item--opt' : ''}">
        <span class="home-day__time">${it.time ? fmtTime(it.time) : ''}</span>
        <span>${it.title}${it.optional ? html` <span class="muted">(facoltativo)</span>` : ''}</span>
      </li>`)}</ol>` : html`<p class="muted">Nessuna attività in programma.</p>`}
    <p><a href="${pageUrl('giorno.html', { d: day.date })}">Apri il giorno</a></p>
  </section>`;
}

function deadlines(transport, todayIt) {
  const head = html`<h2 class="section-title" id="home-dl-h">Prossime scadenze</h2>`;
  if (!transport) return html`<section class="home-sec">${head}<p class="empty">Scadenze non disponibili.</p></section>`;
  const todo = (transport.checklist || [])
    .filter((c) => c.status !== 'done')
    .sort((a, b) => String(a.sortDate || '9999').localeCompare(String(b.sortDate || '9999')))
    .slice(0, 3);
  return html`<section class="home-sec" aria-labelledby="home-dl-h">${head}
    ${todo.length ? html`<ul class="home-list">${todo.map((c) => {
      const st = deadlineState(c, todayIt);
      return html`<li class="home-dl">
        <span class="home-dl__when">${deadlineLabel(c)}</span>
        <span class="home-dl__what">${c.what}${st === 'late' ? html` <span class="badge badge--todo">in ritardo</span>` : st === 'today' ? html` <span class="badge badge--todo">oggi</span>` : ''}</span>
      </li>`;
    })}</ul>` : html`<p class="muted">Niente da fare: è tutto prenotato.</p>`}
    <p><a href="${pageUrl('trasporti.html#scadenze')}">Tutte le scadenze</a></p>
  </section>`;
}

export async function render(root, { trip, loadData }) {
  if (!trip) { mount(root, html`<p class="empty">Dati del viaggio non disponibili.</p>`); return; }
  const today = todayInTokyo(trip.timezone || 'Asia/Tokyo');
  const st = tripStatus(trip, today);
  const [agenda, transport] = await Promise.all([loadData('agenda'), loadData('transport')]);
  mount(root, html`
    <header class="home-head">
      <h1 class="h1">${String(trip.title || '').split(' · ').map((t) => html`<span>${t.replace(/(\d)-(\d)/g, '$1\u2011$2')}</span>`)}</h1>
      <p class="home-head__line">${tripLine(trip, st)}</p>
    </header>
    ${nextDay(agenda, trip, st, today)}
    ${deadlines(transport, todayInTokyo('Europe/Rome'))}`);
}
