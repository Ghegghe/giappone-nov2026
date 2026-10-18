// place-options.js — tappe «linea guida» (SPEC §13): il locale consigliato + le alternative, da scegliere sul posto.
// Fila compatta di mini-card (foto, soprannome, voto, prezzo) in un contenitore scorrevole proprio; il tocco apre una
// breve presentazione (perché, cosa, prezzo, orari, Maps, Scheda). Scelta facoltativa salvata solo su questo telefono.
import { fmtEur, fmtJpy, mapsUrl } from './app.js';
import { el, icon, withDataParam } from './agenda-gaps.js';
import { detailHref } from './place-details.js';

// ---------- foto (stesse regole di §9.1: solo https o copia locale dell'exporter) ----------
const httpsUrl = (u) => (/^https:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
const localImg = (u) => (/^assets\/img\/places\/[\w-]+\.(?:webp|jpe?g)$/.test(String(u || '').trim()) ? String(u).trim() : '');
/** image → {url, credit, page, alt} o null (usato anche da agenda-day.js). */
export function photoOf(image) {
  const url = image && (localImg(image.url) || httpsUrl(image.url));
  return url ? { url, credit: image.credit || '', page: httpsUrl(image.page), alt: image.alt || '' } : null;
}

// ---------- scelta per dispositivo (localStorage, try/catch: in privato o senza storage la pagina funziona uguale) ----------
const KEY = 'agenda.choices';   // { "<data>|<id tappa>": "<id opzione>" }
function readChoices() {
  try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; }
}
function writeChoice(k, oid) {
  try {
    const all = readChoices();
    if (oid) all[k] = oid; else delete all[k];
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch { return false; }
}

const fmtNum = (v, dec) => Number(v).toLocaleString('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const ratingDec = (v) => (Number.isInteger(v) ? 0 : String(v).split('.')[1].length > 1 ? 2 : 1);
const ratingShort = (r) => (r && Number.isFinite(Number(r.value)) ? fmtNum(r.value, ratingDec(Number(r.value))) : '');
const TYPE_ICON = { food: 'food', mercato: 'food', bar: 'beer', nightlife: 'beer', onsen: 'onsen', tempio: 'torii', anime: 'anime', shopping: 'bag' };

let uid = 0;

/**
 * Blocco opzioni per una tappa con `options` (null se non ce ne sono).
 * @param n tappa normalizzata (id, title, options, flex)
 * @param {{date: string, fx: object, details?: Map, cls?: string}} ctx
 */
export function optionsBlock(n, { date, fx, details = new Map(), cls = '' } = {}) {
  const opts = (Array.isArray(n && n.options) ? n.options : []).filter((o) => o && o.id && (o.nick || o.name));
  if (!opts.length) return null;
  const key = `${date}|${n.id}`;
  const base = `opts-${++uid}`;
  const hasRec = opts.some((o) => o.recommended);
  let picked = readChoices()[key];
  if (!opts.some((o) => o.id === picked)) picked = '';   // scelta di una versione vecchia della scaletta: ignorata
  let open = '';

  const label = n.flex || hasRec ? 'Linea guida' : 'Idee';
  const countTxt = `${opts.length} ${opts.length === 1 ? 'opzione' : 'opzioni'}`;
  const status = el('span', { class: 'opts__status small', 'aria-live': 'polite' });
  const head = el('p', { class: 'opts__head' },
    el('span', { class: 'opts__label' }, icon('compass'), el('span', null, `${label} · ${countTxt}`)), status);

  const cards = new Map();
  const list = el('ul', {
    class: 'opts__list', role: 'list', 'aria-label': `Opzioni per «${n.title || ''}»${opts.length > 2 ? ', scorri in orizzontale' : ''}`,
  });
  const detail = el('div', { class: 'opts__detail', id: `${base}-detail`, role: 'region', hidden: true });

  const nameOf = (o) => o.nick || o.name;
  function paintStatus() {
    const p = opts.find((o) => o.id === picked);
    status.replaceChildren(p ? el('span', null, icon('check'), ' Scelto: ', el('strong', null, nameOf(p)))
      : el('span', { class: 'muted' }, n.flex ? 'si sceglie sul posto' : hasRec ? 'il primo è il consigliato' : 'idee alla pari, si sceglie sul posto'));
    for (const [oid, c] of cards) {
      c.btn.classList.toggle('opt--picked', oid === picked);
      c.mark.hidden = oid !== picked;
    }
  }

  function card(o) {
    const img = photoOf(o.image);
    const thumb = el('span', { class: 'opt__thumb', 'aria-hidden': 'true' });
    const tile = () => thumb.replaceChildren(el('span', { class: 'opt__tile' }, icon(TYPE_ICON[o.type] || 'map-pin')));
    if (img) {
      const pic = el('img', { src: img.url, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer', width: '960', height: '720' });
      pic.addEventListener('error', tile, { once: true });
      thumb.append(pic);
    } else tile();
    const mark = el('span', { class: 'opt__picked', hidden: true }, icon('check'), 'scelto');
    const r = ratingShort(o.rating), cost = Number(o.costEur) || 0;
    const aria = [nameOf(o), o.recommended ? 'consigliato' : '', r ? `voto ${o.rating.source || ''} ${r}`.replace('  ', ' ') : '',
      cost ? `circa ${fmtEur(cost)} a testa` : ''].filter(Boolean).join(', ');
    const btn = el('button', {
      type: 'button', class: `opt${o.recommended ? ' opt--rec' : ''}`, 'aria-expanded': 'false', 'aria-controls': detail.id, 'aria-label': aria,
      onclick: () => toggle(o.id),
    },
    thumb,
    o.recommended ? el('span', { class: 'opt__rec' }, 'consigliato') : null,
    mark,
    el('span', { class: 'opt__nick' }, nameOf(o)),
    el('span', { class: 'opt__facts mono' },
      r ? el('span', { class: 'opt__rating' }, icon('star'), r) : null,
      cost ? el('span', null, `~${fmtEur(cost)}`) : null));
    cards.set(o.id, { btn, mark });
    return el('li', null, btn);
  }

  function presentation(o) {
    const img = photoOf(o.image);
    const r = o.rating && ratingShort(o.rating);
    const cost = Number(o.costEur) || 0;
    const det = o.placeId && details && details.get(o.placeId);
    const facts = el('dl', { class: 'kv opts__kv small' });
    const row = (k, ...v) => facts.append(el('dt', null, k), el('dd', null, ...v));
    if (r) row('Voto', el('span', { class: 'mono' }, `${o.rating.source ? `${o.rating.source} ` : ''}${r}`),
      Number.isInteger(o.rating.reviews) ? ` su ${fmtNum(o.rating.reviews, 0)} recensioni` : '', o.rating.awards ? ` · ${o.rating.awards}` : '');
    if (cost || o.costNote) row('Prezzo', cost ? el('span', { class: 'mono' }, `~${fmtEur(cost)} · ${fmtJpy(cost, fx)}`) : null,
      cost && o.costNote ? ' · ' : '', o.costNote || '');
    if (o.hours) row('Orari', o.hours);
    if (o.closedOn) row('Chiuso', o.closedOn);
    const isPicked = picked === o.id;
    const pick = el('button', {
      type: 'button', class: `btn ${isPicked ? 'btn--primary' : 'btn--ghost'} opts__pick`, 'aria-pressed': String(isPicked),
      onclick: () => {
        const next = picked === o.id ? '' : o.id;
        if (!writeChoice(key, next)) { status.textContent = 'Scelta non salvata: memoria del browser non disponibile.'; return; }
        picked = next;
        paintStatus();
        detail.replaceChildren(...presentation(o));
        detail.querySelector('.opts__pick')?.focus();
      },
    }, icon('check'), el('span', null, isPicked ? 'Scelto (tocca per togliere)' : 'Scelgo questo'));
    return [
      el('div', { class: 'opts__dhead' },
        el('h3', { class: 'opts__dnick' }, nameOf(o)),
        o.nick && o.name ? el('p', { class: 'small muted opts__dname' }, o.name) : null,
        o.recommended ? el('span', { class: 'giorno-verdict giorno-verdict--top opts__dbadge' }, 'consigliato') : null),
      o.why ? el('p', { class: 'small opts__why' }, el('strong', null, 'Perché: '), o.why) : null,
      o.what ? el('p', { class: 'small opts__what' }, el('strong', null, 'Cosa: '), o.what) : null,
      facts.childElementCount ? facts : null,
      el('div', { class: 'row opts__actions' },
        o.mapsQuery ? el('a', { class: 'btn btn--ghost', href: mapsUrl(o.mapsQuery), target: '_blank', rel: 'noopener noreferrer',
          'aria-label': `Apri ${o.name || nameOf(o)} in Google Maps (nuova scheda)` }, icon('pin'), el('span', null, 'Maps')) : null,
        det ? el('a', { class: 'btn btn--ghost', href: withDataParam(detailHref(det.id)), 'aria-label': `Scheda: ${det.title}` },
          icon('book'), el('span', null, 'Scheda')) : null,
        pick),
      img && img.credit ? el('p', { class: 'opts__credit' }, 'Foto: ', img.page
        ? el('a', { href: img.page, target: '_blank', rel: 'noopener noreferrer' }, img.credit) : img.credit) : null,
    ].filter(Boolean);
  }

  function toggle(oid) {
    open = open === oid ? '' : oid;
    for (const [id, c] of cards) {
      c.btn.setAttribute('aria-expanded', String(id === open));
      c.btn.classList.toggle('opt--open', id === open);
    }
    const o = opts.find((x) => x.id === open);
    detail.hidden = !o;
    if (o) {
      detail.setAttribute('aria-label', `Presentazione: ${nameOf(o)}`);
      detail.replaceChildren(...presentation(o));
    } else detail.replaceChildren();
  }

  list.append(...opts.map(card));
  paintStatus();
  return el('div', { class: `opts${cls ? ` ${cls}` : ''}` }, head, list, detail);
}
