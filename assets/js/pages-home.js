// pages-home.js — index.html: countdown, oggi/prossimo giorno, scadenze, sezioni, mappa, cambio.
import { fmtDate, fmtEur, fmtJpy, fmtTime, todayInTokyo } from './app.js';
import { html, mount, icon, pageUrl, safeUrl, daysBetween, fxRate } from './pages.js';

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

function countdown(trip, st) {
  let big, small;
  if (st.phase === 'before') {
    big = st.days === 1 ? html`<span class="home-count__n mono">1</span> giorno alla partenza`
      : html`<span class="home-count__n mono">${st.days}</span> giorni alla partenza`;
    small = `Si parte ${fmtDate(trip.start)} · ${st.total} giorni`;
  } else if (st.phase === 'during') {
    big = html`Giorno <span class="home-count__n mono">${st.dayN}</span> di ${st.total}`;
    small = `Ritorno ${fmtDate(trip.end)}`;
  } else {
    big = html`Viaggio concluso`;
    small = `${fmtDate(trip.start)} – ${fmtDate(trip.end)}`;
  }
  return html`<section class="card card--accent home-count" aria-live="polite">
    <h1 class="h1">${trip.title}</h1>
    ${trip.subtitle ? html`<p class="muted">${trip.subtitle}</p>` : ''}
    <p class="h2 home-count__big">${big}</p>
    <p class="small muted">${small}</p>
  </section>`;
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
  return html`<section class="card home-day stack" aria-labelledby="home-day-h">
    <div class="row home-day__head">
      <h2 class="h3" id="home-day-h">${label} · ${fmtDate(day.date)}</h2>
      ${day.status === 'draft' ? html`<span class="badge badge--draft">bozza</span>` : ''}
    </div>
    <p class="muted small">${day.base ? `${day.base} · ` : ''}${day.title || ''}</p>
    ${items.length ? html`<ul class="list">${items.map((it) => html`
      <li class="list-item home-day__item">
        <span class="mono home-day__time">${it.time ? fmtTime(it.time) : '—'}</span>
        <span class="home-day__title">${it.title}${it.fixed ? html` ${icon('lock', 'vincolo fisso')}` : ''}${it.optional ? html` <span class="badge badge--opt">opz.</span>` : ''}</span>
      </li>`)}</ul>` : html`<p class="empty">Nessuna attività in programma.</p>`}
    <a class="btn" href="${href}"><span>Tutto il giorno</span> ${icon('chevron-right')}</a>
  </section>`;
}

function deadlines(transport, today) {
  if (!transport) return html`<section class="card stack"><h2 class="h3">Prossime scadenze</h2><p class="empty">Scadenze non disponibili.</p></section>`;
  const todo = ((transport && transport.checklist) || [])
    .filter((c) => c.status !== 'done')
    .sort((a, b) => String(a.sortDate || '9999').localeCompare(String(b.sortDate || '9999')))
    .slice(0, 5);
  return html`<section class="card stack" aria-labelledby="home-dl-h">
    <h2 class="h3" id="home-dl-h">Prossime scadenze</h2>
    ${todo.length ? html`<ul class="list">${todo.map((c) => {
      const late = c.sortDate && c.sortDate < today;
      return html`<li class="list-item home-dl">
        <span class="mono small home-dl__when">${c.when || fmtDate(c.sortDate, { weekday: false })}</span>
        <span class="home-dl__what">${c.what}${late ? html` <span class="badge badge--todo">in ritardo</span>` : ''}</span>
      </li>`;
    })}</ul>` : html`<p class="empty">Niente da fare: tutto prenotato.</p>`}
    <a class="btn btn--ghost" href="${pageUrl('trasporti.html') + '#scadenze'}"><span>Tutte le scadenze</span> ${icon('chevron-right')}</a>
  </section>`;
}

function sectionsGrid(trip) {
  const secs = (trip.sections || []).filter((s) => s.id !== 'home');
  if (!secs.length) return '';
  return html`<nav aria-label="Sezioni del sito" class="home-sections">
    <h2 class="section-title">Sezioni</h2>
    <div class="grid-3 home-grid">${secs.map((s) => html`
      <a class="card home-grid__item" href="${pageUrl(s.href || `${s.id}.html`)}">${icon(s.icon || s.id)}<span>${s.label || s.id}</span></a>`)}
    </div>
  </nav>`;
}

function infoCard(trip) {
  const rate = fxRate(trip);
  const map = safeUrl(trip.mapsLink);
  return html`<section class="card stack" aria-labelledby="home-info-h">
    <h2 class="h3" id="home-info-h">In tasca</h2>
    ${map ? html`<a class="btn btn--primary" href="${map}" target="_blank" rel="noopener noreferrer">${icon('pin')}<span>Mappa del viaggio (My Maps)</span> ${icon('external', 'apre in una nuova scheda')}</a>` : ''}
    ${rate ? html`<dl class="kv">
      <dt>Cambio</dt><dd class="mono">€1 = ¥${rate}</dd>
      <dt>Esempi</dt><dd class="mono">${fmtEur(10)} ≈ ${fmtJpy(10, rate)} · ¥1.000 ≈ ${fmtEur(1000 / rate)}</dd>
      ${trip.fx.asOf ? html`<dt>Fonte</dt><dd class="small muted">${trip.fx.source || ''} ${fmtDate(trip.fx.asOf, { weekday: false, year: true })}</dd>` : ''}
    </dl>` : ''}
    ${trip.flights ? html`<dl class="kv">
      ${trip.flights.out ? html`<dt>Andata</dt><dd>${fmtDate(trip.flights.out.date)} · arrivo ${trip.flights.out.to} <span class="mono">${trip.flights.out.arr || ''}</span></dd>` : ''}
      ${trip.flights.back ? html`<dt>Ritorno</dt><dd>${fmtDate(trip.flights.back.date)} · volo da ${trip.flights.back.from} <span class="mono">${trip.flights.back.dep || ''}</span></dd>` : ''}
    </dl>` : ''}
  </section>`;
}

export async function render(root, { trip, loadData }) {
  if (!trip) { mount(root, html`<p class="empty">Dati del viaggio non disponibili.</p>`); return; }
  const today = todayInTokyo(trip.timezone || 'Asia/Tokyo');
  const st = tripStatus(trip, today);
  const [agenda, transport] = await Promise.all([loadData('agenda'), loadData('transport')]);
  mount(root, html`
    ${countdown(trip, st)}
    <div class="grid-2">
      ${dayCard(agenda, trip, st, today)}
      ${deadlines(transport, today)}
    </div>
    ${sectionsGrid(trip)}
    ${infoCard(trip)}`);
}
