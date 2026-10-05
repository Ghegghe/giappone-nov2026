// pages-guide.js — guide.html (SPEC §10.3): indice a card con filtro per tag; ?g=<id> o #<id> apre la guida.
// Il corpo `html` arriva già convertito e sanificato dall'exporter (export_site_guides.py): qui si inserisce così com'è,
// con un ultimo controllo difensivo. Tutto il resto è escapato da html``.
import { html, raw, mount, icon, pageUrl, store, mapsIconBtn } from './pages.js';

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const longDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
const UNSAFE = /<script|<[^>]*\son\w+\s*=|<[^>]*javascript:/i;

function wantedId(ids) {
  let g = '';
  try { g = new URLSearchParams(location.search).get('g') || ''; } catch (e) { /* ignore */ }
  const h = decodeURIComponent(location.hash.slice(1));
  if (!g && ids.includes(h)) g = h;
  return g;
}

const tile = (name) => html`<span class="g-tile" aria-hidden="true">${icon(name || 'book')}</span>`;
const tagList = (tags) => (tags || []).length
  ? html`<p class="g-tags">${tags.map((t) => html`<span class="badge">${t}</span>`)}</p>` : '';

// ---------- indice ----------
// filtro compatto come in Luoghi: cerca (titolo, sommario, tag) + select dei tag, una sola riga anche a 375px
const norm = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function renderIndex(root, guides) {
  const tags = [...new Set(guides.flatMap((g) => g.tags || []))].sort((a, b) => a.localeCompare(b, 'it'));
  const saved = store.get('guide', null) || {};
  const st = { q: typeof saved.q === 'string' ? saved.q : '', tag: tags.includes(saved.tag) ? saved.tag : '' };
  mount(root, html`
    <header class="g-head">
      <h1 class="h1">Guide</h1>
      <p class="muted">Come funzionano le cose che incontrerete in viaggio, spiegate passo per passo.</p>
    </header>
    ${guides.length > 1 ? html`<div class="g-filters" role="search">
      <label class="g-search">
        <span class="sr-only">Cerca nelle guide (titolo, descrizione, tema)</span>
        ${icon('search')}
        <input type="search" name="q" class="g-search__input" placeholder="Cerca guide" autocomplete="off" enterkeyhint="search">
      </label>
      ${tags.length > 1 ? html`<label class="g-tagsel"><span class="sr-only">Tema della guida</span>
        <select name="tag">
          <option value="">Tutti i temi</option>
          ${tags.map((t) => html`<option value="${t}">${t}</option>`)}
        </select>
      </label>` : ''}
    </div>` : ''}
    <p class="sr-only" aria-live="polite" data-count></p>
    <ul class="g-index" role="list">${guides.map((g) => html`
      <li data-id="${g.id}">
        <a class="card g-card" href="${pageUrl('guide.html', { g: g.id })}">
          ${tile(g.icon)}
          <span class="g-card__body">
            <span class="g-card__title">${g.title}</span>
            ${g.summary ? html`<span class="g-card__summary">${g.summary}</span>` : ''}
            ${tagList(g.tags)}
          </span>
          ${icon('chevron-right')}
        </a>
      </li>`)}
    </ul>
    <div class="empty g-none" hidden><p>Nessuna guida con questi filtri.</p>
      <button type="button" class="btn btn--sm" data-reset>Mostra tutte le guide</button></div>`);
  const hay = new Map(guides.map((g) => [g.id, norm([g.title, g.summary, ...(g.tags || [])].join(' '))]));
  const tagsOf = new Map(guides.map((g) => [g.id, g.tags || []]));
  const items = [...root.querySelectorAll('.g-index > li')];
  const count = root.querySelector('[data-count]');
  const none = root.querySelector('.g-none');
  const qIn = root.querySelector('input[name=q]');
  const tagSel = root.querySelector('select[name=tag]');
  if (qIn) qIn.value = st.q;
  if (tagSel) tagSel.value = st.tag;
  const apply = (announce) => {
    const words = norm(st.q).split(/\s+/).filter(Boolean);
    let n = 0;
    items.forEach((li) => {
      const id = li.dataset.id;
      const on = (!st.tag || tagsOf.get(id).includes(st.tag)) && words.every((w) => hay.get(id).includes(w));
      li.hidden = !on;
      n += on;
    });
    none.hidden = n > 0;
    if (announce) count.textContent = `${n} ${n === 1 ? 'guida' : 'guide'}`;
    store.set('guide', st);
  };
  if (qIn) qIn.addEventListener('input', () => { st.q = qIn.value; apply(true); });
  if (tagSel) tagSel.addEventListener('change', () => { st.tag = tagSel.value; apply(true); });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    st.q = ''; st.tag = '';
    if (qIn) qIn.value = '';
    if (tagSel) tagSel.value = '';
    apply(true);
  });
  apply(false);
}

// ---------- guida ----------
function placeRow(p) {
  return html`<li class="list-item g-place">
    <span class="g-place__text">
      <span class="g-place__nick">${p.nick || p.name}</span>
      ${p.nick && p.name ? html`<span class="small muted">${p.name}</span>` : ''}
    </span>
    ${mapsIconBtn(p.mapsQuery || p.name, p.nick || p.name)}
  </li>`;
}

function pagerLink(g, label, cls) {
  return g ? html`<a class="card g-pager__link ${cls}" href="${pageUrl('guide.html', { g: g.id })}">
      <span class="small muted">${label}</span><span class="g-pager__title">${g.title}</span></a>` : html`<span></span>`;
}

/** Link relativi del corpo (es. giorno.html?d=…) → conservano ?data= delle fixture. */
function keepDataLinks(article) {
  article.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/^[\w-]+\.html/.test(href)) {
      const [path, rest = ''] = href.split('?');
      const [query, hash = ''] = rest.split('#');
      a.setAttribute('href', pageUrl(path.split('#')[0] + (hash ? `#${hash}` : ''), Object.fromEntries(new URLSearchParams(query))));
    }
  });
}

function renderGuide(root, guides, i, trip) {
  const g = guides[i];
  const safe = !UNSAFE.test(g.html || '');
  if (!safe) console.warn('[guide] corpo scartato: contenuto non sicuro in', g.id);
  const upd = longDate(g.updated);
  mount(root, html`
    <nav class="g-back" aria-label="Percorso"><a class="btn btn--ghost btn--sm" href="${pageUrl('guide.html')}">${icon('chevron-left')}<span>Tutte le guide</span></a></nav>
    <article class="g-article" aria-labelledby="g-title">
      <header class="g-article__head">
        ${tile(g.icon)}
        <div class="stack g-article__titles">
          <h1 class="h1" id="g-title">${g.title}</h1>
          ${g.summary ? html`<p class="g-lede">${g.summary}</p>` : ''}
          <p class="small muted">${upd ? html`Aggiornata il <time datetime="${g.updated}">${upd}</time>` : ''}</p>
          ${tagList(g.tags)}
        </div>
      </header>
      <div class="prose">${safe ? raw(g.html || '') : html`<p class="empty">Questa guida non si può mostrare. Rigenerare i dati del sito.</p>`}</div>
    </article>
    ${(g.places || []).length ? html`<section aria-labelledby="g-places">
      <h2 class="section-title" id="g-places">Luoghi citati</h2>
      <ul class="list card g-places">${g.places.map(placeRow)}</ul>
    </section>` : ''}
    ${guides.length > 1 ? html`<nav class="g-pager" aria-label="Altre guide">
      ${pagerLink(guides[i - 1], 'Guida precedente', 'g-pager__link--prev')}
      ${pagerLink(guides[i + 1], 'Guida successiva', 'g-pager__link--next')}
    </nav>` : ''}`);
  keepDataLinks(root.querySelector('.prose'));
  const site = (trip && trip.title) || '';
  document.title = [g.title, 'Guide', site].filter(Boolean).join(' · ');
}

export async function render(root, { trip, loadData }) {
  const d = await loadData('guides');
  const guides = ((d && d.guides) || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  if (!d) { mount(root, html`<h1 class="h1">Guide</h1><p class="empty">Le guide non sono disponibili. Ricarica la pagina.</p>`); return; }
  if (!guides.length) { mount(root, html`<h1 class="h1">Guide</h1><p class="empty">Ancora nessuna guida: arriveranno con il prossimo aggiornamento del sito.</p>`); return; }
  const ids = guides.map((g) => g.id);
  const show = () => {
    const want = wantedId(ids);
    const i = ids.indexOf(want);
    if (i >= 0) renderGuide(root, guides, i, trip);
    else {
      renderIndex(root, guides);
      if (want) {
        const p = document.createElement('p');
        p.className = 'empty g-missing';
        p.textContent = `La guida «${want}» non c'è: ecco tutte le guide.`;
        root.querySelector('.g-head').after(p);
      }
    }
  };
  show();
  window.addEventListener('hashchange', () => { show(); window.scrollTo(0, 0); });
}
