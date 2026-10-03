# PRESENTAZIONE_REPORT: integrazione della fase "presentazione dati" (2 ott 2026, sera)

Base: HEAD `13e2d7a` + lavoro non committato di A (home, agenda, giorno), B (trasporti, alloggi, luoghi), C (budget, grafici)
e dell'integratore. Piano: `PLAN_PRESENTAZIONE.md`. Regole permanenti: `DESIGN.md` § "Presentazione dati (2 ott, sera)".
Misure su `python3 -m http.server 8775` + Chrome DevTools, in CSS px (`scrollHeight`), `localStorage` con solo tema e modo, dati `data/`.
**Niente commit:** tutto è nella working tree.

## 1. Cosa è cambiato, per pagina
| Pagina | Cambiamento |
|---|---|
| Home (A) | Hero = una frase col numero (`.hero-fig`, cifre proporzionali) + striscia della rotta (`routeStrip`); "Prossime scadenze" a 3 voci con "tra N giorni"; "Primo giorno" con titolo e base su una riga. Nuovo `home.css`. |
| Agenda (A) | `--tl-hour-h` 72px solo in `.agenda .timeline` da desktop; titoli con line-clamp a scalini; intestazione su 2 righe con filo `--accent` al cambio base; scroll iniziale 30' prima della prima tappa delle colonne visibili; `aria-label` col titolo intero su ogni blocco. |
| Giorno (A + integratore) | Nastro del giorno 06-24 (tap = vai alla tappa) con legenda; riga tappa compatta: orario · titolo · Maps solo icona 44px; riga 2 = pallino + tipo, costo, **nota sul costo, luogo, stati, badge "da prenotare" e dove/quando** (spostati qui dall'integratore: prima stavano in una riga sotto la nota); riga 3 = nota intera. |
| Trasporti (B) | Tratte: catena verticale basi/tratte in testa, card più dense; Scadenze: `dotTimeline` da oggi alla partenza + lista per mese con "tra N giorni". |
| Alloggi (B) | `routeStrip` con link alle card; prezzo/pagamento subito sotto il nome; Maps outline-icona, nessun `.btn--primary`; note: 2 visibili + "Altre N note". |
| Luoghi (B + integratore) | Gruppi con date e conteggi sì/forse/in agenda; si apre la base di oggi o la prossima; Sì e Forse come sotto-elenchi; icona tipo da `TYPE_ICON` (anime/otaku/Love Live = nuova `i-anime`). |
| Luoghi, filtri (3 ott) | Filtri compattati: cerca + select città su una riga, Sì/Forse/No segmentato con conteggio e popover "Altro" (altri flag, ordinamento); blocco filtri a 375 da 185 a 107px (−42%), pagina 4321 → 4243px. Select del sito con chevron proprio (`base.css`). |
| Budget (C) | Un solo numero (a persona) + `stackBar` pagato / prezzo noto / stima; titoli di sezione con subtotale e %; `bulletRows` 18 giorni (agenda contro budget); tabelle gemelle. |

**File condivisi toccati dall'integratore:** `sw.js` (PRECACHE + 5 file, `CACHE_VERSION` v7) · `themes/neutral|washi|night.css` (solo le 4 `--fam-*`) ·
`base.css` (`.badge--fixed` e `.badge[style*="--bc"]`: testo 80% verso `--fg`) · `agenda.css` (chip del pannello: testo 80% verso `--fg`; `.giorno__more` tolto) ·
`agenda-day.js` (riga 2) · `charts.js`/`charts.css` (2 difetti, §4) · `pages-luoghi.js` (icona `anime`) · `pages-b.css` (gradino titoli nei temi serif) ·
`pages.css` (regole morte tolte) · `home.css` (commento) · `sprite.svg` (`i-anime`) · `dev/test-pages.html` (2 asserzioni) · `DESIGN.md` · `README.md` · `_styleguide.html`.

Regole tolte da `pages.css` (verificato con grep su html/js/css che nessuno le usa o che `home.css`/`pages-b.css` le sovrascrivono per intero):
tutto il blocco `.home-count*` (anche `.home-count .h1`, `.home-count__n`, il bordo di `.home-count__big + .small`), `.home-day__head`,
`.tr-opt--chosen` (filo verde, azzerato da `pages-b.css`), `.al-stay__head .h2`, `.bu-kpi*`. **Tenute** `.home-day__item, .home-dl`
(danno `display: grid` e `gap`, che `home.css` non ridefinisce), `.home-day__time`, `.home-dl__when`.

## 2. Criteri di accettazione: prima / dopo
| Criterio | Prima (piano) | Dopo | Esito |
|---|---|---|---|
| Home a 375 (neutral / washi) | 1997 | 1615 / 1615 | ≤ 1700 OK |
| Giorno 8 nov a 375 (neutral / washi) | 3206 | 2023 / 2023 | ≤ 2200 OK |
| Giorno 15 nov a 375 (neutral / washi) | 3237 | 2229 / 2257 | ≤ 2300 OK |
| Trasporti (Tratte) a 375 | 3193 | 2585 / 2585 | ≤ 2600 OK |
| Alloggi a 375 | 5086 | 3588 / 3588 (washi era 3644 prima del gradino serif) | ≤ 3600 OK |
| Budget a 375 | 2282 | 2905 / 2905 | > 2600: **accettato dal coordinatore** |
| Luoghi a 375 | n.d. | 4321 / 4321 | nessun tetto nel piano |
| Agenda 1280: titoli troncati | 45/127 | 7/127 (0 nei blocchi ≥ 60'), uguale in neutral chiaro/scuro e washi | ≤ 8 OK |
| Agenda 1280: intestazioni troncate | 18/18 | 1/18 | ≤ 4 OK |
| Agenda: `aria-label` sui blocchi | n.d. | 127/127 | OK |
| Testo "Apri in Google Maps" nel giorno | 11 | 0 | OK |
| Scroll orizzontale a 375 | n.d. | nessuno, 7 pagine × 3 temi + styleguide | OK |
| `.btn--primary` dentro `.al-stay` | 6 | 0 (asserzione in test-pages) | OK |

Night a 375 ha le stesse altezze di washi (stesso gradino serif). Con `?data=dev/fixtures/` tutte le 7 pagine si rendono senza "undefined/NaN".

## 3. Test, check, contrasto, console
- `python3 tools/check_site.py` → **13 pagine HTML · 0 errori · 0 avvisi** (prima dell'integrazione: 5 errori PRECACHE).
- `dev/test-pages.html` **69/69** ("Tutti i test OK") · `dev/test-agenda.html` **44/44** · `dev/test-charts.html` **32/32** (anche `&today=2026-11-12`) · `dev/test-shell.html` **19/19**.
- `dev/contrast-check.js`, 7 pagine, tutti i `<details>` aperti: a 375 in neutral chiaro, neutral scuro, washi chiaro, washi scuro, night → **0 errori** in tutte e 35 le combinazioni
  (index 71 elementi, agenda 489, giorno 120, trasporti 305, alloggi 193, luoghi 634, budget 227); a 1280 neutral chiaro/scuro → 0 errori.
  Inoltre ogni tab di trasporti (4) e alloggi (3) e il pannello agenda aperto (con `.badge--fixed`) nei 5 temi/modi → 0 errori.
  `_styleguide.html`: restano solo il bottone "Disabilitato" e il toast nascosto (esclusi per convenzione, DESIGN § Contrasto).
- Console: nessun errore sulle pagine del sito nei 3 temi. Gli unici 404 sono di `dev/`: `data/non-esiste.json` (voluto, test-shell) e
  `dev/assets/icons/sprite.svg` (le pagine di test rendono le icone con il path relativo del sito: preesistente, solo dev).
- Difetti incrociati verificati: `dotTimeline` con la prossima scadenza oggi → un'etichetta sola "oggi · 2 scadenze" (x 12, larga 103) più "partenza 7 nov" (x 245),
  nessuna sovrapposizione; `routeStrip` "partenza 7 nov" → `fill` = `--fg`, opacità 1 in tutti i temi (la dissolvenza ora tocca solo il filo).

## 4. Validatore dataviz (`validate_palette.js --pairs all --surface <card>`) e contrasto testo
Testo calcolato con `contrast()` del validatore e mix sRGB come `color-mix(in srgb)`: "testo80/t12" = chip e badge (famiglia 80% verso `--fg` su tinta 12%),
"orario80/t20" = orario dei blocchi fissi. Tutti ≥ 4,5. "raw/t11" è il colore puro sulla tinta 11% (la vecchia ricetta della chip):
in washi scuro scende a 4,22-4,45, ed è per questo che chip e badge ora usano la ricetta 80%.
```
== neutral light (light, card #ffffff)
Palette (light, surface #ffffff, categorical): 4 slots
  [PASS] Lightness band         all 4 inside L 0.43–0.77
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #823b15↔#247a4b ΔE 8.1 (deutan) · tritan 6.2
  [PASS] Normal-vision floor    worst all-pairs #823b15↔#9d1172 ΔE 16.8 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1


#2b4aa4 #9d1172 #247a4b #823b15 card 8.02 | raw/t11 6.73 | testo80/t12 8.33 | orario80/t20 7.30 | fg/t20 14.39
== neutral dark (dark, card #18181b)
Palette (dark, surface #18181b, categorical): 4 slots
  [PASS] Lightness band         all 4 inside L 0.48–0.67
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #c76ab5↔#5390eb ΔE 9.0 (protan) · tritan 4.1
  [PASS] Normal-vision floor    worst all-pairs #c76ab5↔#5390eb ΔE 18.6 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1


#5390eb #c76ab5 #53a473 #d47421 card 5.53 | raw/t11 4.80 | testo80/t12 6.04 | orario80/t20 5.28 | fg/t20 12.70
== washi light (light, card #fffcf6)
Palette (light, surface #fffcf6, categorical): 4 slots
  [PASS] Lightness band         all 4 inside L 0.43–0.77
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #a54d07↔#1c7851 ΔE 8.5 (deutan) · tritan 8.3
  [PASS] Normal-vision floor    worst all-pairs #812a62↔#2e4b9a ΔE 17.1 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1


#2e4b9a #812a62 #1c7851 #a54d07 card 7.92 | raw/t11 6.68 | testo80/t12 7.61 | orario80/t20 6.66 | fg/t20 11.43
== washi dark (dark, card #1e2128)
Palette (dark, surface #1e2128, categorical): 4 slots
  [PASS] Lightness band         all 4 inside L 0.48–0.67
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #60a46f↔#ba79ac ΔE 8.4 (deutan) · tritan 4.7
  [PASS] Normal-vision floor    worst all-pairs #ba79ac↔#4a97e1 ΔE 16.3 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1


#4a97e1 #ba79ac #60a46f #d37812 card 5.22 | raw/t11 4.45 | testo80/t12 5.30 | orario80/t20 4.61 | fg/t20 9.43
== night (dark, card #101219)
Palette (dark, surface #101219, categorical): 4 slots
  [PASS] Lightness band         all 4 inside L 0.48–0.67
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #c18434↔#42a878 ΔE 8.4 (deutan) · tritan 3.5
  [PASS] Normal-vision floor    worst all-pairs #c18434↔#42a878 ΔE 17.0 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1


#5c93e4 #bc69ab #42a878 #c18434 card 6.01 | raw/t11 5.25 | testo80/t12 5.97 | orario80/t20 5.20 | fg/t20 9.19
```
Ogni blocco termina con `→ ALL CHECKS PASS`. Nessun WARN CVD (minimo 8,1 in neutral chiaro).
Rampa ordinale della `stackBar` (100/68/45% di `--fam-move` verso la card) sulle nuove tinte di washi e night (`--ordinal`):
```
Palette (light, surface #fffcf6, ordinal ramp): 3 slots
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #a1accd at 2.21:1 vs surface
  [PASS] Single hue             hue spread 5°
Palette (dark, surface #1e2128, ordinal ramp): 3 slots
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #32567b at 2.11:1 vs surface
  [PASS] Single hue             hue spread 1°
Palette (dark, surface #101219, ordinal ramp): 3 slots
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #324c74 at 2.16:1 vs surface
  [PASS] Single hue             hue spread 1°
```
(neutral chiaro e scuro: già validati da C in `NOTES_C`, PASS, light-end 2,21:1 e 2,11:1.)

Carattere delle tinte: washi chiaro indaco / prugna / pino / kaki sulla carta (il vermiglio resta solo al primario); washi scuro le stesse
schiarite; night blu, malva, verde giada, ocra, freddi contro l'ambra del primario.

## 5. Screenshot finali (`dev/shots_pres/final/`, 34 file)
7 pagine × 375/1280 × neutral chiaro/scuro (`<pagina>-<larghezza>-<light|dark>.png`; giorno = 8 nov), più `agenda-1280-washi`,
`giorno-375-washi`, `budget-375-night`, `luoghi-375-night`, `trasporti-scadenze-375-light`, `index-375-washi`.
Negli scatti a pagina intera la bottom-nav (`fixed`) compare a metà pagina: è un effetto della cattura.

## 6. Richiede exporter (consolidato: piano §5 + NOTES A/B/C)
| Idea | Dato mancante | Oggi |
|---|---|---|
| Composizione "pagato" esatta | `perPerson.common[].paid` (+ `paidDate`): l'assicurazione (€47,86) è pagata solo nella nota | finisce in "prezzo noto" |
| Pagato dei trasporti | `legs[].options[].booking.paidEur` o stato `done` dopo l'acquisto | tutti `todo` (corretto a oggi) |
| Orari nella catena trasporti | `options[].dep` / `arr` strutturati (oggi dentro `name`) | si mostra il `name` |
| Link stabili dalla striscia Scadenze | `checklist[].id` stabile | id `chk-N` generati dall'ordine |
| Mappa luoghi, "Indicazioni" | `places[].lat/lon` (0 su 326) | solo Maps per ricerca |
| Tipo di luogo normalizzato | `places[].typeFamily` (oltre 40 valori in `type`) | parole chiave in `TYPE_ICON` |
| Scadenze per area | `checklist[].category` | un solo elenco |
| Budget per giorno per categoria | `daily[].byCategory` | solo totale agenda / previsto |
| Tappa agenda → card tratta | `items[].legId` | nessun link |
| Orari e indirizzi di 4 alloggi | `checkInTime`/`address` vuoti (takayama, nagoya, uchiura; indirizzo shuzenji) | non mostrati |
| Foto delle basi | `trip.photos` (`[]`) | nessuna |

A: niente di nuovo. C: nessun campo nuovo oltre a `paid` per voce.

## 7. Problemi aperti
1. **Budget 2905px a 375** (tetto del piano 2600; accettato dal coordinatore). Le due leve proposte da C restano da decidere:
   (a) togliere i `tfoot` delle tabelle, ridondanti col titolo di sezione (−90px, cambia 2 asserzioni "totale della tabella" in test-pages);
   (b) "Una tantum" in `<details>` (−450px).
2. **Etichette del bullet:** la regola del piano "budget ≥ 2× agenda" non seleziona il 15 nov; C usa "massimo + 2 margini più ampi".
   A 375 l'etichetta del 15 nov non ci sta (resta nel tooltip e nella tabella).
3. **Luoghi 4321px a 375**: nessun tetto nel piano; è la pagina più lunga (166 luoghi, un gruppo aperto).
4. Le pagine `dev/test-*` chiedono lo sprite a `dev/assets/…` (404 solo in dev, preesistente).
5. Il gradino serif di `pages-b.css` è un ritocco per tema (`:root[data-theme=washi|night]`) dentro un CSS di pagina: se il cliente
   preferisce, l'alternativa è un `--title-step` nei temi.
6. **Code review 2 ott: 6 finding corretti.**
   - Luoghi: `open: []` salvato dalla versione vecchia bloccava il default (base di oggi/prossima) → vale solo con `openTouched: true`, scritto al primo clic su un gruppo.
   - Alloggi: `alloggi.html#tokyo` (o reload dopo la striscia) non scorreva alla card → dopo il mount `scrollIntoView` + `focus`, stesso codice del clic.
   - Trasporti: `#transfer-kix` all'apertura diventava `#aeroporti` (tabs.show) → dopo `goTo` riuscito si rimette l'hash della card (`pages.js` invariato).
   - Tap target: area trasparente 44px d'altezza, larga ≥ 44 e centrata (`.giorno-strip__tap`, `.chart__tap`), senza sovrapposizioni: vince la più stretta, una larga ≥ 44 resta ≥ 44, fra due strette si taglia a metà (giorno 15 nov: 12 tappe in 343px → 11-42px; alloggi 30-127px).
   - charts.js: i `ResizeObserver` si disconnettono (e la figura esce dallo stato) quando la figura non è più nel DOM.
   - agenda.css: tolti i fallback `#hex` di `--fam-*` (definiti in tutti e 3 i temi, verificato in neutral/washi/night).

## 8. Decisioni prese dal coordinatore al posto del cliente (da confermare)
1. **Palette delle famiglie nuova** in tutti e 3 i temi: "orari fissi" da cremisi a prugna-lacca, "cibo e sera" da arancio a terra bruciata/kaki/ocra
   (le vecchie fallivano il validatore). Alternativa più vicina ai colori vecchi in neutral: `#2b4aa4,#931157,#247a4b,#b44c0d` (CVD 7,9 = WARN).
2. **Giorno: pallino + parola** invece della chip colorata del tipo.
3. **Maps solo icona 44px** (giorno, alloggi, luoghi), outline in alloggi: nessun bottone primario nelle liste.
4. **Budget: un solo numero grande** (a persona), niente card KPI.
5. **Luoghi: Sì/Forse come sotto-elenchi**, senza badge flag per riga.
6. **Budget a 2905px accettato** (vedi §7.1).
7. (integratore) Testo nel colore di famiglia = 80% verso `--fg` (chip pannello, `.badge--fixed`, badge `--bc`): poco più scuro di prima, serve per l'AA in washi scuro.
