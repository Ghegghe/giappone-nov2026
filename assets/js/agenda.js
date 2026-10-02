// Pagina agenda.html: timeline 6-24, colonne giorno (7 visibili desktop, 1 per schermata mobile), buchi, filtri, pannello.
import { loadData, fmtEur, fmtJpy, fmtDate, mapsUrl, initShell } from './app.js';
import {
  TYPES, TYPE_LABEL, FAMILY, FAMILY_LABEL, FAMILIES, BOOKING_LABEL, normalizeItems, rangeOfDays, assignColumns, computeGaps, dayTotals,
  nowInTz, itemAria, fmtMin, fmtDur, timeRange, withDataParam, el, icon,
} from './agenda-gaps.js';

const $ = (s, r = document) => r.querySelector(s);
const FILTER_KEY = 'agenda.filters';
const state = { trip: null, days: [], idx: 0, range: null, hourH: 48, filters: { onlyFixed: false, hideOpt: false }, pendingIdx: null };
let timeline, dateBar, lastFocus = null;

function readFilters() {
  try { Object.assign(state.filters, JSON.parse(localStorage.getItem(FILTER_KEY) || '{}')); } catch { /* storage non disponibile */ }
}
function saveFilters() {
  try { localStorage.setItem(FILTER_KEY, JSON.stringify(state.filters)); } catch { /* idem */ }
}
const visibleItems = (items) => items.filter((it) =>
  (!state.filters.onlyFixed || it.fixed) && (!state.filters.hideOpt || !it.optional));

// px per ora dal tema (--tl-hour-h), default 48
function readHourH() {
  const v = parseFloat(getComputedStyle(timeline).getPropertyValue('--tl-hour-h'));
  return Number.isFinite(v) && v > 0 ? v : 48;
}
// --top/--h in px relativi all'inizio scala (base.css aggiunge --tl-head-h)
const px = (min) => `${Math.round(((min - state.range.startMin) / 60) * state.hourH)}px`;
const pxLen = (min) => `${Math.round((min / 60) * state.hourH)}px`;

// "Osaka · gita a Kyoto" (base e gita, mai nel titolo)
const placeLabel = (d) => [d.base, d.dayTrip ? `gita a ${d.dayTrip}` : ''].filter(Boolean).join(' · ');

// ---------- rendering timeline (DOM del contratto base.css §7) ----------
function renderTimeline() {
  state.hourH = readHourH();
  const norm = state.days.map((d) => normalizeItems(visibleItems(d.items || [])));
  state.range = rangeOfDays(norm.length ? norm : [[]]);
  const { startMin, endMin } = state.range;
  const now = nowInTz(state.trip.timezone || 'Asia/Tokyo');
  const frag = document.createDocumentFragment();

  const hours = el('div', { class: 'tl-hours', 'aria-hidden': 'true' });
  for (let m = startMin; m < endMin; m += 60) hours.append(el('div', { class: 'tl-hour' }, String((m / 60) % 24).padStart(2, '0')));
  frag.append(hours);
  state.days.forEach((day, i) => frag.append(renderDay(day, i, norm[i], now)));
  timeline.replaceChildren(frag);
  timeline.style.setProperty('--tl-span', String((endMin - startMin) / 60));
  timeline.style.setProperty('--tl-days', String(state.days.length));
}

function renderDay(day, i, norm, now) {
  const isToday = now.date === day.date;
  // cambio di base rispetto al giorno prima: filo accent sull'intestazione (si vede scorrendo)
  const prev = state.days[i - 1];
  const newBase = !!prev && (prev.baseId || prev.base) !== (day.baseId || day.base);
  const col = el('section', {
    class: `tl-day${day.status === 'draft' ? ' tl-day--draft' : ''}${newBase ? ' tl-day--newbase' : ''}`, 'data-date': day.date, 'data-idx': i,
    id: `day-${day.date}`, 'aria-label': `${fmtDate(day.date)} · ${day.title || ''}`, 'aria-current': isToday ? 'date' : null,
  });
  // intestazione su 2 livelli: data + base (vanno a capo se non stanno), poi il titolo su 2 righe al massimo
  col.append(el('header', { class: 'tl-day__header', title: [fmtDate(day.date), placeLabel(day), day.title].filter(Boolean).join(' · ') },
    el('div', { class: 'tl-day__row' },
      el('a', { class: 'tl-day__date', href: withDataParam(`giorno.html?d=${day.date}`) }, fmtDate(day.date)),
      el('span', { class: 'small muted tl-day__base' }, placeLabel(day))),
    el('span', { class: 'small tl-day__title' }, day.title || '')));

  const fromMin = Math.max(state.range.startMin, 6 * 60), toMin = Math.min(state.range.endMin, 24 * 60);
  for (const g of computeGaps(norm, { fromMin, toMin })) {
    col.append(el('div', { class: `tl-gap${g.edge ? ' tl-gap--edge' : ''}`, style: { '--top': px(g.startMin), '--h': pxLen(g.dur) } },
      el('span', null, g.label)));
  }
  for (const n of assignColumns(norm)) col.append(renderItem(n, day));
  if (!norm.length) col.append(el('p', { class: 'empty small tl-day__empty' }, 'Nessuna attività con questi filtri'));
  if (isToday && now.min >= state.range.startMin && now.min <= state.range.endMin) {
    col.append(el('div', { class: 'tl-now', style: { '--top': px(now.min) }, role: 'img', 'aria-label': `Ora: ${fmtMin(now.min)}` }));
  }
  const tot = dayTotals(day.items);
  col.append(el('footer', { class: 'tl-day__foot small mono' },
    `${fmtEur(tot.total)}/pax`, el('span', { class: 'muted' }, ` · ${fmtJpy(tot.total, state.trip.fx)}`)));
  return col;
}

function renderItem(n, day) {
  const cls = ['tl-item', `tl-item--${TYPES.includes(n.type) ? n.type : 'free'}`];
  if (n.optional) cls.push('tl-item--optional');
  if (n.fixed) cls.push('tl-item--locked');   // tinta più piena; il lucchetto è solo nel pannello
  if (n.cols > 1) cls.push('tl-item--split');
  if (n.allDay) cls.push('tl-item--allday');   // occupa la scala dalle 6: non conta per lo scroll iniziale
  return el('button', {
    type: 'button', class: cls.join(' '), id: `tl-${n.id}`, 'data-id': n.id, 'data-date': day.date,
    'aria-label': itemAria(n), title: itemAria(n), 'aria-haspopup': 'dialog',
    style: { '--top': px(n.startMin), '--h': pxLen(n.endMin - n.startMin), '--i': String(n.col), '--n': String(n.cols) },
  },
  // un solo contenitore di testo: il numero di righe lo decidono le container query di agenda.css (orario in linea nei blocchi bassi)
  el('span', { class: 'tl-item__in' },
    el('span', { class: 'mono' }, n.allDay ? timeRange(n) : fmtMin(n.startMin), n.parallel ? ' · in parallelo' : null),
    ' ',
    el('strong', null, n.title || '')));
}

// ---------- selettore date + navigazione ----------
function renderDateBar() {
  const frag = document.createDocumentFragment();
  state.days.forEach((d, i) => {
    frag.append(el('button', {
      type: 'button', class: 'chip agenda-date', 'data-idx': i, 'aria-pressed': 'false',
      'aria-label': `${fmtDate(d.date)}, ${placeLabel(d)}`,
    }, el('span', { class: 'agenda-date__wd' }, d.weekday || fmtDate(d.date).split(' ')[0]),
    el('span', { class: 'agenda-date__n mono' }, String(Number(d.date.slice(8, 10))))));
  });
  dateBar.replaceChildren(frag);
}

function markSelected(idx, smooth = true) {
  state.idx = idx;
  dateBar.querySelectorAll('.agenda-date').forEach((c, i) => {
    c.classList.toggle('chip--active', i === idx);
    c.setAttribute('aria-pressed', String(i === idx));
  });
  timeline.querySelectorAll('.tl-day').forEach((d, i) => d.classList.toggle('tl-day--selected', i === idx));
  const chip = dateBar.children[idx];
  if (chip) dateBar.scrollTo({ left: chip.offsetLeft - (dateBar.clientWidth - chip.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  const day = state.days[idx];
  if (day && location.hash !== `#${day.date}`) history.replaceState(null, '', `#${day.date}`);
  $('#agenda-prev').disabled = idx <= 0;
  $('#agenda-next').disabled = idx >= state.days.length - 1;
  const cur = $('#agenda-current');
  if (cur && day) cur.textContent = `${fmtDate(day.date)} · ${placeLabel(day)}`;
}

const dayEls = () => timeline.querySelectorAll('.tl-day');
const hoursW = () => ($('.tl-hours', timeline)?.offsetWidth || 0);
let scroller; // = timeline (in base.css la .timeline è lo scroller)

function goTo(idx, smooth = true) {
  idx = Math.max(0, Math.min(state.days.length - 1, idx));
  const d = dayEls()[idx];
  if (!d) return;
  state.pendingIdx = idx;
  scroller.scrollTo({ left: d.offsetLeft - hoursW(), behavior: smooth ? 'smooth' : 'auto' });
  markSelected(idx, smooth);
}

// dopo uno scroll manuale (swipe/trackpad) ricava il giorno a sinistra
let scrollT = 0;
function onScroll() {
  clearTimeout(scrollT);
  scrollT = setTimeout(() => {
    const first = dayEls()[0];
    if (!first) return;
    const derived = Math.round(scroller.scrollLeft / first.offsetWidth);
    const p = state.pendingIdx;
    state.pendingIdx = null;
    // a fine corsa (desktop, ultimi giorni) lo scroll non arriva al giorno scelto: tieni quello cliccato
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    if (p !== null && (p === derived || (atEnd && p > derived))) return;
    if (derived !== state.idx) markSelected(Math.max(0, Math.min(state.days.length - 1, derived)));
  }, 120);
}

function indexFromHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  const i = state.days.findIndex((d) => d.date === h);
  if (i >= 0) return i;
  const t = state.days.findIndex((d) => d.date === nowInTz(state.trip.timezone).date);
  return t >= 0 ? t : 0;
}

// colonne giorno visibili nello scroller (desktop ~7, mobile 1), a partire da idx
function visibleDays(idx) {
  const els = [...dayEls()];
  const first = els[idx];
  if (!first) return [];
  const per = Math.max(1, Math.round((scroller.clientWidth - hoursW()) / first.offsetWidth));
  // a fine corsa lo scroll non arriva a idx: le colonne visibili sono le ultime `per`
  const start = Math.max(0, Math.min(idx, els.length - per));
  return els.slice(start, start + per);
}
// scroll verticale iniziale: ora attuale se oggi è fra le colonne visibili; altrimenti 30' prima della
// tappa più mattiniera fra le colonne visibili (nessuna tappa resta nascosta sopra)
function scrollToMorning(idx) {
  const cols = visibleDays(idx);
  if (!cols.length) return;
  const topOf = (x) => parseFloat(x.style.getPropertyValue('--top'));
  const now = cols.map((c) => $('.tl-now', c)).find(Boolean);
  const tops = cols.flatMap((c) => [...c.querySelectorAll('.tl-item:not(.tl-item--allday)')].map(topOf)).filter(Number.isFinite);
  const at = now ? topOf(now) : tops.length ? Math.min(...tops) : null;
  if (at !== null) scroller.scrollTop = Math.max(0, at - state.hourH / 2);
}

// altezza dello scroller = viewport meno ciò che sta sopra e la bottom-nav fissa (se c'è)
function fitScroller() {
  const top = scroller.getBoundingClientRect().top + window.scrollY;
  let bottomNav = 0;
  const nav = document.querySelector('.nav');
  if (nav) {
    const cs = getComputedStyle(nav), r = nav.getBoundingClientRect();
    if ((cs.position === 'fixed' || cs.position === 'sticky') && r.top > window.innerHeight / 2) bottomNav = r.height;
  }
  timeline.style.setProperty('--tl-max-h', `${Math.max(360, window.innerHeight - top - bottomNav - 8)}px`);
}

// ---------- filtri + legenda ----------
function renderFilters() {
  const mk = (key, label) => el('button', {
    type: 'button', class: `chip${state.filters[key] ? ' chip--active' : ''}`, 'aria-pressed': String(state.filters[key]),
    onclick: (e) => {
      state.filters[key] = !state.filters[key];
      e.currentTarget.classList.toggle('chip--active', state.filters[key]);
      e.currentTarget.setAttribute('aria-pressed', String(state.filters[key]));
      saveFilters();
      const left = scroller.scrollLeft, top = scroller.scrollTop;
      renderTimeline();
      markSelected(state.idx);
      scroller.scrollLeft = left; scroller.scrollTop = top;
    },
  }, label);
  $('#agenda-filters').replaceChildren(mk('onlyFixed', 'Solo orari fissi'), mk('hideOpt', 'Senza opzionali'));

  // legenda: le 4 famiglie di colore + come si leggono fissi, facoltativi e tempo libero
  const used = new Set(state.days.flatMap((d) => (d.items || []).map((it) => FAMILY[it.type] || 'free')));
  const frag = document.createDocumentFragment();
  for (const f of FAMILIES.filter((x) => used.has(x))) {
    frag.append(el('li', { class: `chip agenda-legend__chip tl-fam--${f}` }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), FAMILY_LABEL[f]));
  }
  frag.append(el('li', { class: 'chip agenda-legend__chip agenda-legend__chip--locked' }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), 'tinta piena = orario fisso'));
  frag.append(el('li', { class: 'chip agenda-legend__chip agenda-legend__chip--opt' }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), 'senza fondo = facoltativo'));
  $('#agenda-legend-list').replaceChildren(frag);
}

// ---------- pannello dettaglio ----------
function findItem(date, id) {
  const day = state.days.find((d) => d.date === date);
  const n = day && normalizeItems(day.items).find((x) => x.id === id);
  return n ? { day, n } : null;
}

function openPanel(date, id, opener) {
  const hit = findItem(date, id);
  if (!hit) return;
  const { day, n } = hit;
  const fx = state.trip.fx;
  const b = n.booking || { status: 'none' };
  const kv = el('dl', { class: 'kv' });
  const row = (k, ...v) => kv.append(el('dt', null, k), el('dd', null, ...v));
  row('Giorno', `${fmtDate(day.date)} · ${placeLabel(day)}`);
  row('Orario', el('span', { class: 'mono' }, timeRange(n)),
    n.allDay ? null : ` (${fmtDur(n.endMin - n.startMin)}${n.estimated ? ', fine stimata' : ''})`,
    n.parallel ? ' · in parallelo agli altri item' : null);
  if (Number(n.costEur) > 0) row('Costo', el('span', { class: 'mono' }, `${fmtEur(n.costEur)} a testa · ${fmtJpy(n.costEur, fx)}`), n.costEstimate ? ' (stima)' : '', n.costNote ? ` · ${n.costNote}` : '');
  if (n.place && n.place !== n.title) row('Luogo', n.place);
  if (b.status === 'todo' || b.status === 'done') {
    row('Prenotazione', el('span', { class: `badge badge--${b.status}` }, BOOKING_LABEL[b.status]),
      b.where ? ` · ${b.where}` : '', b.when ? ` · ${b.when}` : '');
  }

  // un badge al massimo: tipo come chip, "fisso" col lucchetto (unico posto dove compare); facoltativo a parole
  const badges = el('div', { class: 'row' },
    el('span', { class: `chip agenda-legend__chip tl-type--${n.type}` }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), TYPE_LABEL[n.type] || n.type),
    n.fixed ? el('span', { class: 'badge badge--fixed' }, icon('lock'), n.type === 'fixed' ? ' non spostabile' : ' orario fisso') : null,
    n.optional ? el('span', { class: 'small muted' }, 'facoltativo') : null);

  const links = (n.links || []).filter((l) => /^[\w-]+\.html(#[\w-]*)?$/.test(l.href || ''))
    .map((l) => el('a', { class: 'btn btn--ghost', href: withDataParam(l.href) }, el('span', null, l.label), icon('chevron-right')));
  const actions = el('div', { class: 'row' },
    n.mapsQuery ? el('a', { class: 'btn btn--primary', href: mapsUrl(n.mapsQuery), target: '_blank', rel: 'noopener' }, icon('map-pin'), el('span', null, 'Apri in Google Maps'), el('span', { class: 'sr-only' }, ' (nuova scheda)'), icon('external')) : null,
    el('a', { class: 'btn btn--ghost', href: withDataParam(`giorno.html?d=${day.date}#${n.id}`) }, 'Vedi nel giorno'), ...links);

  const panel = $('#agenda-panel');
  $('#panel-title').textContent = n.title || '';
  $('#panel-body').replaceChildren(...[badges, kv, n.note ? el('p', { class: 'agenda-panel__note' }, n.note) : null, actions].filter(Boolean));
  lastFocus = opener || document.activeElement;
  panel.inert = false; panel.removeAttribute('aria-hidden');
  panel.classList.add('is-open');
  $('#agenda-overlay').hidden = false;
  panel.scrollTop = 0;
  $('.panel__close', panel).focus();
}

function closePanel() {
  const panel = $('#agenda-panel');
  if (!panel.classList.contains('is-open')) return;
  panel.classList.remove('is-open');
  panel.inert = true; panel.setAttribute('aria-hidden', 'true');
  $('#agenda-overlay').hidden = true;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

function trapFocus(e) {
  const panel = $('#agenda-panel');
  if (!panel.classList.contains('is-open') || e.key !== 'Tab') return;
  const f = [...panel.querySelectorAll('a[href],button:not([disabled])')];
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
}

// ---------- avvio ----------
async function main() {
  await initShell('agenda');
  timeline = $('#agenda-timeline'); scroller = timeline; dateBar = $('#agenda-dates');
  // loadData risolve a null in caso di errore (toast mostrato dallo shell)
  const [trip, agenda] = await Promise.all([loadData('trip'), loadData('agenda')]);
  state.trip = trip || { fx: { jpyPerEur: 0 }, timezone: 'Asia/Tokyo' };
  state.days = ((agenda && agenda.days) || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!state.days.length) {
    $('#agenda-error').hidden = false;
    $('#agenda-error').textContent = agenda ? 'Agenda vuota.' : "Impossibile caricare l'agenda. Riprova più tardi o ricarica la pagina.";
    return;
  }
  if (state.trip.subtitle) $('#agenda-sub').textContent = state.trip.subtitle;
  // avviso globale (agenda.notice): l'unico "bozza" del sito, una riga in testa all'agenda (anche su mobile)
  if (agenda.notice) {
    $('.agenda__head').append(el('div', { class: 'small row agenda__notice', role: 'note' }, // div: i <p> della testata sono nascosti su mobile
      icon('info'), el('span', null, agenda.notice)));
  }

  readFilters();
  renderFilters();
  renderDateBar();
  renderTimeline();
  fitScroller();
  const idx = indexFromHash();
  goTo(idx, false);
  scrollToMorning(idx);

  dateBar.addEventListener('click', (e) => { const c = e.target.closest('.agenda-date'); if (c) goTo(Number(c.dataset.idx)); });
  $('#agenda-prev').addEventListener('click', () => goTo(state.idx - 1));
  $('#agenda-next').addEventListener('click', () => goTo(state.idx + 1));
  scroller.addEventListener('scroll', onScroll, { passive: true });
  timeline.addEventListener('click', (e) => {
    const b = e.target.closest('.tl-item');
    if (b) openPanel(b.dataset.date, b.dataset.id, b);
  });
  window.addEventListener('hashchange', () => goTo(indexFromHash()));
  $('#agenda-overlay').addEventListener('click', closePanel);
  $('#agenda-panel .panel__close').addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
    trapFocus(e);
  });

  // cambio breakpoint/tema può cambiare --tl-hour-h: ridisegna mantenendo il giorno
  let rT = 0, lastH = state.hourH;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      fitScroller();
      if (readHourH() !== lastH) { renderTimeline(); lastH = state.hourH; markSelected(state.idx); }
      goTo(state.idx, false);
    }, 150);
  });
  // linea "adesso" aggiornata ogni minuto (solo se oggi è un giorno del viaggio)
  if (state.days.some((d) => d.date === nowInTz(state.trip.timezone).date)) {
    setInterval(() => { const l = scroller.scrollLeft, t = scroller.scrollTop; renderTimeline(); markSelected(state.idx); scroller.scrollLeft = l; scroller.scrollTop = t; }, 60000);
  }
}

main();
