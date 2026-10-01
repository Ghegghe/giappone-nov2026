# SPEC — Sito "Giappone · 7-24 novembre 2026" (static, GitHub Pages)

Contratto condiviso fra gli agenti. Chi lavora su una parte NON tocca i file delle altre parti:
se serve una modifica a un file altrui, la si scrive in `site/NOTES_<agente>.md` e la integra l'orchestratore.

## 0. Vincoli non negoziabili
- HTML/CSS/JS **puro**, nessun framework, nessun bundler, nessun `npm install`. Deve funzionare servito da GitHub Pages
  (`https://<user>.github.io/<repo>/`) e da un server locale (`python3 -m http.server`). Path **relativi** ovunque
  (mai `/assets/...` con slash iniziale: il sito vive in una sottocartella).
- Lingua: italiano. Date in italiano ("sab 7 nov"). Valuta: € primario con ¥ affiancato, tasso in `trip.json`.
- Mobile-first: deve essere perfetto a 375px, poi crescere. Gutter 16px. Niente scroll orizzontale di pagina.
- Tema chiaro/scuro automatico (`prefers-color-scheme`) + toggle manuale persistito in `localStorage` (try/catch).
- Temi intercambiabili: TUTTI i colori/font sono CSS custom properties definite in `assets/css/themes/<nome>.css`;
  il resto del CSS usa solo le variabili. Tre temi: `washi` (default: carta, indaco, vermiglio), `neutral`
  (app moderna, grigi + un accento), `night` (scuro profondo per lettura notturna). Switch tema nel footer/impostazioni.
- Dati **esclusivamente** da `site/data/*.json`, caricati a runtime con `fetch` (relativo). Nessun dato di viaggio
  hard-coded nell'HTML/JS. Il sito deve poter essere riusato per un altro viaggio cambiando solo i JSON.
- Niente nel sito: numeri di prenotazione, numeri di carta, ricevute/registro acquisti, telefoni personali.
  Indirizzi alloggi SÌ (serve in viaggio) ma solo come testo + link Maps, niente coordinate GPS esplicite in chiaro oltre al link.
- Accessibilità base: contrasto AA, focus visibile, `aria-label` su icone, tap target ≥ 44px.
- Offline: PWA con `manifest.webmanifest` + `sw.js` (cache-first per asset e pagine, network-first con fallback cache per i JSON).

## 1. Struttura file
```
site/
  index.html            home: countdown, "oggi" (se in viaggio), prossime scadenze, link alle sezioni
  agenda.html           calendario 18 giorni (timeline verticale 6-24, colonne giorni su desktop, 1 giorno per schermata su mobile)
  giorno.html           dettaglio giorno (?d=2026-11-07): timeline con note, costi, link Maps, buchi/margini
  trasporti.html        tratte + transfer + "come si prenota / come si ritira" + checklist scadenze
  alloggi.html          6 basi + logistica (bagagli Yamato, giorno 1, contanti/carte IC)
  luoghi.html           cosa vedere: filtri per città/zona/flag (Sì/Forse), ricerca, link Maps, "vicino a me" NO (niente geoloc)
  budget.html           riepilogo costi/pax e gruppo per categoria + spese comuni
  assets/css/base.css   reset, tipografia, layout, componenti (usa SOLO variabili)
  assets/css/themes/washi.css | neutral.css | night.css
  assets/js/app.js      shell comune: nav, tema, loader JSON (con cache in memoria), formattazione €/¥/date, util
  assets/js/agenda.js   rendering timeline + giorno
  assets/js/pages.js    rendering trasporti/alloggi/luoghi/budget/index
  assets/icons/         svg inline o sprite; favicon; icone PWA 192/512 (generate via script, placeholder ok)
  data/                 JSON (vedi §2) — generati da ../export_site_data.py, NON editare a mano
  sw.js  manifest.webmanifest  .nojekyll  README.md
  _styleguide.html      pagina di prova componenti/temi (non linkata nella nav)
```
Nav comune (bottom bar su mobile, top bar su desktop): Home · Agenda · Trasporti · Alloggi · Luoghi · Budget.

## 2. Schemi JSON (contratto dati). Tutti UTF-8, chiavi in inglese, testi in italiano.

### data/trip.json
```json
{ "title": "Giappone · 7-24 novembre 2026", "subtitle": "4 persone · Osaka → Takayama → Nagoya → Numazu/Uchiura → Shuzenji → Tokyo",
  "start": "2026-11-07", "end": "2026-11-24", "people": 4, "fx": { "jpyPerEur": 185, "asOf": "2026-07-10", "source": "BCE" },
  "timezone": "Asia/Tokyo", "mapsLink": "https://www.google.com/maps/d/edit?mid=...",
  "generatedAt": "2026-10-01T20:00:00+02:00", "sourceVersion": "build_xlsx_v32.py",
  "flights": { "out": {"from":"MXP","to":"KIX","date":"2026-11-07","arr":"12:10","note":"scalo"}, "back": {"from":"NRT","to":"MXP","date":"2026-11-24","dep":"16:55"} },
  "sections": [ {"id":"agenda","label":"Agenda","icon":"calendar"}, ... ] }
```

### data/agenda.json
```json
{ "days": [ {
  "date": "2026-11-07", "weekday": "sab", "title": "Arrivo a Osaka", "base": "Osaka", "baseId": "osaka",
  "status": "draft|final",            // "draft" = agenda 2.0 da revisionare
  "notes": "...",
  "items": [ {
     "id": "d07-01", "time": "12:10", "end": "13:15",    // end opzionale; se assente il renderer stima 60' o fino al prossimo item
     "title": "Arrivo KIX, immigrazione, ritiro valigia", "type": "transfer|train|bus|sight|food|nightlife|lodging|logistics|free|fixed|anime|onsen|shopping",
     "fixed": true,                    // vincolo non spostabile (treno prenotato, concerto, check-in)
     "optional": false,                // "(opz.)" nell'agenda
     "costEur": 0, "costNote": "",     // €/pax numerico
     "place": "Kansai Airport T1", "placeId": "kix-t1",  // placeId opzionale → join con places.json
     "mapsQuery": "Kansai International Airport Terminal 1",
     "note": "Visit Japan Web pronto; bancomat Seven Bank in sala arrivi",
     "booking": { "status": "none|todo|done", "where": "", "when": "" }
  } ],
  "gaps": "auto"                       // il renderer calcola i buchi tra items; qui si può forzare una lista
} ] }
```

### data/transport.json
```json
{ "legs": [ { "id":"leg1", "date":"2026-11-11", "from":"Shin-Osaka", "to":"Nagoya", "title":"...",
   "options": [ { "name":"Shinkansen", "duration":"48 min", "costEur":42, "chosen":true, "note":"...",
                  "booking": {"site":"smartEX","url":"https://smart-ex.jp/en/","opens":"2026-10-11","opensNote":"h10 JP = 3:00 IT","howToPay":"...","howToCollect":"..."} } ] } ],
  "transfers": [ ... stessa forma, "kind":"airport" ... ],
  "bookingGuide": [ { "what":"...", "site":"...", "url":"...", "when":"...", "payment":"...", "collect":"...", "notes":"..." } ],
  "checklist": [ { "when":"11 ott 3:00-16:30 IT", "what":"...", "where":"...", "status":"todo|done", "sortDate":"2026-10-11" } ] }
```

### data/lodging.json
```json
{ "stays": [ { "id":"osaka", "city":"Osaka", "area":"Umeda", "name":"BON Condominium Umeda", "type":"apartment",
   "checkIn":"2026-11-07", "checkOut":"2026-11-11", "nights":4, "checkInTime":"16:00", "checkOutTime":"10:00",
   "address":"3-1-4 Nakazakinishi, Kita-ku, Osaka", "mapsQuery":"BON Condominium Umeda", "status":"booked",
   "costEurTotal":318, "paid":true, "notes":["Self check-in con codice via mail","Deposito bagagli self-service"] } ],
  "logistics": { "luggage": {...passi A2...}, "day1": [ {"step":1,"title":"...","where":"...","details":"...","cost":"...","open":"..."} ],
                 "cash": {...}, "icCard": {...} } }
```

### data/places.json
```json
{ "places": [ { "id":"fushimi-inari", "name":"Fushimi Inari", "city":"Kyoto", "area":"Fushimi", "type":"Santuario",
   "flag":"Sì|Forse|No|Futuro", "source":"★|💡", "note":"...", "mapsQuery":"Fushimi Inari Taisha",
   "lat":34.967, "lon":135.772,        // SOLO se presente nei CSV My Maps; altrimenti omettere
   "layer":"Kyoto", "dayDates":["2026-11-08"]  // giorni in cui compare in agenda (join per nome/placeId) } ] }
```

### data/budget.json
```json
{ "perPerson": { "categories": [ {"name":"Trasporti","eur":252,"estimate":false}, ... ], "common": [ {"name":"Voli A/R","eur":806,"estimate":false,"note":"pagati"} ],
   "totalEur": 2756 }, "group": { "totalEur": 11024 }, "paidSoFar": { "lodgingEurGroup": 2901.40 }, "notes": ["..."] }
```

## 3. Rendering agenda (requisiti)
- Scala oraria 6:00-24:00 (estendibile se un item esce). 1 ora = altezza fissa (es. 48px mobile, 56px desktop).
- Blocchi proporzionali alla durata; min-height per leggere il titolo; colore per `type`; bordo tratteggiato se `optional`;
  icona lucchetto se `fixed`. Tap/click → pannello con note, costo, link Maps (`https://www.google.com/maps/search/?api=1&query=<mapsQuery>`).
- **Buchi**: gli spazi vuoti ≥ 45' tra item vanno disegnati come area "libera" con l'orario (es. "15:40-17:00 · libero").
- Desktop: giorni in colonne scorrevoli orizzontalmente (7 visibili), header sticky con data/base. Mobile: un giorno a schermata,
  swipe/frecce, selettore date in alto (chip scorrevoli).
- Badge "bozza" se `status=draft`. Piè giorno: totale €/pax e ¥.
- `giorno.html?d=YYYY-MM-DD`: lista verticale leggibile (non timeline) + pulsanti prev/next + link Maps per item.

## 4. Convenzioni codice
- ES modules (`<script type="module">`), nessuna dipendenza esterna, niente CDN (offline!). Font: system stack + eventuale
  font locale in `assets/fonts/` solo se il design agent lo giustifica (peso ≤ 200KB totali).
- `app.js` esporta: `loadData(name)`, `fmtEur(n)`, `fmtJpy(n, fx)`, `fmtDate(iso)`, `mapsUrl(query)`, `initShell(activeSection)`, `applyTheme()`.
- Ogni pagina: `<main>` con `data-page="agenda"`; `initShell` monta nav e footer da `trip.json.sections`.
- Niente `innerHTML` con dati non escapati: usare funzione `esc()` o `textContent`.
- Commenti brevi in italiano. Nessun file > 600 righe: se cresce, splittare.

## 5. Export dati (export_site_data.py, in radice progetto)
- Legge `build_xlsx_v32.py` via `ast` (NON lo esegue): estrae le assegnazioni letterali `legs`, `agenda`-blocchi, `chk`, `itin`,
  `comuni`, `bag`, `bagopt`, `domande`, `pren`, `g1`, `fonti`, liste Cosa vedere per città, `CHOICES`, `AL_CHOICES`, alloggi.
  Dove un valore non è letterale (f-string, formula), lo segnala in `site/data/_export_report.md` e usa un fallback dichiarato.
- Integra `mymaps_csv/*.csv` (nome, lat, lon, layer) → `places.json` con join per nome normalizzato; i non abbinati finiscono nel report.
- Integra `data/alloggi.md`/`data/ryokan_shuzenji.md` solo se servono campi mancanti (indirizzi), altrimenti li lascia a mano in un
  `site_overrides.json` (in radice progetto) che l'exporter fonde sopra i dati estratti. Gli override sono l'unico posto per correzioni manuali.
- Deterministico, idempotente; `python3 export_site_data.py --check` valida gli schemi (chiavi obbligatorie, date ISO, tipi).
- Eseguibile con il python di sistema (solo stdlib).

## 6. Vocabolario CSS condiviso (per lavorare in parallelo senza vedersi)
Il design agent implementa in `base.css` ESATTAMENTE queste classi; agenda/pages le usano e aggiungono il proprio CSS
in `assets/css/agenda.css` / `assets/css/pages.css` (solo variabili, niente colori hard-coded).
- Layout: `.container` (max 1100px, gutter 16px) · `.stack` (gap verticale) · `.row` (flex, wrap, gap) · `.grid-2` `.grid-3` (responsive)
- Testo: `.h1 .h2 .h3` · `.muted` · `.small` · `.mono` (orari/€)
- Componenti: `.card` (+ `.card--accent`) · `.chip` (+ `.chip--active`) · `.btn` (+ `.btn--primary` `.btn--ghost`) · `.badge` (+ `.badge--fixed` `.badge--draft` `.badge--opt` `.badge--todo` `.badge--done`)
  · `.kv` (dl chiave/valore) · `.list` `.list-item` · `.tabs` `.tab` · `.filter-bar` · `.panel` (bottom-sheet mobile / drawer desktop, con `.panel__close`) · `.toast`
  · `.section-title` · `.empty` (stato vuoto) · `.sr-only`
- Nav/shell (montati da app.js): `.nav` `.nav__item` `.nav__item--active` · `.topbar` · `.footer` · `.theme-switch`
- Agenda: `.timeline` · `.tl-hours` `.tl-hour` · `.tl-day` `.tl-day__header` · `.tl-item` + modificatori per type `.tl-item--train .tl-item--bus .tl-item--transfer .tl-item--sight .tl-item--food .tl-item--nightlife .tl-item--lodging .tl-item--logistics .tl-item--free .tl-item--fixed .tl-item--anime .tl-item--onsen .tl-item--shopping` · `.tl-item--optional` (bordo tratteggiato) · `.tl-gap` · `.tl-now`
- Variabili colore per type: `--c-train --c-bus --c-transfer --c-sight --c-food --c-nightlife --c-lodging --c-logistics --c-free --c-fixed --c-anime --c-onsen --c-shopping` (definite in ogni tema).
- Variabili base: `--bg --bg-elev --fg --fg-muted --accent --accent-2 --border --shadow --radius --font-sans --font-mono --space-1..6 --tl-hour-h`.

## 7. Caricamento dati e fixture
`app.js` → `loadData(name)` fa `fetch(\`${DATA_BASE}${name}.json\`)` dove `DATA_BASE` = valore del query param `?data=` (es. `?data=dev/fixtures/`)
oppure `data/` di default. Ogni agente di pagina crea le proprie fixture realistiche in `site/dev/fixtures/<name>.json`
conformi a §2 per sviluppare prima che l'export sia pronto. Le fixture NON vanno in produzione (il SW non le cacha).
