// STUB di sviluppo di assets/js/app.js per le pagine contenuto (agente content-pages). NON va in produzione.
// Stesse firme del vero app.js (vedi NOTES_shell.md §5). Si usa solo da dev/test-pages.html?stub=1,
// che inietta un import map: "../assets/js/app.js" → "./app.stub.pages.js".
const params = new URLSearchParams(location.search);
export const DATA_BASE = params.get('data') || 'dev/fixtures/';
const ROOT = new URL('../', import.meta.url);
const cache = new Map();
export function loadData(name) {
  if (!cache.has(name)) cache.set(name, fetch(new URL(`${DATA_BASE}${name}.json`, ROOT)).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return cache.get(name);
}
const M = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => (s == null ? '' : String(s).replace(/[&<>"']/g, (c) => M[c]));
export const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q || '');
const grp = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const fmtEur = (n) => (Number.isFinite(Number(n)) && n !== null && n !== '' ? '€' + grp(String(Math.round(Number(n)))) : '—');
export function fmtJpy(n, fx) {
  const r = typeof fx === 'object' && fx ? fx.jpyPerEur : fx;
  return Number.isFinite(Number(n)) && r ? '¥' + grp(String(Math.round((n * r) / 10) * 10)) : '';
}
const WD = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'], MO = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
export function fmtDate(iso, { weekday = true, year = false } = {}) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return iso || '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return [weekday ? WD[d.getUTCDay()] : '', d.getUTCDate(), MO[d.getUTCMonth()], year ? m[1] : ''].filter((x) => x !== '').join(' ');
}
export const fmtTime = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(t || ''); };
export function todayInTokyo() {
  const o = params.get('today'); if (o) return o;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}
export const isTripDay = (d, t) => !!t && d >= t.start && d <= t.end;
export const toast = (msg) => console.info('[toast]', msg);
export const showEmpty = (el, msg) => { if (el) el.innerHTML = `<p class="empty">${esc(msg)}</p>`; };
export const applyTheme = () => ({});
export async function initShell() { return loadData('trip'); }
