// pages-budget.js — budget.html: categorie €/pax con ¥, spese comuni, totali persona/gruppo, barre CSS.
import { fmtDate, fmtJpy } from './app.js';
import { html, mount, fxRate } from './pages.js';

// € con decimali (il budget vuole i centesimi visibili: 725,35)
const eur2 = (n) => {
  const v = Number(n);
  if (n == null || n === '' || !Number.isFinite(v)) return '—';
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  const body = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d === '00' ? '' : ',' + d); // it-IT raggruppa anche 4 cifre
  return (v < 0 ? '-' : '') + '€' + body;
};
const estBadge = (x) => (x.estimate ? html` <span class="badge badge--draft">stima</span>` : '');

function table(rows, rate, { caption, totalLabel, total }) {
  const max = Math.max(...rows.map((r) => Number(r.eur) || 0), 1);
  return html`<div class="bu-table-wrap"><table class="bu-table">
    <caption class="sr-only">${caption}</caption>
    <thead><tr><th scope="col">Voce</th><th scope="col" class="bu-num">€/pax${rate ? html`<span class="bu-yen">¥/pax</span>` : ''}</th></tr></thead>
    <tbody>${rows.map((r) => html`<tr>
      <th scope="row">
        <span class="bu-name">${r.name}${estBadge(r)}</span>
        ${r.note || r.detail ? html`<span class="small muted bu-note">${r.note || r.detail}</span>` : ''}
        <span class="bu-bar" aria-hidden="true"><span class="bu-bar__fill${r.estimate ? ' bu-bar__fill--est' : ''}" style="--w:${Math.max(1, Math.round((Number(r.eur) || 0) / max * 100))}%"></span></span>
      </th>
      <td class="bu-num mono">${eur2(r.eur)}${rate ? html`<span class="bu-yen muted small">${fmtJpy(r.eur, rate)}</span>` : ''}</td>
    </tr>`)}</tbody>
    ${total != null ? html`<tfoot><tr><th scope="row">${totalLabel}</th><td class="bu-num mono"><strong>${eur2(total)}</strong>${rate ? html`<span class="bu-yen small">${fmtJpy(total, rate)}</span>` : ''}</td></tr></tfoot>` : ''}
  </table></div>`;
}

export async function render(root, { trip, loadData }) {
  const b = await loadData('budget');
  if (!b || !b.perPerson) { mount(root, html`<h1 class="h1">Budget</h1><p class="empty">Dati budget non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const pp = b.perPerson;
  const cats = pp.categories || [];
  const common = pp.common || [];
  const people = (trip && trip.people) || null;
  const totPax = pp.totalEur != null ? pp.totalEur : cats.reduce((s, c) => s + (Number(c.eur) || 0), 0);
  const totGroup = b.group && b.group.totalEur != null ? b.group.totalEur : people ? totPax * people : null;
  const estPax = cats.filter((c) => c.estimate).reduce((s, c) => s + (Number(c.eur) || 0), 0);
  const comTot = common.reduce((s, c) => s + (Number(c.eur) || 0), 0);
  mount(root, html`
    <h1 class="h1">Budget</h1>
    <section class="grid-2 bu-kpi">
      <div class="card card--accent stack">
        <p class="small muted">Totale a persona</p>
        <p class="h1 mono bu-kpi__n">${eur2(totPax)}</p>
        ${rate ? html`<p class="mono muted">${fmtJpy(totPax, rate)}</p>` : ''}
        ${estPax ? html`<p class="small muted">di cui stime: <span class="mono">${eur2(estPax)}</span></p>` : ''}
      </div>
      <div class="card stack">
        <p class="small muted">Totale gruppo${people ? ` (${people} persone)` : ''}</p>
        <p class="h1 mono bu-kpi__n">${eur2(totGroup)}</p>
        ${rate && totGroup != null ? html`<p class="mono muted">${fmtJpy(totGroup, rate)}</p>` : ''}
        ${b.paidSoFar && b.paidSoFar.lodgingEurGroup != null ? html`<p class="small muted">Alloggi prenotati (gruppo): <span class="mono">${eur2(b.paidSoFar.lodgingEurGroup)}</span>${b.paidSoFar.lodgingEurGroupToPay ? html` · ancora da pagare <span class="mono">${eur2(b.paidSoFar.lodgingEurGroupToPay)}</span>` : ''}</p>` : ''}
      </div>
    </section>
    <section class="stack">
      <h2 class="section-title">Per categoria · a persona</h2>
      ${table(cats, rate, { caption: 'Spese per categoria, euro e yen a persona', totalLabel: 'Totale / persona', total: totPax })}
    </section>
    ${common.length ? html`<section class="stack">
      <h2 class="section-title">Spese comuni · a persona</h2>
      ${table(common, rate, { caption: 'Spese comuni una tantum a persona', totalLabel: 'Totale spese comuni', total: comTot })}
    </section>` : ''}
    <section class="card stack small">
      ${rate ? html`<p>Tasso parametrico: <span class="mono">€1 = ¥${rate}</span>${trip.fx.source ? ` · ${trip.fx.source}` : ''}${trip.fx.asOf ? ` ${fmtDate(trip.fx.asOf, { weekday: false, year: true })}` : ''}. Gli importi in ¥ sono conversioni indicative.</p>` : ''}
      ${(b.notes || []).length ? html`<ul class="al-notes muted">${b.notes.map((n) => html`<li>${n}</li>`)}</ul>` : ''}
    </section>`);
}
