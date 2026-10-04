# NOTES_giorni — accesso ai giorni, foto e "se ci capita" (4 ott 2026, SPEC §9.2)

Solo frontend. Niente commit/push, `sw.js` e `CACHE_VERSION` non toccati, `export_site_data.py` non toccato.

## Cosa cambia
- **Striscia dei giorni** (`assets/js/day-strip.js`, CSS in `agenda.css`): chip "sab 7" per tutti i giorni, attivo pieno,
  frecce 44×44 disabilitate agli estremi, scroll interno senza scrollbar, sticky sotto la topbar, chip attivo portato in vista
  (`scrollIntoView` inline/block `nearest`).
  - `giorno.html`: in cima; frecce = giorno prima/dopo; tasti ← → cambiano giorno (non nei campi di testo né nella striscia "se ci capita").
    Il vecchio pager (prev · Agenda · next) è sceso in fondo alla pagina, dopo il totale: niente doppioni in testa.
  - `agenda.html`: in testa; ogni chip apre `giorno.html?d=`; il chip attivo segue il giorno selezionato nella timeline; le frecce scorrono la striscia.
- **Agenda**: l'intestazione di ogni colonna è un unico link al giorno con "Apri il giorno ›" (chevron come i bottoni esistenti).
  `--tl-head-h` 68→86px (mobile), 84→104px (desktop) per la riga in più.
- **Home**: la card del giorno è diventata la card principale, subito sotto il conto alla rovescia, a tutta larghezza, `card--accent`,
  tutta cliccabile (link esteso sul titolo). Stessa logica di prima (prima del viaggio = giorno 1; in viaggio = oggi/domani).
  "Prossime scadenze" e "In tasca" ora stanno affiancate nella `grid-2` che c'era già (nessuna griglia nuova).
- **Pagina giorno**: `summary` sotto il titolo; item con `image` → card con foto 4:3 a sinistra (112px, 168px da 600px), `nick` come
  titolo e `title` sotto in piccolo, credit con link a `image.page`, `referrerpolicy="no-referrer"`, `loading="lazy"`, fallback testuale
  (alt) se la foto non carica; item senza foto = riga di prima. In fondo "Se ci capita, nei dintorni": mini-card 160px (foto, nick, name,
  pillola verdict top/consigliato/opzionale/sconsigliato su `--ok/--fam-move/--fg-muted/--warn`, durata, costo, link Maps).
- **Fixture** `dev/fixtures/agenda.json`: 7 e 8 nov con `summary`; 3 item con `image`+`nick` (Dōtonbori, Hozenji, Fushimi Inari);
  4 `extras` il 7 nov (uno per verdict). URL Wikimedia 960px presi dal catalogo A, verificati con `curl -sI` → 200.

## Selettore di vista (seconda richiesta, 4 ott)
- Due bottoni-icona "Vista griglia" (icona colonne) / "Vista giorno" (icona foglio), fissi a sinistra della riga delle date, senza testo
  e senza spazio verticale in più: `agenda.html` prima della ‹ del selettore storico, `giorno.html` prima della ‹ della striscia.
- "Giorno" dall'agenda → `giorno.html?d=<giorno selezionato>` (segue la timeline); "Griglia" dal giorno → `agenda.html?view=grid#<data>`
  (`indexFromHash` seleziona già quel giorno). Preferenza in localStorage `agenda-view` (`grid|day`), salvata al click.
- Redirect: `view-boot.js` nell'`<head>` di agenda.html, prima del render. Va su `giorno.html` senza `?d=` (stessa scelta di pagina:
  oggi in viaggio, altrimenti il primo giorno); poi agenda-day.js riscrive l'URL con `?d=`. `?data=` conservato.
- Icone nuove nello sprite: `i-columns`, `i-day`. `view-switch.js` e `view-boot.js` in PRECACHE (nessun bump).
- Corretto in `agenda.js` il centraggio del chip attivo nel selettore storico (`offsetLeft` contava anche selettore e freccia).
- La striscia dei giorni in agenda.html l'ha tolta l'orchestratore: resta solo in giorno.html (il punto 3 sotto è superato).

## Frecce delle strisce di date (terza richiesta, 4 ott)
- `stripHints()` in `day-strip.js`, usato dalla striscia di giorno.html e dal selettore storico di agenda.html.
- Mobile (< 700px): le frecce sono solo indicatori (16px, muted, `aria-hidden`, `tabindex=-1`, niente click); la sinistra sparisce
  a inizio corsa, la destra a fine corsa (`is-start`/`is-end` su `scroll`). Lo spazio va ai chip: a 375px la lista passa da 149 a 211px in agenda.
- Desktop (≥ 700px): restano bottoni, larghi 32px (giorno: giorno prima/dopo; agenda: come prima).
- Chip della striscia di giorno.html alti 44px (prima 36 + area di tocco); quelli dell'agenda erano già a 44.
- Verificato a 375: riga su una linea, `scrollWidth` = viewport, frecce nascoste agli estremi; a 1200 frecce 32px cliccabili; console vuota.

## File toccati
`giorno.html`, `agenda.html`, `assets/js/day-strip.js` (nuovo), `assets/js/agenda-day.js`, `assets/js/agenda.js`,
`assets/js/pages-home.js`, `assets/js/view-switch.js` (nuovo), `assets/js/view-boot.js` (nuovo),
`assets/icons/sprite.svg`, `sw.js` (solo PRECACHE), `SPEC.md` §9.2, `assets/css/agenda.css`, `assets/css/home.css`, `dev/fixtures/agenda.json`, `.gitignore` (+`dev/shots_giorni/`).

## Da decidere / da fare
1. **`summary` già presente nei dati attuali**: il build vecchio scrive in `summary` un'etichetta corta ("Kyoto g.1 — Fushimi + …").
   Per lasciare le pagine identiche con i JSON di oggi, il summary si mostra solo se il giorno viene dal piano
   (`status: "final"`, oppure `extras` presente, oppure un item con `nick`/`image`). Se l'exporter smette di emettere il summary
   vecchio (o lo rinomina), il filtro (`planSummary` in `agenda-day.js` e `pages-home.js`) si può togliere.
2. **Al deploy**: bump `CACHE_VERSION` (i JS nuovi sono già in PRECACHE). `check_site.py`: 0 errori.
3. **Agenda**: la striscia nuova è stata TOLTA dall'agenda (4 ott, decisione orchestratore): sul desktop era ridondante con "Apri il giorno" e con il selettore storico; resta solo in `giorno.html`.
   ridondante. Proposta da chiedere al cliente: tenerlo solo su mobile, oppure toglierlo.
4. Hero della home a 1200px: titolo e rotta vanno sotto il numero invece che a destra. C'era già prima, non dipende da queste modifiche.

## Verifiche (Chrome DevTools, contesto isolato, `?nosw`)
- 375px e 1200/1728px, chiaro e scuro: giorno (fixture + reale), agenda (fixture + reale), home (fixture + reale): nessuno scroll
  orizzontale di pagina (`scrollWidth` = viewport), console vuota.
- Striscia sticky a 56px (sotto la topbar) dopo lo scroll; chip attivo in vista; ← da tastiera porta al giorno giusto; fallback foto ok (112×84 col testo alt).
- Contrasto (neutral/washi chiaro e scuro, night): pillole verdict 5.4-9.1:1, credit e nomi ≥ 4.8:1, chip attivi ≥ 12:1;
  testo fallback corretto (era 4.39 in neutral chiaro → ora mescolato a `--fg`).
- `dev/test-agenda.html` 44/44 OK · `dev/test-pages.html` tutti OK · `check_site.py`: 1 errore (PRECACHE, punto 2).
- Screenshot: `dev/shots_giorni/` (ignorati da git).
- Selettore di vista (375 e 1200, chiaro/scuro): agenda → Giorno → Griglia → agenda con lo stesso giorno selezionato; preferenza `day` +
  `agenda.html` senza hash → redirect a `giorno.html?d=2026-11-07` (con `?data=` conservato); riga delle date su una linea a 375,
  `scrollWidth` = viewport, console vuota; `test-agenda` 44/44 anche con preferenza `day` salvata.

## Fix 4 ott (orchestratore): scroll verticale nelle strisce
Le tre strisce orizzontali (`.agenda-dates`, `.day-strip__list`, `.giorno-extras__list`) avevano solo `overflow-x: auto`:
`.agenda-dates` aveva 3px di scrollHeight in più (47 vs 44, nessun figlio sporge) e permetteva lo scroll verticale.
Causa: il `.chip::after` di base.css (inset -4px, area di tocco) sporgeva di 3px sotto chip già alti 44px → `inset: 0` per i chip di `.agenda-dates` e `.day-strip__list`; in più `overflow-y: clip; touch-action: pan-x pan-y;` sulle tre strisce. Verificato: `scrollTop` resta 0, chip non tagliati.
