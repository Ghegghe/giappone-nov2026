# NOTES_shell — contratto della shell (app.js / theme-boot.js / sw.js)

Agente: shell-pwa. File miei: `assets/js/app.js`, `assets/js/theme-boot.js`, `sw.js`, `manifest.webmanifest`,
`.nojekyll`, `robots.txt`, `404.html`, `README.md`, `tools/check_site.py`, `dev/test-shell.html`.

## 1. Snippet `<head>` OBBLIGATORIO in ogni pagina (in quest'ordine)
```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f4efe4">
<meta name="robots" content="noindex, nofollow">   <!-- robots.txt non basta su un project site GitHub Pages -->
<title>Giappone Nov 2026</title>            <!-- initShell lo sovrascrive -->
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="assets/icons/icon-192.png">
<link rel="apple-touch-icon" href="assets/icons/icon-192.png">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" id="theme-css" href="assets/css/themes/washi.css">
<script src="assets/js/theme-boot.js"></script>   <!-- classico, NON module, DOPO #theme-css: evita il flash -->
<!-- eventuali css di pagina: assets/css/agenda.css / pages.css -->
```
- `id="theme-css"` è vincolante: `applyTheme()` e `theme-boot.js` cambiano solo il nome file finale
  (`.../themes/<nome>.css`), quindi il path relativo funziona a qualunque profondità.
- Path sempre relativi (`assets/...`, mai `/assets/...`).

## 2. Body
```html
<body>
  <main class="container stack" data-page="agenda"> ... </main>
  <script type="module">
    import { initShell, loadData } from './assets/js/app.js';
    const trip = await initShell('agenda');      // id della sezione attiva; 'home' per index
    ...
  </script>
</body>
```
- `initShell` crea `.topbar` (prima di `<main>`), `.nav` (dopo `<main>`) e `.footer` (fine body).
  Se la pagina contiene già `<header class="topbar">`, `<nav class="nav">` o `<footer class="footer">` vuoti, li riempie
  invece di crearli. Aggiunge anche un link "Vai al contenuto" (`.sr-only`, visibile al focus) → `<main id="main">`.
- Ritorna `trip` (oggetto di trip.json) oppure `null` se trip.json manca (nav di fallback, nessun crash).

## 3. Attributi su `<html>` (impostati da theme-boot.js / applyTheme)
- `data-theme="washi|neutral|night"`
- `data-theme-mode="auto|light|dark"` → i temi devono rispettarlo così:
  ```css
  :root { /* variabili chiare */ }
  @media (prefers-color-scheme: dark) { :root:not([data-theme-mode="light"]) { /* variabili scure */ } }
  :root[data-theme-mode="dark"] { /* variabili scure */ }
  ```
  (`night` può essere sempre scuro e ignorare il modo.)
- localStorage: `giappone.theme`, `giappone.mode` (sempre in try/catch).
- Dopo il cambio tema, app.js aggiorna `<meta name="theme-color">` leggendo `--bg` calcolata.

## 4. Markup generato (per design-system: stilare queste classi, già in SPEC §6)
- `.topbar` > `a.topbar__title` (+ `span.topbar__subtitle.small.muted`) + `button.theme-switch` (cicla auto→chiaro→scuro,
  `aria-label`, contiene `<svg class="icon"><use href="assets/icons/sprite.svg#i-sun|i-moon|i-auto">`).
- `.nav` > `a.nav__item` (+ `.nav__item--active`, `aria-current="page"`) > `svg.icon` (`#i-<section.icon>`) + `span.nav__label`.
  Home viene aggiunta in testa se `trip.sections` non contiene `id:"home"` (icona `i-home`).
  Href = `section.href` se presente, altrimenti `index.html` per home e `<id>.html` per gli altri.
- `.footer` > `p.small.muted` "generato da … · …" + `div.footer__theme` con due `<select>` (`#theme-select`, `#mode-select`)
  dentro `<label class="small">`.
- `.toast` (append al body, uno alla volta, `role="status"`, eventuale `button.btn.btn--ghost` per "ricarica"); classe `.toast--show` quando visibile.
- `.empty` (`<p class="empty">` o `<div class="empty">`) per stati vuoti/errori.
- Icone richieste allo sprite: `i-home i-calendar i-train i-bed i-pin i-wallet i-sun i-moon i-auto` (+ quelle in trip.sections).

## 5. API di app.js (import da `./assets/js/app.js`)
`DATA_BASE, loadData(name, {target}) , fmtEur, fmtJpy(eur, fx), fmtDate(iso, {weekday, year}), fmtTime, mapsUrl, esc,
initShell, applyTheme(theme, mode), isTripDay(iso, trip), todayInTokyo(tz?)` + helper `toast(msg, opts)`, `showEmpty(el, msg)`.
- `loadData` → Promise dell'oggetto JSON oppure `null` in caso di errore (mostra toast; se passi `{target: el}` scrive anche un `.empty` in `el`).
  Cache in memoria per sessione. `DATA_BASE` = `?data=` (es. `?data=dev/fixtures/`) o `data/`, risolto rispetto alla radice del sito.
- `fmtJpy(eur, fx)` prende un importo in **euro** e `fx` = numero (jpyPerEur) oppure l'oggetto `trip.fx`.
- `todayInTokyo()` accetta l'override `?today=2026-11-09` (per testare la vista "oggi").

## 6. Service worker
- Toast "Aggiornamento disponibile · ricarica" mostrato da app.js quando un SW nuovo prende il controllo (evento `controllerchange`). `?nosw` disattiva la registrazione.
- Precache con lista esplicita in `sw.js` (`PRECACHE`). Se aggiungete un file statico (pagina/css/js), va aggiunto lì
  → scrivetelo nel vostro NOTES, lo integro io/orchestratore. Bumpare `CACHE_VERSION` a ogni deploy.
- `dev/` non è mai cachata. Su `localhost`/`127.0.0.1` il SW usa network-first per tutto (niente pagine stantie in sviluppo).
