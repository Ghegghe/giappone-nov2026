// app.js — shell comune: tema, nav/topbar/footer, loader JSON, formattazione, util. ES module, nessuna dipendenza.

// Radice del sito ricavata da questo file (assets/js/app.js → ../../): funziona da qualunque profondità di pagina.
const ROOT = new URL('../../', import.meta.url);
const rootUrl = (p) => new URL(p, ROOT).href;

// ---------- Dati ----------
// ?data=dev/fixtures/ → fixture; altrimenti data/. Solo path relativi semplici (niente "//", "..", protocolli).
function readDataBase() {
  try {
    const v = new URLSearchParams(location.search).get('data');
    if (v && /^[\w\-./]+$/.test(v) && !v.startsWith('/') && !v.includes('..')) return v.endsWith('/') ? v : v + '/';
  } catch (e) { /* ignore */ }
  return 'data/';
}
export const DATA_BASE = readDataBase();

const dataCache = new Map();

/** Carica `${DATA_BASE}${name}.json`. Ritorna l'oggetto o null (errore → toast; opz. `.empty` in `target`). */
export function loadData(name, { target = null } = {}) {
  if (!dataCache.has(name)) {
    const url = rootUrl(`${DATA_BASE}${name}.json`);
    const p = fetch(url, { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .catch((err) => { dataCache.delete(name); throw err; });
    dataCache.set(name, p);
  }
  return dataCache.get(name).catch((err) => {
    console.warn(`[app] ${name}.json non caricato:`, err);
    toast(`Non riesco a caricare i dati (${name})`, { key: 'data-' + name });
    if (target) showEmpty(target, 'Dati non disponibili. Riprova più tardi o ricarica la pagina.');
    return null;
  });
}

// ---------- Escape & URL ----------
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape HTML per testo e attributi. null/undefined → ''. */
export function esc(s) {
  return s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

export function mapsUrl(query) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query == null ? '' : String(query));
}

// ---------- Formattazione ----------
const DASH = '—';
function groupIt(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); } // 1234567 → 1.234.567

/** €1.234 · €9,5 (1 decimale sotto 10) · -€12 · "—" se non numerico. */
export function fmtEur(n) {
  const v = Number(n);
  if (n === null || n === '' || !Number.isFinite(v)) return DASH;
  const a = Math.abs(v);
  let body;
  if (a < 10) {
    const r = Math.round(a * 10) / 10;
    body = Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
  } else {
    body = groupIt(String(Math.round(a)));
  }
  return (v < 0 && body !== '0' ? '-' : '') + '€' + body;
}

/** Importo in EURO → yen arrotondati alle 10: ¥12.350. `fx` = numero (¥ per €) o oggetto {jpyPerEur}. */
export function fmtJpy(n, fx) {
  const rate = typeof fx === 'object' && fx ? Number(fx.jpyPerEur) : Number(fx);
  const v = Number(n);
  if (n === null || n === '' || !Number.isFinite(v) || !Number.isFinite(rate) || rate <= 0) return '';
  const y = Math.round((v * rate) / 10) * 10;
  return (y < 0 ? '-' : '') + '¥' + groupIt(String(Math.abs(y)));
}

const WD = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const MO = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/** "2026-11-07" → "sab 7 nov" (opz. {weekday:false} → "7 nov", {year:true} → "sab 7 nov 2026"). Calcolo puro, niente fusi. */
export function fmtDate(iso, { weekday = true, year = false } = {}) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return iso ? String(iso) : '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const parts = [];
  if (weekday) parts.push(WD[d.getUTCDay()]);
  parts.push(String(d.getUTCDate()), MO[d.getUTCMonth()]);
  if (year) parts.push(m[1]);
  return parts.join(' ');
}

const pad2 = (x) => String(x).padStart(2, '0');

/** Orario "HH:MM". Accetta "9:05", minuti (number, es. 545 → "09:05"), o datetime ISO/Date (opz. {timeZone}). */
export function fmtTime(t, { timeZone } = {}) {
  if (t == null || t === '') return '';
  if (typeof t === 'number' && Number.isFinite(t)) return `${pad2(Math.floor(t / 60))}:${pad2(Math.round(t % 60))}`;
  const s = String(t);
  const hm = /^(\d{1,2})[:.](\d{2})$/.exec(s.trim());
  if (hm) return `${pad2(hm[1])}:${hm[2]}`;
  const d = t instanceof Date ? t : new Date(s);
  if (isNaN(d)) return s;
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(d);
}

/** Datetime ISO → "1 ott 2026, 20:00" (ora locale del dato se ha offset, altrimenti del browser). */
function fmtStamp(iso) {
  const s = String(iso || '');
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(s);
  if (!m) return s;
  return fmtDate(m[1], { weekday: false, year: true }) + (m[2] ? ', ' + m[2] : '');
}

// ---------- Date viaggio ----------
/** Data ISO odierna nel fuso indicato (default Asia/Tokyo). Override per test: ?today=YYYY-MM-DD. */
export function todayInTokyo(timeZone = 'Asia/Tokyo') {
  try {
    const o = new URLSearchParams(location.search).get('today');
    if (o && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o;
  } catch (e) { /* ignore */ }
  try {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    return `${g('year')}-${g('month')}-${g('day')}`;
  } catch (e) {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
}

/** true se dateIso è fra trip.start e trip.end inclusi. */
export function isTripDay(dateIso, trip) {
  if (!trip || !trip.start || !trip.end || !dateIso) return false;
  const d = String(dateIso).slice(0, 10);
  return d >= trip.start && d <= trip.end;
}

// ---------- UI helper ----------
const toastKeys = new Set();
/** Toast in basso. opts: {action:{label,onClick}, timeout (ms, 0 = fisso), key (deduplica)}. */
export function toast(msg, { action = null, timeout = 5000, key = null } = {}) {
  if (key && toastKeys.has(key)) return null;
  // un toast alla volta (lo stile .toast di base.css è posizionato fisso)
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  toastKeys.clear();
  if (key) toastKeys.add(key);
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  const span = document.createElement('span');
  span.textContent = msg;
  el.appendChild(span);
  const close = () => { el.classList.remove('toast--show'); setTimeout(() => el.remove(), 300); if (key) toastKeys.delete(key); };
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--ghost';
    b.textContent = action.label;
    b.addEventListener('click', () => { close(); action.onClick && action.onClick(); });
    el.appendChild(b);
  }
  el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--show'));
  if (timeout) setTimeout(close, timeout);
  return el;
}

/** Sostituisce il contenuto di `el` con uno stato vuoto `.empty`. */
export function showEmpty(el, msg) {
  if (!el) return;
  const p = document.createElement('p');
  p.className = 'empty';
  p.textContent = msg;
  el.replaceChildren(p);
}

function icon(name) {
  // aria-hidden: l'etichetta testuale accanto (o aria-label sul contenitore) descrive l'icona
  return `<svg class="icon" aria-hidden="true" focusable="false"><use href="${esc(rootUrl('assets/icons/sprite.svg'))}#i-${esc(name)}"></use></svg>`;
}

// ---------- Tema ----------
const FALLBACK_THEMES = [{ id: 'neutral', label: 'Neutro' }, { id: 'washi', label: 'Washi' }, { id: 'night', label: 'Notte' }];
const themes = () => (Array.isArray(window.GJ_THEMES) && window.GJ_THEMES.length ? window.GJ_THEMES : FALLBACK_THEMES);
const MODES = [{ id: 'auto', label: 'Auto' }, { id: 'light', label: 'Chiaro' }, { id: 'dark', label: 'Scuro' }];
const LS_THEME = 'giappone.theme', LS_MODE = 'giappone.mode';

function currentTheme() {
  const h = document.documentElement;
  return { theme: h.getAttribute('data-theme') || 'neutral', mode: h.getAttribute('data-theme-mode') || 'auto' };
}

function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) meta.setAttribute('content', bg);
}

/** Applica tema (neutral|washi|night) e modo (auto|light|dark); persiste in localStorage. Argomenti omessi = valore corrente/salvato. */
export function applyTheme(themeName, mode) {
  const cur = currentTheme();
  const theme = themes().some((t) => t.id === themeName) ? themeName : cur.theme;
  const md = MODES.some((m) => m.id === mode) ? mode : cur.mode;
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  html.setAttribute('data-theme-mode', md);
  const link = document.getElementById('theme-css');
  if (link) {
    const href = link.getAttribute('href') || '';
    const next = href.replace(/[^/]+\.css(\?.*)?$/, theme + '.css');
    if (next !== href) {
      link.addEventListener('load', syncThemeColor, { once: true });
      link.setAttribute('href', next);
    }
  }
  try { localStorage.setItem(LS_THEME, theme); localStorage.setItem(LS_MODE, md); } catch (e) { /* ignore */ }
  syncThemeColor();
  updateThemeControls();
  return { theme, mode: md };
}

const MODE_ICON = { auto: 'auto', light: 'sun', dark: 'moon' };
function updateThemeControls() {
  const { theme, mode } = currentTheme();
  const ts = document.getElementById('theme-select');
  const ms = document.getElementById('mode-select');
  if (ts) ts.value = theme;
  if (ms) ms.value = mode;
  document.querySelectorAll('.theme-switch').forEach((b) => {
    const label = MODES.find((m) => m.id === mode).label;
    b.setAttribute('aria-label', `Modo colore: ${label} (cambia)`);
    b.title = `Modo: ${label}`;
    b.innerHTML = icon(MODE_ICON[mode]) + `<span class="sr-only">${esc(label)}</span>`;
  });
}

// ---------- Shell ----------
const DEFAULT_SECTIONS = [
  { id: 'agenda', label: 'Agenda', icon: 'calendar' }, { id: 'trasporti', label: 'Trasporti', icon: 'train' },
  { id: 'alloggi', label: 'Alloggi', icon: 'bed' }, { id: 'luoghi', label: 'Luoghi', icon: 'pin' },
  { id: 'guide', label: 'Guide', icon: 'book' }, { id: 'budget', label: 'Budget', icon: 'wallet' },
];

function sectionHref(s) {
  if (s.href) return rootUrl(s.href);
  return rootUrl(s.id === 'home' ? 'index.html' : `${s.id}.html`);
}

/** Link relativo a una pagina del sito che conserva ?data= (fixture) se attivo. */
function keepData(href) {
  if (DATA_BASE === 'data/') return href;
  const u = new URL(href);
  u.searchParams.set('data', DATA_BASE);
  return u.href;
}

function ensureEl(selector, tag, className, place) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement(tag);
    el.className = className;
    place(el);
  }
  return el;
}

/** Monta topbar, nav e footer; imposta il titolo; registra il SW. Ritorna trip (o null). */
export async function initShell(activeSectionId = 'home') {
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const before = (el) => (main ? main.before(el) : document.body.prepend(el));
  const after = (el) => (main ? main.after(el) : document.body.append(el));

  // Skip link
  if (!document.querySelector('.skip-link')) {
    const a = document.createElement('a');
    a.className = 'skip-link sr-only';
    a.href = '#main';
    a.textContent = 'Vai al contenuto';
    document.body.prepend(a);
  }

  const topbar = ensureEl('.topbar', 'header', 'topbar', before);
  const nav = ensureEl('nav.nav, .nav', 'nav', 'nav', after);
  const footer = ensureEl('.footer', 'footer', 'footer', (el) => document.body.append(el));

  const trip = await loadData('trip');
  const sections = (trip && Array.isArray(trip.sections) && trip.sections.length ? trip.sections : DEFAULT_SECTIONS).slice();
  if (!sections.some((s) => s.id === 'home')) sections.unshift({ id: 'home', label: 'Home', icon: 'home' });

  // Topbar
  const title = (trip && trip.title) || 'Viaggio';
  topbar.innerHTML =
    `<a class="topbar__title" href="${esc(keepData(rootUrl('index.html')))}">${esc(title)}</a>` +
    `<button type="button" class="theme-switch"></button>`;
  topbar.querySelector('.theme-switch').addEventListener('click', () => {
    const order = MODES.map((m) => m.id);
    const { mode } = currentTheme();
    applyTheme(undefined, order[(order.indexOf(mode) + 1) % order.length]);
  });

  // Nav
  nav.setAttribute('aria-label', 'Sezioni');
  nav.innerHTML = sections.map((s) => {
    const active = s.id === activeSectionId;
    return `<a class="nav__item${active ? ' nav__item--active' : ''}" href="${esc(keepData(sectionHref(s)))}"${active ? ' aria-current="page"' : ''}>` +
      `${icon(s.icon || s.id)}<span class="nav__label">${esc(s.label || s.id)}</span></a>`;
  }).join('');

  // Footer
  const gen = trip && trip.generatedAt ? fmtStamp(trip.generatedAt) : '';
  const opt = (list, id) => list.map((x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');
  footer.innerHTML =
    (gen ? `<p class="small muted">Dati aggiornati al ${esc(gen)}</p>` : trip ? '' : `<p class="small muted">Dati non disponibili</p>`) +
    (DATA_BASE !== 'data/' ? `<p class="small muted">Dati di prova: ${esc(DATA_BASE)}</p>` : '') +
    `<div class="footer__theme row">` +
    `<label class="small">Tema <select id="theme-select">${opt(themes())}</select></label>` +
    `<label class="small">Modo <select id="mode-select">${opt(MODES)}</select></label></div>`;
  footer.querySelector('#theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
  footer.querySelector('#mode-select').addEventListener('change', (e) => applyTheme(undefined, e.target.value));
  updateThemeControls();
  syncThemeColor();

  // Titolo documento
  const sec = sections.find((s) => s.id === activeSectionId);
  document.title = sec && sec.id !== 'home' ? `${sec.label} · ${title}` : title;

  registerSW();
  return trip;
}

// ---------- Service worker ----------
let swRegistered = false;
function registerSW() {
  if (swRegistered || !('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (location.protocol !== 'https:' && !local) return;
  try { if (new URLSearchParams(location.search).has('nosw')) return; } catch (e) { /* ignore */ }
  swRegistered = true;
  // Toast solo se un SW nuovo prende il controllo di una pagina già controllata (non alla prima installazione).
  let controlled = !!navigator.serviceWorker.controller;
  const notify = () => toast('È disponibile una versione aggiornata', { timeout: 0, key: 'sw-update', action: { label: 'Ricarica', onClick: () => location.reload() } });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) notify();
    controlled = true;
  });
  // sw.js invia anche {type:'SW_ACTIVATED', version}: utile per debug
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'SW_ACTIVATED') console.info('[app] SW attivo:', ev.data.version);
  });
  navigator.serviceWorker.register(rootUrl('sw.js'), { scope: rootUrl('./') })
    .catch((err) => console.warn('[app] SW non registrato:', err));
}
