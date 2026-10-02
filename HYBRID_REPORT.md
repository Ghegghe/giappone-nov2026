# HYBRID_REPORT: agente "ibrido" (2 ott 2026)

Decisione del cliente: **struttura e look della versione A** (`4d4a952`, shadcn) + **solo alcune pulizie della B**
(`dc1652a`, editoriale). Regole del risultato: `DESIGN.md` § "Ibrido 2 ott". Screenshot: `dev/shots_hybrid/`
(7 pagine × 375/1280 × chiaro/scuro, pagina intera, tema `neutral`; più `agenda-panel-375-light.png`).
Nessun commit/checkout/reset/stash: i file di A sono stati letti con `git show 4d4a952:<path>` e scritti nella working
tree. Backup della working tree di HEAD (pulita all'inizio) in `scratchpad/Bbackup/site_head_worktree.tar`.

## Ripreso da A (contenuto di `4d4a952`, poi ritoccato come sotto)
`agenda.html`, `giorno.html`, `assets/css/{base,pages,agenda}.css`, `assets/css/themes/neutral.css`,
`assets/js/{app,theme-boot,pages,pages-home,pages-trasporti,pages-alloggi,pages-luoghi,pages-budget,agenda,agenda-day,agenda-gaps}.js`,
`sw.js`, `tools/check_site.py`, `dev/test-{agenda,pages}.html`.
Già uguali fra A e HEAD, quindi non toccati: `index.html` e le altre pagine, `manifest.webmanifest`, `assets/icons/*`,
`washi.css`/`night.css` (salvo la mappa delle famiglie), `dev/test-shell.html`.
Risultato: 3 temi col selettore nel footer (default `neutral`), card, nav con icone, hero e card in home.

## Restato di HEAD (livello dati)
`../export_site_data.py`, `../site_overrides.json`, `data/*.json`, `dev/fixtures/*.json`: non toccati, non rigenerati.
Compatibilità JS di A con i JSON di HEAD verificata: le chiavi di HEAD sono un soprainsieme di quelle di A
(in più solo `id` in `lodging.logistics.*` e `transport.bookingGuide[]`, e `trip.photos`). L'`id` della guida ora è
anche l'`id` della card in Trasporti (`pages-trasporti.js`). Bus Narita: 11:20 in tutti i testi (nessun 11:45 su NRT).

## Pulizie di B portate in A
| Pulizia | Dove |
|---|---|
| Un badge al massimo per riga | `agenda-day.js` (tipo = chip, stati a parole, unico badge "da prenotare"; base/gita = testo), `pages-home.js` (base/gita = testo), `agenda.js` pannello (chip tipo + un badge) |
| "bozza" una sola volta, in testa all'agenda | `agenda.js` (via badge per colonna e nel pannello, via `allDraft`), `agenda-day.js`, `pages-home.js` |
| Timeline a 4 famiglie | `themes/{neutral,washi,night}.css`: `--fam-move/-fixed/-culture/-evening` per modo, `--c-<type>` → famiglia, `--c-free` = `--fg-muted`; `agenda-gaps.js` `FAMILY*`; legenda a 4 famiglie (`agenda.js`, `agenda.css` `.tl-fam--*`) |
| "Libero" senza tratteggio | `base.css` `.tl-gap` (niente gradiente né pillola), `.tl-item--free`; `agenda.css` buco del giorno senza filo, `tl-gap--edge` tolto; facoltativi non più tratteggiati |
| Lucchetto solo nel pannello | `agenda.js` (`.tl-item--locked` = tinta 20%, niente icona nel blocco), `agenda-day.js`, `pages-home.js` |
| Niente slot foto | A non li aveva; `photoHtml` e gli slot di B non sono stati ripresi. `trip.photos` resta nei dati, ignorato |
| Home: via "Sezioni" e tasso di cambio | `pages-home.js` (via `sectionsGrid` e le righe Cambio/Esempi/Fonte), `pages.css` (via `.home-grid*`) |
| Cifre tabulari, niente monospazio | `base.css` `.mono` = solo `tabular-nums`; ore della timeline e numeri del date bar senza `--font-mono` |
| SW | `CACHE_VERSION` `v6`, PRECACHE con i 3 temi (come A); `check_site.py` di A (temi controllati) |

Documentazione: `DESIGN.md` (base A + sezione "Ibrido 2 ott" + tabella famiglie), `README.md` (temi di nuovo,
via le istruzioni foto), `_styleguide.html` (esempio timeline senza lucchetto).

## Controlli (2 ott 2026, `python3 -m http.server 8770`, Chrome DevTools MCP, contesto isolato)
| Controllo | Esito |
|---|---|
| `python3 tools/check_site.py` | 12 pagine · 0 errori · 0 avvisi |
| `python3 export_site_data.py --check` | schemi OK (non rigenerato) |
| `dev/test-agenda.html` | 44/44 (nuovi: niente lucchetto nei blocchi, 4 famiglie e 4 colori in legenda, ≤4 colori di blocco, buchi e facoltativi senza tratteggio, orari non mono, niente badge bozza) |
| `dev/test-pages.html` fixture / `?data=data/` | 70/70 · 70/70 (nuovi: niente "Sezioni", niente cambio, hero e card presenti, niente bozza/lucchetto in home, nessuno slot foto) |
| `dev/test-shell.html` | 19/19 |
| 7 pagine × 375/1280 × chiaro/scuro (neutral): contrasto AA con `<details>` aperti, pannello agenda aperto | 0 errori |
| Stesse 7 pagine a 375 in washi e night, chiaro/scuro | 0 errori AA |
| Scroll orizzontale · risposte 4xx · testo null/undefined/NaN · badge multipli per riga · lucchetti fuori dal pannello · slot foto · font mono | 0 su 28 combinazioni |
| Console | 0 messaggi |

## Aperti
1. `assets/img/.gitkeep` (di B) è rimasto: l'exporter guarda quella cartella per `trip.photos`. Innocuo; si può togliere.
2. `DIRECTION.md` e `REDESIGN_REPORT.md` descrivono B: superati da questo file e da `DESIGN.md`, non modificati.
3. Titoli dell'agenda con " — " (es. "Concerto — Vantelin Dome") vengono dai dati: non toccati (livello dati fuori mandato).
4. Al prossimo deploy che cambia file statici: `CACHE_VERSION` → `v7`.
