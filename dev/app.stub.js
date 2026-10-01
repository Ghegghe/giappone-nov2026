// STUB di sviluppo di assets/js/app.js (shell-pwa). Solo per lavorare in locale prima che esista il vero app.js.
// Stesse firme usate da agenda.js / agenda-day.js. Non va in produzione (vedi site/NOTES_agenda.md, "Sviluppo locale").

const params = new URLSearchParams(location.search);
// ?data=dev/fixtures/ → carica le fixture; default data/
const DATA_BASE = params.get('data') || 'data/';
const cache = new Map();

// come il vero app.js: risolve a null in caso di errore (non lancia)
export function loadData(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(`${DATA_BASE}${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`${name}.json: HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { console.warn('[stub]', e); return null; }));
  }
  return cache.get(name);
}

const nfEur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
const nfJpy = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });

export const fmtEur = (n) => nfEur.format(Number(n) || 0);
// n = importo in €, fx = trip.fx ({jpyPerEur}) o numero → "¥1.850"
export function fmtJpy(n, fx) {
  const rate = typeof fx === 'number' ? fx : (fx && fx.jpyPerEur) || 1;
  return `¥${nfJpy.format(Math.round((Number(n) || 0) * rate))}`;
}

const WD = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const MO = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
// "2026-11-07" → "sab 7 nov"
export function fmtDate(iso, { weekday = true } = {}) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${weekday ? WD[dt.getUTCDay()] + ' ' : ''}${d} ${MO[m - 1]}`;
}

export const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || '')}`;

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function applyTheme() {}

// Nel vero shell monta nav + footer; qui una nav minima per non avere pagine nude.
export async function initShell(active) {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'Sezioni (stub)');
  for (const [href, label] of [['index.html', 'Home'], ['agenda.html', 'Agenda']]) {
    const a = document.createElement('a');
    a.className = 'nav__item' + (label.toLowerCase() === active ? ' nav__item--active' : '');
    a.href = href + location.search.replace(/[?&]d=[^&]*/, '');
    a.textContent = label;
    nav.append(a);
  }
  document.body.prepend(nav);
  return loadData('trip');
}
