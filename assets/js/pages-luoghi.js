// pages-luoghi.js — luoghi.html: filtri sticky (testo, città, flag, ordinamento) + lista card con Maps / Indicazioni.
import { fmtDate } from './app.js';
import { html, mount, icon, pageUrl, dirUrl, store, mapsIconBtn } from './pages.js';

// flag = colonna "Andiamo?" del dossier, mostrata con parole da sito
const FLAGS = [
  { id: 'Sì', label: 'Sì' }, { id: 'Forse', label: 'Forse' }, { id: 'No', label: 'No' },
  { id: 'Futuro', label: "Un'altra volta" }, { id: '', label: 'Da decidere' },
];
const FLAG_LABEL = Object.fromEntries(FLAGS.map((f) => [f.id, f.label]));
const DEFAULT_FLAGS = ['Sì', 'Forse'];
// "Andiamo?" come parola nella riga dei dettagli (niente badge): "Sì" è il caso normale e non si scrive
const FLAG_WORD = { 'Sì': '', Forse: 'forse', No: 'no', Futuro: "un'altra volta", '': 'da decidere' };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const OPEN_ALL_MAX = 30; // con pochi risultati (ricerca, una città) i gruppi si aprono tutti

/** Riga compatta: nome + flag · tipo · zona · nota breve · giorni in agenda · Maps (icona 44px a destra). */
function placeRow(p) {
  const q = p.mapsQuery || `${p.name} ${p.city || ''}`;
  const hasGeo = Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)) && p.lat !== '' && p.lon !== '' && p.lat != null;
  const flag = p.flag || '';
  return html`<li class="list-item lu-row">
    <div class="stack lu-row__body">
      <p class="lu-row__name"><strong>${p.name}</strong>${p.source === '★' ? html` <span class="lu-star" title="segnalato da voi" aria-label="segnalato da voi">★</span>` : ''}</p>
      <p class="small muted">${[p.type, p.area, FLAG_WORD[flag] != null ? FLAG_WORD[flag] : FLAG_LABEL[flag]].filter(Boolean).join(' · ')}</p>
      ${p.note ? html`<p class="small">${p.note}</p>` : ''}
      ${(p.dayDates || []).length ? html`<p class="row lu-days" aria-label="Giorni in agenda">${p.dayDates.map((d) => html`
        <a class="chip" href="${pageUrl('giorno.html', { d })}">${fmtDate(d)}</a>`)}</p>` : ''}
    </div>
    <div class="row lu-row__actions">
      ${mapsIconBtn(q, p.name)}
      ${hasGeo ? html`<a class="btn btn--icon btn--ghost" href="${dirUrl(p.lat, p.lon)}" target="_blank" rel="noopener noreferrer" aria-label="Indicazioni a piedi per ${p.name} (nuova scheda)" title="Indicazioni a piedi">${icon('walk')}</a>` : ''}
    </div>
  </li>`;
}

/** Flag "" (colonna Andiamo? vuota): se il luogo è in agenda (dayDates) segue il chip "Sì" — così resta visibile
 *  col filtro di default; se non è in agenda compare solo col chip "Da decidere". */
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
  if (!d) { mount(root, html`<h1 class="h1">Luoghi</h1><p class="empty">Dati dei luoghi non disponibili.</p>`); return; }
  const cityOrder = [...new Set(places.map((p) => p.city).filter(Boolean))]; // ordine dei dati = ordine di viaggio
  const flagsPresent = FLAGS.filter((f) => places.some((p) => (p.flag || '') === f.id));
  const saved = store.get('luoghi', null) || {};
  const st = {
    q: typeof saved.q === 'string' ? saved.q : '',
    open: Array.isArray(saved.open) ? saved.open : [],
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
        <div class="row lu-chips" role="group" aria-label="Andiamo?">
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
    <div class="lu-list stack" aria-label="Risultati"></div>`);

  const listEl = root.querySelector('.lu-list');
  const countEl = root.querySelector('.lu-count');
  const input = root.querySelector('.lu-search__input');
  const sortSel = root.querySelector('.lu-sort__select');
  sortSel.value = st.sort;
  input.value = st.q;

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
    store.set('luoghi', { cities: st.cities, flags: st.flags, sort: st.sort, q: st.q, open: st.open });
    if (!res.length) { mount(listEl, html`<p class="empty">Nessun luogo con questi filtri.</p>`); return; }
    if (st.sort !== 'city') { mount(listEl, html`<ul class="list">${res.map(placeRow)}</ul>`); return; }
    // per città: un gruppo richiudibile per città, con il conteggio; aperto se scelto o se i risultati sono pochi
    const groups = new Map();
    res.forEach((p) => { const c = p.city || '—'; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(p); });
    const openAll = res.length <= OPEN_ALL_MAX || groups.size === 1;
    mount(listEl, [...groups].map(([c, ps]) => html`<details class="lu-group" data-group="${c}"${openAll || st.open.includes(c) ? ' open' : ''}>
      <summary class="lu-group__head"><span class="h3">${c}</span> <span class="lu-group__count" aria-label="${ps.length} luoghi">${ps.length}</span></summary>
      <ul class="list">${ps.map(placeRow)}</ul>
    </details>`));
  };
  // apertura/chiusura gruppi ricordata solo quando la cambia l'utente (click/Invio sul titolo del gruppo)
  listEl.addEventListener('click', (e) => {
    const sum = e.target.closest('summary');
    const g = sum && sum.parentElement;
    if (!g || !g.dataset.group) return;
    const c = g.dataset.group, willOpen = !g.open;
    st.open = willOpen ? [...new Set([...st.open, c])] : st.open.filter((x) => x !== c);
    store.set('luoghi', { cities: st.cities, flags: st.flags, sort: st.sort, q: st.q, open: st.open });
  });

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
