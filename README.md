# Sito "Giappone · 7-24 novembre 2026"

Sito statico (HTML/CSS/JS puro, nessun framework/bundler/CDN) con agenda, trasporti, alloggi, luoghi e budget del viaggio.
Funziona offline come PWA. Tutti i dati arrivano da `data/*.json` a runtime: per un altro viaggio basta cambiare i JSON.
Contratto completo fra le parti: `SPEC.md`. Contratto della shell (head, attributi, API): `NOTES_shell.md`.

## Struttura
```
index.html agenda.html giorno.html trasporti.html alloggi.html luoghi.html budget.html   pagine
404.html                     rimanda alla home (GitHub Pages)
assets/css/base.css          layout e componenti (solo variabili)
assets/css/themes/*.css      temi: neutral (default), washi, night
assets/js/app.js             shell: nav/topbar/footer, tema, loadData, formattazione €/¥/date
assets/js/theme-boot.js      applica il tema salvato prima del paint (script classico nell'<head>)
assets/js/agenda.js pages.js rendering delle pagine
assets/icons/                sprite.svg + icone PWA 192/512
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

## Temi
- Default `neutral` (shadcn zinc). Cambio da footer (Tema + Modo auto/chiaro/scuro) o dal pulsante `.theme-switch`
  nella topbar. Persistito in `localStorage` (`giappone.theme`, `giappone.mode`). Regole del design: `DESIGN.md`
  (sezione "Ibrido 2 ott" per cosa viene dalla versione A e cosa dalla B).
- Aggiungere un tema `foo`:
  1. creare `assets/css/themes/foo.css` con TUTTE le variabili di SPEC §6, le 4 `--fam-*` della timeline e i `--c-*`
     che vi puntano (chiaro su `:root`, scuro sotto `@media (prefers-color-scheme: dark) { :root:not([data-theme-mode="light"]) {…} }`
     e `:root[data-theme-mode="dark"] {…}`);
  2. aggiungere `{ id: 'foo', label: 'Foo' }` a `THEMES` in `assets/js/theme-boot.js` (e a `FALLBACK_THEMES` in `app.js`);
  3. aggiungere il file a `PRECACHE` in `sw.js` e bumpare `CACHE_VERSION`.
- Niente foto nel sito: `trip.photos` (scritto dall'exporter da `assets/img/*.jpg`) non è usato da nessuna pagina.

## Service worker: `CACHE_VERSION`
In `sw.js` le pagine e gli asset sono **cache-first**: senza bump gli utenti continuano a vedere la versione in cache.
A ogni deploy che cambia HTML/CSS/JS/icone: incrementare `const CACHE_VERSION` (ora `'v6'` → `'v7'` al prossimo deploy).
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
  rsync -a --delete --exclude dev/ --exclude 'NOTES_*.md' --exclude SPEC.md --exclude INTEGRATION_REPORT.md --exclude REVIEW_FINAL.md --exclude REDESIGN_REPORT.md --exclude DIRECTION.md --exclude HYBRID_REPORT.md site/ ../giappone-site/
  cd ../giappone-site && git add -A && git commit -m "deploy" && git push
  ```
- **Stesso repo**: copiare `site/` alla radice del branch `main` (Pages non serve sottocartelle arbitrarie: solo `/` o `/docs`).
Poi: Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `/ (root)`. URL: `https://<user>.github.io/<repo>/`.
`.nojekyll` evita che Jekyll ignori file/cartelle con `_`. Tutti i path sono relativi, quindi la sottocartella `/<repo>/` funziona.

Privacy: il sito è pubblico ma non indicizzato (`robots.txt` + `<meta name="robots" content="noindex">` nelle pagine;
su un project site il robots.txt non è alla radice del dominio, il meta è quello che conta). Non contiene numeri di
prenotazione, carte o telefoni personali (SPEC §0); restano solo numeri pubblici di esercizi (ristoranti, linea
inglese Yamato). Controllare i JSON prima di pubblicare (`python3 ../export_site_data.py --check` fa anche una scansione privacy).
