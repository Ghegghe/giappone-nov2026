// charts.js — grafici SVG inline, senza librerie (PLAN_PRESENTAZIONE §3). API fissata nel piano §4: non cambiarla senza l'orchestratore.
// Ogni funzione restituisce un frammento html`` (Raw) già disegnato a 343px; wire(root), dopo mount, lo ridisegna
// alla larghezza misurata (ResizeObserver) e aggiunge tooltip, tastiera e salti alla lista. Colori SOLO via classi → charts.css.
import { fmtEur, fmtJpy, fmtDate, todayInTokyo } from './app.js';
import { html, raw, mount, daysBetween } from './pages.js';

const DEFAULT_W = 343;                 // colonna utile a 375
const FS = 12;                         // corpo delle etichette
let uidN = 0;
const uid = (p) => `${p}${(++uidN).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Aree di tocco ≥ T px (SPEC §4) per segmenti in fila [{x, w}]: centrate sul segmento, mai sovrapposte fra loro.
 *  Se due vicine si contendono lo spazio vince la più stretta, ma una larga ≥ T non scende sotto T;
 *  se sono strette entrambe si taglia a metà fra le due → lì l'area può scendere sotto T (scelta: niente sovrapposizioni). */
function tapSpans(segs, W, T = 44) {
  const out = segs.map((g) => { const w = Math.max(g.w, T); const a = clamp(g.x + g.w / 2 - w / 2, 0, Math.max(0, W - w)); return { a, b: Math.min(W, a + w) }; });
  for (let i = 1; i < segs.length; i++) {
    const L = out[i - 1], R = out[i], gl = segs[i - 1], gr = segs[i];
    if (L.b <= R.a) continue;
    const mid = (gl.x + gl.w + gr.x) / 2;
    // la larga cede al massimo (w - T) / 2 per lato: se era ≥ T resta ≥ T
    const slack = (g) => Math.max(0, (g.w - T) / 2);
    const cut = gl.w < T && gr.w < T ? mid
      : gl.w < gr.w ? Math.max(mid, Math.min(L.b, gr.x + slack(gr)))
      : gr.w < gl.w ? Math.min(mid, Math.max(R.a, gl.x + gl.w - slack(gl))) : mid;
    L.b = Math.min(L.b, cut); R.a = Math.max(R.a, cut);
  }
  return out;
}
const guess = (s, size = FS) => String(s).length * size * 0.56;   // misura stimata finché non c'è il DOM
const ISO = /^\d{4}-\d{2}-\d{2}/;

/** € con centesimi (1.189,61; niente ",00"). */
function eur2(n) {
  const v = Number(n);
  if (n == null || n === '' || !Number.isFinite(v)) return '—';
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  return (v < 0 ? '-' : '') + '€' + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d === '00' ? '' : ',' + d);
}
function addDays(iso, n) {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n));
  return d.toISOString().slice(0, 10);
}
const weekdayOf = (iso) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay();
/** "7-11 nov" · "30 ott - 2 nov" */
function rangeLabel(a, b) {
  const A = fmtDate(a, { weekday: false }), B = fmtDate(b, { weekday: false });
  if (!b || a === b) return A;
  const [da, ma] = A.split(' '), [db, mb] = B.split(' ');
  return ma === mb ? `${da}-${db} ${mb}` : `${A} - ${B}`;
}
/** Percentuali intere che sommano a 100 (resti maggiori). */
function pcts(values) {
  const tot = values.reduce((s, v) => s + v, 0) || 1;
  const raw0 = values.map((v) => (v / tot) * 100);
  const out = raw0.map(Math.floor);
  let left = 100 - out.reduce((s, v) => s + v, 0);
  raw0.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0 && values[i] > 0) { out[i]++; left--; } });
  return out;
}
/** Barra orizzontale con angoli arrotondati solo a destra (estremo dati), base quadrata. */
function barPath(x, y, w, h, r = 4) {
  if (w <= 0) return '';
  const rr = Math.min(r, w, h / 2);
  return `M${r1(x)} ${r1(y)}H${r1(x + w - rr)}Q${r1(x + w)} ${r1(y)} ${r1(x + w)} ${r1(y + rr)}V${r1(y + h - rr)}Q${r1(x + w)} ${r1(y + h)} ${r1(x + w - rr)} ${r1(y + h)}H${r1(x)}Z`;
}
const svgOpen = (W, H, attrs) => raw(`<svg viewBox="0 0 ${Math.round(W)} ${Math.round(H)}" width="${Math.round(W)}" height="${Math.round(H)}" focusable="false" ${attrs}>`);
const tip = (v, l) => html`data-tv="${v}" data-tl="${l || ''}"`;

// ---------- Contenitore comune ----------
function figure(type, spec, { caption, after = '', cls = '' } = {}) {
  const first = DRAW[type](spec, DEFAULT_W, guess);
  return html`<figure class="chart chart--${type}${cls ? ' ' + cls : ''}" data-chart="${type}" data-spec="${JSON.stringify(spec)}">
    ${caption ? html`<figcaption class="chart__caption">${caption}</figcaption>` : ''}
    <div class="chart__plot">${first.svg}</div>
    ${type === 'route' ? html`<p class="chart__inline-legend small muted"${first.fallback ? '' : raw(' hidden')}>${spec.segs.map((s) => `${s.city} ${s.nights}`).join(' · ')}</p>` : ''}
    ${after}
    <div class="chart__tip" role="tooltip" hidden></div>
  </figure>`;
}
function tableDetails(head, rows, foot, caption) {
  return html`<details class="chart__table"><summary>Mostra come tabella</summary>
    <div class="chart__tbl-wrap"><table class="chart__tbl">
      <caption class="sr-only">${caption}</caption>
      <thead><tr>${head.map((h, i) => html`<th scope="col"${i ? raw(' class="chart__num"') : ''}>${h}</th>`)}</tr></thead>
      <tbody>${rows.map((r) => html`<tr>${r.map((c, i) => (i ? html`<td class="chart__num">${c}</td>` : html`<th scope="row">${c}</th>`))}</tr>`)}</tbody>
      ${foot ? html`<tfoot><tr>${foot.map((c, i) => (i ? html`<td class="chart__num">${c}</td>` : html`<th scope="row">${c}</th>`))}</tr></tfoot>` : ''}
    </table></div></details>`;
}

// =====================================================================
// routeStrip — §3.4: barra unica, larghezze ∝ notti, enfasi su una base, etichette su 2 corsie misurate
// =====================================================================
/**
 * stays: [{id, city, checkIn, checkOut, nights}] (lodging.stays). Opzioni:
 * today/start/end ISO (default: todayInTokyo() e il primo checkIn / l'ultimo checkOut) ·
 * link: false | true ('#'+id) | (stay) => href · emphasis: 'auto' (base di oggi o la prossima) | 'none' | id · caption.
 */
export function routeStrip(stays, { today, start, end, link = false, emphasis = 'auto', caption } = {}) {
  const list = (stays || []).filter((s) => s && ISO.test(s.checkIn || '') && ISO.test(s.checkOut || '')).slice()
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  if (!list.length) return '';
  start = start || list[0].checkIn;
  end = end || list[list.length - 1].checkOut;
  today = today || todayInTokyo();
  const nightsOf = (s) => (Number(s.nights) > 0 ? Number(s.nights) : Math.max(1, daysBetween(s.checkIn, s.checkOut)));
  let emph = null;
  if (emphasis === 'auto') {
    const cur = list.find((s) => s.checkIn <= today && today < s.checkOut);
    emph = cur ? cur.id : today < list[0].checkIn ? list[0].id : null;
  } else if (emphasis && emphasis !== 'none') emph = emphasis;
  const href = (s) => {
    const h = link === true ? '#' + (s.id || '') : typeof link === 'function' ? String(link(s) || '') : '';
    return /^(#[\w-]+|[\w-]+\.html([?#][\w=&.%/-]*)?)$/.test(h) ? h : '';
  };
  const segs = list.map((s) => {
    const n = nightsOf(s), city = s.city || s.name || '', dates = rangeLabel(s.checkIn, s.checkOut);
    return { id: s.id || '', city, nights: n, dates, href: href(s), emph: !!emph && s.id === emph,
      aria: `${city}, ${dates}, ${n} ${n === 1 ? 'notte' : 'notti'}` };
  });
  const total = segs.reduce((a, s) => a + s.nights, 0);
  // tacca: in viaggio "oggi" a metà della notte corrente; prima del viaggio "partenza" all'inizio; dopo, nessuna
  let tick = null;
  if (today >= start && today <= end) tick = { at: Math.min(total, daysBetween(start, today) + (today < end ? 0.5 : 0)), label: 'oggi' };
  else if (today < start) tick = { at: 0, label: `partenza ${fmtDate(start, { weekday: false })}` };
  const linked = segs.some((s) => s.href);
  const summary = `Rotta: ${segs.length} basi, ${total} notti`;
  const spec = { segs, total, tick, linked, summary };
  return figure('route', spec, {
    caption,
    after: linked ? '' : html`<ol class="sr-only">${segs.map((s) => html`<li>${s.aria}${s.emph ? (tick && tick.label === 'oggi' ? ' (oggi)' : ' (prossima)') : ''}</li>`)}</ol>`,
  });
}

function drawRoute(spec, W, measure) {
  const { segs, total, tick } = spec;
  // righe: [etichetta tacca] · corsia sopra · barra · corsia sotto. La tacca ha una riga sua: non ruba posto alle città.
  const GAP = 2, BAR = 12, ROWT = tick ? 14 : 0, laneTop = 12 + ROWT, TOP = 20 + ROWT, laneBot = TOP + BAR + 15, H = laneBot + 5;
  const avail = W - GAP * (segs.length - 1);
  let x = 0;
  const geo = segs.map((s) => { const w = (avail * s.nights) / total; const g = { x, w, cx: x + w / 2 }; x += w + GAP; return g; });
  // posizione della tacca in px (tiene conto dei gap)
  let tickX = null;
  if (tick) {
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (tick.at <= acc + segs[i].nights || i === segs.length - 1) { tickX = geo[i].x + geo[i].w * clamp((tick.at - acc) / segs[i].nights, 0, 1); break; }
      acc += segs[i].nights;
    }
  }
  const lanes = { top: [], bot: [] };
  const SP = 10;   // spazio minimo fra due nomi nella stessa corsia (con 6px "Osaka Takayama" si legge come un nome solo)
  const free = (lane, a, b) => lanes[lane].every(([p, q]) => b + SP <= p || a >= q + SP);
  let tickLab = null;
  if (tick) {
    const tw = measure(tick.label);
    const lx = clamp(tickX - tw / 2, 0, W - tw);
    lanes.top.push([tickX - 3, tickX + 3]);   // il filo della tacca attraversa la corsia sopra
    tickLab = { x: lx, w: tw };
  }
  let fallback = false;
  const labs = geo.map((g, i) => {
    const tw = measure(segs[i].city);
    // centrata sul segmento; se urta scivola a destra finché copre ancora il centro. Vince la corsia con lo spostamento minore (a pari, sotto).
    const c0 = clamp(g.cx - tw / 2, 0, W - tw);
    let best = null;
    for (const lane of ['bot', 'top']) {
      let lx = c0;
      for (let k = 0; k < 8 && !free(lane, lx, lx + tw); k++) {
        const hit = lanes[lane].find(([p, q]) => !(lx + tw + SP <= p || lx >= q + SP));
        lx = hit[1] + SP;
      }
      if (lx <= g.cx && lx + tw <= W && free(lane, lx, lx + tw) && (!best || lx - c0 < best.x - c0)) best = { lane, x: lx };
    }
    if (best) { lanes[best.lane].push([best.x, best.x + tw]); return best; }
    fallback = true; return null;
  });
  const cid = uid('rc');
  // con i link: area di tocco trasparente 44×44 (≥ del segmento), sotto il segno; vedi tapSpans
  const TAP = 44, tapY = clamp(TOP + BAR / 2 - TAP / 2, 0, Math.max(0, H - TAP));
  const taps = spec.linked ? tapSpans(geo, W, TAP) : [];
  const segMark = (s, g, i) => {
    const inner = measure(String(s.nights), 10) + 8 <= g.w;
    const t = s.href && taps[i];
    const body = html`${t ? html`<rect class="chart__tap" x="${r1(t.a)}" y="${r1(tapY)}" width="${r1(t.b - t.a)}" height="${TAP}"></rect>` : ''}<rect class="chart__hit" x="${r1(g.x)}" y="${TOP - 10}" width="${r1(g.w)}" height="32"></rect>
      <rect class="chart__seg${s.emph ? ' chart__seg--emph' : ''}" x="${r1(g.x)}" y="${TOP}" width="${r1(g.w)}" height="${BAR}" clip-path="url(#${cid})"></rect>
      ${inner ? html`<text class="chart__in${s.emph ? ' chart__in--emph' : ''}" x="${r1(g.cx)}" y="${TOP + 9}" text-anchor="middle">${s.nights}</text>` : ''}`;
    return s.href
      ? html`<a class="chart__mark" href="${s.href}" aria-label="${s.aria}" ${tip(s.city, `${s.dates} · ${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`)}>${body}</a>`
      : html`<g class="chart__mark" ${tip(s.city, `${s.dates} · ${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`)}>${body}</g>`;
  };
  const svg = html`${svgOpen(W, H, spec.linked ? html`role="group" aria-label="${spec.summary}"` : 'aria-hidden="true"')}
    <defs><clipPath id="${cid}"><rect x="0" y="${TOP}" width="${r1(W)}" height="${BAR}" rx="4"></rect></clipPath></defs>
    ${segs.map((s, i) => segMark(s, geo[i], i))}
    ${fallback ? '' : labs.map((l, i) => l && html`<text class="chart__label" x="${r1(l.x)}" y="${l.lane === 'bot' ? laneBot : laneTop}">${segs[i].city}</text>`)}
    ${tick ? html`<g class="chart__today" aria-hidden="true">
      <rect class="chart__today-tick${spec.anim === false ? '' : ' chart__today--enter'}" x="${r1(clamp(tickX - 1, 0, W - 2))}" y="16" width="2" height="${TOP + BAR + 4 - 16}"></rect>
      <text class="chart__label chart__label--strong" x="${r1(tickLab.x)}" y="12">${tick.label}</text></g>` : ''}
  </svg>`;
  return { svg, fallback };
}

// =====================================================================
// dotTimeline — §3.3: strip plot da `from` a `to`, punti impilati per data, enfasi sulla prossima
// =====================================================================
/**
 * events: [{date, label, id?, emph?, when?}] · id = id dell'elemento della lista gemella (tap/Invio ci scorre) ·
 * when = testo data da mostrare nel tooltip (es. deadlineLabel) · emph: se nessuno lo ha, si enfatizzano i più vicini.
 * Opzioni: from (default today), to (default ultima data), today, caption. Gli eventi fuori da [from, to] non si disegnano:
 * il chiamante li conta a parte ("+1 dopo la partenza").
 */
export function dotTimeline(events, { from, to, today, caption } = {}) {
  today = today || todayInTokyo();
  from = from || today;
  const all = (events || []).filter((e) => e && ISO.test(e.date || '')).map((e) => ({ ...e, date: e.date.slice(0, 10) }));
  to = to || all.reduce((m, e) => (e.date > m ? e.date : m), from);
  if (to < from) to = from;
  const evs = all.filter((e) => e.date >= from && e.date <= to).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const span = Math.max(1, daysBetween(from, to));
  if (!evs.some((e) => e.emph) && evs.length) evs.forEach((e) => { e.emph = e.date === evs[0].date; });
  const byDate = new Map();
  evs.forEach((e) => { if (!byDate.has(e.date)) byDate.set(e.date, []); byDate.get(e.date).push(e); });
  const groups = [...byDate].map(([date, items]) => ({
    d: daysBetween(from, date), date: fmtDate(date),
    items: items.map((e) => ({ label: String(e.label || ''), id: /^[\w-]+$/.test(e.id || '') ? e.id : '', emph: !!e.emph, when: e.when || fmtDate(date) })),
  }));
  const ticks = [];
  for (let d = 0; d <= span; d++) { const iso = addDays(from, d); if (weekdayOf(iso) === 1) ticks.push({ d, label: fmtDate(iso, { weekday: false }) }); }
  const firstEmph = groups.find((g) => g.items.some((i) => i.emph));
  const nE = firstEmph ? firstEmph.items.length : 0;
  const nWord = `${nE} ${nE === 1 ? 'scadenza' : 'scadenze'}`;
  const next = firstEmph ? { d: firstEmph.d, label: `${firstEmph.date} · ${nWord}`, nWord } : null;
  const fromWord = from === today ? 'oggi' : `il ${fmtDate(from, { weekday: false })}`;
  const summary = `${evs.length} ${evs.length === 1 ? 'scadenza' : 'scadenze'} fra ${fromWord} e il ${fmtDate(to, { weekday: false })}` +
    (next ? `; la prossima ${firstEmph.date}` : '');
  const spec = { span, groups, ticks, next, todayD: today >= from && today <= to ? daysBetween(from, today) : null,
    endLabel: `partenza ${fmtDate(to, { weekday: false })}`, summary };
  return figure('dots', spec, { caption });
}

function drawDots(spec, W, measure) {
  const { span, groups, ticks, next, todayD } = spec;
  const PAD = 8, STEP = 8, R = 4;
  const X = (d) => PAD + ((W - 2 * PAD) * d) / span;
  // etichette in alto: "oggi" e "partenza" in riga 1; la prossima in riga 1 se c'è posto, altrimenti riga 2
  const rows = [[], []];
  const fits = (row, a, b) => rows[row].every(([p, q]) => b + 6 <= p || a >= q + 6);
  const labels = [];
  const put = (text, x, anchor, cls, forceRow) => {
    const tw = measure(text);
    let a = anchor === 'end' ? x - tw : anchor === 'middle' ? x - tw / 2 : x;
    a = clamp(a, 0, W - tw);
    const row = forceRow != null ? forceRow : fits(0, a, a + tw) ? 0 : 1;
    rows[row].push([a, a + tw]);
    labels.push({ text, x: a, row, cls });
  };
  // prossima scadenza nello stesso giorno di "oggi": un'etichetta sola ("oggi · 2 scadenze"), mai due sovrapposte sul filo
  const sameDay = !!next && todayD != null && next.d === todayD;
  if (todayD != null) put(sameDay ? `oggi · ${next.nWord}` : 'oggi', X(todayD) + 4, 'start', 'chart__label--strong', 0);
  put(spec.endLabel, X(span) - 4, 'end', 'chart__label--muted', 0);
  if (next && !sameDay) { const nx = X(next.d); put(next.label, measure(next.label) + nx - 4 <= W ? nx - 4 : nx + 4, measure(next.label) + nx - 4 <= W ? 'start' : 'end', 'chart__label--strong'); }
  const nRows = labels.some((l) => l.row === 1) ? 2 : 1;
  const maxStack = groups.reduce((m, g) => Math.max(m, g.items.length), 1);
  const labH = nRows * 16;
  const axisY = labH + 10 + 6 + (maxStack - 1) * STEP + R + 6;
  const H = axisY + 22;
  const tickLabs = [];
  let lastEnd = -Infinity;
  ticks.forEach((t) => {
    const tw = measure(t.label), a = clamp(X(t.d) - tw / 2, 0, W - tw);
    if (a >= lastEnd + 8) { tickLabs.push({ ...t, x: a }); lastEnd = a + tw; }
  });
  const dot = (g, it, k) => {
    const cx = X(g.d), cy = axisY - 6 - R - k * STEP;
    const aria = `${it.label}, ${it.when}`;
    const body = html`<rect class="chart__hit" x="${r1(cx - 12)}" y="${r1(cy - 12)}" width="24" height="24"></rect>
      <circle class="chart__dot${it.emph ? ' chart__dot--emph' : ''}" cx="${r1(cx)}" cy="${r1(cy)}" r="${R}"></circle>`;
    return it.id
      ? html`<a class="chart__mark" href="#${it.id}" data-goto="${it.id}" aria-label="${aria}" ${tip(it.label, it.when)}>${body}</a>`
      : html`<g class="chart__mark" tabindex="0" role="img" aria-label="${aria}" ${tip(it.label, it.when)}>${body}</g>`;
  };
  const svg = html`${svgOpen(W, H, html`role="group" aria-label="${spec.summary}"`)}
    <line class="chart__axis" x1="${PAD}" x2="${r1(W - PAD)}" y1="${axisY}" y2="${axisY}"></line>
    ${ticks.map((t) => html`<line class="chart__axis" x1="${r1(X(t.d))}" x2="${r1(X(t.d))}" y1="${axisY}" y2="${axisY + 4}"></line>`)}
    ${tickLabs.map((t) => html`<text class="chart__axis-label" x="${r1(t.x)}" y="${axisY + 17}">${t.label}</text>`)}
    <line class="chart__ref" x1="${r1(X(span))}" x2="${r1(X(span))}" y1="2" y2="${axisY + 4}"></line>
    ${todayD != null ? html`<rect class="chart__today-tick" x="${r1(X(todayD) - 1)}" y="2" width="2" height="${axisY + 2}"></rect>` : ''}
    ${labels.map((l) => html`<text class="chart__label ${l.cls}" x="${r1(l.x)}" y="${12 + l.row * 16}">${l.text}</text>`)}
    ${groups.map((g) => g.items.map((it, k) => dot(g, it, k)))}
  </svg>`;
  return { svg };
}

// =====================================================================
// stackBar — §3.2(a): barra 100% impilata, rampa ordinale di una tinta, legenda con importi sotto
// =====================================================================
/** segments: [{id, label, value}] nell'ordine ordinale · total (default somma) · caption · fx (¥ per € o trip.fx) per tooltip e tabella. */
export function stackBar(segments, { total, caption, fx } = {}) {
  const segs0 = (segments || []).filter((s) => s && Number.isFinite(Number(s.value))).map((s) => ({ id: String(s.id || ''), label: String(s.label || ''), value: Math.max(0, Number(s.value)) }));
  if (!segs0.length) return '';
  const sum = segs0.reduce((a, s) => a + s.value, 0);
  const tot = Number(total) > 0 ? Number(total) : sum;
  const pc = pcts(segs0.map((s) => s.value));
  const segs = segs0.map((s, i) => ({ ...s, ord: Math.min(i + 1, 4), pct: pc[i], eur: eur2(s.value), jpy: fmtJpy(s.value, fx) }));
  const spec = { segs, total: tot, label: caption || 'Composizione del totale' };
  const legend = html`<ul class="chart__legend">${segs.map((s) => html`<li><span class="chart__key chart__key--ord-${s.ord}" aria-hidden="true"></span><span>${s.label} <strong>${s.eur}</strong> · ${s.pct}%</span></li>`)}</ul>`;
  const hasJ = segs.some((s) => s.jpy);
  const table = tableDetails(['Voce', '€', '%', ...(hasJ ? ['¥'] : [])],
    segs.map((s) => [s.label, s.eur, s.pct + '%', ...(hasJ ? [s.jpy] : [])]),
    ['Totale', eur2(tot), '100%', ...(hasJ ? [fmtJpy(tot, fx)] : [])], spec.label);
  return figure('stack', spec, { caption, after: html`${legend}${table}` });
}

function drawStack(spec, W) {
  const { segs, total } = spec, GAP = 2, BAR = 16, TOP = 8, H = 32;
  const shown = segs.filter((s) => s.value > 0);
  const avail = W - GAP * (shown.length - 1);
  const cid = uid('sc'), h1 = uid('h'), h2 = uid('h');
  let x = 0;
  const marks = shown.map((s) => {
    const w = (avail * s.value) / (total || 1);
    const m = html`<g class="chart__mark" tabindex="0" role="img" aria-label="${s.label}: ${s.eur}, ${s.pct}% del totale" ${tip(`${s.eur}${s.jpy ? ' · ' + s.jpy : ''}`, `${s.label} · ${s.pct}%`)}>
      <rect class="chart__hit" x="${r1(x)}" y="0" width="${r1(w + GAP)}" height="${H}"></rect>
      <rect class="chart__ord chart__ord-${s.ord}" x="${r1(x)}" y="${TOP}" width="${r1(Math.max(0, w))}" height="${BAR}" clip-path="url(#${cid})"
        style="--hatch: ${s.ord === 2 ? `url(#${h1})` : s.ord >= 3 ? `url(#${h2})` : 'CanvasText'}"></rect></g>`;
    x += w + GAP;
    return m;
  });
  const hatch = (id, rot) => html`<pattern id="${id}" class="chart__hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><path d="M0 0V6" stroke-width="2"></path></pattern>`;
  const svg = html`${svgOpen(W, H, html`role="group" aria-label="${spec.label}"`)}
    <defs><clipPath id="${cid}"><rect x="0" y="${TOP}" width="${r1(W)}" height="${BAR}" rx="4"></rect></clipPath>${hatch(h1, 45)}${hatch(h2, 135)}</defs>
    ${marks}</svg>`;
  return { svg };
}

// =====================================================================
// bulletRows — §3.2(b): una riga per giorno, barra = valore, tacca in inchiostro = obiettivo, un solo asse € da 0
// =====================================================================
/**
 * rows: [{date, value, target}] · caption · labelRule(row, i, rows) → string | true | false (true = testo di default);
 * default: il valore massimo e i 2 giorni col margine target − valore più ampio; al massimo 3 etichette dirette.
 * names (estensione facoltativa): {value:'agenda', target:'budget', valueLong:'costi in agenda', targetLong:'budget previsto'}.
 */
export function bulletRows(rows, { caption, labelRule, names } = {}) {
  const N = { value: 'agenda', target: 'budget', valueLong: 'costi in agenda', targetLong: 'budget previsto', ...(names || {}) };
  const rs = (rows || []).filter((r) => r && ISO.test(r.date || '')).map((r) => ({
    date: r.date.slice(0, 10), v: Math.max(0, Number(r.value) || 0), t: Number.isFinite(Number(r.target)) && r.target !== null && r.target !== '' ? Number(r.target) : null,
  }));
  if (!rs.length) return '';
  const maxV = Math.max(...rs.map((r) => r.v));
  const iMax = rs.findIndex((r) => r.v === maxV);
  const defText = (r, i) => (i !== iMax && r.t != null && r.t > r.v ? `${fmtEur(r.v)} / ${N.target} ${fmtEur(r.t)}` : fmtEur(r.v));
  // default: il massimo + i 2 giorni col margine (target − valore) più ampio, cioè dove il budget copre altro (es. ryokan con cena)
  const byMargin = rs.map((r, i) => [r.t != null ? r.t - r.v : -1, i]).filter(([m, i]) => m > 0 && i !== iMax).sort((a, b) => b[0] - a[0]).slice(0, 2).map(([, i]) => i);
  const rule = labelRule || ((r, i) => i === iMax || byMargin.includes(i));
  const pub = rs.map((r) => ({ date: r.date, value: r.v, target: r.t }));
  const want = rs.map((r, i) => { const x = rule(pub[i], i, pub); return x === true ? defText(r, i) : typeof x === 'string' && x ? x : null; });
  const order = [iMax, ...rs.map((_, i) => i).filter((i) => i !== iMax)];
  let n = 0;
  order.forEach((i) => { if (want[i] && n < 3) n++; else want[i] = null; });
  const top = Math.max(1, ...rs.map((r) => Math.max(r.v, r.t || 0)));
  const mag = Math.pow(10, Math.floor(Math.log10(top)));
  const step = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => Math.ceil(top / s) <= 4) || 10 * mag;
  const dmax = Math.ceil(top / step) * step;
  const ticks = []; for (let v = 0; v <= dmax + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  const out = rs.map((r, i) => {
    const dl = fmtDate(r.date);
    const marg = r.t != null ? r.t - r.v : null;
    const tl = `${dl}${marg != null ? (marg >= 0 ? ` · margine ${fmtEur(marg)}` : ` · oltre di ${fmtEur(-marg)}`) : ''}`;
    const tv = `${N.value} ${fmtEur(r.v)}${r.t != null ? ` · ${N.target} ${fmtEur(r.t)}` : ''}`;
    return { dl, v: r.v, t: r.t, lab: want[i], tv, tl, aria: `${tl.replace(' · ', ': ')}; ${tv}` };
  });
  const spec = { rows: out, dmax, ticks, label: caption || `${N.valueLong} e ${N.targetLong} per giorno` };
  const legend = html`<ul class="chart__legend"><li><span class="chart__key chart__key--bar" aria-hidden="true"></span><span>barra = ${N.valueLong}</span></li>
    <li><span class="chart__key chart__key--tick" aria-hidden="true"></span><span>tacca = ${N.targetLong}</span></li></ul>`;
  const table = tableDetails(['Giorno', N.value, N.target, 'differenza'],
    rs.map((r) => [fmtDate(r.date), eur2(r.v), r.t != null ? eur2(r.t) : '—', r.t != null ? eur2(Math.round((r.t - r.v) * 100) / 100) : '—']),
    ['Totale', eur2(rs.reduce((a, r) => a + r.v, 0)), eur2(rs.reduce((a, r) => a + (r.t || 0), 0)), eur2(Math.round(rs.reduce((a, r) => a + ((r.t || 0) - r.v), 0) * 100) / 100)],
    spec.label);
  return figure('bullet', spec, { caption, after: html`${legend}${table}` });
}

function drawBullet(spec, W, measure) {
  const { rows, dmax, ticks } = spec;
  const LW = Math.ceil(Math.max(...rows.map((r) => measure(r.dl)))) + 12, RP = 4, ROW = W < 480 ? 24 : 28, TOP = 22;
  const PW = W - LW - RP;
  const X = (v) => LW + (PW * v) / (dmax || 1);
  const H = TOP + rows.length * ROW + 2;
  const grid = ticks.map((t, i) => {
    const last = i === ticks.length - 1;
    const lab = last ? `${t} €` : String(t);
    return html`<line class="chart__grid" x1="${r1(X(t))}" x2="${r1(X(t))}" y1="${TOP - 4}" y2="${H}"></line>
      <text class="chart__axis-label" x="${r1(X(t))}" y="12" text-anchor="${i === 0 ? 'start' : last ? 'end' : 'middle'}">${lab}</text>`;
  });
  const row = (r, i) => {
    const cy = TOP + i * ROW + ROW / 2;
    const xe = X(r.v), xt = r.t != null ? X(r.t) : null;
    let lab = '';
    if (r.lab) {
      const tw = measure(r.lab);
      let lx = null;
      if (xt != null && xt > xe && xt - xe - 12 >= tw) lx = xe + 6;                 // fra la fine della barra e la tacca
      else if (Math.max(xe, xt || 0) + 6 + tw <= W) lx = Math.max(xe, xt || 0) + 6;  // dopo il segno più a destra
      if (lx != null) lab = html`<text class="chart__label chart__label--muted" x="${r1(lx)}" y="${cy + 4}">${r.lab}</text>`;
    }
    return html`<g class="chart__mark chart__row" tabindex="${i === 0 ? 0 : -1}" role="img" aria-label="${r.aria}" ${tip(r.tv, r.tl)}>
      <rect class="chart__hit chart__hit--row" x="0" y="${cy - ROW / 2}" width="${r1(W)}" height="${ROW}"></rect>
      <text class="chart__label" x="0" y="${cy + 4}">${r.dl}</text>
      ${r.v > 0 ? html`<path class="chart__bar" d="${barPath(LW, cy - 5, xe - LW, 10)}"></path>` : ''}
      ${xt != null ? html`<rect class="chart__target" x="${r1(xt - 1)}" y="${cy - 8}" width="2" height="16"></rect>` : ''}
      ${lab}</g>`;
  };
  const svg = html`${svgOpen(W, H, html`role="group" aria-label="${spec.label}"`)}${grid}${rows.map(row)}</svg>`;
  return { svg };
}

const DRAW = { route: drawRoute, dots: drawDots, stack: drawStack, bullet: drawBullet };

// =====================================================================
// wire — ridisegno alla larghezza reale, tooltip, tastiera, salti. Idempotente.
// =====================================================================
const state = new WeakMap();
let ctx2d = null;
function measurer(fig) {
  const cs = getComputedStyle(fig);
  try { ctx2d = ctx2d || document.createElement('canvas').getContext('2d'); } catch (e) { ctx2d = null; }
  if (!ctx2d) return guess;
  return (s, size = FS) => { ctx2d.font = `500 ${size}px ${cs.fontFamily}`; return Math.ceil(ctx2d.measureText(String(s)).width); };
}
function redraw(fig, st) {
  const plot = fig.querySelector('.chart__plot');
  const w = Math.floor(plot ? plot.clientWidth : 0);
  if (!w || w === st.w) return;
  const firstTime = st.w == null;
  st.w = w;
  const spec = firstTime ? st.spec : { ...st.spec, anim: false };   // l'animazione della tacca solo al primo disegno
  const focusedIdx = [...plot.querySelectorAll('.chart__mark')].indexOf(document.activeElement && document.activeElement.closest && document.activeElement.closest('.chart__mark'));
  const out = DRAW[fig.dataset.chart](spec, w, measurer(fig));
  mount(plot, out.svg);
  const leg = fig.querySelector('.chart__inline-legend');
  if (leg) leg.hidden = !out.fallback;
  if (focusedIdx >= 0) { const m = plot.querySelectorAll('.chart__mark')[focusedIdx]; if (m) m.focus({ preventScroll: true }); }
}
function showTip(fig, el, ev) {
  const t = fig.querySelector('.chart__tip');
  if (!t || !el) return;
  const s = document.createElement('strong'); s.textContent = el.dataset.tv || '';
  const l = document.createElement('span'); l.textContent = el.dataset.tl || '';
  t.replaceChildren(s, l);
  t.hidden = false;
  const fr = fig.getBoundingClientRect();
  const mark = (el.querySelector('.chart__seg, .chart__ord, .chart__dot, .chart__bar, .chart__target') || el).getBoundingClientRect();
  const cx = ev && ev.clientX != null && ev.type !== 'focusin' ? ev.clientX : mark.left + mark.width / 2;
  const tw = t.offsetWidth, th = t.offsetHeight;
  let top = mark.top - fr.top - th - 8;
  if (top < 0) top = mark.bottom - fr.top + 8;
  t.style.left = `${Math.round(clamp(cx - fr.left - tw / 2, 0, Math.max(0, fr.width - tw)))}px`;
  t.style.top = `${Math.round(top)}px`;
  fig.querySelectorAll('.is-active').forEach((x) => x.classList.remove('is-active'));
  el.classList.add('is-active');
}
function hideTip(fig) {
  const t = fig.querySelector('.chart__tip');
  if (t) t.hidden = true;
  fig.querySelectorAll('.is-active').forEach((x) => x.classList.remove('is-active'));
}
const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } };

/** Collega tutti i .chart dentro root (o root stesso). Da chiamare dopo mount(); richiamarlo è innocuo. */
export function wire(root = document) {
  if (!root) return;
  const figs = [...(root.matches && root.matches('.chart[data-chart]') ? [root] : []), ...root.querySelectorAll('.chart[data-chart]')];
  figs.forEach((fig) => {
    if (!DRAW[fig.dataset.chart]) return;
    let st = state.get(fig);
    if (st) { redraw(fig, st); return; }
    let spec;
    try { spec = JSON.parse(fig.dataset.spec || 'null'); } catch (e) { spec = null; }
    if (!spec) return;
    st = { spec, w: null };
    state.set(fig, st);
    redraw(fig, st);
    if ('ResizeObserver' in window) {
      let raf = 0;
      st.ro = new ResizeObserver(() => {
        // figura uscita dal DOM (tab rimontata, pagina ridisegnata): si stacca, niente osservatori orfani
        if (!fig.isConnected) { cancelAnimationFrame(raf); st.ro.disconnect(); state.delete(fig); return; }
        cancelAnimationFrame(raf); raf = requestAnimationFrame(() => redraw(fig, st));
      });
      st.ro.observe(fig.querySelector('.chart__plot'));
    }
    const markOf = (e) => (e.target && e.target.closest ? e.target.closest('.chart__mark') : null);
    fig.addEventListener('pointermove', (e) => { const m = markOf(e); if (m && fig.contains(m)) showTip(fig, m, e); else if (!fig.contains(document.activeElement)) hideTip(fig); });
    fig.addEventListener('pointerleave', () => { if (!fig.querySelector('.chart__mark:focus')) hideTip(fig); });
    fig.addEventListener('focusin', (e) => { const m = markOf(e); if (m) showTip(fig, m, e); });
    fig.addEventListener('focusout', (e) => { if (!fig.contains(e.relatedTarget)) hideTip(fig); });
    fig.addEventListener('keydown', (e) => {
      const m = markOf(e);
      if (!m) return;
      if (e.key === 'Escape') { hideTip(fig); return; }
      if (m.classList.contains('chart__row') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const rows = [...fig.querySelectorAll('.chart__row')];
        const i = rows.indexOf(m), j = clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, rows.length - 1);
        if (j !== i) { e.preventDefault(); rows.forEach((r, k) => { r.tabIndex = k === j ? 0 : -1; }); rows[j].focus(); }
      }
    });
    fig.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('[data-goto]') : null;
      if (!a) return;
      const dest = document.getElementById(a.getAttribute('data-goto'));
      if (!dest) return;
      e.preventDefault();
      if (!dest.matches('a, button, input, select, textarea, [tabindex]')) dest.setAttribute('tabindex', '-1');
      dest.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      dest.focus({ preventScroll: true });
    });
  });
}
