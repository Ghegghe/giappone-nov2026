# Sito "Giappone · 7-24 novembre 2026"

Sito statico (HTML/CSS/JS puro, nessun framework/bundler/CDN) con agenda, trasporti, alloggi, luoghi e budget del viaggio.
Funziona offline come PWA. Tutti i dati arrivano da `data/*.json` a runtime: per un altro viaggio basta cambiare i JSON.
Contratto completo fra le parti: `SPEC.md`. Contratto della shell (head, attributi, API): `NOTES_shell.md`.

## Struttura
```
index.html agenda.html giorno.html trasporti.html alloggi.html luoghi.html budget.html   pagine
404.html                     rimanda alla home (GitHub Pages)
assets/css/base.css          layout e componenti (solo variabili)
assets/css/themes/neutral.css tema unico (washi.css, night.css: storici, non linkati)
assets/js/app.js             shell: nav/topbar/footer, tema, loadData, formattazione €/¥/date
assets/js/theme-boot.js      applica il tema salvato prima del paint (script classico nell'<head>)
assets/js/agenda.js pages.js rendering delle pagine
assets/icons/                sprite.svg + icone PWA 192/512
assets/img/                  foto delle 6 basi, fornite dal cliente (vedi «Fotografie»)
data/*.json                  dati generati da ../export_site_data.py (NON editare a mano)
dev/                         pagine di prova e fixture (mai cachate dal service worker)
sw.js manifest.webmanifest   PWA
tools/check_site.py          controlli statici
.nojekyll robots.txt         GitHub Pages / niente indicizzazione
```

## Servire in locale
```sh
cd site
python3 -m http.server 8080
# http://localhost:8080/            sito
# http://localhost:8080/dev/test-shell.html?data=dev/fixtures/   test della shell
```
Su `localhost` il service worker usa network-first per tutto (vedi sempre i file aggiornati). `?nosw` disattiva la registrazione.
Da `file://` il sito non funziona (fetch dei JSON bloccato): serve sempre un server.

## Rigenerare i dati
Dalla cartella `site/`: `python3 ../export_site_data.py` (validazione schemi: `python3 ../export_site_data.py --check`).
Correzioni manuali solo in `../site_overrides.json`. Report dei valori non estratti: `data/_export_report.md`.

## Fixture e parametri URL
- `?data=dev/fixtures/` carica i JSON da `dev/fixtures/` invece di `data/` (path relativo alla radice del sito; la nav lo conserva).
- `?today=2026-11-09` simula la data odierna (vista "oggi" della home).
- `?nosw` non registra il service worker.

## Tema e colori
- Tema **unico**: `assets/css/themes/neutral.css` (decisione del 2 ott 2026, `DIRECTION.md`). Chiaro e scuro seguono il
  sistema; il pulsante nella topbar passa fra automatico, chiaro e scuro (salvato in `localStorage`, chiave `giappone.mode`).
- `washi.css` e `night.css` restano nel repo come storia: non sono linkati, non sono in `PRECACHE`
  (`tools/check_site.py` li esclude dal controllo di completezza). Regole del design: `DESIGN.md`.

## Fotografie delle basi
Slot pronti in testa a `giorno.html` e in cima a ogni card di `alloggi.html`. Finché il file non c'è si vede un blocco
colore con il nome della città. Per aggiungere una foto:
1. nome file = id della base: `osaka.jpg`, `takayama.jpg`, `nagoya.jpg`, `uchiura.jpg`, `shuzenji.jpg`, `tokyo.jpg`;
   cartella `site/assets/img/`;
2. JPEG orizzontale, **1600×900 px** (16:9; il sito ritaglia al centro a 3:1 su desktop e 5:2 nelle card), progressivo,
   **al massimo 160 KB** (qualità 60-70 di solito basta). Solo foto vostre o con licenza che lo permetta;
3. rilanciare `python3 ../export_site_data.py`: l'exporter guarda la cartella e scrive l'elenco in `data/trip.json`
   (`photos`); il sito chiede solo le foto elencate, così gli slot vuoti non fanno richieste a vuoto. Se un file supera
   i 160 KB finisce fra le ambiguità di `data/_export_report.md`;
4. le foto non vanno in `PRECACHE`: il service worker le mette in cache alla prima visita. Bump di `CACHE_VERSION` non serve.

## Service worker: `CACHE_VERSION`
In `sw.js` le pagine e gli asset sono **cache-first**: senza bump gli utenti continuano a vedere la versione in cache.
A ogni deploy che cambia HTML/CSS/JS/icone: incrementare `const CACHE_VERSION` (ora `'v5'` → `'v6'` al prossimo deploy).
Il nuovo SW si installa, si attiva subito (`skipWaiting` + `clients.claim`), cancella le cache vecchie e la pagina
mostra il toast "Aggiornamento disponibile · ricarica". I JSON in `data/` sono network-first (aggiornati appena c'è rete),
quindi un cambio solo-dati non richiede il bump. Un nuovo file statico va aggiunto a `PRECACHE` (lista esplicita).

## Controlli
```sh
python3 tools/check_site.py
```
Verifica che ogni `href`/`src` relativo delle pagine HTML (e `url()` nei CSS, `import` nei JS) esista, che nessun path
interno cominci con `/`, che i JSON in `data/` e `dev/fixtures/` siano validi, che manifest e `PRECACHE` di `sw.js`
puntino a file esistenti e che ogni file statico (html/css/js/svg/png/manifest fuori da `dev/ data/ tools/`, escluso
`_styleguide.html`) sia in `PRECACHE`. Exit code 1 se trova errori. Eseguirlo prima di ogni pubblicazione.

## Pubblicare su GitHub Pages
Il repo dev'essere **pubblico** (Pages gratuito). Due opzioni:
- **Repo dedicato** (consigliato): il contenuto di `site/` va alla radice del repo (`index.html` in root).
  ```sh
  rsync -a --delete --exclude dev/ --exclude 'NOTES_*.md' --exclude SPEC.md --exclude INTEGRATION_REPORT.md --exclude REVIEW_FINAL.md --exclude REDESIGN_REPORT.md --exclude DIRECTION.md site/ ../giappone-site/
  cd ../giappone-site && git add -A && git commit -m "deploy" && git push
  ```
- **Stesso repo**: copiare `site/` alla radice del branch `main` (Pages non serve sottocartelle arbitrarie: solo `/` o `/docs`).
Poi: Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `/ (root)`. URL: `https://<user>.github.io/<repo>/`.
`.nojekyll` evita che Jekyll ignori file/cartelle con `_`. Tutti i path sono relativi, quindi la sottocartella `/<repo>/` funziona.

Privacy: il sito è pubblico ma non indicizzato (`robots.txt` + `<meta name="robots" content="noindex">` nelle pagine;
su un project site il robots.txt non è alla radice del dominio, il meta è quello che conta). Non contiene numeri di
prenotazione, carte o telefoni personali (SPEC §0); restano solo numeri pubblici di esercizi (ristoranti, linea
inglese Yamato). Controllare i JSON prima di pubblicare (`python3 ../export_site_data.py --check` fa anche una scansione privacy).
