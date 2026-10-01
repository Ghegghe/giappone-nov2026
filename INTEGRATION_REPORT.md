# INTEGRATION_REPORT — integrazione e QA (1 ott 2026)

Verifica con Chrome DevTools (contesto isolato) su `python3 -m http.server 8765` in `site/`, **dati reali** `site/data/`.
Esito: 7 pagine OK a 375 e 1280, temi washi (chiaro), night e neutral; console senza errori/warning, nessuna richiesta 404,
nessuno scroll orizzontale di pagina, offline OK (SW installato, server spento: le 7 pagine + i 6 JSON vengono dalla cache).
`python3 tools/check_site.py` → 0 errori · `python3 export_site_data.py --check` → schemi OK ·
`dev/test-pages.html` 46/46 · `dev/test-agenda.html` 32/32 (con `?data=data/` e `?data=dev/fixtures/`) · `dev/test-shell.html` 19/19.

## Modifiche per file

### Dati / exporter
- `export_site_data.py`
  - nuovo `apply_text_fixes()` + chiave `textFixes` negli override: sostituzione testuale su tutte le stringhe di un file
    (corregge anche le copie, es. `bookingGuide` → `booking` delle tratte); se il testo non si trova più finisce in «Ambiguità».
  - nuova chiave `ignorePins` (nome pin → motivo): pin My Maps saltati nel join e annotati nelle Note del report.
  - il controllo «Sanban-gai» sulla bookingGuide ora gira **dopo** le correzioni (prima segnalava sempre).
  - `budget.notes`: testo per chi legge il sito (prima citava nomi di campi JSON: `estimate:true`, `lodgingEurGroup`…).
- `site_overrides.json`
  - `ignorePins`: «Ghibli Park» (eliminato dal viaggio il 18 set).
  - `textFixes` transport: riga KATE → «¥1.800 · di pomeriggio non ferma a Hankyu Sanban-gai: scendere a UM9 Hotel Hankyu
    Respire / Yodobashi Umeda Tower, 13' a piedi al BON»; Hida: «(ticketless)» → «(ritiro cartaceo alla macchinetta con la
    carta)» e tolta la frase «Niente ticketless sulla versione inglese» (2×: guida + booking della tratta). Zero occorrenze di
    «ticketless» nei JSON.
  - `textFixes` agenda: titolo Limousine 24/11 «(PRENOTATO online)» → «(da prenotare online, ~fine ott)», coerente con
    checklist e `booking.status: todo`.
- `site/data/*` rigenerati. Checklist: **26 righe**, riga Limousine Bus = `todo` (verificato).
- `site/dev/fixtures/*`: sostituite con **copia dei dati reali**; solo in `places.json` restano 2 coordinate di test
  (`fushimi-inari-taisha`, `castello-di-osaka`) per provare «Indicazioni». Va ricopiato dopo ogni export (`cp data/*.json dev/fixtures/`).

### Pagine (adeguate allo schema dell'exporter)
- `pages-trasporti.js`: `details` è un oggetto `{cost, how, booking, proCon}` → reso come `dl` in «Come funziona» (prima
  `[object Object]`); «Prenotare:» da `details.booking` se manca `bookingNeeded`; checklist usa `url` dell'exporter;
  totale da `totalChosenEur`.
- `pages-alloggi.js`: bagagli con lo schema reale (`steps {phase, what, when, notes}`, `rules`, `options[]` in «Opzioni valutate»,
  `openQuestions[]` in «Domande verificate», aperta se ce n'è una aperta); contanti/carta IC con `{rule, atArrival, reminders}`
  (titolo di fallback); basi: `payment`, `costEurPerPerson`, `costJpyTotal` (Yasudaya «in struttura»).
- `pages-budget.js`: mostra `detail` delle categorie; riga «ancora da pagare» da `paidSoFar.lodgingEurGroupToPay`.
- `pages-luoghi.js`: flag vuoto → badge «—» (title «senza flag nel dossier»); `flagPass()`: un luogo senza flag **in agenda**
  (`dayDates` non vuoto) segue il chip «Sì», quindi è visibile col filtro di default (4 luoghi: Sanmachi Suji, Miyagawa
  Morning Market, Hida beef street food, Tokko-no-yu); gli altri 19 solo col chip «Senza flag». Default: 166/326.
- `pages-home.js`: `transport` null → «Scadenze non disponibili» (prima diceva «Niente da fare: tutto prenotato»).
- `agenda-gaps.js`: item `allDay` senza orario → blocco dalle 6:00 al primo item con orario (21/11: fino alle 20:00, prima
  veniva scartato e il giorno risultava vuoto); `timeRange()`; `itemAria` include «in parallelo».
- `agenda.js`: `title` = testo accessibile su ogni blocco (blocchi bassi); «in parallelo» / «stima» nel blocco e nel pannello;
  `agenda.notice` come `<details>` «Agenda in revisione» sotto il titolo (visibile anche su mobile); bug: il pannello
  scriveva «null» per item senza nota (`replaceChildren` nativo); date-bar allineata subito al caricamento (scroll non smooth).
- `agenda-day.js`: «tutto il giorno / giornata fino alle…», badge «in parallelo», «(stima)», «Spostamenti:» da `moves`,
  «Budget previsto dal dossier» da `budgetEur`; bug: «null» stampato in testata/piè quando `notes`/`moves` mancavano.
- `agenda.css`: stile `.agenda__notice` (summary 44px).

### Design / shell
- `base.css`: rimosso `.btn[aria-label]:has(> .icon:only-child)` (scattava anche con icona + testo nudo) → classe esplicita
  `.btn--icon`; aggiornati `DESIGN.md`, `_styleguide.html`, `NOTES_design.md`. Nessuna pagina di produzione usava bottoni solo-icona.
- 7 pagine + `404.html`: aggiunto `<meta name="robots" content="noindex, nofollow">` (mancava, richiesto da NOTES_shell §1)
  e `<link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">`.
- `sw.js`: `CACHE_VERSION` → `v2`; PRECACHE + `favicon.svg`, `icon.svg` (32 voci, tutte esistenti; verificato in cache).
- `tools/check_site.py`: nuovo controllo di completezza — ogni html/css/js/svg/png/manifest fuori da `dev/ data/ tools/`
  (eccetto `_styleguide.html`, `sw.js`) deve stare in PRECACHE.
- `README.md`: bump `v2→v3` al prossimo deploy, controllo di completezza, rsync esclude anche questo report, nota telefoni.
- `dev/test-pages.html`, `dev/test-agenda.html`: asserzioni rese dipendenti dai dati (non più dalle vecchie fixture);
  nuovi test: details resi come `dl`, chip «Senza flag», `allDay`.

### Verificati senza modifiche
- Nessun import degli stub `dev/app.stub*.js` nelle pagine di produzione (tutte importano `./app.js`).
- Tutte le icone usate (JS, HTML, `trip.sections`, `i-sun/moon/auto/home`) esistono nello sprite.
- Sottotitolo topbar a 1280: nascosto sotto 1600px, nessuna sovrapposizione con la nav (misurato).
- `loadData` → `null`: agenda/giorno mostrano `.empty`, pagine contenuto `.empty` per pagina (home ora anche per trasporti).
- Tap target: `.btn`, `.tab`, `.nav__item`, theme-switch ≥44px; `.chip` 36px visivi + area 44px via `::after` (base.css).

## Aperto / limiti noti
- Blocchi timeline da 30' ≈ 24px di altezza (sotto 44px): restano bottoni, il tap al centro colpisce il blocco giusto (11/11
  verificati), hanno `title`/`aria-label`; l'alternativa accessibile è `giorno.html` (lista). Non allargati per non falsare la scala.
- Luoghi a 375: la riga flag è scorrevole orizzontalmente; «Futuro» e «Senza flag» sono fuori vista finché non si scorre.
- `theme-boot.js` carica prima `washi.css` e poi il tema salvato (doppio download del CSS tema, innocuo).
- `trip.facts`, `trip.links`, `budget.daily` sono esportati ma non mostrati da nessuna pagina.
- Il report export continua a elencare l'ambiguità «24/11 PRENOTATO vs Da fare» (rilevata prima del textFix), il titolo è già corretto.
- Fixture = copia dei dati reali: vanno ricopiate dopo ogni export, altrimenti divergono di nuovo.

## Deploy (da README)
1. `python3 ../export_site_data.py && python3 ../export_site_data.py --check` (da `site/`), poi `cp data/*.json dev/fixtures/` (facoltativo).
2. `python3 tools/check_site.py` deve uscire 0.
3. Se cambiano HTML/CSS/JS/icone: bumpare `CACHE_VERSION` in `sw.js` (prossimo: `v3`); un file statico nuovo va in `PRECACHE`.
4. Repo dedicato pubblico: `rsync -a --delete --exclude dev/ --exclude 'NOTES_*.md' --exclude SPEC.md --exclude INTEGRATION_REPORT.md site/ ../giappone-site/`,
   commit e push; Settings → Pages → Deploy from a branch → `main` / `(root)`. URL `https://<user>.github.io/<repo>/`.

## Decisioni dell'orchestratore necessarie
1. **Telefoni**: in `transport.checklist` ci sono i numeri pubblici dei ristoranti (Mouriya, Torafugutei) e in `lodging` la linea
   inglese Yamato (0120-…). SPEC vieta solo i telefoni *personali*; l'exporter li tiene. Tenerli o toglierli via `textFixes`?
2. **Budget «Spedizione bagagli (Yamato)»**: il testo dalla sorgente v32 dice ancora «destinazione da decidere», ma l'opzione A2
   è scelta dal 18 set. Correggere in `build_xlsx_v33` o con un `textFixes`?
3. **Indirizzi** mancanti di Country Hotel Takayama, Glocal Nagoya, Yasudaya, Arai Ryokan (e civico Yume-no-ya): da inserire in `site_overrides.json`.
4. **Pagato/da confermare** Takayama e Shuzenji (`paid:false`, «da confermare»): confermare lo stato reale.
5. **Aeroporto italiano** di andata/ritorno (`trip.flights.out.from` / `back.to` vuoti).
6. Mostrare `trip.links` / `trip.facts` in home («In tasca»)? Oggi non usati.
7. Luoghi senza flag in agenda: li ho agganciati al chip «Sì» (visibili di default). Se si preferisce un chip dedicato
   «In agenda», è una modifica di 3 righe in `pages-luoghi.js`.
