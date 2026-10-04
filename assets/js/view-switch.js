// Selettore di vista "Griglia | Giorno" (SPEC §9.2): due bottoni-icona a segmenti, fissi a sinistra della riga delle date.
// La scelta si ricorda in localStorage (agenda-view = grid|day); view-boot.js la legge all'apertura di agenda.html.
import { el, icon } from './agenda-gaps.js';

export const VIEW_KEY = 'agenda-view';
export function saveView(v) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage non disponibile */ }
}

const VIEWS = [
  { v: 'grid', label: 'Vista griglia', icon: 'columns' },
  { v: 'day', label: 'Vista giorno', icon: 'day' },
];

/** active = 'grid' | 'day'; gridHref/dayHref = destinazioni (già con withDataParam). */
export function viewSwitch({ active, gridHref, dayHref }) {
  const href = { grid: gridHref, day: dayHref };
  return el('div', { class: 'view-switch', role: 'group', 'aria-label': "Vista dell'agenda" },
    ...VIEWS.map((x) => el('a', {
      class: `chip view-switch__btn${x.v === active ? ' chip--active' : ''}`, href: href[x.v], 'data-view': x.v,
      'aria-label': x.label, title: x.label, 'aria-current': x.v === active ? 'page' : null,
      onclick: () => saveView(x.v),
    }, icon(x.icon))));
}

/** Aggiorna la destinazione di un segmento (agenda: "Giorno" segue il giorno selezionato nella timeline). */
export function setViewHref(sw, view, href) {
  const a = sw && sw.querySelector(`[data-view="${view}"]`);
  if (a) a.href = href;
}
