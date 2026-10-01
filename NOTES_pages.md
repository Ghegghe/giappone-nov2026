# NOTES_pages — agente content-pages

## File miei
`index.html` `trasporti.html` `alloggi.html` `luoghi.html` `budget.html` · `assets/js/pages.js` (nucleo + dispatcher) +
`pages-home.js` `pages-trasporti.js` `pages-alloggi.js` `pages-luoghi.js` `pages-budget.js` · `assets/css/pages.css` (solo variabili) ·
`dev/fixtures/{transport,lodging,places,budget}.json` · `dev/app.stub.pages.js` · `dev/test-pages.html`.

## Come funziona
- Ogni pagina: head obbligatorio di NOTES_shell §1 + `pages.css`; `<main class="container stack" data-page="..." data-root>`;
  `<script type="module" src="assets/js/pages.js">`. `pages.js` chiama `initShell(page)` e importa dinamicamente `pages-<page>.js`
  (`render(root, {trip, loadData})`).
- HTML sicuro: tagged template `html```` in pages.js, ogni interpolazione passa da `esc()` di app.js; `mount()` è l'unico innerHTML.
  URL esterni solo http(s) (`safeUrl`). Link interni preservano `?data=` (`pageUrl`).
- I tab (trasporti, logistica alloggi) sincronizzano `location.hash` (`#tratte #aeroporti #prenotazioni #scadenze`, `#bagagli #giorno1 #contanti`).
  La home linka `trasporti.html#scadenze`.
- Luoghi: filtri salvati per-viewer in `localStorage['giappone.pages.luoghi']` (try/catch). Default flag Sì+Forse.

## Test
`python3 -m http.server` in `site/` → `dev/test-pages.html?data=dev/fixtures/` (44 asserzioni sul DOM, titolo "OK …" se tutto passa;
`&show=1` mostra i render; `&stub=1` usa `dev/app.stub.pages.js` al posto di app.js tramite import map iniettato).
Verificato con il vero app.js e con lo stub: 44/44. Screenshot controllati a 375 e 1280 (home, trasporti, alloggi, luoghi, budget):
niente scroll orizzontale (scrollWidth = 375).

## Fixture (dev/fixtures) — come le ho ricavate
- Lette da `build_xlsx_v32.py` via `ast` (script NON eseguito): `legs` (tratte + 2 transfer), chiamate `transfer_table(...)` (spiegazioni
  transfer), `pren` (bookingGuide), `chk` (checklist), `cv` + `CHOICES` (places), `g1`, `bag`, `allog`, `comuni`, `cost`; + `mymaps_csv/*.csv`
  (layer e `dayDates` dal numero di giorno nelle note) + `data/trasporti_bagagli.md §3`, `data/carte_contanti.md`, `data/alloggi.md`.
- Tolti telefoni (Mouriya, Torafugutei, Yamato), numeri di prenotazione, carte.
- Correzioni volute (da riportare nell'exporter / `site_overrides.json`):
  1. `pren` riga "Bus KATE": v32 dice ancora "scende a Hankyu Sanban-gai, 8' dal BON" → corretto in UM9 Yodobashi, ~13' (come `g1`/agenda).
  2. `legs` Hida: nota "(ticketless)" rimossa: `pren` (verificato) dice ritiro cartaceo, niente ticketless sulla versione inglese.
  3. `sortDate` dei testi vaghi: "giu"→06-01, "~metà ott"→10-15, "~24 ott"→10-24, "~fine ott"→10-28, "entro fine ott"→10-31,
     "~inizio nov"→11-02, "prima di partire"/"ott-nov"→11-06.
- places: 326 luoghi, 23 senza flag nel dossier (es. Sanmachi Suji) → `flag: ""`; la UI li mostra sotto il chip "Senza flag" (fuori dal default).
  I CSV My Maps NON hanno lat/lon: ho messo coordinate SOLO DI TEST su `fushimi-inari-taisha` e `castello-di-osaka` per provare "Indicazioni".
- lodging: indirizzo noto solo per il BON; per gli altri c'è solo `mapsQuery`. Orari check-in di Country/Glocal/Yasudaya/Yume-no-ya =
  orario di arrivo dell'agenda, non orario ufficiale; check-out mancanti dove ignoti (UI mostra "—").
- Budget: Trasporti €237,20 (somma scelte), Alloggi €725,35, Comuni €883,06 → €2.765,61/pax, €11.062,44 gruppo.

## Schema che uso dove SPEC §2 dice `{...}` (per export-data)
- transport: opzione può avere anche `details` e `bookingNeeded` (dai transfer); leg/transfer possono avere `subtitle`.
- `logistics.luggage = {choice, decided, summary, costNote, url, steps:[{step,when,title,where,details,mapsQuery?}], notes:[]}`
- `logistics.day1 = [{step,title,where,details,cost,open,url?,mapsQuery?}]`
- `logistics.cash` / `logistics.icCard` = `{title, summary, rules:[]}`
- budget: le voci (`categories`/`common`) possono avere `note`.
I renderer accettano campi mancanti (array vuoti, stringhe assenti).

## Dipendenze / richieste agli altri
- sw.js (shell): aggiungere a PRECACHE `index.html trasporti.html alloggi.html luoghi.html budget.html assets/css/pages.css
  assets/js/pages.js assets/js/pages-home.js assets/js/pages-trasporti.js assets/js/pages-alloggi.js assets/js/pages-luoghi.js assets/js/pages-budget.js`.
- Sprite (design): uso `i-pin i-external i-calendar i-check i-clock i-lock i-search i-walk i-chevron-right` + le icone di `trip.sections`. Tutte presenti.
- Topbar desktop (shell/design): a 1280px `.topbar__subtitle` si sovrappone alle voci della nav (si vede in home e luoghi). Non è mio da correggere.
- base.css: `svg {display:block}` del reset → in pages.css forzo `main[data-page] .icon {display:inline-block}`; `.btn:has(> .icon:only-child)`
  trasforma in bottone-icona da 44px anche un bottone con testo nudo + icona → il testo nei miei bottoni va sempre in uno `<span>`.
