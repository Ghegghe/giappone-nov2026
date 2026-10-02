// pages-budget.js — budget.html (PLAN_PRESENTAZIONE §2.7): un solo numero grande (a persona) con la barra di composizione
// Pagato / Prezzo noto / Stima, poi le voci in due tabelle con barre a scala comune, poi la spesa per giorno (bullet).
// Tabelle: UNA scala condivisa da tutte le righe delle due tabelle, un solo colore, ancorate a zero; "stima" detta dal badge.
import { fmtDate, fmtJpy } from './app.js';
import { html, mount, fxRate, internalLinks } from './pages.js';
import { stackBar, bulletRows, wire } from './charts.js';

// € con decimali (il budget vuole i centesimi visibili: 725,35)
const eur2 = (n) => {
  const v = Number(n);
  if (n == null || n === '' || !Number.isFinite(v)) return '—';
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  const body = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d === '00' ? '' : ',' + d); // it-IT raggruppa anche 4 cifre
  return (v < 0 ? '-' : '') + '€' + body;
};
const cents = (n) => Math.round((Number(n) || 0) * 100);
const estBadge = (x) => (x.estimate ? html` <span class="badge badge--draft">stima</span>` : '');
const sum = (rows) => rows.reduce((s, r) => s + cents(r.eur), 0) / 100;

function table(rows, rate, max, { caption, totalLabel }) {
  const total = sum(rows);
  return html`<div class="bu-table-wrap"><table class="bu-table">
    <caption class="sr-only">${caption}</caption>
    <thead><tr><th scope="col">Voce</th><th scope="col" class="bu-num">a persona</th></tr></thead>
    <tbody>${rows.map((r) => {
      const v = Number(r.eur) || 0;
      const tip = `${r.name}: ${eur2(v)} a persona${rate ? ` (${fmtJpy(v, rate)})` : ''}${r.estimate ? ', stima' : ''}`;
      return html`<tr title="${tip}">
      <th scope="row">
        <span class="bu-name">${r.name}${estBadge(r)}</span>
        ${r.note || r.detail ? html`<span class="small muted bu-note">${r.note || r.detail}</span>` : ''}
        ${internalLinks(r.links)}
        <span class="bu-bar" aria-hidden="true"><span class="bu-bar__fill" style="--w:${Math.max(1, Math.round(v / max * 100))}%"></span></span>
      </th>
      <td class="bu-num mono">${eur2(v)}${rate ? html`<span class="bu-yen muted small">${fmtJpy(v, rate)}</span>` : ''}</td>
    </tr>`;
    })}</tbody>
    <tfoot><tr><th scope="row">${totalLabel}</th><td class="bu-num mono"><strong>${eur2(total)}</strong>${rate ? html`<span class="bu-yen small">${fmtJpy(total, rate)}</span>` : ''}</td></tr></tfoot>
  </table></div>`;
}

/**
 * Composizione a persona, in centesimi interi (la somma torna al centesimo):
 * pagato = (voli + alloggi già pagati, di gruppo) / persone · stima = Σ voci con estimate · prezzo noto = totale − pagato − stima.
 * L'assicurazione è pagata ma non ha un campo `paid`: resta in "prezzo noto" (PLAN §5). Senza `paidSoFar` → null.
 */
export function composition(b, people) {
  const pp = b.perPerson || {};
  const ps = b.paidSoFar;
  const items = [...(pp.categories || []), ...(pp.common || [])];
  const totC = pp.totalEur != null ? cents(pp.totalEur) : items.reduce((s, r) => s + cents(r.eur), 0);
  if (!ps || !people || !totC) return null;
  const paidC = Math.round((cents(ps.flightsEurGroup) + cents(ps.lodgingEurGroupPaid)) / people);
  const estC = items.filter((r) => r.estimate).reduce((s, r) => s + cents(r.eur), 0);
  const knownC = totC - paidC - estC;
  if (paidC < 0 || knownC < 0) return null;
  return { total: totC / 100, paid: paidC / 100, known: knownC / 100, est: estC / 100 };
}

function pctPair(a, b) {
  const t = a + b || 1;
  const pa = Math.round((a / t) * 100);
  return [pa, 100 - pa];
}

export async function render(root, { trip, loadData }) {
  const b = await loadData('budget');
  if (!b || !b.perPerson) { mount(root, html`<h1 class="h1">Budget</h1><p class="empty">Dati del budget non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const pp = b.perPerson;
  const cats = pp.categories || [];
  const common = pp.common || [];
  const people = (trip && trip.people) || null;
  const totPax = pp.totalEur != null ? pp.totalEur : sum(cats) + sum(common);
  const totGroup = b.group && b.group.totalEur != null ? b.group.totalEur : people ? Math.round(totPax * people * 100) / 100 : null;
  const max = Math.max(1, ...[...cats, ...common].map((r) => Number(r.eur) || 0));
  const ps = b.paidSoFar || {};
  const comp = composition(b, people);
  const subCats = sum(cats), subCommon = sum(common);
  const [pcCats, pcCommon] = pctPair(subCats, subCommon);
  const daily = (b.daily || []).filter((d) => d && d.date);

  mount(root, html`
    <h1 class="h1">Budget</h1>
    <section class="card card--accent stack bu-hero" aria-labelledby="bu-hero-n">
      <div class="bu-hero__head">
        <p class="hero-fig" id="bu-hero-n">${eur2(totPax)}</p>
        <div class="bu-hero__meta">
          <p class="bu-hero__per">a persona${rate ? html` · ${fmtJpy(totPax, rate)}` : ''}</p>
          ${totGroup != null ? html`<p class="small muted">gruppo${people ? ` di ${people} persone` : ''} · ${eur2(totGroup)}</p>` : ''}
        </div>
      </div>
      ${comp ? html`${stackBar([
        { id: 'paid', label: 'Pagato', value: comp.paid },
        { id: 'known', label: 'Prezzo noto', value: comp.known },
        { id: 'est', label: 'Stima', value: comp.est },
      ], { total: comp.total, fx: rate, caption: 'A che punto siamo, a persona' })}
      <p class="small muted bu-hero__note">Pagato: voli e alloggi già saldati.${ps.lodgingEurGroupToPay ? ` Restano ${eur2(ps.lodgingEurGroupToPay)} di alloggi da pagare in struttura (gruppo).` : ''}</p>` : ''}
    </section>
    <div class="bu-layout">
      <div class="stack bu-layout__main">
        <section class="stack">
          <h2 class="section-title">In viaggio · ${eur2(subCats)}${common.length ? ` · ${pcCats}%` : ''}</h2>
          ${table(cats, rate, max, { caption: 'Spese in viaggio per categoria, a persona', totalLabel: 'Totale in viaggio' })}
        </section>
        ${common.length ? html`<section class="stack">
          <h2 class="section-title">Una tantum · ${eur2(subCommon)} · ${pcCommon}%</h2>
          ${table(common, rate, max, { caption: 'Spese una tantum a persona', totalLabel: 'Totale una tantum' })}
        </section>` : ''}
      </div>
      ${daily.length ? html`<section class="stack bu-layout__side">
        <h2 class="section-title">Spesa per giorno · a persona</h2>
        <div class="card bu-daily">
          ${bulletRows(daily.map((d) => ({ date: d.date, value: d.eurAgenda, target: d.eurPlanned })), { caption: 'Costi in agenda e budget previsto, a persona' })}
        </div>
      </section>` : ''}
    </div>
    <section class="card stack small">
      <p class="muted">Le barre delle due tabelle usano la stessa scala.${rate ? html` Cambio usato: <span class="mono">€1 = ¥${rate}</span>${trip.fx.source ? ` (${trip.fx.source}${trip.fx.asOf ? ` ${fmtDate(trip.fx.asOf, { weekday: false, year: true })}` : ''})` : ''}; gli importi in ¥ sono indicativi.` : ''}</p>
      ${(b.notes || []).length ? html`<ul class="al-notes muted">${b.notes.map((n) => html`<li>${n}</li>`)}</ul>` : ''}
    </section>`);
  wire(root);
}
