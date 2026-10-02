// pages-trasporti.js — trasporti.html: tab Tratte · Aeroporti · Prenotazioni · Scadenze (ordine e id fissi: test e link #scadenze).
// Tratte: in testa la catena del viaggio (basi e tratte in ordine, ogni tratta porta alla sua card), poi le card dense.
// Scadenze: in testa la striscia "da oggi alla partenza" (dotTimeline di charts.js, con fallback testuale), poi la lista per mese.
import { fmtDate, fmtEur, fmtJpy, todayInTokyo } from './app.js';
import { html, mount, icon, extLink, safeUrl, setupTabs, monthLabel, fxRate, internalLinks, deadlineLabel, deadlineState, daysBetween } from './pages.js';

const money = (eur, rate) => (eur == null || eur === '' ? '' : html`<span class="mono">${fmtEur(eur)}</span>${rate ? html` <span class="mono muted small">${fmtJpy(eur, rate)}</span>` : ''}`);
const BOOK = { todo: ['badge--todo', 'da prenotare'], done: ['badge--done', 'prenotato'] };
const chosenOf = (l) => (l.options || []).find((o) => o.chosen) || null;
// nome breve per la catena: senza parentesi finale, destinazione e orari d'arrivo ("Limousine Bus KATE", "Gifu Bus 15:30")
const shortName = (s) => String(s || '').replace(/\s*\([^)]*\)\s*$/, '').split(/\s+(?:→|da)\s+|,\s*/)[0];

function opensText(b) {
  if (!b) return '';
  if (b.opensApprox) return b.opensNote ? `quando: ${b.opensNote}` : '';
  if (b.opens) return `apre ${fmtDate(b.opens)}${b.opensNote ? ` · ${b.opensNote}` : ''}`;
  return b.opensNote || '';
}

/** <details> "Come si prenota e si ritira": Prenota · Pagamento · Ritiro (+ come funziona / pro-contro / altre note). */
function howTo(o) {
  const b = o.booking;
  const d = o.details && typeof o.details === 'object' ? o.details : (o.details ? { how: o.details } : null);
  const rows = [];
  if (b) {
    const site = b.url ? extLink(b.url, b.site || null) : b.site;
    const when = opensText(b);
    if (site || when) rows.push(['Prenota', html`${site || ''}${b.siteNote ? html` <span class="muted">(${b.siteNote})</span>` : ''}${when ? html`${site ? html`<br>` : ''}<span class="muted">${when}</span>` : ''}`]);
    if (b.howToPay) rows.push(['Pagamento', b.howToPay]);
    if (b.howToCollect) rows.push(['Ritiro', b.howToCollect]);
  }
  if (d) {
    if (d.how) rows.push(['Come funziona', d.how]);
    if (d.proCon) rows.push(['Pro e contro', d.proCon]);
  } else if ((o.noteMore || []).length) {
    rows.push(['Altre note', html`<ul class="al-notes">${o.noteMore.map((n) => html`<li>${n}</li>`)}</ul>`]);
  }
  if (!rows.length) return '';
  return html`<details class="tr-opt__details"><summary class="small">${b ? 'Come si prenota e si ritira' : 'Dettagli'}</summary>
    <dl class="kv small">${rows.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl></details>`;
}

/** Riga meta: durata · €/¥ a testa (2 elementi); "apre …" solo se da prenotare. */
function meta(o, rate) {
  const b = o.booking;
  // sulla card solo "apre dom 11 ott": la fascia oraria resta nel <details> (riga Prenota)
  const op = b && b.status === 'todo' ? (b.opens && !b.opensApprox ? `apre ${fmtDate(b.opens)}` : opensText(b)) : '';
  return html`<div class="tr-opt__meta row small">
    ${o.duration ? html`<span><span class="sr-only">durata </span><span class="mono">${o.duration}</span></span>` : ''}
    ${o.costEur != null ? html`<span>${money(o.costEur, rate)} <span class="muted">a testa</span></span>` : ''}
    ${op ? html`<span class="muted tr-opt__opens">${op}</span>` : ''}
  </div>`;
}

/** Alternativa (ripiegata): nota completa. */
function alternative(o, rate) {
  return html`<li class="list-item tr-opt">
    <div class="tr-opt__head row"><span class="tr-opt__name">${o.name}</span></div>
    ${meta(o, rate)}
    ${o.note ? html`<p class="small muted">${o.note}</p>` : ''}
    ${o.details ? howTo({ details: o.details }) : ''}
  </li>`;
}

/** Card tratta densa: titolo (+ unico badge di stato), opzione scelta, meta, una riga di nota, poi i due <details> affiancati. */
function legCard(l, rate) {
  const opts = l.options || [];
  const ch = opts.filter((o) => o.chosen);
  const others = opts.filter((o) => !o.chosen);
  const b0 = ch[0] && ch[0].booking;
  const st = b0 && BOOK[b0.status];
  const alts = others.length ? html`<details class="tr-leg__alts">
      <summary class="small">${others.length === 1 ? '1 alternativa' : `${others.length} alternative`}</summary>
      <ul class="list">${others.map((o) => alternative(o, rate))}</ul>
    </details>` : '';
  return html`<article class="card tr-leg stack" id="${l.id}" tabindex="-1">
    <header class="tr-leg__head">
      <h3 class="h3">${l.title || `${l.from} → ${l.to}`}</h3>
      ${st ? html`<span class="badge ${st[0]}">${st[1]}</span>` : ''}
      ${l.subtitle ? html`<p class="small muted">${l.subtitle}</p>` : ''}
    </header>
    ${ch.map((o, i) => {
      const line = i === 0 ? (l.summary || o.noteShort || '') : (o.noteShort || '');
      const how = howTo(o);
      return html`<div class="tr-opt tr-opt--chosen">
        <div class="tr-opt__head row"><span class="tr-opt__name">${i === 0 && l.date ? html`<span class="tr-opt__date">${fmtDate(l.date)} · </span>` : ''}<span class="sr-only">scelta: </span>${o.name}</span></div>
        ${meta(o, rate)}
        ${line ? html`<p class="small">${line}</p>` : ''}
        ${how || (i === 0 && alts) ? html`<div class="tr-opt__more">${how}${i === 0 ? alts : ''}</div>` : ''}
      </div>`;
    })}
    ${!ch.length && alts ? html`<div class="tr-opt__more">${alts}</div>` : ''}
  </article>`;
}

/** Raggruppa per data, in ordine. */
function byDate(list, rate) {
  const groups = new Map();
  [...list].sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((l) => {
    if (!groups.has(l.date)) groups.set(l.date, []);
    groups.get(l.date).push(l);
  });
  if (!groups.size) return html`<p class="empty">Nessuna tratta.</p>`;
  return [...groups].map(([d, ls]) => html`<section class="stack tr-day">
    <h2 class="section-title tr-day__title">${fmtDate(d)}</h2>
    ${ls.map((l) => legCard(l, rate))}
  </section>`);
}

function totalChosen(t, rate) {
  const all = [...(t.legs || []), ...(t.transfers || [])];
  const sum = t.totalChosenEur != null ? Number(t.totalChosenEur) : all.reduce((s, l) => s + (l.options || []).filter((o) => o.chosen).reduce((a, o) => a + (Number(o.costEur) || 0), 0), 0);
  return html`<p class="small muted tr-total">Totale scelte, aeroporti compresi: ${money(sum, rate)} a testa</p>`;
}

// ---------- Catena del viaggio ----------
/** Base "di riferimento": quella di oggi o, prima del viaggio, la prossima (id) — l'unica in accento. */
function focusStay(stays, today) {
  const cur = stays.find((s) => s.checkIn <= today && today < s.checkOut);
  if (cur) return cur.id;
  const next = stays.find((s) => s.checkIn > today);
  return next ? next.id : null;
}

/** Basi e tratte in un solo elenco ordinato: una tratta del giorno X viene prima della base con check-in X. */
function chainItems(t, stays) {
  const legs = [...(t.legs || []).map((l) => ({ l, kind: 'leg' })), ...(t.transfers || []).map((l) => ({ l, kind: 'transfer' }))]
    .filter((x) => x.l && x.l.date)
    .map((x, i) => ({ ...x, key: `${x.l.date}|0|${String(i).padStart(3, '0')}` }));
  const bases = stays.filter((s) => s.checkIn).map((s, i) => ({ s, kind: 'base', key: `${s.checkIn}|1|${String(i).padStart(3, '0')}` }));
  return [...legs, ...bases].sort((a, b) => a.key.localeCompare(b.key));
}

function chain(t, stays, rate, today) {
  const items = chainItems(t, stays);
  if (!items.length) return '';
  const focus = focusStay(stays, today);
  return html`<nav class="tr-chain-wrap" aria-labelledby="tr-chain-h">
    <h2 class="section-title" id="tr-chain-h">La catena del viaggio</h2>
    <ol class="tr-chain">${items.map((x) => {
      if (x.kind === 'base') {
        const s = x.s, n = Number(s.nights) || 0;
        return html`<li class="tr-chain__base${s.id === focus ? ' tr-chain__base--focus' : ''}">
          <span class="tr-chain__city">${s.city}</span>${n ? html` <span class="muted small">${n} ${n === 1 ? 'notte' : 'notti'}</span>` : ''}</li>`;
      }
      const l = x.l, o = chosenOf(l);
      const todo = o && o.booking && o.booking.status === 'todo';
      const sub = o ? [shortName(o.name), o.costEur != null ? fmtEur(o.costEur) : ''].filter(Boolean).join(' · ') : '';
      // mobile: una riga (data · tratta · stato); da 900px anche mezzo e costo sotto
      return html`<li class="tr-chain__leg">
        <a class="tr-chain__link" href="#${l.id}" data-chain="${x.kind}">
          <span class="tr-chain__top"><span class="tr-chain__date mono">${fmtDate(l.date, { weekday: false })}</span><span class="tr-chain__title">${l.title || `${l.from} → ${l.to}`}</span>${todo ? html`<span class="tr-chain__todo small">da prenotare</span>` : ''}</span>
          ${sub ? html`<span class="tr-chain__sub small muted">${sub}</span>` : ''}
        </a></li>`;
    })}</ol>
  </nav>`;
}

// ---------- Prenotazioni ----------
/** Vista estesa: una card per prenotazione, tutto visibile. */
function guide(t) {
  const g = t.bookingGuide || [];
  if (!g.length) return html`<p class="empty">Nessuna prenotazione da fare.</p>`;
  return html`<div class="grid-2">${g.map((x) => html`<article class="card stack tr-guide"${x.id ? html` id="${x.id}"` : ''}>
    <h3 class="h3">${x.what}</h3>
    <dl class="kv small">
      ${x.site || x.url ? html`<dt>Dove</dt><dd>${x.url ? extLink(x.url, x.site || null) : x.site}${x.siteNote ? html` <span class="muted">(${x.siteNote})</span>` : ''}</dd>` : ''}
      ${x.when ? html`<dt>Quando</dt><dd>${x.when}</dd>` : ''}
      ${x.payment ? html`<dt>Pagamento</dt><dd>${x.payment}</dd>` : ''}
      ${x.collect ? html`<dt>Biglietto</dt><dd>${x.collect}</dd>` : ''}
    </dl>
    ${x.notes ? html`<p class="small muted">${x.notes}</p>` : ''}
    ${internalLinks(x.links)}
  </article>`)}</div>`;
}

// ---------- Scadenze ----------
// primo dominio nel testo "dove" (es. "japanbusonline.com") → link
const urlIn = (s) => { const m = /((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s·]*)?)/i.exec(s || ''); return m ? safeUrl(m[1]) : ''; };
// "westjr.co.jp/travel-information/en/…" → "westjr.co.jp" (il link completo resta nell'href)
const shortUrls = (s) => String(s || '').replace(/((?:[a-z0-9-]+\.)+[a-z]{2,})\/\S+/gi, '$1');

/** "tra 9 giorni" / "domani" / "tra circa 26 giorni" (date approssimate); '' se oggi, passata o fatta. */
function relDays(c, st, todayIt) {
  if (st !== 'todo' || !c.sortDate) return '';
  const n = daysBetween(todayIt, c.sortDate);
  if (n <= 0) return '';
  if (c.dateApprox) return `tra circa ${n} giorni`;
  return n === 1 ? 'domani' : `tra ${n} giorni`;
}

function chkRow(c, todayIt) {
  const st = deadlineState(c, todayIt);
  const u = safeUrl(c.url) || urlIn(c.where);
  const lab = { done: ['badge--done', 'fatto'], late: ['badge--todo', 'in ritardo'], today: ['badge--draft', 'oggi'], todo: ['badge--todo', 'da fare'] }[st];
  const rel = relDays(c, st, todayIt);
  return html`<li class="list-item tr-chk${st === 'done' ? ' tr-chk--done' : ''}"${c._id ? html` id="${c._id}" tabindex="-1"` : ''}>
    <div class="row tr-chk__head">
      <span class="small"><span class="mono">${deadlineLabel(c)}</span>${rel ? html` <span class="muted">· ${rel}</span>` : ''}</span>
      <span class="badge ${lab[0]}">${lab[1]}</span>
    </div>
    <p class="tr-chk__what">${c.what}</p>
    ${c.whenDetail ? html`<p class="small muted">${icon('clock')} ${c.whenDetail}</p>` : ''}
    ${c.where ? html`<p class="small muted">${u ? extLink(u, shortUrls(c.where)) : c.where}</p>` : ''}
    ${internalLinks(c.links)}
  </li>`;
}

/** Eventi della striscia: voci da fare ancora aperte (la data efficace non è prima di oggi) fino alla partenza. */
export function deadlineEvents(items, todayIt, start) {
  const open = items.filter((c) => c.status !== 'done' && c.sortDate && (c.endDate || c.sortDate) >= todayIt);
  const inRange = open.filter((c) => !start || c.sortDate <= start);
  const after = open.length - inRange.length;
  const late = items.filter((c) => c.status !== 'done' && c.sortDate && (c.endDate || c.sortDate) < todayIt).length;
  const date = (c) => (c.sortDate < todayIt ? todayIt : c.sortDate);
  // "la prossima" = la prima data dopo oggi (quelle di oggi le segna già il filo "oggi"); se non ce n'è, oggi
  const nToday = inRange.filter((c) => date(c) === todayIt).length;
  const future = inRange.filter((c) => date(c) > todayIt);
  const first = (future.length ? future : inRange).reduce((m, c) => (m == null || date(c) < m ? date(c) : m), null);
  const events = inRange.map((c) => ({ date: date(c), label: c.what, when: deadlineLabel(c), id: c._id, emph: date(c) === first }));
  return { events, after, late, first, nToday: first === todayIt ? 0 : nToday, nFirst: events.filter((e) => e.emph).length };
}

function strip(charts, ev, todayIt, start) {
  const n = ev.events.length;
  const firstTxt = [ev.nToday ? `${ev.nToday} in corso oggi` : '', ev.first ? `la prossima ${fmtDate(ev.first)}${ev.nFirst > 1 ? ` (${ev.nFirst})` : ''}` : ''].filter(Boolean).join(', ');
  const caption = `${n === 1 ? '1 scadenza' : `${n} scadenze`} da fare prima della partenza${firstTxt ? `; ${firstTxt}` : ''}`;
  const extra = [ev.after ? `+${ev.after} dopo la partenza` : '', ev.late ? `${ev.late} in ritardo` : ''].filter(Boolean).join(' · ');
  let chart = '';
  if (n && start && charts && typeof charts.dotTimeline === 'function') {
    try { chart = charts.dotTimeline(ev.events, { from: todayIt, to: start, today: todayIt, caption }); } catch (e) { console.warn('[trasporti] dotTimeline', e); chart = ''; }
  }
  return html`<section class="tr-strip stack" aria-label="Scadenze da oggi alla partenza">
    ${chart || html`<p class="tr-strip__fallback">${caption}.</p>`}
    ${extra ? html`<p class="small muted tr-strip__extra">${extra}</p>` : ''}
  </section>`;
}

function checklist(t, todayIt, start, charts) {
  const items = [...(t.checklist || [])].sort((a, b) => String(a.sortDate || '9999').localeCompare(String(b.sortDate || '9999')))
    .map((c, i) => ({ ...c, _id: `chk-${i + 1}` }));
  if (!items.length) return html`<p class="empty">Nessuna scadenza.</p>`;
  const todo = items.filter((c) => c.status !== 'done');
  const done = items.filter((c) => c.status === 'done');
  const groups = new Map();
  todo.forEach((c) => { const k = monthLabel(c.sortDate); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); });
  return html`${todo.length ? strip(charts, deadlineEvents(items, todayIt, start), todayIt, start) : ''}
  <p class="small muted">${todo.length} da fare · ${done.length} già fatte</p>
  ${[...groups].map(([m, cs]) => html`<section class="stack">
    <h2 class="section-title">${m}</h2>
    <ul class="list card">${cs.map((c) => chkRow(c, todayIt))}</ul>
  </section>`)}
  ${done.length ? html`<details class="card tr-done"><summary class="small">Già fatte (${done.length})</summary>
    <ul class="list">${done.map((c) => chkRow(c, todayIt))}</ul></details>` : ''}`;
}

/** Porta a una card (anche di un'altra tab) e le dà il fuoco. */
function goTo(root, tabs, id, tabId) {
  if (tabId) tabs.show(tabId);
  const el = root.querySelector(`[id="${CSS.escape(id)}"]`);
  if (!el) return false;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
  el.focus({ preventScroll: true });
  return true;
}

export async function render(root, { trip, loadData }) {
  const [t, lodging, charts] = await Promise.all([
    loadData('transport'),
    Promise.resolve(loadData('lodging')).catch(() => null),
    import('./charts.js').catch(() => null),
  ]);
  if (!t) { mount(root, html`<h1 class="h1">Trasporti</h1><p class="empty">Dati dei trasporti non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const todayIt = todayInTokyo('Europe/Rome'); // scadenze di prenotazione = azioni da fare dall'Italia
  const todayJp = todayInTokyo();               // la base "di oggi" è in fuso giapponese
  const start = (trip && trip.start) || '';
  const stays = [...((lodging && lodging.stays) || [])].sort((a, b) => String(a.checkIn).localeCompare(String(b.checkIn)));
  const transferIds = new Set((t.transfers || []).map((x) => x.id));
  mount(root, html`<h1 class="h1">Trasporti</h1><div data-tabs></div>`);
  const todoN = (t.checklist || []).filter((c) => c.status !== 'done').length;
  const wire = () => { if (charts && typeof charts.wire === 'function') queueMicrotask(() => { try { charts.wire(root); } catch (e) { console.warn('[trasporti] wire', e); } }); };
  const tabs = setupTabs(root.querySelector('[data-tabs]'), [
    { id: 'tratte', label: 'Tratte' },
    { id: 'aeroporti', label: 'Aeroporti' },
    { id: 'prenotazioni', label: 'Prenotazioni' },
    { id: 'scadenze', label: 'Scadenze', count: todoN || null },
  ], (id) => {
    if (id === 'tratte') {
      return html`<div class="tr-tratte">${chain(t, stays, rate, todayJp)}
        <div class="stack tr-cards">${byDate(t.legs || [], rate)}${totalChosen(t, rate)}</div></div>`;
    }
    if (id === 'aeroporti') return byDate(t.transfers || [], rate);
    if (id === 'prenotazioni') return guide(t);
    wire();
    return checklist(t, todayIt, start, charts);
  }, { key: 'tr' });

  // catena → card: i transfer stanno nella tab Aeroporti, quindi si cambia tab prima di scorrere
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a.tr-chain__link[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    e.preventDefault();
    if (goTo(root, tabs, id, transferIds.has(id) ? 'aeroporti' : null)) {
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* ignore */ }
    }
  });
  // apertura con #leg-… o #transfer-… (link interni, reload dopo un tap sulla catena)
  const h = decodeURIComponent(location.hash.slice(1));
  if (h && !['tratte', 'aeroporti', 'prenotazioni', 'scadenze'].includes(h)) {
    // tabs.show riscrive l'hash con l'id della tab: si rimette quello della card, come nel click
    requestAnimationFrame(() => {
      if (goTo(root, tabs, h, transferIds.has(h) ? 'aeroporti' : null)) {
        try { history.replaceState(null, '', '#' + h); } catch (err) { /* ignore */ }
      }
    });
  }
}
