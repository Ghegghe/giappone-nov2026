// Pagina giorno.html?d=YYYY-MM-DD: lista verticale leggibile, buchi "libero", totale €/pax e ¥, prev/next.
import { loadData, fmtEur, fmtJpy, fmtDate, mapsUrl, initShell } from './app.js';
import {
  TYPES, TYPE_LABEL, BOOKING_LABEL, normalizeItems, computeGaps, dayTotals, nowInTz, fmtMin, timeRange, withDataParam, el, icon,
} from './agenda-gaps.js';

const $ = (s) => document.querySelector(s);

function pickDay(days, trip) {
  const d = new URLSearchParams(location.search).get('d');
  if (d) return days.findIndex((x) => x.date === d);              // -1 = data non presente
  const today = nowInTz(trip.timezone || 'Asia/Tokyo').date;
  const t = days.findIndex((x) => x.date === today);
  return t >= 0 ? t : 0;
}

function itemRow(n, fx) {
  const type = TYPES.includes(n.type) ? n.type : 'free';
  const b = n.booking || { status: 'none' };
  const meta = el('div', { class: 'row giorno__badges' },
    el('span', { class: `chip agenda-legend__chip tl-type--${type}` }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), TYPE_LABEL[type]),
    n.fixed ? el('span', { class: 'badge badge--fixed' }, icon('lock'), ' fisso') : null,
    n.optional ? el('span', { class: 'badge badge--opt' }, 'opzionale') : null,
    n.parallel ? el('span', { class: 'badge' }, 'in parallelo') : null,
    b.status === 'todo' ? el('span', { class: 'badge badge--todo' }, BOOKING_LABEL.todo) : null,
    b.status === 'done' ? el('span', { class: 'badge badge--done' }, BOOKING_LABEL.done) : null);

  const cost = Number(n.costEur) || 0;
  const facts = el('p', { class: 'small giorno__facts' },
    cost ? el('span', { class: 'mono' }, `${fmtEur(cost)}/pax · ${fmtJpy(cost, fx)}${n.costEstimate ? ' (stima)' : ''}`) : el('span', null, 'gratis / incluso'),
    n.costNote ? el('span', { class: 'muted' }, ` · ${n.costNote}`) : null,
    n.place ? el('span', { class: 'muted' }, ` · ${n.place}`) : null,
    b.status !== 'none' && (b.where || b.when) ? el('span', { class: 'muted' }, ` · ${[b.where, b.when].filter(Boolean).join(' · ')}`) : null);

  return el('li', {
    class: `list-item giorno__item giorno__item--${type}${n.optional ? ' giorno__item--optional' : ''}`, id: n.id,
  },
  n.allDay ? el('div', { class: 'giorno__time mono small' }, timeRange(n))
    : el('div', { class: 'giorno__time mono' }, fmtMin(n.startMin),
      el('span', { class: 'small muted' }, `${fmtMin(n.endMin)}${n.estimated ? '*' : ''}`)),
  el('div', { class: 'stack giorno__main' },
    el('h2', { class: 'h3 giorno__title' }, n.title || ''),
    meta,
    n.note ? el('p', { class: 'giorno__note' }, n.note) : null,
    facts,
    n.mapsQuery ? el('div', { class: 'row' }, el('a', {
      class: 'btn btn--ghost', href: mapsUrl(n.mapsQuery), target: '_blank', rel: 'noopener', 'aria-label': `Apri in Google Maps: ${n.title || ''}`,
    }, icon('map-pin'), el('span', null, 'Apri in Google Maps'))) : null));
}

const gapRow = (g) => el('li', { class: 'list-item giorno__gap' },
  el('div', { class: 'giorno__time mono small muted' }, fmtMin(g.startMin)),
  el('div', { class: 'giorno__main tl-gap__label small muted' }, `${g.label}`));

function setPager(a, day, prefix) {
  if (!day) { a.hidden = true; return; }
  a.hidden = false;
  a.href = withDataParam(`giorno.html?d=${day.date}`);
  a.querySelector('span').textContent = fmtDate(day.date);
  a.setAttribute('aria-label', `${prefix}: ${fmtDate(day.date)}`);
}

async function main() {
  await initShell('agenda');
  const [trip0, agenda] = await Promise.all([loadData('trip'), loadData('agenda')]);
  const trip = trip0 || { fx: { jpyPerEur: 0 }, timezone: 'Asia/Tokyo' };
  const days = ((agenda && agenda.days) || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const err = $('#giorno-error');
  if (!days.length) {
    err.hidden = false;
    err.textContent = agenda ? 'Agenda vuota.' : "Impossibile caricare l'agenda. Riprova più tardi o ricarica la pagina.";
    return;
  }
  const i = pickDay(days, trip);
  $('#giorno-agenda').href = withDataParam(`agenda.html#${(days[i] || days[0]).date}`);
  if (i < 0) {
    err.hidden = false;
    err.replaceChildren('Giorno non presente in agenda. ', el('a', { href: withDataParam(`giorno.html?d=${days[0].date}`) }, 'Vai al primo giorno'));
    setPager($('#giorno-prev'), null); setPager($('#giorno-next'), null);
    return;
  }
  const day = days[i];
  document.title = `${fmtDate(day.date)} · Agenda`;

  // intestazione
  $('#giorno-title').textContent = `${fmtDate(day.date)} · ${day.title || ''}`;
  // append/replaceChildren nativi convertono null in testo "null": filtrare sempre
  $('#giorno-head').append(...[
    el('div', { class: 'row' },
      el('span', { class: 'muted' }, day.base || ''),
      day.status === 'draft' ? el('span', { class: 'badge badge--draft' }, 'bozza') : null),
    day.notes ? el('p', { class: 'small muted' }, day.notes) : null,
    day.moves && day.moves !== '—' ? el('p', { class: 'small' }, el('strong', null, 'Spostamenti: '), day.moves) : null].filter(Boolean));
  setPager($('#giorno-prev'), days[i - 1], 'Giorno precedente');
  setPager($('#giorno-next'), days[i + 1], 'Giorno successivo');

  // item + buchi in ordine cronologico
  const norm = normalizeItems(day.items);
  const rows = [
    ...norm.map((n) => ({ at: n.startMin, k: 1, node: () => itemRow(n, trip.fx) })),
    ...computeGaps(norm).map((g) => ({ at: g.startMin, k: 0, node: () => gapRow(g) })),
  ].sort((a, b) => a.at - b.at || a.k - b.k);
  const frag = document.createDocumentFragment();
  for (const r of rows) frag.append(r.node());
  if (!norm.length) frag.append(el('li', { class: 'empty' }, 'Nessuna attività in programma.'));
  $('#giorno-list').replaceChildren(frag);
  if (norm.some((n) => n.estimated)) {
    $('#giorno-list').after(el('p', { class: 'small muted' }, '* orario di fine stimato (fino alla tappa successiva, 30-90 min).'));
  }

  // piè: totale giorno
  const tot = dayTotals(day.items);
  const foot = $('#giorno-foot');
  foot.hidden = false;
  foot.replaceChildren(...[
    el('p', { class: 'h3' }, 'Totale giorno: ', el('span', { class: 'mono' }, `${fmtEur(tot.total)}/pax`), ' · ',
      el('span', { class: 'mono muted' }, fmtJpy(tot.total, trip.fx))),
    tot.optional ? el('p', { class: 'small muted' }, `di cui opzionali ${fmtEur(tot.optional)}/pax · alloggi esclusi`) : el('p', { class: 'small muted' }, 'alloggi esclusi'),
    day.budgetEur != null ? el('p', { class: 'small muted' }, `Budget previsto dal dossier: ${fmtEur(day.budgetEur)}/pax`) : null,
    trip.fx && trip.fx.jpyPerEur ? el('p', { class: 'small muted' }, `Cambio ${trip.fx.jpyPerEur} ¥/€${trip.fx.asOf ? ` (${trip.fx.source || ''} ${fmtDate(trip.fx.asOf, { weekday: false })})` : ''}`) : null].filter(Boolean));

  // ancora #item-id: scorri ed evidenzia
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (target) {
    target.classList.add('giorno__item--target');
    target.setAttribute('tabindex', '-1');
    target.scrollIntoView({ block: 'center' });
    target.focus({ preventScroll: true });
  }
}

main();
