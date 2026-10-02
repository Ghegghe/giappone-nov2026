// Calcoli puri dell'agenda (niente DOM): orari, durate stimate, colonne per sovrapposizioni, buchi liberi.
// Usato da agenda.js (timeline) e agenda-day.js (lista). Testato in dev/test-agenda.html.

export const DAY_START_H = 6;
export const DAY_END_H = 24;
export const GAP_MIN = 45;        // buco minimo da disegnare (minuti)
const EST_MIN = 30, EST_MAX = 90, EST_LAST = 60;

export const TYPES = ['train', 'bus', 'transfer', 'sight', 'food', 'nightlife', 'lodging', 'logistics', 'free', 'fixed', 'anime', 'onsen', 'shopping'];
export const TYPE_LABEL = {
  train: 'Treno', bus: 'Bus', transfer: 'Spostamento', sight: 'Visita', food: 'Cibo', nightlife: 'Nightlife',
  lodging: 'Alloggio', logistics: 'Logistica', free: 'Libero', fixed: 'Vincolo fisso', anime: 'Anime/otaku',
  onsen: 'Onsen', shopping: 'Shopping',
};
// 4 famiglie di colore della timeline (ibrido 2 ott): i 13 type dei dati restano, il colore viene dalla famiglia
// (mappa --c-<type> → --fam-* nei temi). "free" non è una famiglia: è spazio, in grigio.
export const FAMILY = {
  train: 'move', bus: 'move', transfer: 'move', logistics: 'move',
  fixed: 'fixed', lodging: 'fixed',
  sight: 'culture', anime: 'culture', onsen: 'culture', shopping: 'culture',
  food: 'evening', nightlife: 'evening', free: 'free',
};
export const FAMILY_LABEL = { move: 'Spostamenti', fixed: 'Orari fissi', culture: 'Visite e cultura', evening: 'Cibo e sera', free: 'Libero' };
export const FAMILIES = ['move', 'fixed', 'culture', 'evening'];
export const BOOKING_LABEL = { none: 'nessuna prenotazione', todo: 'da prenotare', done: 'prenotato' };

// "07:45" → 465 ; null se non valido
export function toMin(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
// 465 → "07:45" (oltre le 24 resta "25:10" per non confondere col giorno dopo)
export const fmtMin = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
// 80 → "1h20" · 45 → "45'" · 120 → "2h"
export function fmtDur(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m}'`;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Normalizza gli item: aggiunge start/endMin/estimated, ordina per orario. Item senza orario valido scartati (contati).
// Regola durata se `end` manca: fino all'item successivo (che inizia dopo), min 30', max 90'; ultimo item 60'.
// Item `allDay` senza orario (es. giorno libero): occupa la scala dalle 6 fino al primo item con orario
// (o fino alle 24 se non ce ne sono) e non genera buchi.
export function normalizeItems(items) {
  const firstTimed = Math.min(...(items || []).map((it) => toMin(it.time)).filter((m) => m !== null && m > DAY_START_H * 60 + 30));
  const allEnd = Number.isFinite(firstTimed) ? firstTimed : DAY_END_H * 60;
  const all = (items || []).filter((it) => it.allDay && toMin(it.time) === null)
    .map((it) => ({ ...it, startMin: DAY_START_H * 60, endMin: allEnd, estimated: false, allDay: true }));
  const list = (items || [])
    .map((it, idx) => ({ it, idx, start: toMin(it.time) }))
    .filter((x) => x.start !== null)
    .sort((a, b) => a.start - b.start || a.idx - b.idx);
  return list.map((x, i) => {
    let end = toMin(x.it.end), estimated = false;
    if (end !== null && end < x.start) end += 24 * 60;           // finisce dopo mezzanotte
    if (end === null) {
      estimated = true;
      const next = list.slice(i + 1).find((y) => y.start > x.start);
      end = x.start + (next ? clamp(next.start - x.start, EST_MIN, EST_MAX) : EST_LAST);
    }
    return { ...x.it, startMin: x.start, endMin: end, estimated };
  }).concat(all).sort((a, b) => a.startMin - b.startMin);
}
// "06:00-24:00" oppure "tutto il giorno" / "giornata, fino alle 20:00" (allDay)
export const timeRange = (n) => (n.allDay
  ? (n.endMin < DAY_END_H * 60 ? `giornata, fino alle ${fmtMin(n.endMin)}` : 'tutto il giorno')
  : `${fmtMin(n.startMin)}-${fmtMin(n.endMin)}`);

// Intervallo orario da disegnare: 6-24, esteso a ore intere se un item esce.
export function dayRange(norm) {
  let lo = DAY_START_H * 60, hi = DAY_END_H * 60;
  for (const n of norm) { lo = Math.min(lo, n.startMin); hi = Math.max(hi, n.endMin); }
  return { startMin: Math.floor(lo / 60) * 60, endMin: Math.ceil(hi / 60) * 60 };
}
export function rangeOfDays(normDays) {
  const all = normDays.map(dayRange);
  return { startMin: Math.min(...all.map((r) => r.startMin)), endMin: Math.max(...all.map((r) => r.endMin)) };
}

// Sovrapposizioni: raggruppa item che si toccano transitivamente, assegna colonna greedy.
// Ritorna nuovi oggetti con col (0-based) e cols (colonne del gruppo).
export function assignColumns(norm) {
  const out = norm.map((n) => ({ ...n, col: 0, cols: 1 }));
  let cluster = [], colEnds = [], clusterEnd = -1;
  const flush = () => { for (const c of cluster) c.cols = colEnds.length; cluster = []; colEnds = []; clusterEnd = -1; };
  for (const n of out) {
    if (cluster.length && n.startMin >= clusterEnd) flush();
    let col = colEnds.findIndex((e) => e <= n.startMin);
    if (col === -1) { col = colEnds.length; colEnds.push(n.endMin); } else colEnds[col] = n.endMin;
    n.col = col;
    cluster.push(n);
    clusterEnd = Math.max(clusterEnd, n.endMin);
  }
  flush();
  return out;
}

// Buchi ≥ GAP_MIN: tra l'unione degli intervalli occupati + margine iniziale (da 6:00) e finale (fino a 24:00).
// edge = 'start' | 'end' | null
export function computeGaps(norm, opts = {}) {
  const from = opts.fromMin ?? DAY_START_H * 60, to = opts.toMin ?? DAY_END_H * 60, min = opts.minGap ?? GAP_MIN;
  const busy = [];
  for (const n of [...norm].sort((a, b) => a.startMin - b.startMin)) {
    const last = busy[busy.length - 1];
    if (last && n.startMin <= last.e) last.e = Math.max(last.e, n.endMin);
    else busy.push({ s: n.startMin, e: n.endMin });
  }
  const gaps = [];
  const push = (s, e, edge) => { if (e - s >= min) gaps.push({ startMin: s, endMin: e, dur: e - s, edge, label: gapLabel(s, e) }); };
  if (!busy.length) { push(from, to, 'start'); return gaps; }
  if (busy[0].s > from) push(from, busy[0].s, 'start');
  for (let i = 1; i < busy.length; i++) push(busy[i - 1].e, busy[i].s, null);
  const lastEnd = busy[busy.length - 1].e;
  if (lastEnd < to) push(lastEnd, to, 'end');
  return gaps;
}
export const gapLabel = (s, e) => `${fmtMin(s)}-${fmtMin(e)} · libero (${fmtDur(e - s)})`;

// Totale €/pax del giorno (tutti gli item) + quota opzionali
export function dayTotals(items) {
  let total = 0, optional = 0;
  for (const it of items || []) {
    const c = Number(it.costEur) || 0;
    total += c;
    if (it.optional) optional += c;
  }
  return { total: Math.round(total * 100) / 100, optional: Math.round(optional * 100) / 100 };
}

// Data e minuti correnti nel fuso del viaggio. Test: ?now=2026-11-08T14:30 (ora del viaggio) oppure
// ?today=2026-11-08 (stesso override di app.js todayInTokyo; ora = ora reale a Tokyo).
export function nowInTz(tz = 'Asia/Tokyo') {
  const q = new URLSearchParams(location.search);
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(q.get('now') || '');
  if (m) return { date: m[1], min: Number(m[2]) * 60 + Number(m[3]) };
  const today = /^\d{4}-\d{2}-\d{2}$/.test(q.get('today') || '') ? q.get('today') : null;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: today || `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

// Testo accessibile di un item
export function itemAria(n) {
  const bits = [timeRange(n), n.title, TYPE_LABEL[n.type] || n.type];
  if (n.fixed) bits.push('vincolo fisso');
  if (n.optional) bits.push('opzionale');
  if (n.parallel) bits.push('in parallelo');
  return bits.join(', ');
}

// Mantiene ?data= (fixture in sviluppo) nei link interni
export function withDataParam(href) {
  const data = new URLSearchParams(location.search).get('data');
  if (!data) return href;
  const [base, hash = ''] = href.split('#');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}data=${encodeURIComponent(data)}${hash ? '#' + hash : ''}`;
}

// Mini helper DOM condiviso: el('div', {class:'x', 'aria-label':'..'}, figli...). Testi sempre via textContent (mai innerHTML).
export function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'style') for (const [p, val] of Object.entries(v)) n.style.setProperty(p, val);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k instanceof Node ? k : String(k));
  return n;
}
// Icona dallo sprite (design-system): <svg class="icon"><use href="assets/icons/sprite.svg#i-NAME"></svg>
const SVG = 'http://www.w3.org/2000/svg';
export function icon(name, cls = 'icon') {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('class', cls);
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const u = document.createElementNS(SVG, 'use');
  u.setAttribute('href', `assets/icons/sprite.svg#i-${name}`);
  s.append(u);
  return s;
}
