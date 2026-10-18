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

## 9. Estensioni del 4 ott 2026 — piano definitivo, foto e "se ci capita"
Decise con il cliente durante la revisione dell'agenda (vedi `../data/piano/agenda_definitiva.md`). Tutti i campi nuovi sono OPZIONALI:
il renderer deve funzionare identico se mancano.

### 9.1 `data/agenda.json` — campi aggiunti
```json
{ "days": [ {
  "summary": "2 frasi sul senso della giornata (dal piano definitivo).",
  "status": "draft|final",             // final = blocco confermato dal cliente
  "items": [ {
     "nick": "I torii rossi con le scale",          // titolo 'come lo direbbe il cliente'; se presente è il titolo grande, title va sotto
     "image": { "url": "https://upload.wikimedia.org/...960px-....jpg", "credit": "Autore · CC BY-SA 4.0 · Wikimedia Commons",
                "page": "https://commons.wikimedia.org/wiki/File:...", "alt": "..." }
  } ],
  "extras": [ {                        // "Se ci capita, nei dintorni": luoghi vicini NON in scaletta, ordinati per verdict
     "id": "shirakawa-gion", "nick": "Il canaletto con i salici", "name": "Shirakawa (Gion)", "type": "vista",
     "verdict": "top|consigliato|opzionale|sconsigliato", "duration": "20'-30'", "costEur": 0, "costNote": "",
     "mapsQuery": "Shirakawa Gion Kyoto", "image": { "url": "...", "credit": "...", "page": "..." }
  } ]
} ] }
```
Sorgente: `../data/piano/catalogo/scaletta/<B>.json` (giorni, items con `placeId`, `extras`) + `../data/piano/catalogo/data/<B>.json`
(luoghi con foto). L'exporter fonde i blocchi con `status: "confermata"` sopra l'agenda del build (le date del blocco vengono
SOSTITUITE); con `--scaletta-proposte` include anche i blocchi `proposta` (solo per sviluppo locale, mai per il deploy).
Mappa `kind`→`type`: transfer→transfer (train/bus se il titolo contiene treno/Shinkansen/Hankyu/JR/Keihan/metro → train; bus/KATE/Limousine → bus) ·
meal→food · free→free · place→ dal `type` del catalogo: tempio/cultura/vista/natura/museo/gita→sight · food/mercato→food ·
bar/nightlife→nightlife · anime→anime · shopping→shopping · onsen→onsen. `optional` passa. Id item: `dGG-NN`.
Foto: solo Wikimedia Commons, credit obbligatorio e visibile (licenze CC BY / CC BY-SA). `referrerpolicy="no-referrer"`, lazy.
Precisazioni dell'exporter (4 ott): `items[].placeId` resta l'id di `places.json` (il luogo del catalogo viene abbinato per nome/mapsQuery;
se non c'è corrispondenza l'item non ha `placeId`, ma ha comunque `nick`/`image`/`mapsQuery`) · `extras[].type` = tipo grezzo del catalogo
(tempio/vista/…) · `image.alt` = `nick` · `booking` = none salvo match con la checklist (es. Mouriya → todo) · `budgetEur` = `costEur` del
giorno di scaletta, `notes` vuoto, `moves` assente, `dayTrip` dedotto dalle zone dei luoghi · item `place` senza `costEur` → costo del catalogo.

### 9.2 UI — accesso ai giorni e pagina giorno
- **Striscia dei giorni** (componente condiviso `assets/js/day-strip.js` + CSS): chip con data breve per tutti i 18 giorni, chip attivo
  evidenziato, frecce ← → (tap ≥44px), scroll orizzontale, sticky sotto la topbar. Presente in `giorno.html` (sopra il contenuto) e in
  `agenda.html` (in testa: ogni chip apre direttamente `giorno.html?d=`). Tasti ← → cambiano giorno in `giorno.html`.
- **Agenda**: l'intestazione di ogni giorno è un link completo al giorno con affordance esplicita ("Apri il giorno →"), non solo i singoli item.
- **Home**: card principale "Prossimo giorno" (prima del viaggio = giorno 1; in viaggio = oggi) che apre `giorno.html`.
- **Pagina giorno**: `summary` sotto il titolo; item con `image` → card con foto 4:3 a sinistra (112px mobile / 168px desktop), `nick`
  grande e `title` piccolo, credit piccolo; item senza foto → riga come oggi. In fondo: sezione "Se ci capita, nei dintorni" = striscia
  orizzontale di mini-card (foto 4:3 ~160px, nick, name, chip verdict, durata, link Maps) se `extras` non è vuoto.
- **Selettore di vista** (`assets/js/view-switch.js` + `assets/js/view-boot.js`): due bottoni-icona a segmenti "Vista griglia" /
  "Vista giorno" (solo icona, `aria-label` + `title`, 44×40, attivo come i chip), FISSI a sinistra della riga delle date, nessuno spazio
  verticale in più: in `agenda.html` prima della freccia ‹ del selettore storico, in `giorno.html` prima della freccia ‹ della striscia.
  Agenda: "Giorno" → `giorno.html?d=<giorno selezionato nella timeline>`. Giorno: "Griglia" → `agenda.html?view=grid#<data>`.
  La scelta si salva in localStorage `agenda-view` = `grid|day` (try/catch). `view-boot.js` (classico, nell'`<head>` di agenda.html):
  se la preferenza è `day` e l'URL non ha né `#data` né `?view=grid`, `location.replace` su `giorno.html` (che sceglie oggi in viaggio,
  altrimenti il primo giorno, e scrive `?d=` nell'URL). Il link "Agenda" della nav resta `agenda.html`.
- Nessun dato hard-coded; tutto da JSON. Deploy SOLO su richiesta del cliente (bump `CACHE_VERSION`).

## 10. Pagina GUIDE (5 ott 2026) — tutorial pratici per il viaggio
Richiesta del cliente: "una pagina di guide locali, come dei tutorial che spiegano nel dettaglio una cosa utile per il viaggio"
(es. come orientarsi fra i localini di Tenma e le vie parallele all'arcata coperta; come funzionano izakaya e tachinomi; bere; mangiare...).

### 10.1 Sorgente: `data/guide/<slug>.md` (mantenuti a mano, in italiano)
Frontmatter YAML minimale + corpo Markdown (sottoinsieme: `#`/`##`/`###`, paragrafi, liste `-`/`1.`, **grassetto**, *corsivo*, link
`[testo](url)`, tabelle `|`, citazioni `>`, blocchi `<svg>…</svg>` o `<figure>…</figure>` inline passati così come sono, separatore `---`).
```
---
title: Orientarsi a Tenma di sera
icon: compass            # nome icona dello sprite del sito (compass, beer, food, train, yen, onsen, torii, phone, bag, map, info…)
summary: Una frase per la card dell'indice.
order: 10                # ordine nell'indice
tags: [osaka, sera, bere]
places: [tenma-uosho, tenma-mame]   # opzionale: id del catalogo citati → il renderer aggiunge i link Maps in fondo
updated: 2026-10-05
---
corpo markdown…
```
- **Galleria scorrevole** (18 ott 2026; anche nelle schede §12): UN blocco su una sola riga o su righe consecutive SENZA righe
  vuote, 2-5 foto, credit obbligatorio in ogni didascalia; la didascalia finale è opzionale. I `<figure>` annidati sono ammessi
  (il blocco finisce al `</figure>` esterno):
  `<figure class="g-gallery"><div class="g-gallery__track"><figure class="g-gallery__item"><img src="https://…" alt="…" loading="lazy"><figcaption>Foto: X, sito ufficiale · <a href="https://…">fonte</a></figcaption></figure> …</div><figcaption>didascalia opzionale</figcaption></figure>`
  L'exporter aggiunge alla striscia `tabindex="0" role="region" aria-label="…"` (scorrimento da tastiera). UI in `guide.css`:
  striscia con scroll-snap orizzontale (solo la striscia scorre, mai la pagina), foto 4:3 `object-fit: cover`, ~80% della colonna
  su mobile, ~45% da 720px.

### 10.2 Dati: `site/data/guides.json` (generato dall'exporter, step `build_guides`)
```json
{ "guides": [ { "id": "tenma-sera", "title": "...", "icon": "compass", "summary": "...", "order": 10, "tags": ["osaka"],
  "updated": "2026-10-05", "html": "<h2>…</h2><p>…</p>",  // markdown convertito in HTML sanificato dall'exporter (nessuna lib esterna)
  "places": [ { "id": "tenma-uosho", "nick": "…", "name": "…", "mapsQuery": "…" } ] } ] }
```
L'exporter converte il markdown con un convertitore proprio (sottoinsieme sopra), escapa l'HTML tranne i blocchi `<svg>`/`<figure>`
che devono essere sicuri (niente script/eventi); `places` risolti dai cataloghi `data/piano/catalogo/data/*.json` quando esistono.
- Foto: come le schede §12 ma in `site/assets/img/guide/<guideId>-<sha1(url)[:8]>.webp`, lato lungo **800**, WebP **q65**:
  con `--fetch-images` si scaricano, senza flag si riusano i file presenti, altrimenti resta l'URL remoto (report
  `_export_report.md` › «Guide» › «Foto senza copia locale»). L'URL remoto resta nella sorgente.
- Offline: ogni foto locale delle guide va elencata A MANO in `sw.js` PRECACHE (come quelle delle schede); `tools/check_site.py`
  dà errore se una foto usata in `guides.json` manca o non è in PRECACHE, e avvisa dei file orfani della cartella.

### 10.3 UI: `site/guide.html`
- Indice: card per guida (icona, titolo, summary, tag), ordinate per `order`, filtro per tag (chip). `?g=<id>` o `#<id>` apre la guida.
- Guida: titolo, "aggiornata il", corpo HTML con stile di lettura (max 70ch, tabelle scrollabili, SVG responsive `max-width:100%`),
  in fondo "Luoghi citati" con link Maps, e nav prev/next fra guide. Torna all'indice.
- Nav: voce **Guide** (icona libro) in tutte le pagine. Su mobile la bottom bar passa a 7 voci: ridurre padding/etichette (font 10-11px)
  o nascondere le etichette sotto 360px; MAI scroll orizzontale della barra. Aggiornare `sw.js` PRECACHE (+ bump versione al deploy).
- Nessun contenuto hard-coded: tutto da `guides.json`.

## 11. Numeri calcolati e fonte unica (13 ott 2026)
Richiesta del cliente: una modifica che si ripercuote su altre pagine deve propagarsi da sola, senza contraddizioni.
Dettaglio e mappa completa: `site/NOTES_dati.md`. Codice: `../export_site_costs.py` (chiamato come ULTIMO passo dell'export).
- **Fonti**: cambio = `trip.fx.jpyPerEur` (parametro unico, da `site_overrides.json › trip.fx`) · spese già pagate =
  `site_overrides.json › expenses.items` ({id, group, what, date, jpy?, rate?, eur?, ref}; ref `lodging:<id>` |
  `transport:<optionId>` | `common:<id>`) · prezzi da pagare in ¥ = `costJpy` (a testa, opzioni e voci comuni),
  `costJpyTotal` (alloggi), `extraJpy` (supplemento in loco di una tratta pagata).
- **Calcolati dall'exporter** (mai scritti a mano): `lodging.stays[].costEurTotal/costEurPerPerson/paid`, `options[].costEur`
  (+ `costSource: paid|jpy`, `dep`/`arr` per le scelte), `transport.totalChosenEur`, `costEur` delle tappe di agenda agganciate
  a una tratta scelta (`transportOptionId`; aggancio = stessa data + `agendaKey` dell'opzione nel titolo), budget «Trasporti»
  e «Alloggi», voci comuni con ref/costJpy, totali a persona e gruppo, `paidSoFar` (+ `advancedEurGroup`), `daily`,
  `budget.advanced` (conto rimborsi → `conto.html` via `assets/js/conto.js`). I giorni `final` non hanno `budgetEur`.
- **Coerenza**: `python3 export_site_data.py --check` esce con 1 se orari/costi delle tratte scelte ≠ tappe dell'agenda,
  durate ≠ orari, ¥ nei testi ≠ costJpy, check-in/out nei testi o nelle tappe ≠ alloggio, notti/basi ≠ date, totali ≠ somme.
  Gli avvisi (giorni in bozza) vanno solo nel report (`_export_report.md` › «Coerenza dei dati»).

## 12. Schede dei locali (18 ott 2026) — `luogo.html?id=<placeId>`
Richiesta del cliente: una pagina per locale da usare SUL POSTO (prima istanza Mouriya Sannomiya, pranzo dell'8 nov: menu in
italiano con le carni spiegate, cosa ordinare, frasi da mostrare al cuoco). Riusabile per fugu, cene kaiseki dei ryokan, cena di compleanno.

### 12.1 Sorgente: `data/luoghi/<placeId>.md` (a mano, in italiano)
Stesso formato e stesso sottoinsieme Markdown delle guide (§10.1), con lo stesso convertitore e la stessa sanificazione.
```
---
title: Mouriya Sannomiya, il pranzo di manzo di Kobe
placeId: mouriya-sannomiya      # = id di places.json / del catalogo (default: nome del file)
summary: Una frase per l'elenco delle schede e la testata.
updated: 2026-10-18
dates: [2026-11-08]             # opzionale: si aggiungono da sole le date delle tappe di agenda con lo stesso placeId
tags: [kobe, ristorante]        # opzionale
address: 1-9-9 Kitanagasa-dori, …   # opzionale, testo in testata
access: 5' a piedi da JR Sannomiya  # opzionale, testo in testata
mapsQuery: …                    # opzionale: se manca → catalogo → places.json
---
corpo markdown…
```
- Foto: blocchi `<figure><img src="https://…" alt="…"><figcaption>credit</figcaption></figure>`. Credit obbligatorio nella didascalia
  (le foto ufficiali del locale si citano come «Foto: <locale>, sito ufficiale»). L'URL remoto resta nella sorgente.
- Galleria scorrevole di più foto: stesso markup `figure.g-gallery` delle guide (§10.1), foto in `assets/img/luoghi/` come sopra.
- Frasi da mostrare: `<figure class="l-phrase"><p class="l-phrase__ja" lang="ja">…</p><p class="l-phrase__ro">romaji</p>
  <figcaption><span lang="en">English</span> · Italiano</figcaption></figure>` (la pagina le ingrandisce a tutto schermo al tocco).
- Riquadri «in breve / attenzione»: citazione `>`. Dati non verificati marcati come nelle guide («da verificare», «stima», sezione finale).

### 12.2 Dati: `site/data/place-details.json` (exporter, `export_site_places.py`, chiamato da `export_site_data.py`)
```json
{ "details": [ { "id": "mouriya-sannomiya", "placeId": "mouriya-sannomiya", "title": "…", "name": "Mouriya Sannomiya",
  "summary": "…", "updated": "2026-10-18", "tags": ["kobe"], "dates": ["2026-11-08"], "address": "…", "access": "…",
  "mapsQuery": "Mouriya Sannomiya",
  "visits": [ { "date": "2026-11-08", "time": "13:00", "end": "14:20", "itemId": "d08-05", "title": "Pranzo di manzo di Kobe" } ],
  "html": "<figure><img src=\"assets/img/luoghi/mouriya-sannomiya-56828ac9.webp\" …>…" } ] }
```
- `visits` = tappe dell'agenda con lo stesso `placeId` (join al momento dell'export: se cambia l'orario in scaletta, la scheda segue).
- Foto: con `--fetch-images` ogni `<img src="https://…">` del corpo è scaricato in `site/assets/img/luoghi/<placeId>-<sha1(url)[:8]>.webp`
  (lato lungo 960, WebP q72) e `src` diventa il path locale; senza flag si riusano i file già presenti, altrimenti resta l'URL remoto
  (segnalato nel report e da `check_site.py`). Report: `_export_report.md` › «Schede dei luoghi». `--check` valida anche questo file.
- Ordine: per prima data, poi id. Il file è facoltativo per le altre pagine (nessun toast se manca: `loadData(name, {quiet: true})`).

### 12.3 UI
- `luogo.html?id=<placeId>` (`assets/js/pages-luogo.js` + `assets/css/luogo.css`, sopra `guide.css`): «Indietro» (torna alla pagina
  di provenienza, altrimenti Luoghi), titolo, summary, «Aggiornata il», indirizzo e come arrivare (`.kv`), chip delle tappe in agenda
  (→ `giorno.html?d=…#<itemId>`), bottone Maps, corpo `.prose` (tabelle scorrevoli nel loro contenitore, mai la pagina, anche a 360px).
  Senza `id` o con id sconosciuto: elenco delle schede. Nav: evidenzia **Luoghi** (`data-section="luoghi"`); NESSUNA voce nuova nella barra.
- Collegamenti (join per `placeId`, lato codice, `assets/js/place-details.js`): pulsante «Scheda» (icona libro) nella tappa di
  `giorno.html`, nel pannello della tappa in `agenda.html` e nella riga del luogo in `luoghi.html`, solo se esiste la scheda.
- Offline: `luogo.html`, i JS/CSS e le foto delle schede sono in `sw.js` PRECACHE; `place-details` in `DATA_FILES`.

## 13. Tappe «linea guida» con alternative (18 ott 2026)
Richiesta del cliente: ristoranti e bar dell'agenda NON sono una scelta fissa ma una linea guida; per la tappa si vede il
locale consigliato e le alternative, ognuna con una breve presentazione, per decidere sul posto.

### 13.1 Sorgente (`../data/piano/catalogo/`)
- Scaletta `scaletta/<B>.json`, items di kind `meal`/`free`/`place`: `placeId` = consigliato (o scelto) · `alternatives` = array di
  id del catalogo (2-3) in ordine di preferenza · `flex: true` = «linea guida, si sceglie sul posto» (facoltativo).
  Nei `free` senza `placeId` le alternative sono idee alla pari (nessuna «consigliata»).
- Catalogo `data/<B>.json`: i luoghi usano i campi di sempre (nick, name, whyUs, what, costEur/costNote, hoursNov, closedOn,
  image, mapsQuery) + voto facoltativo `rating: {source, value, reviews?, awards?}`; se manca, l'exporter usa il blocco
  `tabelog: {score, reviews, awards}` come `{source: "Tabelog", value: score, …}`.

### 13.2 Dati: `items[].options` e `items[].flex` in `site/data/agenda.json`
```json
{ "id": "d13-11", "title": "1° giro: …", "placeId": "…", "flex": true,
  "options": [ { "id": "daijin-honten",            // id del catalogo (foto locale assets/img/places/<id>.webp)
                 "placeId": "…",                     // opzionale: id di places.json (pulsante «Scheda» se c'è il dettaglio §12)
                 "nick": "…", "name": "…", "type": "nightlife", "recommended": true,
                 "why": "…", "what": "…", "costEur": 20, "costNote": "~¥3.000-4.000 a testa", "hours": "…", "closedOn": "…",
                 "rating": { "source": "Tabelog", "value": 3.51, "reviews": 1254, "awards": "…" },   // opzionale
                 "image": { "url": "…", "credit": "…", "page": "…", "alt": "…" },                   // opzionale
                 "mapsQuery": "…" } ] }
```
- Ordine: consigliato (`placeId` della tappa, `recommended: true`) e poi le alternative nell'ordine della sorgente; al massimo un
  `recommended`. `options` c'è solo con ≥ 2 opzioni risolte (≥ 1 nei `free` senza placeId); `flex` solo insieme a `options`.
  Gli item senza alternative restano identici. Alternative non trovate nel catalogo del blocco → report («placeId non trovati»).
- Foto: stessa logica di §9.1 (`--fetch-images` → `assets/img/places/<id>.webp`, riuso se il file c'è). Il costo della tappa resta
  quello del consigliato (le opzioni non entrano nei totali). Report: «Tappe con opzioni». `--check` valida options/flex.

### 13.3 UI (`assets/js/place-options.js` + `assets/css/options.css`)
- In `giorno.html` (dentro la tappa, sotto nota e link) e nel pannello della tappa in `agenda.html` (fra nota e azioni):
  testata «Linea guida · N opzioni» (con `flex` o con un consigliato; altrimenti «Idee · N opzioni») + stato
  («si sceglie sul posto» / «Scelto: …»); fila di mini-card (foto 4:3 o icona del tipo, soprannome su 3 righe max, voto ★, prezzo)
  scorrevole nel proprio contenitore (mai la pagina, anche a 360px); il consigliato ha la pillola «consigliato» e il filo verde.
- Tocco su una mini-card (`aria-expanded`) → presentazione sotto la fila: soprannome, nome, Perché (`why`), Cosa (`what`), voto,
  prezzo € · ¥ + nota, orari, chiuso, Maps, «Scheda» (se c'è il dettaglio §12 per `placeId`), credit della foto. Secondo tocco chiude.
- «Scelgo questo»: scelta per dispositivo in `localStorage['agenda.choices']` = `{"<data>|<id tappa>": "<id opzione>"}` (try/catch;
  una scelta che non corrisponde più alle opzioni attuali si ignora). Nessun backend; la tappa e i costi non cambiano.
