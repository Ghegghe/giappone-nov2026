// pages-budget.js — budget.html: totali (stat tile), poi voci a persona in due tabelle con barre.
// Barre (guida dataviz): UNA scala condivisa da tutte le righe delle due tabelle (lunghezze confrontabili),
// un solo colore (una serie), ancorate a zero; "stima" detta dal badge testuale, non dal colore.
import { fmtDate, fmtJpy } from './app.js';
import { html, mount, fxRate, internalLinks } from './pages.js';

// € con decimali (il budget vuole i centesimi visibili: 725,35)
const eur2 = (n) => {
  const v = Number(n);
  if (n == null || n === '' || !Number.isFinite(v)) return '—';
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  const body = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d === '00' ? '' : ',' + d); // it-IT raggruppa anche 4 cifre
  return (v < 0 ? '-' : '') + '€' + body;
};
const estBadge = (x) => (x.estimate ? html` <span class="bu-est">stima</span>` : '');
const sum = (rows) => Math.round(rows.reduce((s, r) => s + (Number(r.eur) || 0), 0) * 100) / 100;

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

export async function render(root, { trip, loadData }) {
  const b = await loadData('budget');
  if (!b || !b.perPerson) { mount(root, html`<h1 class="h1">Budget</h1><p class="empty">Dati del budget non disponibili.</p>`); return; }
  const rate = fxRate(trip);
  const pp = b.perPerson;
  const cats = pp.categories || [];
  const common = pp.common || [];
  const people = (trip && trip.people) || null;
  const totPax = pp.totalEur != null ? pp.totalEur : sum(cats) + sum(common);
  const totGroup = b.group && b.group.totalEur != null ? b.group.totalEur : people ? totPax * people : null;
  const estPax = sum([...cats, ...common].filter((c) => c.estimate));
  const max = Math.max(1, ...[...cats, ...common].map((r) => Number(r.eur) || 0));
  const ps = b.paidSoFar || {};
  mount(root, html`
    <h1 class="h1">Budget</h1>
    <section class="bu-kpi">
      <div class="stack bu-kpi__main">
        <p class="muted">A persona</p>
        <p class="h1 mono bu-kpi__n">${eur2(totPax)}</p>
        <p class="small muted">${rate ? html`<span class="mono">${fmtJpy(totPax, rate)}</span>. ` : ''}${estPax ? html`Di cui stime: <span class="mono">${eur2(estPax)}</span>.` : ''}</p>
      </div>
      <div class="stack">
        <p class="muted">Gruppo${people ? `, ${people} persone` : ''}</p>
        <p class="h1 mono bu-kpi__n">${eur2(totGroup)}</p>
        ${ps.lodgingEurGroup != null ? html`<p class="small muted">Alloggi prenotati: <span class="mono">${eur2(ps.lodgingEurGroup)}</span>${ps.lodgingEurGroupToPay ? html`, ancora da pagare <span class="mono">${eur2(ps.lodgingEurGroupToPay)}</span>` : ''}.</p>` : ''}
      </div>
    </section>
    <section class="stack">
      <h2 class="section-title">In viaggio, a persona</h2>
      ${table(cats, rate, max, { caption: 'Spese in viaggio per categoria, a persona', totalLabel: 'Totale in viaggio' })}
    </section>
    ${common.length ? html`<section class="stack">
      <h2 class="section-title">Spese una tantum, a persona</h2>
      ${table(common, rate, max, { caption: 'Spese una tantum a persona', totalLabel: 'Totale una tantum' })}
    </section>` : ''}
    <section class="stack small muted bu-foot">
      <p>Le barre usano la stessa scala nelle due tabelle.${rate ? html` Cambio usato: <span class="mono">€1 = ¥${rate}</span>${trip.fx.source ? `, ${trip.fx.source}${trip.fx.asOf ? ` del ${fmtDate(trip.fx.asOf, { weekday: false, year: true })}` : ''}` : ''}. Gli importi in ¥ sono indicativi.` : ''}</p>
      ${(b.notes || []).length ? html`<ul class="al-notes muted">${b.notes.map((n) => html`<li>${n}</li>`)}</ul>` : ''}
    </section>`);
}
