# DESIGN — design system del sito (redesign del 2 ott 2026)

Mandato: `DIRECTION.md` (vincolante). In una riga: **una pagina fatta da una persona con gusto, non una dashboard**.
Si toglie prima di aggiungere: niente hero, niente griglie di scorciatoie, niente card dove basta un titolo e una linea.
Vincoli tecnici invariati (SPEC §0, §4): CSS/JS puro, path relativi, niente CDN né font esterni, dati solo dai JSON.

## Tema unico
`assets/css/themes/neutral.css` è l'unico tema linkato e precacheato. Base: token shadcn/ui *zinc* (v4), chiaro e
scuro automatici con `prefers-color-scheme`, più il pulsante della topbar (automatico → chiaro → scuro, `giappone.mode`).
`washi.css` e `night.css` restano nel repo come storia; non sono in `PRECACHE` e `tools/check_site.py` li esclude.
`theme-boot.js` applica solo il modo prima del paint; `applyTheme(_, mode)` ignora il tema.

Struttura del file: **(A)** token grezzi (`--background`, `--primary`, `--ink`…), **(B)** mappa sulle variabili SPEC §6
(`--bg`, `--fg`, `--accent`…), **(C)** famiglie di colore e type. I blocchi scuri ridefiniscono solo (A) e (C).
Regola d'oro: `base.css`, `pages.css`, `agenda.css` usano solo `var(--…)`; tinte con `color-mix()`.

## Un solo accento
`--ink` indaco tenue: `#3a4796` in chiaro (8:1 su bianco), `#a9b5f0` in scuro. Lo usano **solo** i link (`--accent-2`),
lo stato attivo (voce di nav, scheda, filtro premuto: `--accent`, `--chip-on-bg`) e "oggi"/"ora" (giorno corrente,
linea dell'ora nella timeline). Tutto il resto è zinc: testo, fili, fondi, bottoni (`--primary` resta zinc-900).
Il totale del budget, i titoli, le date non sono colorati.

## Tipografia
- Titoli: serif di sistema `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif` (`--font-display`),
  **peso normale (400)**, tracking −0.01em. Scala: h3 18/24 · h2 22/28 · `.section-title` 22/28 · h1 32/38 → 40/46 ≥900.
  Home: il titolo è il solo elemento grande (40-64px, `clamp`), spezzato sul " · " in due righe, la seconda grigia.
- Testo: sans di sistema (`--font-sans`, senza "Inter"), 16/24; `.small` 14/20.
- Cifre: `font-variant-numeric: tabular-nums` su tutto il `body`. **Niente monospazio**: `--font-mono` = sans, e la
  classe `.mono` (SPEC §6) resta solo come "cifre tabulari". Orari, prezzi, date sono nel font del testo.
- Niente maiuscoletto, niente testo in maiuscolo da CSS, niente etichette sopra i titoli.

## Card, linee, spazio
- **Card solo per oggetti ripetuti e confrontabili**: le 6 basi (`alloggi.html`) e le tratte con le loro opzioni
  (`trasporti.html`). Card = filo 1px, raggio 8px, **senza ombra**. Le righe dei luoghi sono una lista a fili, non card.
- Altrove (home, testate, logistica, guida prenotazioni, scadenze, budget, piè del giorno): **tipografia**.
  Il "riquadro" è `.section-title`: un filo sottile sopra, titolo serif, spazio. Sotto le schede (`.tabs`, che hanno
  già il loro filo) il primo titolo non ridisegna la linea.
- Liste a fili: `.rule-list` (righe separate da un filo) e `details.fold` (apri/chiudi a filo, 48px, chevron) al posto
  di `details.card`. Testi lunghi a misura di lettura: `.prose` (68ch).
- Tabelle del budget: fili orizzontali, totale sopra un filo `--fg`, barre grigie da 4px su scala unica.

## Badge e icone
- **Badge: al massimo uno per riga, e solo se c'è da fare qualcosa**: "da prenotare", "in ritardo", "oggi",
  "pagamento da verificare". Forma piccola e squadrata (raggio 4px), non pillola. Tutto il resto è una parola nel testo:
  "prenotato", "pagato", "si paga in struttura", "stima", "facoltativo", "orario fisso", il flag dei luoghi ("forse";
  "sì" non si scrive). Conteggi (schede, gruppi città) in grigio accanto al titolo, non in un badge.
- **"bozza" compare una volta sola**: la riga in testa all'agenda (`agenda.notice`). Né in home, né nel giorno, né
  nelle colonne.
- **Icone**: la nav mobile le tiene (convenzione), quella desktop no (solo parole, attiva = inchiostro + filo sotto).
  Il lucchetto compare solo nel pannello di dettaglio dell'item. Restano le icone funzionali senza testo: frecce
  giorno precedente/successivo, cerca, pin Maps nelle righe dei luoghi, chiudi, modo colori. Nessuna icona nei titoli,
  niente icona "esterno" sui link (la nuova scheda è detta agli screen reader con `.sr-only`).

## Timeline: 4 famiglie di colore
I dati tengono i 13 `type`; il colore viene dalla famiglia (tema, blocco C) e i `--c-*` puntano alle famiglie:

| Famiglia | Variabile | Chiaro / scuro | Type |
|---|---|---|---|
| Spostamenti | `--fam-move` | `#2c5d6b` / `#86bccb` | train, bus, transfer, logistics |
| Fissi | `--fam-fixed` | `#8a2f45` / `#eb9aab` | fixed, lodging |
| Visite e cultura | `--fam-culture` | `#4b6627` / `#aecb87` | sight, anime, onsen, shopping |
| Cibo e sera | `--fam-evening` | `#8a4f0c` / `#e2ad69` | food, nightlife |
| (spazio) | `--fg-muted` | — | free |

- Blocco: tinta 10% della famiglia + filo sinistro 2px, senza bordo intorno. Ora in testa al blocco nel font del testo.
- `fixed: true` → `.tl-item--locked`: tinta 16% e filo 3px (niente lucchetto nel blocco).
- `optional` → solo filo e contorno leggero, **senza fondo e senza tratteggio**.
- `free` e buchi `.tl-gap`: spazio vuoto con l'orario in grigio. Nessun tratteggio, nessuna pillola.
- Legenda (`Legenda` nella barra filtri): le 4 famiglie + come si leggono fisso e facoltativo. Mappa in JS:
  `FAMILY`/`FAMILY_LABEL` in `agenda-gaps.js`; in CSS `.tl-fam--move|fixed|culture|evening`.
- `giorno.html`: stessa famiglia sul filo sinistro di ogni riga (2px; facoltativo = filo al 40%).

Geometria invariata: `--top` = minuti dall'inizio scala × `--tl-hour-h`/60, `--i/--n` per le sovrapposizioni,
container query per i blocchi corti, mobile un giorno per schermata, ≥900 sette colonne.

## Fotografie
Slot `<figure class="photo">` creato da `photoHtml(baseId, città, trip)` in `app.js`: in testa a `giorno.html`
(16:9 mobile, 3:1 desktop) e in cima alle card alloggi (5:2). L'`<img loading="lazy">` c'è solo se `baseId` è in
`trip.photos` (scritto dall'exporter guardando `assets/img/*.jpg`): uno slot vuoto non fa richieste. Senza foto,
o se il file non si carica, resta il blocco colore (`--fg` 7% su `--bg`) con il nome della città in serif.
Nessuna immagine inventata o scaricata: le fornisce il cliente (istruzioni nel README).

## Copy
Frasi complete e corte, voce "voi", niente parentesi annidate, niente "(verificato)", niente sigle interne.
Regole generali in `export_site_data.py` (`plain_copy` dentro `clean_text`: via "(verificato)", "Verificato su X:",
parentesi annidate → virgole; checklist "X — Y" → "X. Y"); riscritture puntuali in `site_overrides.json`
(`transport.bookingGuide` per id `bg-*`, `transport.legs/transfers` per id opzione, `lodging.stays.*.notes`,
`lodging.logistics` per id `bag-N`/`opt-N`/`qN`/`g1-N`, applicata dopo le regole generali). Solo la forma: fatti invariati.

## Componenti ancora disponibili (SPEC §6)
`.btn` (outline) · `.btn--primary` (una per pannello: "Apri in Google Maps") · `.btn--ghost` · `.btn--icon` · `.chip`
(filtri; premuto = indaco) · `.tabs/.tab` (testo con filo sotto, attiva indaco) · `.kv` · `.list/.list-item` ·
`.panel` (bottom sheet mobile, side sheet ≥900) · `.toast` · `.empty` · `.badge` (+ `--todo` per le azioni).
`.card--accent` e le varianti shadcn restano in `base.css` per `_styleguide.html`, ma le pagine non le usano.

## Contrasto e controlli
`dev/contrast-check.js` sul DOM renderizzato (soglie WCAG 4.5/3). 2 ott 2026: 7 pagine × 375/1280 × chiaro/scuro con
tutti i `<details>` aperti, più il pannello agenda aperto in chiaro e scuro → **0 errori**; nessuno scroll orizzontale.
