# NOTES_guide — pagina Guide, step build_guides, foto locali (5 ott 2026, SPEC §10 e §9.1)

Niente commit/push. `CACHE_VERSION` NON bumpato (resta `v9`): i file nuovi sono già in PRECACHE.

## A. Exporter: guide (`export_site_guides.py`, importato da `export_site_data.py`)
- `data/guide/*.md` (salta `_*.md`, README) → `site/data/guides.json`, ordinato per `(order, id)`. Cartella vuota/assente → `{"guides": []}`.
- Frontmatter: parser proprio (`key: value`, liste inline `[a, b]`, commenti ` # …`, virgolette). Chiavi: id (default = nome file), title
  (obbligatorio, sennò guida saltata), icon (deve esistere nello sprite, sennò `info`), summary, order (int, default 999), tags (minuscolo),
  places, updated (ISO, sennò vuoto). Chiavi sconosciute → segnalate.
- Markdown proprio: `#`…`###` (il livello più alto usato diventa `<h2>`: l'`<h1>` è il titolo della pagina), paragrafi, liste `-`/`1.` con un
  livello di annidamento (indentazione ≥ 2 spazi), `**`/`__`, `*`/`_`, `` `codice` ``, link (http/https → `rel="noopener" target="_blank"`;
  interni `pagina.html?…#…` senza target; altro → solo testo + report), tabelle con `<thead>` e allineamento `:--:`/`--:` (classi `ta-c`/`ta-r`),
  avvolte in `<div class="g-table" role="region" tabindex="0">`, citazioni `>` (anche annidando liste), `---` → `<hr>`. Tutto il resto è escapato.
- Blocchi che iniziano con `<svg`/`<figure` e finiscono con `</svg>`/`</figure>`: passano così come sono solo se superano il controllo (whitelist
  di tag SVG + figure/figcaption/img/picture/…; niente `<script`, attributi `on*`, `javascript:`/`vbscript:`/`data:` non immagine, `@import`,
  `expression(`, `foreignObject`, doctype/entità; URL solo `#…`, `https://`, `assets/…`). Altrimenti il blocco è SCARTATO e segnalato.
  Avvisi: `<svg>` senza `viewBox` o senza `role="img"`/`aria-label`/`<title>`.
- `places`: risolti da `data/piano/catalogo/data/*.json` (sia file-blocco `{places:[…]}` sia liste), poi fallback su `places.json` (senza nick).
- Report: sezione "Guide" in coda a `_export_report.md` (lette, errori frontmatter, blocchi scartati, luoghi non trovati, link non ammessi, avvisi).
- `--check` valida anche `guides.json` (tipi + html sicuro). CLI: `--guides-src <dir>` (es. `site/dev/fixtures/guide`).
- **Nav**: con almeno una guida l'exporter aggiunge `{"id":"guide","label":"Guide","icon":"book","href":"guide.html"}` a `trip.sections`
  prima di Budget. È l'UNICA differenza di `trip.json` rispetto al baseline (verificato: trip senza quella voce == output dell'exporter originale).
  Scelta fatta per non avere una voce di nav verso una pagina vuota; per renderla incondizionata basta togliere il `if g["guides"]` in `add_guides`.

## B. Foto locali (`export_site_images.py`, flag `--fetch-images`)
- Giorni fusi dalla scaletta (confermati; tutti con `--scaletta-proposte`): items (id catalogo registrato in `SCALETTA["catIds"]` da `sc_day`) ed extras
  → `site/assets/img/places/<id catalogo>.webp`, lato lungo 960, qualità 72, `User-Agent` esplicito, nessun riscaricamento se il file esiste.
  `image.url` → `assets/img/places/<id>.webp`; `credit`, `page`, `alt` invariati.
- Senza flag: nessun download, ma i file già presenti vengono usati comunque (deploy deterministico). Oggi la cartella non esiste → JSON invariati.
- Convertitore: Pillow del python corrente → Pillow di `.venv/` del progetto (creato ora: `python3 -m venv .venv && .venv/bin/pip install Pillow`,
  Pillow 12.3.0; NIENTE a livello di sistema) → `sips` (salva `.jpg` 960px, segnalato). L'exporter resta eseguibile con il python di sistema.
- Report: sezione "Foto locali" (modalità, convertitore, scaricate/riusate/fallite, file e KB totali della cartella).
- Front-end: `agenda-day.js` `photoOf` accetta anche `assets/img/places/<id>.(webp|jpg)` (prima solo https).
- Test (copia in scratchpad, 2 immagini: dotonbori item + ohatsu-tenjin-ura-sando extra): 2 scaricate (960×720, 132+91 KB), 2° giro "riusate",
  senza flag usate lo stesso; `sips` provato a parte; giorno.html mostra la webp locale col credit. File temporanei rimossi.
- Le webp NON sono in PRECACHE (sono tante): le mette in cache il SW al primo uso (cache-first stessa origine).

## C. Pagina `guide.html` + `assets/js/pages-guide.js` + `assets/css/guide.css`
- Indice: card (tassello icona, titolo, summary, tag come badge); filtro compatto come in Luoghi (richiesta cliente): campo cerca
  (titolo/summary/tag, senza accenti) + `select` "Tutti i temi" su UNA riga (44px, anche a 320), stato in localStorage `giappone.pages.guide`,
  conteggio annunciato (aria-live), stato vuoto con "Mostra tutte le guide".
- `?g=<id>` o `#<id>` apre la guida (hashchange gestito); id sconosciuto → indice con avviso. Guida: "Tutte le guide", tassello + titolo,
  summary, "Aggiornata il …", tag, corpo `.prose` (68ch, 17px/1.7), tabelle scorrevoli nel loro riquadro, SVG `max-width:100%`, "Luoghi citati"
  (nick, nome, bottone Maps), precedente/successiva. I link interni del corpo conservano `?data=`. Titolo documento `Guida · Guide · Viaggio`.
  Controllo difensivo: se l'html contiene script/eventi non viene inserito.
- SVG inline: il CSS NON tocca `svg text` (batterebbe `fill`/`font-size` dell'autore); il colore di base è `currentColor` = `--fg`. Classi opzionali
  che seguono il tema: `g-text g-ink g-muted g-muted-fill g-fill g-card-fill g-accent g-accent-fill g-move g-move-fill g-evening-fill`.
- Sprite: aggiunte `i-book` (nav), `i-compass`, `i-beer`, `i-phone`, `i-map` (le icone previste in §10.1 che mancavano).
- Nav (base.css + `DEFAULT_SECTIONS` in app.js): 7 voci. < 420px etichette 10px; < 360px solo icone 24px (etichetta resta per i lettori di schermo);
  900-1149px desktop: solo etichette (niente icone) e titolo topbar più largo; ≥ 1150px come prima. Misurato: nessuna sovrapposizione titolo/nav
  fra 900 e 1440, nessuna etichetta troncata a 375, `scrollWidth` = viewport a 320/360/375/414.
- `sw.js`: + `guide.html`, `guide.css`, `pages-guide.js` in PRECACHE; `guides` in DATA_FILES (network-first come gli altri JSON).
- `tools/check_site.py`: + controllo che ogni `trip.sections` punti a una pagina esistente e che `guides.json` (data e fixture) abbia le chiavi e html sicuro.
- Fixture: `dev/fixtures/guide/{tenma-sera,contanti-giappone}.md` (tabella, liste annidate, link ok e non ammesso, SVG, luogo inesistente),
  `dev/fixtures/guides.json` generato da quelle, `dev/fixtures/trip.json` con la voce Guide.

## Verifiche
- `python3 export_site_data.py` (senza flag, con le 6 guide già arrivate in `data/guide/`): agenda/transport/lodging/places/budget IDENTICI byte per
  byte all'output dell'exporter originale sulle stesse sorgenti; trip diverso solo per la voce Guide. guides.json: 6 guide, 0 errori, 0 scarti.
  NB: i JSON che c'erano in `site/data` prima (4 ott 10:13) erano già vecchi rispetto alle sorgenti (scaletta A modificata dopo): il confronto
  giusto è con l'exporter originale rieseguito, non con quei file.
- Errore di validazione GIÀ ESISTENTE e non mio: `agenda.days[0].d07-13: end «01:00»` (dalla scaletta A, c'è anche col codice originale).
- Guida con contenuti malevoli (in scratchpad): `onload`, `javascript:` in href, `foreignObject`, svg non chiuso → 4 blocchi scartati; `<script>`/`<img onerror>`
  nel testo → escapati; frontmatter rotto → 5 errori segnalati.
- `check_site.py`: 14 pagine, 0 errori. `dev/test-shell.html` 19/19, `dev/test-pages.html` OK.
- Chrome (contesto isolato, `?nosw`), 375/320/1200, chiaro e scuro, fixture e dati reali: console vuota, nessuno scroll orizzontale, tabelle
  scorrono nel loro riquadro (512/341 a 375), SVG dentro la colonna (testo compreso), nav a 7 voci su tutte le 8 pagine.

## Al deploy
1. `python3 export_site_data.py --fetch-images` (scarica le foto dei giorni confermati), poi controllare la sezione "Foto locali" del report.
2. Bump `CACHE_VERSION` in `sw.js`.
3. Ricordare che il browser può tenere in cache HTTP i moduli JS vecchi in locale: ricaricare senza cache quando si prova.

## Fix 5 ott: tappe dopo mezzanotte (merge_scaletta → sc_day)
- `end` < `time` (23:30→01:00): `end` tolto, nota + "fino all'1:00". Tappe con inizio 00:00-04:59: niente item, frase "Dopo: … (01:00-02:30) · …" nella nota dell'ultimo item, placeId aggiunto agli extras; elenco nel report ("Tappe dopo mezzanotte ripiegate"). Validazione: 0 errori; d07 chiude con d07-13 23:30.
