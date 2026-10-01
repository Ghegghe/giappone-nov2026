// contrast-check.js — controllo contrasto AA sul DOM renderizzato (agente design).
// Uso (DevTools / MCP): const m = await import('./dev/contrast-check.js'); m.run()
// Per ogni elemento con testo visibile: colore testo vs sfondo effettivo (composizione degli sfondi degli antenati,
// gradienti/immagini ignorati). Soglie WCAG: 4.5:1 normale, 3:1 testo grande (≥24px o ≥18.66px bold).
// Tiene conto dell'opacity degli antenati in modo approssimato (moltiplica l'alfa del testo).

function parse(c) {
  if (!c || c === 'transparent') return [0, 0, 0, 0];
  let m = c.match(/^rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  m = c.match(/^color\(srgb ([^)]+)\)/);
  if (m) {
    const p = m[1].split(/[ /]+/).filter(Boolean).map(Number);
    return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1];
  }
  return null; // formato non gestito (oklab ecc.)
}
const over = (top, bot) => {           // compositing "source over"
  const a = top[3] + bot[3] * (1 - top[3]);
  if (!a) return [0, 0, 0, 0];
  return [0, 1, 2].map((i) => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a);
};
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function bgOf(el) {
  const stack = [];
  for (let e = el; e; e = e.parentElement) {
    const c = parse(getComputedStyle(e).backgroundColor);
    if (c && c[3] > 0) stack.push(c);
    if (c && c[3] >= 1) break;
  }
  let bg = parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1];
  if (bg[3] < 1) bg = over(bg, [255, 255, 255, 1]);
  for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
  return bg;
}
function opacityOf(el) { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; }

export function run(root = document.body) {
  const out = []; const seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.textContent.trim() ? 1 : 2 });
  let n;
  while ((n = walker.nextNode())) {
    const el = n.parentElement;
    if (!el || seen.has(el)) continue; seen.add(el);
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden],[inert],.sr-only,[aria-hidden="true"]')) continue;
    if (el.closest('.panel') && !el.closest('.panel.is-open')) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el);
    const col = over([fg[0], fg[1], fg[2], fg[3] * opacityOf(el)], bg);
    const k = ratio(col, bg);
    const px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
    if (k < need) out.push({ text: n.textContent.trim().slice(0, 40), cls: el.className && String(el.className).slice(0, 50), tag: el.tagName, ratio: +k.toFixed(2), need });
  }
  const theme = document.documentElement.dataset.theme + '/' + document.documentElement.dataset.themeMode;
  return { theme, page: location.pathname, checked: seen.size, fails: out.slice(0, 40), failCount: out.length };
}
