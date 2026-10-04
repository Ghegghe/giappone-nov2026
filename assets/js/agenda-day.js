// Pagina giorno.html?d=YYYY-MM-DD: nastro del giorno, lista compatta (3 livelli), buchi "libero", totale €/pax e ¥, prev/next.
import { loadData, fmtEur, fmtJpy, fmtDate, mapsUrl, initShell } from './app.js';
import {
  TYPES, TYPE_LABEL, FAMILY, FAMILY_LABEL, FAMILIES, BOOKING_LABEL, DAY_START_H, DAY_END_H, normalizeItems, assignColumns, computeGaps, dayTotals,
  nowInTz, fmtMin, fmtDur, timeRange, withDataParam, el, icon,
} from './agenda-gaps.js';
import { dayStripNav, revealActive, bindDayKeys } from './day-strip.js';
import { viewSwitch } from './view-switch.js';

const $ = (s) => document.querySelector(s);

function pickDay(days, trip) {
  const d = new URLSearchParams(location.search).get('d');
  if (d) return days.findIndex((x) => x.date === d);              // -1 = data non presente
  const today = nowInTz(trip.timezone || 'Asia/Tokyo').date;
  const t = days.findIndex((x) => x.date === today);
  return t >= 0 ? t : 0;
}

// Nastro del giorno (PLAN §3.5): asse DAY_START-DAY_END, un segmento per tappa non "free" largo quanto la sua durata,
// colore della famiglia (--tc via .tl-type--*), facoltativi solo bordo, buchi = binario vuoto. Tap = vai alla tappa.
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, ...kids) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  for (const k of kids) if (k) n.append(k instanceof Node ? k : String(k));
  return n;
};
const STRIP_H = 28;   // altezza del binario (unità SVG = px in verticale)
const TAP = 44;       // area di tocco (SPEC §4): rect trasparente 44px, 8px oltre il binario sopra e sotto (svg overflow visibile)

/** Aree di tocco in px per i segmenti [{x, w, y0, y1}]: larghe ≥ TAP, centrate, mai sovrapposte fra segmenti della
 *  stessa fascia. Se due vicine si contendono lo spazio vince la più stretta (una larga ≥ TAP non scende sotto TAP); se sono strette entrambe si taglia a metà
 *  fra le due → lì l'area può scendere sotto TAP (scelta: niente sovrapposizioni, il tocco va sempre alla tappa giusta). */
function tapSpans(segs, W) {
  const out = segs.map((g) => { const w = Math.max(g.w, TAP); const a = Math.max(0, Math.min(g.x + g.w / 2 - w / 2, W - w)); return { a, b: Math.min(W, a + w) }; });
  const order = segs.map((g, i) => i).sort((i, j) => segs[i].x - segs[j].x);
  for (let p = 0; p < order.length; p++) for (let q = p + 1; q < order.length; q++) {
    const l = order[p], r = order[q], gl = segs[l], gr = segs[r], L = out[l], R = out[r];
    if (L.b <= R.a || gl.y1 <= gr.y0 || gr.y1 <= gl.y0) continue;
    const mid = (gl.x + gl.w + gr.x) / 2;
    // la larga cede al massimo (w - TAP) / 2 per lato: se era ≥ TAP resta ≥ TAP
    const slack = (g) => Math.max(0, (g.w - TAP) / 2);
    const cut = gl.w < TAP && gr.w < TAP ? mid
      : gl.w < gr.w ? Math.max(mid, Math.min(L.b, gr.x + slack(gr)))
      : gr.w < gl.w ? Math.min(mid, Math.max(R.a, gl.x + gl.w - slack(gl))) : mid;
    L.b = Math.min(L.b, cut); R.a = Math.max(R.a, cut);
  }
  return out;
}

export function dayStrip(norm, { from = DAY_START_H * 60, to = DAY_END_H * 60 } = {}) {
  const items = assignColumns(norm.filter((n) => !n.allDay && TYPES.includes(n.type) && n.type !== 'free'));
  if (!items.length) return null;
  const lo = Math.min(from, ...items.map((n) => Math.floor(n.startMin / 60) * 60));
  const hi = Math.max(to, ...items.map((n) => Math.ceil(n.endMin / 60) * 60));
  const span = hi - lo;
  const svg = sv('svg', {
    class: 'giorno-strip__svg', viewBox: `0 0 ${span} ${STRIP_H}`, preserveAspectRatio: 'none', role: 'group',
    'aria-label': `Nastro del giorno, ${fmtMin(lo % 1440)}-${fmtMin(hi)}: ${items.length} tappe`,
  });
  svg.append(sv('rect', { class: 'giorno-strip__track', x: 0, y: 0, width: span, height: STRIP_H }));
  // fascia di tocco: TAP px centrati sul binario; con tappe in parallelo (cols > 1) si divide fra le corsie
  const tapRects = [];
  for (const n of items) {
    const type = n.type;
    const laneH = STRIP_H / n.cols;
    const tapH = TAP / n.cols, tapY = (STRIP_H - TAP) / 2 + n.col * tapH;
    const tap = sv('rect', { class: 'giorno-strip__tap', y: tapY, height: tapH });
    tapRects.push({ n, tap, y0: tapY, y1: tapY + tapH });
    const a = sv('a', {
      href: `#${n.id}`, class: `giorno-strip__seg tl-type--${type}${n.optional ? ' giorno-strip__seg--opt' : ''}`,
      'data-id': n.id, 'aria-label': `${timeRange(n)} ${n.title || ''}${n.optional ? ', facoltativo' : ''}`,
    }, sv('title', null, `${timeRange(n)} · ${n.title || ''}`), tap,
    sv('rect', { x: n.startMin - lo, y: n.col * laneH, width: Math.max(1, n.endMin - n.startMin), height: laneH }));
    svg.append(a);
  }
  // il viewBox è in minuti (preserveAspectRatio none): i 44px diventano minuti alla larghezza reale, misurata
  const layoutTaps = (pxW) => {
    const k = pxW / span;   // px per minuto
    const spans = tapSpans(tapRects.map((t) => ({ x: (t.n.startMin - lo) * k, w: Math.max(1, t.n.endMin - t.n.startMin) * k, y0: t.y0, y1: t.y1 })), pxW);
    tapRects.forEach((t, i) => { t.tap.setAttribute('x', spans[i].a / k); t.tap.setAttribute('width', (spans[i].b - spans[i].a) / k); });
  };
  layoutTaps(343);   // colonna utile a 375, finché non c'è il DOM
  if ('ResizeObserver' in window) {
    let seen = false;
    const ro = new ResizeObserver(() => {
      if (!svg.isConnected) { if (seen) ro.disconnect(); return; }
      seen = true;
      if (svg.clientWidth) layoutTaps(svg.clientWidth);
    });
    ro.observe(svg);
  }
  const ticks = el('div', { class: 'giorno-strip__ticks', 'aria-hidden': 'true' });
  for (let m = Math.ceil(lo / 360) * 360; m <= hi; m += 360) {
    ticks.append(el('span', { style: { '--x': `${((m - lo) / span) * 100}%` } }, String(m / 60).padStart(2, '0')));
  }
  return el('div', { class: 'giorno-strip' }, svg, ticks);
}

function stripLegend(norm) {
  const used = new Set(norm.filter((n) => n.type !== 'free').map((n) => FAMILY[n.type]).filter(Boolean));
  const fams = FAMILIES.filter((f) => used.has(f));
  if (fams.length < 2) return null;
  return el('ul', { class: 'giorno-strip__legend', role: 'list', 'aria-label': 'Legenda colori' },
    ...fams.map((f) => el('li', { class: `tl-fam--${f}` }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), FAMILY_LABEL[f])));
}

// bottone Maps solo icona 44×44 (stessa ricetta di mapsIconBtn in pages.js)
const mapsBtn = (q, name) => {
  const label = `Apri ${name || q} in Google Maps (nuova scheda)`;
  return el('a', { class: 'btn btn--ghost btn--icon giorno__maps', href: mapsUrl(q), target: '_blank', rel: 'noopener noreferrer', 'aria-label': label, title: label }, icon('pin'));
};

// il luogo si mostra solo se aggiunge qualcosa al titolo
const placeAdds = (place, title) => {
  if (!place) return false;
  const p = place.toLowerCase(), t = (title || '').toLowerCase();
  return p !== t && !t.includes(p);
};

// ---------- foto (Wikimedia Commons, §9.1): solo https, credit visibile, lazy, no referrer ----------
const httpsUrl = (u) => (/^https:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
function photoOf(image) {
  const url = image && httpsUrl(image.url);
  return url ? { url, credit: image.credit || '', page: httpsUrl(image.page), alt: image.alt || '' } : null;
}
// figura 4:3 + credit; se l'immagine non si carica (offline, link rotto) resta un riquadro col testo alternativo
function photoFigure(img, fallback, cls) {
  const alt = img.alt || fallback || '';
  const pic = el('img', { src: img.url, alt, loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer', width: '960', height: '720' });
  const frame = el('div', { class: 'photo__frame' }, pic);
  pic.addEventListener('error', () => {
    frame.classList.add('photo__frame--missing');
    frame.replaceChildren(el('span', { class: 'photo__fallback' }, alt || 'Foto non disponibile'));
  }, { once: true });
  const credit = img.credit ? (img.page
    ? el('a', { href: img.page, target: '_blank', rel: 'noopener noreferrer', title: `Fonte della foto: ${img.credit}` }, img.credit)
    : el('span', null, img.credit)) : null;
  return el('figure', { class: `photo ${cls}` }, frame, credit ? el('figcaption', { class: 'photo__credit' }, credit) : null);
}

function itemRow(n, fx) {
  const type = TYPES.includes(n.type) ? n.type : 'free';
  const b = n.booking || { status: 'none' };
  const cost = Number(n.costEur) || 0;
  // riga 2 (PLAN §2.3): pallino + tipo a parole · costo (+ nota sul costo) · stati in parole · luogo · un solo badge
  // "da prenotare" seguito da dove/quando. Tutto in una riga che va a capo: niente riga "altro" sotto la nota.
  const states = [n.fixed && type !== 'fixed' ? 'orario fisso' : '', n.optional ? 'facoltativo' : '', n.parallel ? 'in parallelo' : '',
    b.status === 'done' ? BOOKING_LABEL.done : ''].filter(Boolean);
  const showPlace = placeAdds(n.place, n.title);
  const meta = el('p', { class: 'small giorno__meta' },
    el('span', { class: 'giorno__type' }, el('span', { class: 'agenda-legend__dot', 'aria-hidden': 'true' }), TYPE_LABEL[type]),
    cost ? el('span', { class: 'mono' }, `${fmtEur(cost)} · ${fmtJpy(cost, fx)}${n.costEstimate ? ' stima' : ''}`) : null,
    n.costNote ? el('span', { class: 'muted' }, n.costNote) : null,
    showPlace ? el('span', { class: 'muted' }, n.place) : null,
    ...states.map((st) => el('span', { class: 'muted' }, st)),
    b.status === 'todo' ? el('span', { class: 'badge badge--todo' }, BOOKING_LABEL.todo) : null,
    b.status === 'todo' && (b.where || b.when) ? el('span', { class: 'muted' }, `prenota: ${[b.where, b.when].filter(Boolean).join(', ')}`) : null);
  const links = (n.links || []).filter((l) => /^[\w-]+\.html(#[\w-]*)?$/.test(l.href || ''))
    .map((l) => el('a', { class: 'btn btn--ghost', href: withDataParam(l.href) }, el('span', null, l.label), icon('chevron-right')));
  const img = photoOf(n.image);
  const nick = img && n.nick ? n.nick : '';   // il soprannome fa da titolo solo nella card con foto (§9.2)

  return el('li', {
    class: `list-item giorno__item giorno__item--${type}${n.optional ? ' giorno__item--optional' : ''}${img ? ' giorno__item--photo' : ''}`, id: n.id,
  },
  n.allDay ? el('div', { class: 'giorno__time mono small' }, timeRange(n))
    : img ? el('div', { class: 'giorno__time mono small' }, `${fmtMin(n.startMin)}-${fmtMin(n.endMin)}${n.estimated ? '*' : ''}`)
      : el('div', { class: 'giorno__time mono' }, fmtMin(n.startMin),
        el('span', { class: 'small muted' }, `${fmtMin(n.endMin)}${n.estimated ? '*' : ''}`)),
  img ? photoFigure(img, nick || n.title, 'giorno__photo') : null,
  el('div', { class: 'giorno__main' },
    el('h2', { class: 'giorno__title' }, nick || n.title || ''),
    nick && n.title ? el('p', { class: 'small muted giorno__subtitle' }, n.title) : null,
    meta,
    n.note ? el('p', { class: 'small giorno__note' }, n.note) : null,
    links.length ? el('div', { class: 'row giorno__links' }, ...links) : null),
  n.mapsQuery ? mapsBtn(n.mapsQuery, n.title) : null);
}

const gapRow = (g) => el('li', { class: 'list-item giorno__gap' },
  el('div', { class: 'giorno__time mono small muted' }, fmtMin(g.startMin)),
  el('div', { class: 'giorno__main tl-gap__label small muted' }, `libero fino alle ${fmtMin(g.endMin)} (${fmtDur(g.dur)})`));

// porta alla tappa: scroll + fuoco + evidenza (stesso trattamento dell'ancora #id all'apertura)
function goToItem(id, smooth = true) {
  const target = id && document.getElementById(id);
  if (!target || !target.classList.contains('giorno__item')) return false;
  document.querySelectorAll('.giorno__item--target').forEach((x) => x.classList.remove('giorno__item--target'));
  target.classList.add('giorno__item--target');
  target.setAttribute('tabindex', '-1');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ block: 'center', behavior: smooth && !reduce ? 'smooth' : 'auto' });
  target.focus({ preventScroll: true });
  return true;
}

// ---------- "Se ci capita, nei dintorni" (§9.2): mini-card in striscia orizzontale ----------
const VERDICTS = ['top', 'consigliato', 'opzionale', 'sconsigliato'];
function extraCard(x, fx) {
  const img = photoOf(x.image);
  const title = x.nick || x.name || '';
  const v = VERDICTS.includes(x.verdict) ? x.verdict : '';
  const cost = Number(x.costEur) || 0;
  const facts = [x.duration ? el('span', { class: 'mono' }, x.duration) : null,
    cost ? el('span', { class: 'mono' }, `${fmtEur(cost)} · ${fmtJpy(cost, fx)}`) : null].filter(Boolean);
  return el('li', { class: 'card giorno-extra', id: x.id ? `extra-${x.id}` : null },
    img ? photoFigure(img, title, 'giorno-extra__photo') : null,
    el('div', { class: 'giorno-extra__body' },
      el('h3', { class: 'giorno-extra__nick' }, title),
      x.nick && x.name ? el('p', { class: 'small muted giorno-extra__name' }, x.name) : null,
      el('p', { class: 'small giorno-extra__facts' },
        v ? el('span', { class: `giorno-verdict giorno-verdict--${v}` }, v) : null, ...facts),
      x.mapsQuery ? el('a', { class: 'btn btn--ghost giorno-extra__maps', href: mapsUrl(x.mapsQuery), target: '_blank', rel: 'noopener noreferrer',
        'aria-label': `Apri ${x.name || title} in Google Maps (nuova scheda)` }, icon('pin'), el('span', null, 'Maps')) : null));
}
function renderExtras(day, fx) {
  const list = (Array.isArray(day.extras) ? day.extras : []).filter((x) => x && (x.nick || x.name));
  const box = $('#giorno-extras');
  if (!box || !list.length) return;
  const rank = (x) => { const r = VERDICTS.indexOf(x.verdict); return r < 0 ? VERDICTS.length : r; };
  const sorted = list.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i).map((o) => o.x);
  box.replaceChildren(
    el('h2', { class: 'h3', id: 'giorno-extras-h' }, 'Se ci capita, nei dintorni'),
    el('ul', { class: 'giorno-extras__list', role: 'list', tabindex: '0', 'aria-label': 'Luoghi vicini fuori programma, scorri in orizzontale' },
      ...sorted.map((x) => extraCard(x, fx))));
  box.hidden = false;
}

/** summary del piano definitivo (§9.1). I giorni del vecchio build hanno già un "summary" che è un'etichetta corta
 *  ("Kyoto g.1 — Fushimi + …"): lo si mostra solo se il giorno viene dal piano (status final o campi §9.1 presenti). */
function planSummary(day) {
  if (!day || !day.summary) return '';
  const fromPlan = day.status === 'final' || Array.isArray(day.extras) || (day.items || []).some((it) => it && (it.nick || it.image));
  return fromPlan ? day.summary : '';
}

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
    $('#giorno-days').replaceChildren(dayStripNav(days, { active: -1, mode: 'days' }));
    setPager($('#giorno-prev'), null); setPager($('#giorno-next'), null);
    return;
  }
  const day = days[i];
  document.title = `${fmtDate(day.date)} · Agenda`;
  const strip = dayStripNav(days, { active: i, mode: 'days' });
  // selettore di vista fisso a sinistra della striscia; "Griglia" con ?view=grid così view-boot.js non rimbalza qui
  strip.prepend(viewSwitch({ active: 'day', gridHref: withDataParam(`agenda.html?view=grid#${day.date}`), dayHref: withDataParam(`giorno.html?d=${day.date}`) }));
  $('#giorno-days').replaceChildren(strip);
  // senza ?d= (arrivo da view-boot.js) l'URL diventa quello canonico del giorno scelto
  if (!new URLSearchParams(location.search).get('d')) history.replaceState(null, '', withDataParam(`giorno.html?d=${day.date}`) + location.hash);
  revealActive(strip);
  bindDayKeys(days, i);

  // intestazione
  $('#giorno-title').textContent = `${fmtDate(day.date)} · ${day.title || ''}`;
  $('#giorno-title').title = day.title || '';
  // append/replaceChildren nativi convertono null in testo "null": filtrare sempre
  // base e gita in una riga di testo; niente badge: "bozza" compare una volta sola, in testa all'agenda
  const where = [day.base, day.dayTrip ? `gita a ${day.dayTrip}` : ''].filter(Boolean).join(' · ');
  $('#giorno-head').append(...[
    planSummary(day) ? el('p', { class: 'giorno__summary' }, planSummary(day)) : null,
    where ? el('p', { class: 'muted giorno__where' }, where) : null,
    day.notes || (day.moves && day.moves !== '—') ? el('p', { class: 'small giorno__notes' }, ...[
      day.notes || null,
      day.notes && day.moves && day.moves !== '—' ? el('br') : null,
      day.moves && day.moves !== '—' ? el('span', { class: 'muted' }, 'Spostamenti: ', day.moves) : null].filter(Boolean)) : null].filter(Boolean));
  setPager($('#giorno-prev'), days[i - 1], 'Giorno precedente');
  setPager($('#giorno-next'), days[i + 1], 'Giorno successivo');

  // item + buchi in ordine cronologico
  const norm = normalizeItems(day.items);
  const tot = dayTotals(day.items);
  const ribbon = dayStrip(norm);
  const sum = el('p', { class: 'small giorno-strip__sum' }, el('span', { class: 'mono' }, `${fmtEur(tot.total)} a testa`),
    day.budgetEur != null ? el('span', { class: 'muted' }, ` · budget ${fmtEur(day.budgetEur)}`) : null);
  if (ribbon) {
    ribbon.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-id]');
      if (!a) return;
      e.preventDefault();
      if (goToItem(a.dataset.id)) history.replaceState(null, '', `#${a.dataset.id}`);
    });
    $('#giorno-head').append(el('div', { class: 'giorno-strip__wrap' }, ribbon, el('div', { class: 'giorno-strip__foot' }, stripLegend(norm), sum)));
  } else if (norm.length) $('#giorno-head').append(sum);
  const rows = [
    ...norm.map((n) => ({ at: n.startMin, k: 1, node: () => itemRow(n, trip.fx) })),
    ...computeGaps(norm).map((g) => ({ at: g.startMin, k: 0, node: () => gapRow(g) })),
  ].sort((a, b) => a.at - b.at || a.k - b.k);
  const frag = document.createDocumentFragment();
  for (const r of rows) frag.append(r.node());
  if (!norm.length) frag.append(el('li', { class: 'empty' }, 'Nessuna attività in programma.'));
  $('#giorno-list').replaceChildren(frag);
  if (norm.some((n) => n.estimated)) {
    $('#giorno-list').after(el('p', { class: 'small muted' }, '* fine stimata: fino alla tappa dopo, 30-90 min.'));
  }

  // piè: totale giorno
  const foot = $('#giorno-foot');
  foot.hidden = false;
  foot.replaceChildren(...[
    el('p', { class: 'h3' }, 'Totale ', el('span', { class: 'mono' }, `${fmtEur(tot.total)} a testa`), ' · ',
      el('span', { class: 'mono muted' }, fmtJpy(tot.total, trip.fx))),
    // al massimo 2 elementi uniti dal punto: il budget previsto sta già in testa, accanto al nastro
    el('p', { class: 'small muted' }, [tot.optional ? `di cui opzionali ${fmtEur(tot.optional)}` : '', 'alloggi esclusi'].filter(Boolean).join(' · '))].filter(Boolean));

  renderExtras(day, trip.fx);

  // ancora #item-id: scorri ed evidenzia
  goToItem(decodeURIComponent(location.hash.slice(1)), false);
  window.addEventListener('hashchange', () => goToItem(decodeURIComponent(location.hash.slice(1))));
}

main();
