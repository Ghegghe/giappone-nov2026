// conto.js — conto.html: riepilogo delle spese anticipate, generato da budget.json › advanced (fonte: site_overrides.json
// › expenses, calcolato dall'exporter). Nessun importo scritto qui: subtotali e totali arrivano già calcolati.
import { loadData, esc } from './app.js';

const num = (n, min = 2, max = 2) => Number(n).toLocaleString('it-IT', { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: 'always' });
const eur = (n) => num(n);
const jpy = (n) => (n ? num(n, 0, 0) : '');
const rate = (x) => (x.rate ? num(x.rate, 2, 3) : 'in EUR');
const dmy = (iso, year = false) => { const [y, m, d] = String(iso).split('-'); return year ? `${d}/${m}/${y}` : `${d}/${m}`; };

function rows(adv) {
  const out = [];
  for (const g of adv.groups || []) {
    out.push(`<tr class="sec"><td colspan="6">${esc(g.name)}</td></tr>`);
    for (const x of (adv.items || []).filter((i) => i.group === g.name)) {
      out.push(`<tr><td>${esc(x.what)}</td><td>${dmy(x.date)}</td><td class="n">${jpy(x.jpy)}</td><td class="n">${rate(x)}</td>`
        + `<td class="n">${eur(x.eur)}</td><td class="n pp">${eur(x.eurPerPerson)}</td></tr>`);
    }
    out.push(`<tr class="sub"><td colspan="4">Subtotale ${esc(g.name.toLowerCase())}</td><td class="n">${eur(g.eurTotal)}</td><td class="n">${eur(g.eurPerPerson)}</td></tr>`);
  }
  out.push(`<tr class="tot"><td colspan="4">Totale (${adv.people} partecipanti)</td><td class="n">${eur(adv.totalEur)}</td><td class="n pp">${eur(adv.totalEurPerPerson)}</td></tr>`);
  return out.join('');
}

async function main() {
  const root = document.querySelector('[data-conto]');
  const [b, trip, lodging] = await Promise.all([loadData('budget'), loadData('trip'), loadData('lodging')]);
  const adv = b && b.advanced;
  if (!adv || !(adv.items || []).length) { root.innerHTML = '<p class="empty">Nessuna spesa anticipata.</p>'; return; }
  const ds = (trip.start || '').split('-')[2], [ye, me, de] = (trip.end || '').split('-');
  const meta = { trip: `Giappone ${Number(ds)}-${Number(de)}/${me}/${ye}`, people: adv.people, date: dmy(adv.asOf, true) };
  // alloggi non ancora pagati (si pagano in loco): esclusi dal conto, detti in nota
  const unpaid = ((lodging && lodging.stays) || []).filter((s) => !s.paid && s.costJpyTotal)
    .map((s) => `${s.name} (¥ ${jpy(s.costJpyTotal)}, contanti in loco)`);
  const implicit = (adv.items || []).filter((x) => x.rateImplicit).map((x) => x.what.split(' · ')[0]);
  root.innerHTML = `
  <div class="top">
    <h1 class="h2">Riepilogo spese anticipate</h1>
    <dl class="meta">
      <dt>Anticipate da</dt><dd>organizzatore del gruppo</dd>
      <dt>Viaggio</dt><dd>${esc(meta.trip)}</dd>
      <dt>Partecipanti</dt><dd>${meta.people}</dd>
      <dt>Data</dt><dd>${meta.date}</dd>
    </dl>
  </div>
  <div class="wrap">
    <table>
      <thead><tr><th>Descrizione</th><th>Data</th><th class="n">JPY</th><th class="n">Cambio ¥/€</th><th class="n">EUR</th><th class="n">EUR a persona</th></tr></thead>
      <tbody>${rows(adv)}</tbody>
    </table>
  </div>
  <p class="foot">Cambio = yen ÷ euro effettivamente spesi; «in EUR» = addebito direttamente in euro.${implicit.length ? ` ${esc(implicit.join(', '))}: addebito in euro verificato.` : ''}
    Importi a persona arrotondati al centesimo; i subtotali a persona sono il subtotale diviso per ${meta.people}.${unpaid.length ? ` Escluso: ${esc(unpaid.join('; '))}.` : ''}</p>`;
}

main();
