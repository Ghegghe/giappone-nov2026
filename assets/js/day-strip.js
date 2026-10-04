// Striscia dei giorni (SPEC §9.2), condivisa da giorno.html e agenda.html.
// Chip "sab 7" per ogni giorno di agenda.json, chip attivo pieno, frecce ← → da 44px, scroll orizzontale interno.
// Modo "days" (giorno.html): le frecce sono link al giorno prima/dopo, disabilitate agli estremi; tasti ← → cambiano giorno.
// Modo "scroll" (agenda.html): le frecce fanno scorrere la striscia, disabilitate a inizio/fine corsa.
import { fmtDate } from './app.js';
import { withDataParam, el, icon } from './agenda-gaps.js';

const shortLabel = (d) => `${d.weekday || fmtDate(d.date).split(' ')[0]} ${Number(d.date.slice(8, 10))}`;
const dayHref = (d) => withDataParam(`giorno.html?d=${d.date}`);

function arrowLink(day, dir) {
  const label = dir < 0 ? 'Giorno precedente' : 'Giorno successivo';
  const a = el('a', { class: 'btn btn--ghost btn--icon day-strip__arrow', 'data-dir': String(dir) }, icon(dir < 0 ? 'chevron-left' : 'chevron-right'));
  if (day) { a.href = dayHref(day); a.setAttribute('aria-label', `${label}: ${fmtDate(day.date)}`); }
  else { a.setAttribute('aria-disabled', 'true'); a.setAttribute('aria-label', label); }
  return a;
}

function arrowButton(dir) {
  return el('button', {
    type: 'button', class: 'btn btn--ghost btn--icon day-strip__arrow', 'data-dir': String(dir),
    'aria-label': dir < 0 ? 'Scorri ai giorni precedenti' : 'Scorri ai giorni successivi',
  }, icon(dir < 0 ? 'chevron-left' : 'chevron-right'));
}

/** Frecce come indicatori di scorrimento su mobile (< 700px): strette, muted, non cliccabili né focusabili (aria-hidden);
 *  quella sinistra sparisce a inizio corsa, la destra a fine corsa (classi is-start/is-end sulla barra). Da 700px restano bottoni.
 *  bar = contenitore con le frecce, list = elemento che scorre, arrows = [prev, next]. */
export function stripHints(bar, list, arrows) {
  const mq = matchMedia('(max-width: 699.98px)');
  bar.classList.add('strip-hints');
  arrows.forEach((a, i) => a.classList.add('strip-hint', i ? 'strip-hint--next' : 'strip-hint--prev'));
  const sync = () => {
    const max = list.scrollWidth - list.clientWidth;
    bar.classList.toggle('is-start', list.scrollLeft <= 1);
    bar.classList.toggle('is-end', list.scrollLeft >= max - 1);
  };
  const mode = () => {
    for (const a of arrows) {
      if (mq.matches) { a.setAttribute('aria-hidden', 'true'); a.setAttribute('tabindex', '-1'); }
      else { a.removeAttribute('aria-hidden'); a.removeAttribute('tabindex'); }
    }
    sync();
  };
  list.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(list);
  if (mq.addEventListener) mq.addEventListener('change', mode);
  mode();
  requestAnimationFrame(sync);
}

/** Porta il chip attivo in vista dentro la striscia (inline nearest, senza muovere la pagina in verticale). */
export function revealActive(strip, smooth = false) {
  const chip = strip && strip.querySelector('.day-strip__chip.chip--active');
  if (!chip) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  chip.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: smooth && !reduce ? 'smooth' : 'auto' });
}

/** Cambia il chip attivo (agenda: segue il giorno selezionato nella timeline). idx < 0 = nessuno. */
export function setActive(strip, idx, smooth = true) {
  if (!strip) return;
  strip.querySelectorAll('.day-strip__chip').forEach((c, i) => {
    c.classList.toggle('chip--active', i === idx);
    if (i === idx) c.setAttribute('aria-current', strip.dataset.mode === 'days' ? 'page' : 'date');
    else c.removeAttribute('aria-current');
  });
  revealActive(strip, smooth);
}

/**
 * Crea la striscia. days = giorni ordinati; active = indice del giorno attivo (-1 nessuno);
 * mode = 'days' (frecce = giorno prima/dopo) | 'scroll' (frecce = scorrimento della striscia).
 */
export function dayStripNav(days, { active = -1, mode = 'days', label = 'Giorni del viaggio' } = {}) {
  const list = el('ol', { class: 'day-strip__list', role: 'list' },
    ...days.map((d, i) => el('li', null, el('a', {
      class: `chip day-strip__chip${i === active ? ' chip--active' : ''}`, href: dayHref(d), 'data-date': d.date,
      'aria-label': [fmtDate(d.date), d.title].filter(Boolean).join(', '),
      'aria-current': i === active ? (mode === 'days' ? 'page' : 'date') : null,
    }, shortLabel(d)))));
  const prev = mode === 'days' ? arrowLink(days[active - 1], -1) : arrowButton(-1);
  const next = mode === 'days' ? arrowLink(active >= 0 ? days[active + 1] : null, 1) : arrowButton(1);
  const nav = el('nav', { class: `day-strip day-strip--${mode}`, 'aria-label': label, 'data-mode': mode }, prev, list, next);
  stripHints(nav, list, [prev, next]);

  if (mode === 'scroll') {
    const sync = () => {
      const max = list.scrollWidth - list.clientWidth;
      prev.disabled = list.scrollLeft <= 1;
      next.disabled = list.scrollLeft >= max - 1;
    };
    const page = (dir) => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      list.scrollBy({ left: dir * Math.max(120, list.clientWidth * 0.8), behavior: reduce ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    list.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(list);
    requestAnimationFrame(sync);
  }
  return nav;
}

/** giorno.html: tasti ← → (senza modificatori, fuori dai campi di testo) aprono il giorno prima/dopo. */
export function bindDayKeys(days, idx) {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    if (t && t.closest && t.closest('.giorno-extras__list')) return;   // nella striscia "se ci capita" le frecce la fanno scorrere
    const to = days[idx + (e.key === 'ArrowLeft' ? -1 : 1)];
    if (!to) return;
    e.preventDefault();
    location.href = dayHref(to);
  });
}
