// pages-luoghi.js — luoghi.html: filtri sticky (testo, città, flag, ordinamento) + gruppi per città con date e conteggi;
// dentro ogni gruppo prima i "Sì" (righe complete), poi "Forse" (righe compatte). Icona del tipo davanti al nome.
import { fmtDate, todayInTokyo } from './app.js';
import { html, mount, icon, pageUrl, dirUrl, store, mapsIconBtn } from './pages.js';

// flag = colonna "Andiamo?" del dossier, mostrata con parole da sito
const FLAGS = [
  { id: 'Sì', label: 'Sì' }, { id: 'Forse', label: 'Forse' }, { id: 'No', label: 'No' },
  { id: 'Futuro', label: "Un'altra volta" }, { id: '', label: 'Da decidere' },
];
const FLAG_LABEL = Object.fromEntries(FLAGS.map((f) => [f.id, f.label]));
const DEFAULT_FLAGS = ['Sì', 'Forse'];
const FLAG_BADGE = { 'Sì': 'badge--done', Forse: 'badge--opt', No: '', Futuro: 'badge--draft', '': '' };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const OPEN_ALL_MAX = 30; // con pochi risultati (ricerca, una città) i gruppi si aprono tutti

// segno del tipo (presentazione: `type` è testo libero con più di 40 valori → parole chiave). Ordine = priorità.
// Anime/otaku/Love Live: icona i-anime (stella + scintilla), distinta da i-star (= segnalato da voi).
const TYPE_ICON = [
  [/anime|otaku|love live|gaming|merch/, 'anime'],
  [/onsen/, 'onsen'],
  [/nightlife|musica/, 'moon'],
  [/food|mercato|specialit|street|wagyu|fugu/, 'food'],
  [/shopping|vintage/, 'bag'],
  [/tempio|santuario|castello|storic|unesco|casa storica/, 'torii'],
];
export const typeIcon = (type) => { const t = norm(type); const hit = TYPE_ICON.find(([re]) => re.test(t)); return hit ? hit[1] : 'map-pin'; };

/** Riga: [icona tipo] nome (+★) · "tipo · zona" · nota (2 righe) · giorni in agenda · Maps 44px. compact = riga "Forse". */
function placeRow(p, { compact = false, badge = false } = {}) {
  const q = p.mapsQuery || `${p.name} ${p.city || ''}`;
  const hasGeo = Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)) && p.lat !== '' && p.lon !== '' && p.lat != null;
  const flag = p.flag || '';
  return html`<li class="list-item lu-row${compact ? ' lu-row--compact' : ''}">
    <div class="stack lu-row__body">
      <p class="lu-row__name">${icon(typeIcon(p.type))}<strong>${p.name}</strong>${p.source === '★' ? html` <span class="lu-star" title="segnalato da voi" aria-label="segnalato da voi">★</span>` : ''}
        ${badge ? html`<span class="badge ${FLAG_BADGE[flag] || ''}" title="Andiamo? ${FLAG_LABEL[flag] || flag}">${FLAG_LABEL[flag] || flag}</span>` : ''}</p>
      ${p.type || p.area ? html`<p class="small muted lu-row__meta">${[p.type, p.area].filter(Boolean).join(' · ')}</p>` : ''}
      ${p.note && !compact ? html`<p class="small lu-row__note">${p.note}</p>` : ''}
      ${(p.dayDates || []).length ? html`<p class="row lu-days" aria-label="Giorni in agenda">${p.dayDates.map((d) => html`
        <a class="chip" href="${pageUrl('giorno.html', { d })}">${icon('calendar')} ${fmtDate(d)}</a>`)}</p>` : ''}
    </div>
    <div class="row lu-row__actions">
      ${mapsIconBtn(q, p.name)}
      ${hasGeo ? html`<a class="btn btn--icon btn--ghost" href="${dirUrl(p.lat, p.lon)}" target="_blank" rel="noopener noreferrer" aria-label="Indicazioni a piedi per ${p.name} (nuova scheda)" title="Indicazioni a piedi">${icon('walk')}</a>` : ''}
    </div>
  </li>`;
}

/** Sotto-elenchi di un gruppo città: "Sì" (righe complete, include i senza flag già in agenda), poi "Forse", poi gli altri flag attivi. */
const isYes = (p) => p.flag === 'Sì' || (!p.flag && (p.dayDates || []).length > 0);
function groupBody(ps) {
  const yes = ps.filter(isYes);
  const rest = ps.filter((p) => !isYes(p));
  const by = new Map();
  rest.forEach((p) => { const f = p.flag || ''; if (!by.has(f)) by.set(f, []); by.get(f).push(p); });
  const order = FLAGS.map((f) => f.id).filter((f) => by.has(f));
  return html`${yes.length ? html`<ul class="list card lu-yes" aria-label="Sì">${yes.map((p) => placeRow(p))}</ul>` : ''}
    ${order.map((f) => html`<h3 class="lu-sub small">${FLAG_LABEL[f] || f} <span class="muted">(${by.get(f).length})</span></h3>
      <ul class="list card lu-maybe">${by.get(f).map((p) => placeRow(p, { compact: true }))}</ul>`)}`;
}

/** Date del gruppo dal `layer` dei dati: "Osaka (7-11 nov)" → "7-11 nov"; "Tokyo (17-24)" → "17-24 nov" (mese della partenza). */
export function layerDates(places, monthAbbr = '') {
  for (const p of places) {
    const l = String(p.layer || '');
    if (!l) continue;
    const par = [...l.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).find((x) => /\d/.test(x));
    const m = par || ((/\d{1,2}(?:\s*-\s*\d{1,2})?\s+[a-z]{3}\b/i.exec(l) || [])[0]);
    if (!m) continue;
    const t = m.trim();
    return /^\d{1,2}(\s*-\s*\d{1,2})?$/.test(t) && monthAbbr ? `${t} ${monthAbbr}` : t;
  }
  return '';
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

/** Città da aprire senza stato salvato: la base di oggi o, prima del viaggio, la prossima (lodging.stays). */
export function focusCity(stays, today, cities) {
  const list = [...(stays || [])].filter((x) => x && x.checkIn).sort((a, b) => String(a.checkIn).localeCompare(String(b.checkIn)));
  const cur = list.find((x) => x.checkIn <= today && today < (x.checkOut || x.checkIn));
  const next = list.find((x) => x.checkIn > today);
  const c = (cur || next || {}).city;
  return c && cities.includes(c) ? c : null;
}

export async function render(root, { trip, loadData }) {
  const [d, lodging] = await Promise.all([loadData('places'), Promise.resolve(loadData('lodging')).catch(() => null)]);
  const places = (d && d.places) || [];
  if (!d) { mount(root, html`<h1 class="h1">Luoghi</h1><p class="empty">Dati dei luoghi non disponibili.</p>`); return; }
  const cityOrder = [...new Set(places.map((p) => p.city).filter(Boolean))]; // ordine dei dati = ordine di viaggio
  const month = trip && trip.start ? (fmtDate(trip.start, { weekday: false }).split(' ')[1] || '') : '';
  const datesOf = new Map(cityOrder.map((c) => [c, layerDates(places.filter((p) => p.city === c), month)]));
  const focus = focusCity(lodging && lodging.stays, todayInTokyo(), cityOrder) || cityOrder[0] || null;
  const flagsPresent = FLAGS.filter((f) => places.some((p) => (p.flag || '') === f.id));
  const saved = store.get('luoghi', null) || {};
  const st = {
    q: typeof saved.q === 'string' ? saved.q : '',
    // null = mai toccato dall'utente → si apre la base di oggi/prossima. Vale solo con openTouched: le versioni
    // precedenti salvavano `open: []` senza clic, che altrimenti chiuderebbe tutto per sempre.
    open: saved.openTouched === true && Array.isArray(saved.open) ? saved.open : null,
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

  const save = () => store.set('luoghi', { cities: st.cities, flags: st.flags, sort: st.sort, q: st.q, open: st.open, openTouched: st.open !== null });
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
    save();
    if (!res.length) { mount(listEl, html`<p class="empty">Nessun luogo con questi filtri.</p>`); return; }
    if (st.sort !== 'city') { mount(listEl, html`<ul class="list card">${res.map((p) => placeRow(p, { badge: true }))}</ul>`); return; }
    // per città: un gruppo richiudibile per città, con date, conteggio e sommario Sì/Forse/in agenda (sui risultati filtrati)
    const groups = new Map();
    res.forEach((p) => { const c = p.city || '—'; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(p); });
    const openAll = res.length <= OPEN_ALL_MAX || groups.size === 1;
    const isOpen = (c) => openAll || (st.open ? st.open.includes(c) : c === (groups.has(focus) ? focus : [...groups.keys()][0]));
    mount(listEl, [...groups].map(([c, ps]) => {
      const nYes = ps.filter(isYes).length, nMaybe = ps.filter((p) => p.flag === 'Forse').length;
      const nAg = ps.filter((p) => (p.dayDates || []).length).length;
      const counts = [nYes ? `${nYes} sì` : '', nMaybe ? `${nMaybe} forse` : '', nAg ? `${nAg} in agenda` : ''].filter(Boolean).join(' · ');
      const dates = datesOf.get(c);
      return html`<details class="lu-group" data-group="${c}"${isOpen(c) ? ' open' : ''}>
      <summary class="lu-group__head">
        <span class="lu-group__title"><span class="h3">${c}</span>${dates ? html` <span class="small muted lu-group__dates">${dates}</span>` : ''}
          ${counts ? html`<span class="small muted lu-group__counts">${counts}</span>` : ''}</span>
        <span class="badge" aria-label="${ps.length} luoghi">${ps.length}</span>
      </summary>
      ${groupBody(ps)}
    </details>`;
    }));
  };
  // apertura/chiusura gruppi ricordata solo quando la cambia l'utente (click/Invio sul titolo del gruppo)
  listEl.addEventListener('click', (e) => {
    const sum = e.target.closest('summary');
    const g = sum && sum.parentElement;
    if (!g || !g.dataset.group) return;
    const c = g.dataset.group, willOpen = !g.open;
    // la prima volta si parte da quello che si vede (gruppi aperti ora), così il default non "salta"
    const now = st.open || [...listEl.querySelectorAll('details.lu-group[open]')].map((x) => x.dataset.group);
    st.open = willOpen ? [...new Set([...now, c])] : now.filter((x) => x !== c);
    save();
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
