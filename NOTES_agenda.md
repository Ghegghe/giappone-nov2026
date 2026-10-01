# NOTES_agenda — agente agenda-ui

## File miei
`agenda.html`, `giorno.html`, `assets/js/agenda.js` (timeline + pannello), `assets/js/agenda-day.js` (giorno.html),
`assets/js/agenda-gaps.js` (calcoli puri + helper DOM `el`/`icon`), `assets/css/agenda.css`,
`dev/fixtures/agenda.json`, `dev/fixtures/trip.json`, `dev/app.stub.js`, `dev/test-agenda.html`.

## Contratto usato
- **DOM della timeline = quello documentato in `base.css` §7** (design-system): `.timeline` è lo scroller
  (figli: `.tl-hours` con `.tl-hour` alte 1h, poi `.tl-day`); `.tl-item`/`.tl-gap`/`.tl-now` figli diretti di `.tl-day`
  con `--top`/`--h` in px dall'inizio scala (base.css aggiunge `--tl-head-h`), colonne interne `--i`/`--n`.
  JS imposta inline su `.timeline`: `--tl-span` (ore, se un item esce da 6-24) e `--tl-max-h` (viewport − topbar − bottom nav).
- `agenda.css` sovrascrive solo: `--tl-head-h` (3 righe: data+bozza · base · titolo), `--tl-foot-h` + `.tl-day__foot`
  (totale €/pax · ¥ del giorno), desktop ≥900px `grid-auto-columns` = 1/7 della larghezza (min `--tl-col-min`).
- Pannello: `.panel` + `.is-open` (base.css), `inert`/`aria-hidden` quando chiuso; `.agenda-overlay` trasparente solo
  per il click-fuori (l'oscuramento lo fa base.css col box-shadow). Chiusura: `.panel__close`, Esc, click fuori; focus trap e ritorno focus.
- Oggi: `aria-current="date"` su `.tl-day` (stile base.css); giorno selezionato: `.tl-day--selected`.
- Icone sprite: `i-lock`, `i-map-pin`, `i-close`, `i-info`.
- app.js: `loadData` (null su errore), `fmtEur`, `fmtJpy(eur, fx)`, `fmtDate`, `mapsUrl`, `initShell`. Testi via `textContent` (helper `el`), mai innerHTML.
- Test "oggi": `?today=2026-11-14` (come app.js) oppure `?now=2026-11-14T15:10` (fissa anche l'ora → linea `.tl-now`).
- I link interni mantengono `?data=` (fixture) — `withDataParam()`.
- Regole: fine mancante = fino all'item successivo, min 30', max 90' (ultimo: 60'), segnata "*" in giorno.html.
  Buchi ≥45' tra item (intervalli uniti) + margine iniziale da 6:00 e finale fino a 24:00. Totale giorno = somma `costEur`
  di tutti gli item (anche opzionali, indicati a parte). Filtri "Solo fissi"/"Nascondi opzionali" ri-calcolano layout e buchi;
  stato in localStorage `agenda.filters` (try/catch).

## Fixture
Generate leggendo con `ast` (senza eseguirlo) la lista `agenda` di `build_xlsx_v32.py`: 18 giorni, 127 item, tutti `status:"draft"`
(agenda in revisione dal 1 ott). Mappatura tipi: trasf→train/bus/transfer (da titolo), logist→logistics, alloggio→lodging,
CONCERTO→fixed, "—"→free, tempio/quartiere/vista/…→sight. `fixed` = PRENOTATO/PRENOTARE/smartEX/e5489/concerto;
alcuni `end` presi dalle note (arrivi treni/bus). 21 nov "—" → item free 10:00-19:00. `mapsQuery` approssimati (fixture).

## Sviluppo locale
`cd site && python3 -m http.server 8765` → `agenda.html?data=dev/fixtures/`, `giorno.html?d=2026-11-12&data=dev/fixtures/`,
test: `dev/test-agenda.html` (31 test: calcoli + DOM in iframe 375px; tutti OK il 1 ott). Il vero `app.js` esiste già:
`dev/app.stub.js` serve solo se app.js manca/è rotto (stesse firme); per usarlo, in una copia locale sostituire l'import
`./app.js` con `../../dev/app.stub.js` — non committare.

## Per gli altri agenti / orchestratore
1. **design-system (bug base.css riga ~142)**: `.btn:has(> .icon:only-child)` scatta anche con icona + testo nudo
   (`:only-child` ignora i nodi di testo) → il bottone diventa 44px quadrato. Io avvolgo il testo in `<span>`; suggerito
   `.btn--icon` esplicito oppure `:has(> .icon:only-child):not(:has(> span))` e documentarlo.
2. **shell/design**: a 1280px nella topbar il sottotitolo (`.topbar__subtitle`) si sovrappone alla nav desktop.
3. `sw.js`: OK, PRECACHE contiene già agenda.html, giorno.html, agenda.css e i 3 js.
4. Tap target: blocchi brevi (30' ≈ 24px a 48px/h) sono sotto i 44px di altezza (larghi però tutta la colonna su mobile);
   alternativa accessibile = `giorno.html` (lista), linkato dalla data in header e dal pannello.
