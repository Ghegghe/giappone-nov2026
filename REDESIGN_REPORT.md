# REDESIGN_REPORT: agente "redesign" (2 ott 2026)

Mandato: `DIRECTION.md`. Regole del risultato: `DESIGN.md`. Screenshot: `dev/shots_redesign/before/` e `after/`
(7 pagine × 375/1280 × chiaro/scuro, pagina intera, Chrome headless). `giorno` = `giorno.html?d=2026-11-08`.
Niente git, nessuno script `build_xlsx_v*.py` eseguito; Excel, `data/*.md`, CLAUDE.md non toccati.
Backup pre-modifica di exporter, overrides e `site/` nello scratchpad della sessione.

## Gli 8 artefatti
| # | Prima | Dopo |
|---|---|---|
| 1 | Tutto in card con lo stesso raggio e ombra | Card solo per basi e tratte, senza ombra. Altrove titolo serif, filo, testo (`.section-title`, `.rule-list`, `details.fold`) |
| 2 | Hero "36 giorni" a 72px in un riquadro | Titolo grande in due righe e una riga: "sab 7 → mar 24 nov · 4 persone · tra 36 giorni" |
| 3 | Badge ovunque ("bozza" ×3, "da fare", "scelta", chip di tipo) | Un badge al massimo per riga, solo per azioni (da prenotare, in ritardo, oggi, pagamento da verificare). "bozza" una volta, in testa all'agenda |
| 4 | Icona davanti a tutto | Nav desktop solo parole; lucchetto solo nel pannello; niente icona esterno, orologio, spunta, calendario, info |
| 5 | Griglia "Sezioni" che duplica la nav | Tolta (anche il tasso di cambio e "In tasca"; il link alla My Maps è passato nel footer) |
| 6 | "3 modi (verificati):", "(Nessun account, da ospite)", parentesi annidate | Regole generali nell'exporter e riscritture in `site_overrides.json`: frasi complete, voce "voi". Test: nessun "(verificat", nessuna parentesi annidata nel render |
| 7 | Orari in monospazio, 13 colori nella timeline | Cifre tabulari nel font del testo; 4 famiglie di colore; "libero" come spazio con l'orario grigio, senza tratteggi |
| 8 | Font di sistema, grigi, anonimo | Titoli in serif di sistema a peso normale, un solo accento indaco, slot foto per le 6 basi con fallback |

## Prima / dopo per pagina
- **Home** (`index.html`, `pages-home.js` riscritto). Prima: hero con conto alla rovescia, card "Primo giorno" (3 item,
  badge bozza e base), card 5 scadenze, griglia di 5 sezioni, card "In tasca" con tasso ed esempi.
  Dopo: titolo, una riga, "Prossimo giorno" come lista orario-titolo di tutto il giorno (durante il viaggio da adesso
  in poi, poi domani), le 3 scadenze più vicine, fine.
- **Agenda**. Prima: legenda con 13 chip colorati + tratteggio + lucchetto, ore e orari in mono, buchi tratteggiati con
  pillola, avviso con icona. Dopo: legenda testuale con 4 famiglie; blocchi a tinta 10% con filo 2px, i fissi più pieni,
  i facoltativi senza fondo; buchi vuoti con l'orario grigio; avviso bozza su una riga. Date dei giorni in nero, non indaco.
- **Giorno**. Prima: titolo "dom 8 nov · …", badge base/gita/bozza, chip di tipo + badge fisso/opzionale/prenotazione,
  bottoni Maps con due icone, piè in card evidenziata. Dopo: blocco foto (o colore + "Osaka"), riga "dom 8 nov · Osaka,
  gita a Kyoto", titolo serif, per ogni attività una riga di parole ("Visita · facoltativo") e un solo badge se da
  prenotare, link "Apri in Maps"; totale sopra un filo.
- **Trasporti**. Prima: TabsList grigia con badge contatore, opzione scelta con spunta e filo verde, icona orologio,
  badge "da prenotare"/"prenotato", guida prenotazioni in card, scadenze in card con badge "da fare" su ogni riga.
  Dopo: schede sottolineate (contatore in grigio), tratte ancora in card (sono confrontabili), meta in testo e una
  seconda riga "da prenotare · Apre dom 11 ott, dalle 3:00 alle 16:30, ora italiana."; guida come sezioni tipografiche;
  scadenze a fili, badge solo "oggi"/"in ritardo"; "Già fatte" ripiegate a filo.
- **Alloggi**. Prima: card con badge pagamento, bottone Maps nero con due icone, logistica tutta in card (scelta in
  card evidenziata, passi con cerchi neri, details in card). Dopo: card con slot foto in cima, stato pagamento come
  parola (badge solo "pagamento da verificare"), bottone Maps outline solo testo; logistica tipografica: frase sulla
  scelta, passi numerati in serif grigio, regole/alternative/domande ripiegate a filo; "Da chiarire" a fili.
- **Luoghi**. Prima: badge "Sì"/"Forse" su ogni riga, conteggio gruppi in badge, righe dentro card, chip giorni con
  icona. Dopo: flag come parola nella riga dei dettagli ("forse"; "sì" sottinteso), conteggio grigio accanto alla
  città, liste a fili, chip giorni solo testo. Filtri invariati.
- **Budget**. Prima: due card KPI (una evidenziata), badge "stima", card di note. Dopo: due cifre in serif senza
  riquadro, "stima" come parola, tabelle a fili con barre grigie, nota in testo.
- **Shell**. Topbar: titolo in serif, niente quadratino-marchio. Nav: mobile icona + etichetta (attiva in indaco,
  senza pillola); desktop solo parole con filo sotto l'attiva. Footer: data dei dati e link alla mappa; via i
  selettori Tema/Modo (il modo resta nel pulsante della topbar).

## File toccati
`assets/css/{base,pages,agenda}.css`, `assets/css/themes/neutral.css`, `assets/js/{app,theme-boot,pages,pages-home,
pages-trasporti,pages-alloggi,pages-luoghi,pages-budget,agenda,agenda-day,agenda-gaps}.js`, `agenda.html`,
`giorno.html`, `sw.js` (`CACHE_VERSION` v5, washi/night fuori da PRECACHE), `tools/check_site.py` (esclusione dei
vecchi temi), `dev/test-{pages,agenda}.html`, `dev/fixtures/*.json` (copia dei dati + 2 coordinate di test in
`places.json`), `assets/img/.gitkeep`, `README.md`, `DESIGN.md`, questo file;
`../export_site_data.py` (`plain_copy`, id `bg-*`/`bag-N`/`opt-N`/`qN`/`g1-N`, override `lodging.logistics` dopo le
regole generali, `trip.photos`), `../site_overrides.json` (riscritture di copy), `data/*.json` rigenerati.

## Controlli (2 ott 2026)
| Controllo | Esito |
|---|---|
| `python3 export_site_data.py` / `--check` | OK · schemi OK · privacy OK · 12 ambiguità e 8 fallback, gli stessi di prima |
| `python3 tools/check_site.py` | 12 pagine · 0 errori · 0 avvisi |
| `dev/test-pages.html` (fixture / data) | 70/70 · 70/70 (test aggiornati: home, link senza icona, slot foto, badge, copy) |
| `dev/test-agenda.html` | 38/38 (nuovi: blocco fisso senza lucchetto, 4 famiglie in legenda, buchi senza tratteggio) |
| `dev/test-shell.html` (default / fixture) | 19/19 · 19/19 |
| `dev/contrast-check.js`: 7 pagine × 375/1280 × chiaro/scuro, `<details>` aperti, + pannello agenda chiaro/scuro | 0 errori AA |
| Scroll orizzontale (28 combinazioni) | 0 |
| Console sulle 7 pagine × 4 combinazioni | 0 messaggi (nessun 404: gli slot foto vuoti non fanno richieste) |
| Testo "null / undefined / NaN / [object" nel DOM | 0 |

## Cosa resta aperto
1. **Foto**: gli slot mostrano il blocco colore. Servono 6 JPEG del cliente (`assets/img/<baseId>.jpg`, 1600×900,
   ≤160 KB, poi rilanciare l'exporter): istruzioni nel README.
2. **Copy non riscritto**: titoli e note dell'agenda (127 item) e testi della checklist scadenze hanno avuto solo le
   regole generali (niente "(verificato)", "X — Y" → "X. Y"). Restano forme brevi da appunti, per esempio
   "Account smartEX con la Revolut fisica (3-D Secure). Sito aperto 22:30 → 16:30 italiane". Da fare con la revisione
   dell'agenda, in `site_overrides.json` (`agendaItems`); la checklist non ha id: servirebbe aggiungerli nell'exporter.
3. **Domande già risolte** sui bagagli: q3 conserva la formula "Alternativa aperta 7 lug 9-19" del dossier. Non è chiaro
   se voglia dire "aperta 7 giorni su 7" o una data: non l'ho riscritta per non cambiare il fatto.
4. **Dati in conflitto nel sorgente**: la guida dice Limousine Bus "verso le 11:45", la tratta consiglia le 11:20.
   Lasciati entrambi (non è una questione di forma).
5. La **My Maps** ora è solo nel footer; il tasso di cambio è solo nella nota del budget; i voli (andata 12:10, ritorno
   16:55) solo in agenda. Se servono in home, contraddicono DIRECTION ("poi fine").
6. `SPEC.md` §0 parla ancora di tre temi intercambiabili: superato da DIRECTION e DESIGN, non modificato.
7. `_styleguide.html` mostra ancora il selettore temi (pagina di prova, non linkata e non precacheata).
8. Aperti ereditati da REVIEW_FINAL §4: repo pubblicato, telefoni pubblici, indirizzi mancanti di 4 basi, pagamenti
   Takayama/Shuzenji da verificare, aeroporto italiano, tariffa C/D del bus Gifu.
9. Al prossimo deploy che cambia file statici: `CACHE_VERSION` → `v6`.
