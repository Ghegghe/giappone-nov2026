// pages-luoghi.js — luoghi.html: filtri sticky (testo, città, flag, ordinamento) + lista card con Maps / Indicazioni.
import { fmtDate } from './app.js';
import { html, mount, icon, pageUrl, dirUrl, store } from './pages.js';

const FLAGS = [
  { id: 'Sì', label: 'Sì' }, { id: 'Forse', label: 'Forse' }, { id: 'No', label: 'No' },
  { id: 'Futuro', label: 'Futuro' }, { id: '', label: 'Senza flag' },
];
const DEFAULT_FLAGS = ['Sì', 'Forse'];
const FLAG_BADGE = { 'Sì': 'badge--done', Forse: 'badge--opt', No: '', Futuro: 'badge--draft', '': '' };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function placeCard(p) {
  const q = p.mapsQuery || `${p.name} ${p.city || ''}`;
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  const hasGeo = Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)) && p.lat !== '' && p.lon !== '' && p.lat != null;
  return html`<li class="card lu-card">
    <div class="lu-card__body stack">
      <div class="row lu-card__head">
        <h2 class="h3 lu-card__name">${p.source === '★' ? html`<span class="lu-star" aria-label="salvato">★</span> ` : ''}${p.name}</h2>
        <span class="badge ${FLAG_BADGE[p.flag || ''] || ''}"${p.flag ? '' : ' title="senza flag nel dossier" aria-label="senza flag"'}>${p.flag || '—'}</span>
      </div>
      <p class="small muted">${[p.type, p.city, p.area].filter(Boolean).join(' · ')}</p>
      ${p.note ? html`<p class="small">${p.note}</p>` : ''}
      ${(p.dayDates || []).length ? html`<div class="row lu-days" aria-label="Giorni in agenda">${p.dayDates.map((d) => html`
        <a class="chip" href="${pageUrl('giorno.html', { d })}">${icon('calendar')} ${fmtDate(d)}</a>`)}</div>` : ''}
    </div>
    <div class="lu-card__actions">
      <a class="btn btn--primary lu-maps" href="${maps}" target="_blank" rel="noopener noreferrer">${icon('pin')}<span>Maps</span></a>
      ${hasGeo ? html`<a class="btn btn--ghost" href="${dirUrl(p.lat, p.lon)}" target="_blank" rel="noopener noreferrer">${icon('walk')}<span>Indicazioni</span></a>` : ''}
    </div>
  </li>`;
}

/** Flag "" (colonna Andiamo? vuota): se il luogo è in agenda (dayDates) segue il chip "Sì" — così resta visibile
 *  col filtro di default; se non è in agenda compare solo col chip "Senza flag". */
export const flagPass = (p, flags) => flags.includes(p.flag || '') || (!p.flag && (p.dayDates || []).length > 0 && flags.includes('Sì'));

/** Filtra e ordina (esportata per i test). */
export function filterPlaces(places, st) {
  const q = norm(st.q).trim();
  const terms = q ? q.split(/\s+/) : [];
  const out = places.filter((p) => {
    if (st.cities.length && !st.cities.includes(p.city)) return false;
    if (!flagPass(p, st.flags)) return false;
    if (!terms.length) return true;
    const hay = norm([p.name, p.city, p.area, p.type, p.note, p.layer].join(' '));
    return terms.every((t) => hay.includes(t));
  });
  const cityIdx = new Map(st.cityOrder.map((c, i) => [c, i]));
  const byName = (a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' });
  out.sort(st.sort === 'name' ? byName : (a, b) => ((cityIdx.get(a.city) ?? 999) - (cityIdx.get(b.city) ?? 999)) || 0);
  return out; // con sort "città" resta l'ordine dei dati dentro ogni città (= ordine del dossier)
}

export async function render(root, { loadData }) {
  const d = await loadData('places');
  const places = (d && d.places) || [];
  if (!d) { mount(root, html`<h1 class="h1">Luoghi</h1><p class="empty">Dati luoghi non disponibili.</p>`); return; }
  const cityOrder = [...new Set(places.map((p) => p.city).filter(Boolean))]; // ordine dei dati = ordine di viaggio
  const flagsPresent = FLAGS.filter((f) => places.some((p) => (p.flag || '') === f.id));
  const saved = store.get('luoghi', null) || {};
  const st = {
    q: '',
    cities: (saved.cities || []).filter((c) => cityOrder.includes(c)),
    flags: Array.isArray(saved.flags) ? saved.flags : DEFAULT_FLAGS.slice(),
    sort: saved.sort === 'name' ? 'name' : 'city',
    cityOrder,
  };
  mount(root, html`
    <h1 class="h1">Luoghi</h1>
    <div class="filter-bar lu-filters stack" role="search">
      <label class="lu-search">
        <span class="sr-only">Cerca un luogo</span>
        ${icon('search')}
        <input type="search" name="q" class="lu-search__input" placeholder="Cerca (nome, zona, tipo…)" autocomplete="off" enterkeyhint="search">
      </label>
      <div class="row lu-chips" role="group" aria-label="Città">
        <button type="button" class="chip" data-city="" aria-pressed="false">Tutte</button>
        ${cityOrder.map((c) => html`<button type="button" class="chip" data-city="${c}" aria-pressed="false">${c}</button>`)}
      </div>
      <div class="row lu-row2">
        <div class="row lu-chips" role="group" aria-label="Flag">
          ${flagsPresent.map((f) => html`<button type="button" class="chip" data-flag="${f.id}" aria-pressed="false">${f.label}</button>`)}
        </div>
        <label class="small lu-sort">Ordina
          <select name="sort" class="lu-sort__select">
            <option value="city">per città</option>
            <option value="name">per nome</option>
          </select>
        </label>
      </div>
      <p class="small muted lu-count" role="status" aria-live="polite"></p>
    </div>
    <ul class="lu-list stack" aria-label="Risultati"></ul>`);

  const listEl = root.querySelector('.lu-list');
  const countEl = root.querySelector('.lu-count');
  const input = root.querySelector('.lu-search__input');
  const sortSel = root.querySelector('.lu-sort__select');
  sortSel.value = st.sort;

  const sync = () => {
    root.querySelectorAll('[data-city]').forEach((b) => {
      const c = b.dataset.city;
      const on = c ? st.cities.includes(c) : st.cities.length === 0;
      b.setAttribute('aria-pressed', String(on)); b.classList.toggle('chip--active', on);
    });
    root.querySelectorAll('[data-flag]').forEach((b) => {
      const on = st.flags.includes(b.dataset.flag);
      b.setAttribute('aria-pressed', String(on)); b.classList.toggle('chip--active', on);
    });
    const res = filterPlaces(places, st);
    countEl.textContent = res.length === 1 ? '1 luogo' : `${res.length} luoghi su ${places.length}`;
    if (!res.length) { mount(listEl, html`<li class="empty">Nessun luogo con questi filtri.</li>`); return; }
    // con ordinamento per città: intestazione di gruppo
    if (st.sort === 'city') {
      let last = null; const parts = [];
      res.forEach((p) => { if (p.city !== last) { last = p.city; parts.push(html`<li class="section-title lu-group">${p.city || '—'}</li>`); } parts.push(placeCard(p)); });
      mount(listEl, parts);
    } else mount(listEl, res.map(placeCard));
    store.set('luoghi', { cities: st.cities, flags: st.flags, sort: st.sort });
  };

  root.querySelector('.lu-filters').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if ('city' in b.dataset) {
      const c = b.dataset.city;
      if (!c) st.cities = [];
      else st.cities = st.cities.includes(c) ? st.cities.filter((x) => x !== c) : [...st.cities, c];
    } else if ('flag' in b.dataset) {
      const f = b.dataset.flag;
      st.flags = st.flags.includes(f) ? st.flags.filter((x) => x !== f) : [...st.flags, f];
    } else return;
    sync();
  });
  let tmr;
  input.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { st.q = input.value; sync(); }, 120); });
  sortSel.addEventListener('change', () => { st.sort = sortSel.value; sync(); });
  sync();
}
