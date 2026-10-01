# REVIEW_FINAL — agente "review-finale" (1 ott 2026)

Server di prova: `python3 -m http.server 8768` in `site/` (spento a fine lavoro). Chrome DevTools MCP, contesto isolato, dati reali `site/data/`.
Niente git, nessuno script `build_xlsx_v*.py` eseguito, Excel/`data/*.md`/CLAUDE.md non toccati.

## 1. Cosa ho cambiato

### Richieste incrociate di NOTES_design2 §0 e §"Richieste"
| Richiesta | Fatto |
|---|---|
| Tema di default `neutral` | `theme-boot.js`: `theme = 'neutral'`, `neutral` primo in `THEMES`; `app.js`: `FALLBACK_THEMES` con neutral primo, fallback `\|\| 'neutral'` |
| href tema + `theme-color` | 7 pagine: `themes/neutral.css`, `<meta name="theme-color" content="#ffffff">`; `404.html` non ha CSS tema (pagina autonoma con `Canvas`), lasciata così; `dev/test-pages.html`, `dev/test-shell.html` allineati; `_styleguide.html` select con neutral primo |
| `manifest.webmanifest` | `background_color` e `theme_color` → `#ffffff` |
| Frecce agenda | `agenda.html`: `btn btn--ghost btn--icon agenda__nav` + sprite `i-chevron-left/right` (prima `‹ ›` di testo). Stesso per il pager di `giorno.html` |
| Riga «Tipo» nel pannello | Già tolta da ux-content (verificato nel DOM: nessun «Tipo» nel pannello) |
| Orari ripetuti nei buchi di `giorno.html` | `agenda-day.js`: colonna = inizio, testo = «libero fino alle 07:00 (1h)» (prima «06:00 \| 06:00-07:00 · libero (1h)») |
| Stessa variante bottoni in home | «Apri il giorno» ora `btn btn--ghost` come «Tutte le scadenze» (resta un solo bottone pieno: «Mappa del viaggio») |
| MAIUSCOLE residue → textFixes | Nei campi **mostrati** non ce ne sono più (resta solo `mapsQuery` «UFFICIO YAMATO…», non visibile, e `zone`/`mapNote` dei luoghi, non resi). Nessun textFix necessario |

### Richieste di NOTES_ux al design
| Richiesta | Fatto |
|---|---|
| Padding righe luoghi | Già presente: la `ul.list.card` tiene il padding orizzontale della card (20 px a 375, misurato) |
| Titolo gruppo ≥44 px | `.lu-group__head` 52 px (misurato) |
| `min-width:0` passi alloggi | `.al-step__head .stack { min-width: 0; overflow-wrap: anywhere }` |
| Regole orfane | Tolte dopo grep su HTML/JS: `.agenda__notice > summary`, `[open] > summary`, `> div` (×2), `.bu-bar__fill--est`, `.al-step`, `.tr-booking`. `.lu-card*`/`.lu-maps` erano già state tolte da design-polish |

### Bug e ritocchi trovati in QA
- **Avviso agenda** (`div.agenda__notice`): icona su una riga e testo sotto, con rientro da card. Ora riga unica icona 16 px + testo `text-sm` muted (`agenda.css`).
- **`details.card` senza stile** (Trasporti «Già fatte», Alloggi «Regole su valigie e treni», «Alternative scartate», «Domande già risolte»): summary alto 20 px (sotto i 44 px) con marker nativo. Ora trigger Accordion 44 px con chevron che ruota, card compatta da chiusa (62 px) (`pages.css`).
- **`li.list-item.stack` centrato**: righe a colonna (Alternative scartate, Domande risolte) avevano `align-items: center` ereditato da `.list-item` → «Pro: …» rientrato a metà. `base.css`: `.list-item.stack { align-items: stretch }`.
- **Luoghi**: la ★ «segnalato da voi» finiva a metà riga (space-between su 3 figli). Ora accanto al nome, badge «Andiamo?» a destra.

### Testi (exporter / overrides)
- `export_site_data.py`
  - nuova `fix_opz()`: «(opz.)» dentro titoli/note agenda → «+ eventualmente …» / «Facoltativo: …» (12 occorrenze; l'item intero opzionale resta `optional` → badge). `--check` ora fallisce se resta «(opz.)» in titolo/nota di un item.
  - `short_title()`: spazi attorno a «→» anche nei titoli/nomi opzione («Kodama → Mishima + locale», prima «Kodama→Mishima»).
- `site_overrides.json` → 8 `textFixes` nuovi (con `_why`): codici delle opzioni del dossier (A1/A2/E) sostituiti da parole in alloggi (domande bagagli) e trasporti (nota bagagli); budget «(opzione A2)» tolto; «Nozomi/Hikari ris.» → «(posto riservato)»; «JR Hida LTD EXP ris. 12:48» → «JR Hida Limited Express 12:48 (posto riservato)». Report export: 0 textFixes «non trovato».
- Fixture: `cp data/*.json dev/fixtures/` + reinserite le 2 coordinate di test in `dev/fixtures/places.json` (fushimi-inari-taisha, castello-di-osaka) per tenere coperto il ramo «Indicazioni».

### Service worker e doc
- `sw.js`: `CACHE_VERSION` `v2` → `v3`. PRECACHE invariato e già completo: 32 voci, tutte esistenti; tutti i file statici fuori da `dev/ data/ tools/` (esclusi `_styleguide.html`, `sw.js`) sono presenti; nessun font o immagine nuovi. In browser: cache `giappone-static-v3` + `giappone-data-v3` (6 JSON), vecchie cache eliminate.
- `README.md`: prossimo bump `v3 → v4`; il comando rsync esclude anche `REVIEW_FINAL.md`.

File toccati: `assets/js/{theme-boot,app,agenda-day,pages-home}.js`, 7 `*.html`, `_styleguide.html`, `manifest.webmanifest`, `sw.js`,
`assets/css/{base,agenda,pages}.css`, `dev/test-{pages,shell}.html`, `dev/fixtures/*.json`, `data/*` (rigenerati), `README.md`,
`../export_site_data.py`, `../site_overrides.json`, questo file. Backup pre-modifica di exporter e overrides nello scratchpad della sessione.

## 2. Esito dei controlli
| Controllo | Esito |
|---|---|
| `python3 export_site_data.py` / `--check` | OK · «schemi OK» · validazione + privacy OK · 12 ambiguità, 8 fallback (invariati, già noti) |
| `python3 tools/check_site.py` | 12 pagine · **0 errori · 0 avvisi** |
| `dev/test-pages.html` (fixtures / data) | **64/64 · 64/64** |
| `dev/test-agenda.html` (fixtures / data) | **36/36 · 36/36** |
| `dev/test-shell.html` (default / fixtures) | **19/19 · 19/19** |
| `dev/contrast-check.js`: 7 pagine (+404 senza tema) × 375/1280 × neutral chiaro/scuro, washi chiaro/scuro, night = **74 combinazioni**, con tutti i `<details>` aperti | **0 errori AA** |
| Scroll orizzontale di pagina (stesse 74 combinazioni) | **0** |
| Testo «null / undefined / NaN / [object Object]» nel DOM | **0** |
| Console (navigazione reale delle 8 pagine) | **0 messaggi** (nessun errore, nessun warning) |
| Richieste ≥400 | **0**; solo `neutral.css` scaricato di default (niente più doppio download washi→tema) |
| Pannello agenda: apertura, focus nel pannello, Esc chiude, focus torna al blocco | OK |
| Frecce agenda mobile (→ 8 nov, ‹ abilitata) e swipe simulato (scroll della timeline → 11 nov, chip e hash aggiornati) | OK |
| Filtri luoghi persistenti dopo reload (Kyoto + solo «Sì» → 14/326, gruppo aperto) | OK |
| Tab trasporti via hash (`#scadenze`, `#aeroporti`, `#prenotazioni`) | OK |
| `details` chiusi/aperti leggibili (summary 44 px) | OK |
| Classi markup ↔ CSS | Senza regola CSS ma voluti come hook JS/semantica: `al-stay(s)`, `al-lug-alts/-q`, `home-day`, `home-dl__what`, `lu-count`, `lu-sort__select`, `tr-day/-guide/-leg__head/-total/-done` (ora stilato via `details.card`), `tl-gap__label`, `tab--active` (lo stato visivo usa `aria-selected`), `skip-link` (stilato via `a.sr-only:focus`). Solo in CSS: varianti shadcn per la styleguide (`btn--secondary/outline/destructive/link/sm/lg`, `badge--default/…`, `card__*`, `.xs`) e modificatori per type generati dinamicamente (`tl-item--*`, `tl-type--*`, `giorno__item--*`): da tenere |
| Testi in `data/*.json` (gergo, emoji 📎/🗓, «cliente», «tab », null, doppi spazi, URL nudi) | 0 nei campi mostrati. Restano solo in campi **non resi** dei luoghi: `zone` («FUORI ROTTA — … (righe rosse)», maiuscole di città) e `mapNote` («(opz.) 10 sera»); «flagship» è un nome proprio |

## 3. Screenshot
`site/dev/shots_final/` — 44 file:
- tutte le 7 pagine + 404 a 375 e 1280, neutral chiaro e scuro (`<pagina>-<larghezza>-neutral-<light|dark>.png`; 404 senza tema: `404-<w>-<light|dark>.png`);
- agenda e luoghi in washi e night a 375 e 1280 (`agenda-375-washi.png`, `luoghi-1280-night.png`…);
- stati: pannello agenda aperto (`agenda-375-neutral-light-panel.png`), scadenze «Già fatte» aperte, alloggi con details aperti, luoghi filtrati Kyoto, gruppo Osaka aperto in scuro.

## 4. Aperti per il cliente
1. **Repo pubblicato**: in `site/.git` sono tracciati anche `dev/` (fixture = copia dei dati reali), `NOTES_*.md`, `SPEC.md`, `INTEGRATION_REPORT.md`; il README prevede un repo separato via rsync che li esclude. Decidere se pubblicare da `site/` (allora aggiungerli a `.gitignore` e toglierli dall'indice) o dal repo separato.
2. **Telefoni** pubblici nella checklist (Mouriya, Torafugutei) e linea inglese Yamato: tenerli o toglierli (`textFixes`).
3. **Indirizzi** mancanti: Country Hotel Takayama, Glocal Nagoya, Yasudaya, Arai Ryokan (+ civico Yume-no-ya) → `site_overrides.json`.
4. **Pagato / da confermare** Takayama e Shuzenji (badge «pagamento da verificare»).
5. **Aeroporto italiano** di andata/ritorno (`trip.flights.out.from` / `back.to` vuoti).
6. **Domanda aperta 7**: tariffa C o D del bus Gifu del 12 nov (¥3.600 vs ¥3.800).
7. Luoghi a 375: la barra filtri sticky occupa ~185 px su 812 (proposta «Ordina» in fondo o in un menu, NOTES_design2 §7) — non fatto, è una scelta di layout.
8. Facoltativi: «7-24» con trattino non separabile nel titolo; countdown in home che ripete il titolo della topbar; `trip.facts`/`trip.links`/`budget.daily` esportati ma non mostrati; formato €<10 a un decimale («€9,7», voluto e coperto da test).
9. Al prossimo deploy che cambia file statici: `CACHE_VERSION` → `v4`.
