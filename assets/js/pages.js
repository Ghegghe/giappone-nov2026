// pages.js — nucleo condiviso delle pagine contenuto (home, trasporti, alloggi, luoghi, budget).
// Ogni pagina: <main data-page="..."> + <script type="module" src="assets/js/pages.js">.
// Il rendering vero sta in pages-<pagina>.js; qui: helper HTML sicuro, icone, link, tab, dispatcher.
import { esc, initShell, loadData, DATA_BASE } from './app.js';

// ---------- HTML sicuro ----------
// Tagged template: ogni ${valore} è escapato, salvo raw(...) o array di raw (risultato di html``).
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s == null ? '' : s));
const part = (v) => {
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  if (v === false || v == null) return '';
  return esc(v);
};
export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += part(v) + strings[i + 1]; });
  return new Raw(out);
}
/** Scrive un frammento html`` dentro el (unico punto in cui usiamo innerHTML: tutto è già escapato). */
export function mount(el, frag) { el.innerHTML = part(frag); return el; }

// ---------- URL ----------
/** Solo http(s): qualunque altra cosa (javascript:, data:) diventa ''. */
export function safeUrl(u) {
  if (!u) return '';
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return 'https://' + s; // "smart-ex.jp/en" → https://
  return '';
}
/** Link interno relativo che conserva ?data= (fixture) se attivo. */
export function pageUrl(file, params = {}) {
  const q = new URLSearchParams(params);
  if (DATA_BASE !== 'data/') q.set('data', DATA_BASE);
  const s = q.toString();
  return s ? `${file}?${s}` : file;
}
export const dirUrl = (lat, lon) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lon)}&travelmode=walking`;

// ---------- Icone (sprite di design-system) ----------
export const SPRITE = 'assets/icons/sprite.svg';
export const icon = (name, label) => label
  ? html`<svg class="icon" role="img" aria-label="${label}"><use href="${SPRITE}#i-${name}"></use></svg>`
  : html`<svg class="icon" aria-hidden="true" focusable="false"><use href="${SPRITE}#i-${name}"></use></svg>`;

/** Link esterno con icona i-external (nuova scheda). */
export function extLink(url, text, cls = 'ext-link') {
  const u = safeUrl(url);
  if (!u) return text ? html`<span>${text}</span>` : '';
  return html`<a class="${cls}" href="${u}" target="_blank" rel="noopener noreferrer"><span>${text || hostOf(u)}</span> ${icon('external', 'apre in una nuova scheda')}</a>`;
}
export function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } }

/** Bottone Maps (ricerca). */
export function mapsBtn(query, label = 'Apri in Maps', cls = 'btn btn--primary') {
  if (!query) return '';
  const u = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  return html`<a class="${cls}" href="${u}" target="_blank" rel="noopener noreferrer">${icon('pin')}<span>${label}</span></a>`;
}

// ---------- Numeri / date ----------
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const monthLabel = (iso) => { const m = /^(\d{4})-(\d{2})/.exec(iso || ''); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : 'senza data'; };
/** Giorni interi fra due date ISO (b - a). */
export function daysBetween(a, b) {
  const t = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((t(b) - t(a)) / 86400000);
}
export const fxRate = (trip) => (trip && trip.fx && Number(trip.fx.jpyPerEur)) || null;

// ---------- Tab accessibili ----------
/** tabs: [{id,label}] · render(id) → frammento. Sincronizza con location.hash (#id). */
export function setupTabs(root, tabs, render, { hash = true, key = 'tab' } = {}) {
  const ids = tabs.map((t) => t.id);
  const fromHash = hash ? location.hash.slice(1) : '';
  let cur = ids.includes(fromHash) ? fromHash : ids[0];
  const uid = key + '-' + Math.random().toString(36).slice(2, 7);
  mount(root, html`
    <div class="tabs" role="tablist">${tabs.map((t) => html`
      <button type="button" class="tab" role="tab" id="${uid}-t-${t.id}" data-tab="${t.id}"
        aria-controls="${uid}-p" aria-selected="false" tabindex="-1">${t.label}${t.count != null ? html` <span class="badge">${t.count}</span>` : ''}</button>`)}
    </div>
    <div class="tab-panel stack" id="${uid}-p" role="tabpanel" tabindex="0"></div>`);
  const panel = root.querySelector('.tab-panel');
  const btns = [...root.querySelectorAll('[role=tab]')];
  const show = (id, focus) => {
    cur = id;
    btns.forEach((b) => {
      const on = b.dataset.tab === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle('tab--active', on);
      if (on && focus) b.focus();
      if (on && b.parentElement) { const tl = b.parentElement; tl.scrollLeft = Math.max(0, b.offsetLeft - tl.offsetLeft - 16); }
    });
    panel.setAttribute('aria-labelledby', `${uid}-t-${id}`);
    mount(panel, render(id));
    if (hash) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ } }
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => show(b.dataset.tab));
    b.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); show(btns[(i + d + btns.length) % btns.length].dataset.tab, true); }
    });
  });
  show(cur);
  return { show, panel };
}

// ---------- Storage per-viewer (filtri ecc.) ----------
export const store = {
  get(k, d) { try { const v = localStorage.getItem('giappone.pages.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('giappone.pages.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

// ---------- Dispatcher ----------
const PAGES = {
  home: () => import('./pages-home.js'),
  trasporti: () => import('./pages-trasporti.js'),
  alloggi: () => import('./pages-alloggi.js'),
  luoghi: () => import('./pages-luoghi.js'),
  budget: () => import('./pages-budget.js'),
};

export async function boot() {
  const main = document.querySelector('main[data-page]');
  if (!main) return;
  const page = main.dataset.page;
  const loader = PAGES[page];
  if (!loader) return;
  const root = main.querySelector('[data-root]') || main;
  root.setAttribute('aria-busy', 'true');
  try {
    const [trip, mod] = await Promise.all([initShell(page), loader()]);
    await mod.render(root, { trip, loadData });
  } catch (err) {
    console.error('[pages]', err);
    mount(root, html`<p class="empty">Errore nel caricare la pagina. Riprova o ricarica.</p>`);
  } finally {
    root.removeAttribute('aria-busy');
  }
}

// Auto-avvio quando caricato come entry della pagina (non nei test, che importano i moduli direttamente).
if (!window.__PAGES_NO_BOOT__) boot();
