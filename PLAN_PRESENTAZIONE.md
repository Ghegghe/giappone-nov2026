# PLAN_PRESENTAZIONE: presentazione dei dati e grafica (2 ott 2026)

Piano del design lead. **Qui non si implementa nulla.** Base: HEAD `13e2d7a` (ibrido A + pulizie B), `SPEC.md` §0 invariato,
`DESIGN.md` § "Ibrido 2 ott" invariato salvo le eccezioni scritte qui sotto e marcate **[decisione cliente]**.
Ogni misura riportata come "oggi" l'ho presa il 2 ott su `python3 -m http.server 8771` con Chrome DevTools (CSS px, non device px).

## 0. Cosa ho verificato rispetto alle osservazioni del coordinatore

| Osservazione | Esito | Misura / fonte |
|---|---|---|
| giorno.html a 375 lungo 6372px | **vero, ma sono px del device (DPR 2)**: in CSS sono **3206px** (8 nov, 11 tappe) e 3237px (15 nov, 12 tappe) | `scrollHeight` a 375×812 |
| Ogni tappa ripete chip tipo, costo e riga "Apri in Google Maps" | vero: 11 link testuali "Apri in Google Maps" su 11 tappe; circa 250px per tappa | `agenda-day.js` `itemRow()` |
| Budget: manca la composizione (pagato/da pagare, viaggio/una tantum) | vero. I dati per farla **ci sono in parte**: `paidSoFar.flightsEurGroup` 3224, `lodgingEurGroupPaid` 1534,42, `lodgingEurGroupToPay` 1366,98, `estimate` per voce. In più esiste `budget.daily[]` (18 giorni, `eurPlanned` e `eurAgenda`) che **nessuna pagina usa** | `data/budget.json` |
| Budget: numeri grandi in card da dashboard | vero: due card KPI affiancate; in più l'importo grande ha `.mono` = `tabular-nums`, anti-pattern dataviz su un numero isolato | `pages-budget.js` |
| Trasporti: una card per tratta, catena non visibile | vero: 8 card + 2 transfer; 3193px a 375 | screenshot + misura |
| Scadenze è il contenuto più utile ora | vero: 16 scadenze da fare su 26, la prima l'11 ott | `transport.checklist` |
| Luoghi: accordion chiusi, una pagina di chevron | vero: 13 gruppi chiusi; 166 risultati su 326 (Sì 76 + Forse 86 + 4 con flag vuoto ma in agenda: `flagPass`) | `pages-luoghi.js` |
| Luoghi: Sì/Forse poco distinguibili, nessun segno del tipo | vero: un badge (`badge--done` / `badge--opt`) per riga; `type` è testo libero con **più di 40 valori** | `places.json` |
| Agenda 1280: titoli troncati | vero: **45 blocchi su 127** hanno il titolo tagliato, **18 su 18** intestazioni di giorno tagliate | misura `scrollHeight > clientHeight` |
| Asse ore parte da 12 perché scrollato | vero in parte: la scala va 06-23, ma all'apertura `scrollTop` = 317px, cioè le 11:40, allineato alla prima tappa del 7 nov. Le tappe delle 07:00 dell'8 nov restano nascoste sopra | `#agenda-timeline.scrollTop` |
| Home: numerone in card | vero; anche qui `.home-count__n.mono` = cifre tabulari su un numero grande | `pages-home.js`, `pages.css` |

Altre cose emerse:
- **Le 4 famiglie colore della timeline non passano il validatore dataviz** (§3.1), in nessuno dei tre temi.
  Il caso più grave: con la vista normale (senza daltonismo) "orari fissi" e "cibo e sera" distano ΔE 9,9, sotto la soglia 15.
- Alloggi a 375 è la pagina più lunga: **5086px**. Il motivo sono le note (Arai Ryokan: 8 punti elenco) e i 6 bottoni neri "Apri in Maps".
- Nessun luogo ha `lat`/`lon` (0 su 326): niente mappa e niente "Indicazioni" per ora.
- Negli screenshot a pagina intera la bottom-nav compare a metà pagina. È un effetto della cattura (nav `fixed`), non un bug.

---

## 1. Token plan

### 1.1 Prima passata (frontend-design)
- **Soggetto:** il quaderno di viaggio di 4 amici (anime, onsen, cibo, vita notturna), letto sul telefono in treno o in coda, e da desktop per preparare il viaggio.
  Ha due compiti: oggi le scadenze (siamo a 36 giorni dalla partenza), in viaggio il giorno corrente.
- **Colore:** il neutral zinc resta (scelta del cliente). I colori di dato sono le 4 famiglie, ricalibrate (§3.1). Nient'altro.
- **Tipo:** un solo stack sans di sistema "stile Inter", quello che c'è già. I ruoli sono in 1.4.
- **Layout:** la colonna mobile da 343px utili guida tutto. Su desktop la stessa colonna si allarga a 2 colonne solo dove gli oggetti si confrontano (alloggi, home).
- **Principio guida:** **"la rotta è il filo"**. Le stesse 6 basi in 17 notti compaiono come una striscia in home, alloggi e trasporti. È l'elemento riconoscibile del sito.

### 1.2 Revisione rispetto al brief (cosa ho cambiato e perché)
| Prima idea (default da template) | Rivista | Perché |
|---|---|---|
| Budget con 3 KPI card (totale, gruppo, pagato) | **Un solo numero grande** (a persona) con la barra di composizione sotto; il totale di gruppo è una riga | La "KPI row" di card identiche è il kit SaaS (trait 4); il dato che serve è uno solo |
| Striscia della rotta colorata con 6 tinte, una per base | **Grigio + enfasi su una sola base** (quella di oggi o la prossima), nomi scritti sulla striscia | 6 tinte categoriche per dati già etichettati sprecano il canale colore (dataviz: "emphasis") |
| Righe meta "A · B · C · D" ovunque | **Al massimo 2 elementi uniti dal punto**; da 3 in su si usano colonne o `kv` | La catena di punti medi è chrome da template (trait 5) e oggi su mobile va a capo male |
| Icona Maps + testo + icona esterno su ogni tappa | **Bottone solo icona 44px** (`mapsIconBtn`, esiste già in `pages.js`) con `aria-label` completo | Una riga di 44px per tappa in meno; il pin è una convenzione che tutti riconoscono |
| Numeri in `.mono` anche quando sono grandi | `tabular-nums` **solo in colonna** (orari, tabelle, assi); cifre proporzionali per hero e totali | Regola dataviz "proportional figures for big numbers" |
| Animazione d'ingresso sulle card | **Nessuna.** Un solo movimento: la tacca "oggi" che si posa sulla striscia della rotta, e solo con `prefers-reduced-motion: no-preference` | Un movimento orchestrato vale più di tanti effetti sparsi |

Lo scheletro A resta intero: card, 3 temi, nav con icone, hero col conto alla rovescia, tabs shadcn, panel. Della B non torna niente.

### 1.3 Palette neutral (nominata). Cambiano solo le 4 famiglie
| Nome | Ruolo | Chiaro | Scuro |
|---|---|---|---|
| Sumi | testo, inchiostro, tacche di riferimento | `#09090b` | `#fafafa` |
| Carta | `--card` (superficie di grafici e timeline) | `#ffffff` | `#18181b` |
| Pietra | `--fg-muted`, segmenti neutri della rotta | `#71717b` | `#9f9fa9` |
| Filo | `--border`, griglie | `#e4e4e7` | `rgb(255 255 255 / .1)` |
| Famiglie (nuove) | `--fam-move / -fixed / -culture / -evening` | `#2b4aa4` `#9d1172` `#247a4b` `#823b15` | `#5390eb` `#c76ab5` `#53a473` `#d47421` |

**Cosa cambia nei temi:** solo i valori delle 4 `--fam-*`, in neutral (validati qui) e in washi/night. Washi e night vanno
ricalcolati col metodo di §3.1 sulle loro superfici. I temi sono **file condivisi**: la modifica la fa l'orchestratore (vedi §4).
**Cosa NON cambia:** blocchi (A) e (B) dei temi, `--radius`, ombre, font, scala tipografica, la mappa dei 13 `--c-*` sulle famiglie.
I token dei grafici **non entrano nei temi**: li definisce `charts.css` a partire dalle variabili esistenti (`--fam-move`, `--fg`, `--fg-muted`, `--card`).

### 1.4 Ruoli tipografici (stack di sistema già nei temi; niente font esterni)
| Ruolo | Classe | Misura | Note |
|---|---|---|---|
| Titolo pagina | `.h1` | 30/36, 36/40 da 900px, bold, tracking −0.025em | invariato |
| Numero hero (countdown, totale budget) | `.hero-fig` (nuova, in home.css e budget.css) | 56-72px, 600, **cifre proporzionali** | sans, mai serif (dataviz) |
| Titolo oggetto (tappa, tratta, alloggio) | `.h3` | 18/28 → nelle righe compatte 16/24 600 | |
| Orari e importi in colonna | `.mono` | `tabular-nums` | solo dove si allineano in verticale |
| Meta | `.small .muted` | 14/20 | al massimo 2 elementi uniti dal punto medio |
| Etichette dei grafici | `.chart__label` | 12/16, `--fg` o `--fg-muted` | mai nel colore della serie |

### 1.5 Principi (5 righe)
1. Una cosa grande per pagina: è l'elemento memorabile della pagina. Il resto lo sostiene.
2. Densità da tasca: una tappa, una tratta o un luogo si leggono in una sola occhiata (≤ 3 righe prima del dettaglio).
3. Le card solo per oggetti ripetuti e confrontabili. Il dettaglio va in `<details>` o nel panel.
4. Il colore è un dato: 4 famiglie in timeline, enfasi su una sola serie nei grafici, testo sempre in inchiostro.
5. Ogni grafico ha accanto il suo gemello leggibile, una tabella o una lista. Il tooltip aggiunge, non è l'unico accesso al valore.

---

## 2. Pagine

Convenzioni: wireframe a 375 (343 utili) e, dove cambia, a 1280 (container 1100). `[ ]` = card. Componenti dal vocabolario SPEC §6 e `_styleguide.html`.
Le altezze si misurano in CSS px, a 375×812 DPR 2, con lo stato salvato in `localStorage` vuoto.

### 2.1 Home (`index.html`, owner A)
**Problema.** L'hero è giusto ma generico (numero, poi titolo, poi rotta scritta con 5 frecce che va a capo su 2 righe).
"Primo giorno" spreca una riga per "Osaka". Nella prima scadenza il badge "oggi" finisce dentro il testo. 1997px a 375.
**Decisione.** L'hero resta una card col conto alla rovescia. La rotta scritta diventa la **striscia della rotta**
(`routeStrip`, §3.4): 17 notti in proporzione, nomi delle basi sulla striscia, tacca "oggi"/"partenza".
"Prossime scadenze" passa a 3 voci, con la data relativa ("tra 9 giorni") nella colonna data e lo stato nella stessa colonna.
"Primo giorno" scrive titolo e base su una riga.
```
375                                        1280
[ 36 giorni alla partenza            ]     [ 36  giorni alla partenza   | Giappone · 7-24 novembre 2026          ]
[ sab 7 nov → mar 24 nov · 4 persone ]     [ sab 7 → mar 24 nov         | ▓▓▓▓▓|▓|▓▓▓|▓|▓|▓▓▓▓▓▓▓▓▓▓▓▓         ]
[ ▓▓▓▓|▓|▓▓▓|▓|▓|▓▓▓▓▓▓▓            ]     [                            | Osaka 4  Takayama 1  Nagoya 3 …        ]
[ Osaka  Nagoya    Tokyo             ]     [ Primo giorno · sab 7 nov ][ Prossime scadenze                    ]
[   Takayama Uchiura Shuzenji        ]     [ Arrivo e prima sera · Osaka][ dom 11 ott  Hida Nagoya→Takayama…  ]
[ Primo giorno · sab 7 nov           ]     [ 12:10 Arrivo KIX…        ][ tra 9 gg   Shinkansen…              ]
[ Arrivo e prima sera · Osaka        ]     [ 13:30 Limousine Bus…     ][ lun 12 ott Bus Nohi…                 ]
[ 12:10  Arrivo KIX (immigrazione…)  ]     [ Apri il giorno >         ][ Tutte le scadenze >                  ]
[ 13:30  Limousine Bus KATE → …      ]     [ In tasca: Mappa del viaggio (btn primario) · Andata · Ritorno     ]
[ Apri il giorno >                   ]
[ Prossime scadenze                  ]
[ dom 11 ott · tra 9 giorni          ]
[ Hida Nagoya → Takayama 12:48 …     ]
[ … (3 voci) · Tutte le scadenze >   ]
[ In tasca                           ]
```
**Componenti:** `.card.card--accent.home-count` (classe da tenere: la usa `dev/test-pages.html`), `.hero-fig`, `routeStrip()` da `charts.js`,
`.list .list-item`, `.btn--ghost`, `.kv`. **CSS:** nuovo `assets/css/home.css` linkato in `index.html` **dopo** `pages.css`
(le regole `.home-*` di `pages.css` restano: si sovrascrivono, non si cancellano). Anche `charts.css` va linkato.
**Campi JSON:** `trip.start/end/people/title/flights/mapsLink/timezone` · `lodging.stays[].city/checkIn/checkOut/nights/id` ·
`agenda.days[0].title/base/dayTrip/items[].time/title/optional` · `transport.checklist[].sortDate/endDate/what/when/whenDetail/status/dateApprox`.
**Accettazione:**
- altezza `index.html` a 375 **≤ 1700px** (oggi 1997);
- la striscia mostra 6 basi con nomi leggibili, nessuna etichetta sovrapposta o tagliata (verifica coi rettangoli di `getBoundingClientRect`), a 375 e 1280;
- il numero hero ha `font-variant-numeric` diverso da `tabular-nums`;
- nessuna riga meta con più di 2 elementi uniti da "·";
- `dev/test-pages.html` resta 70/70, oppure le differenze sono motivate in `NOTES_A.md`.

### 2.2 Agenda (`agenda.html`, owner A)
**Problema.** A 1280, 45 titoli su 127 e 18 intestazioni su 18 sono troncati. All'apertura lo scroll verticale è a 11:40 e nasconde le tappe del mattino nelle colonne visibili.
Le colonne sono larghe 145px con `--tl-hour-h` 56px: un blocco da 30' ha 28px e ci sta solo l'orario.
**Decisione.**
1. Desktop: `--tl-hour-h` 72px **solo in `.agenda .timeline`** (agenda.css, non nel tema). Un blocco da 1h ha 72px: orario + 3 righe da 15px.
2. Il titolo usa tutta l'altezza del blocco: `line-clamp` calcolato dalle container query a scalini (≥90px: 4 righe; ≥72: 3; ≥52: 2; altrimenti una riga con orario in linea).
   Se è comunque tagliato, `title` e `aria-label` del blocco portano il titolo intero (oggi solo il panel).
3. Intestazione del giorno su 2 righe, `--tl-head-h` 84px: data + base sulla prima, titolo del giorno su 2 righe con clamp.
   Quando la base cambia rispetto al giorno prima, un filo di 2px in `--accent` sul bordo sinistro dell'intestazione: è l'elemento memorabile, il cambio di base si vede scorrendo.
4. Scroll verticale iniziale = **min(prima tappa fra le 7 colonne visibili) − 30'**, non la prima tappa del giorno selezionato.
5. Mobile: niente cambia nella geometria (un giorno per schermata).
```
1280
| sab 7 nov · Osaka       ┃dom 8 nov · Osaka·Kyoto  | … ┃mer 11 nov · Takayama
| Arrivo e prima sera a   | Fushimi presto,         |   | Castello di Osaka →
| Dōtonbori               | Higashiyama e Gion      |   | Nagoya → Takayama
|-------------------------|-------------------------|
| 07 |                    | 07:00 Treno Osaka →     |
|    |                    | Inari (JR Nara line)    |
| 08 |                    | 07:45 Fushimi Inari     |
(┃ = filo accent: cambio base)
```
**Componenti:** `.timeline .tl-day .tl-day__header .tl-item` (base.css, invariati); override in `agenda.css` sotto `.agenda .timeline`.
**Campi JSON:** `agenda.days[].date/weekday/base/baseId/dayTrip/title/items[]` (invariati).
**Accettazione (1280×900, neutral chiaro e scuro):**
- titoli troncati nei blocchi **≤ 8** su 127 (oggi 45) e **0** nei blocchi di durata ≥ 60';
- intestazioni troncate **≤ 4** su 18 (oggi 18);
- ogni `.tl-item` ha `aria-label` col titolo intero;
- all'apertura nessuna tappa delle 7 colonne visibili sta sopra il bordo alto dello scroller;
- `dev/test-agenda.html` 44/44.

### 2.3 Giorno (`giorno.html`, owner A)
**Problema.** 3206px per 11 tappe. Ogni tappa ha 5-6 righe: titolo, chip tipo, nota, costo + luogo, riga Maps a tutta larghezza. Sul telefono il giorno non si vede d'insieme.
**Decisione.**
1. **Nastro del giorno** in testa (elemento memorabile): barra orizzontale 06-24 con i blocchi nei colori di famiglia e i buchi vuoti.
   Toccare un blocco porta alla tappa (`#id`). È la timeline dell'agenda vista "di lato", con la sua legenda (4 famiglie).
2. **Riga tappa compatta**, su 3 livelli:
   - riga 1: orario a sinistra (colonna 52px), titolo in grassetto 16px, bottone Maps solo icona 44px a destra;
   - riga 2: pallino famiglia + tipo a parole + costo "€4 · ¥740" + stato ("facoltativo", "da prenotare" come unico badge);
   - riga 3: la nota, intera (è il contenuto utile in viaggio).
   `place` si mostra solo se diverso dal titolo e non già contenuto nel titolo; va nella riga 2 al posto del costo quando il costo è 0.
3. Il filo sinistro di famiglia resta (DESIGN). **[decisione cliente]** la chip tipo diventa pallino + parola senza pillola:
   è un'eccezione alla riga "nel giorno il tipo resta una chip colorata" di DESIGN.md.
4. I buchi "libero" restano su una riga sola, 32px.
5. Totale del giorno: resta la card in fondo. In testa, accanto al nastro, una riga "€54 a testa · budget €70".
```
375
‹ sab 7 nov        Agenda        lun 9 nov ›
dom 8 nov · Fushimi presto, Higashiyama e Gion
Osaka · gita a Kyoto
06 ▕██▏█████▏ ▏███▏██▏█▏███▏██▏██▏███  ▏██ 24      ← nastro (tap = vai)
● spostamenti ● visite ● cibo e sera ● fissi       €54 a testa · budget €70
───────────────────────────────────────────
07:00 │ Treno Osaka → Inari (JR Nara)    [⌖]
07:35 │ ● Treno · €4 · ¥740
      │ ~35'
───────────────────────────────────────────
07:45 │ Fushimi Inari                    [⌖]
09:15*│ ● Visita · Fushimi Inari-taisha
      │ Tunnel di torii (salita fino al belvedere)…
09:15   libero fino alle 10:00 (45')
```
1280: stessa lista larga al massimo 720px (misura di lettura); il nastro occupa la larghezza del container.
**Componenti:** `.list .list-item.giorno__item` (classi da tenere), bottone `.btn.btn--icon` come `mapsIconBtn` (in agenda-day.js: stessa ricetta via `el()`),
`.badge--todo`, `.agenda-legend__dot`. Nastro = SVG inline generato in `agenda-day.js` (è timeline, non un grafico di charts.js),
colori da `--fam-*` attraverso le classi `.tl-type--*`.
**Campi JSON:** `agenda.days[].items[].time/end/title/type/fixed/optional/parallel/costEur/costEstimate/costNote/place/mapsQuery/note/booking/links/id`,
`days[].budgetEur/base/dayTrip/notes/moves`.
**Accettazione:**
- altezza `giorno.html?d=2026-11-08` a 375 **≤ 2200px** (oggi 3206) e `?d=2026-11-15` ≤ 2300px (oggi 3237);
- zero occorrenze del testo "Apri in Google Maps" visibile; ogni bottone Maps ha `aria-label` "Apri <titolo> in Google Maps (nuova scheda)" e area di tocco ≥ 44×44;
- il nastro ha un segmento per ogni tappa non `free`; il tap su un segmento porta a `#<id>` (fuoco sulla riga); segmenti con area di tocco ≥ 24px di altezza;
- contrasto AA invariato (0 errori con `dev/contrast-check.js`), anche in washi e night.

### 2.4 Trasporti (`trasporti.html`, owner B)
**Problema.** 8 card con molto bianco (3193px a 375). La catena del viaggio non si vede come un insieme. Le scadenze, oggi le più utili, stanno nella 4ª tab.
**Decisione.**
1. Tab invariate per ordine e id (i test e i link `#scadenze` ci contano). Si cambia il **contenuto** di Tratte e Scadenze.
2. **Tratte, in testa: la catena** (elemento memorabile). È una linea verticale (rail) che alterna basi e tratte nell'ordine del viaggio:
   ```
   375
   ● KIX → Osaka Umeda           sab 7 nov   Limousine Bus KATE · ~60' · €9,7
   ┃ Osaka · 4 notti
   ● Osaka → Nagoya              mer 11 nov  Shinkansen · 48 min · €42   da prenotare
   ● Nagoya → Takayama           mer 11 nov  JR Hida 12:48 · 2h24 · €34   da prenotare
   ┃ Takayama · 1 notte
   ● Takayama → Shirakawa → Nagoya  gio 12 nov  2 bus · €35          da prenotare
   ┃ Nagoya · 3 notti
   …
   ● Tokyo Yoyogi → NRT          mar 24 nov  Limousine Bus · €19,5  da prenotare
   ```
   Ogni riga tratta è un link alla card (`#leg-…`) più sotto. Lo stato è una parola, non un badge (l'unico badge resta nella card).
   È HTML/CSS (`<ol class="tr-chain">`), non un grafico: i dati sono un elenco ordinato con etichette.
3. **Card tratta più dense:** titolo, poi una riga meta (durata · €/¥ · stato), poi la nota breve. "Come si prenota" e "alternative" restano `<details>`, sulla stessa riga come due link a 44px.
   Classe `.tr-leg` tenuta su ogni card (test).
4. **Scadenze, in testa: la striscia "da oggi alla partenza"** (`dotTimeline`, §3.3): asse oggi → 7 nov, un punto per scadenza da fare,
   impilati se nella stessa data. Etichette solo per "oggi", la prossima scadenza e "partenza". Sotto, la lista attuale per mese, che fa da tabella-gemella.
   Ogni voce della lista ha "tra N giorni". La tab porta già il conteggio (16).
```
1280 (Tratte)
Trasporti   [Tratte][Aeroporti][Prenotazioni][Scadenze 16]
┌ catena (colonna sx 420px, sticky) ┐  ┌ card tratte (colonna dx) ───────────────┐
│ ● KIX → Osaka …                   │  │ mer 11 nov                               │
│ ┃ Osaka · 4 notti                 │  │ [ Osaka → Nagoya  Shinkansen · 48 min…  ]│
│ ● Osaka → Nagoya …                │  │ [ Nagoya → Takayama …                   ]│
└───────────────────────────────────┘  └──────────────────────────────────────────┘
```
**Componenti:** `.tabs .tab` (setupTabs di pages.js, invariato), `.card.tr-leg`, `.list`, `.badge--todo`, `dotTimeline()` di `charts.js`.
**CSS:** nuovo `assets/css/pages-b.css` linkato **dopo** `pages.css` in `trasporti.html`, `alloggi.html`, `luoghi.html`, più `charts.css`.
**Campi JSON:** `transport.legs[]/transfers[]`: `id/date/from/to/title/summary/kind/options[].name/duration/costEur/chosen/noteShort/booking.status/opens/opensNote/opensApprox` ·
`lodging.stays[].city/nights/checkIn/checkOut` (basi della catena) · `checklist[].sortDate/endDate/status/what/when/whenDetail/dateApprox/where/url/links` · `trip.start`.
**Accettazione:**
- `trasporti.html` (tab Tratte) a 375 **≤ 2600px** con i `<details>` chiusi (oggi 3193);
- la catena ha 6 basi e 10 tratte (8 legs + 2 transfer), in ordine di data, e ogni riga tratta porta alla sua card;
- la striscia Scadenze ha un punto per ogni voce `todo` con `sortDate` fra oggi e `trip.start`; quelle dopo la partenza sono contate a parte ("+1 dopo la partenza");
- `.tr-leg` = numero di legs (test); nessuno scroll orizzontale a 375.

### 2.5 Alloggi (`alloggi.html`, owner B)
**Problema.** 5086px a 375. Note lunghe sempre aperte, 6 bottoni primari neri uguali, il riepilogo "6 basi · 17 notti" è solo testo.
**Decisione.**
1. In testa la **striscia della rotta** (`routeStrip`, la stessa della home). I segmenti sono link alle card (`#osaka` …): è l'indice della pagina.
2. **Card alloggio:** nome (h2 → `.h3` 20px), poi città · tipo (2 elementi). In `kv`: date + notti, orari se ci sono, indirizzo.
   La riga prezzo e pagamento si sposta **in alto**, subito sotto il nome: è l'informazione che oggi decide le azioni ("si paga in struttura", "da verificare").
   Bottone Maps **outline** (`.btn`), non primario: in una lista di 6 l'azione è outline (DESIGN, regola Card).
   Le note: le prime 2 visibili, il resto in `<details>` "Altre N note".
3. Logistica (tabs Bagagli · Giorno 1 · Contanti) invariata nella struttura. I passi numerati restano (sono una sequenza vera).
   Il testo dei passi è limitato a 3 righe con "continua" (`<details>`).
```
375
Alloggi · 6 basi, 17 notti
▓▓▓▓|▓|▓▓▓|▓|▓|▓▓▓▓▓▓▓      (link alle card)
[ BON Condominium Umeda              ]
[ Osaka · Appartamento               ]
[ €318 in tutto · €80 a testa  pagato]
[ Date   sab 7 → mer 11 nov · 4 notti]
[ Orari  check-in 16:00 · out 10:00  ]
[ Indir. 3-1-4 Nakazakinishi…        ]
[ (⌖ Apri in Maps)  outline          ]
[ • Appartamento con cucina…         ]
[ • Namba è a 8 minuti di metro.     ]
[ Altre 0-6 note ›                   ]
```
1280: griglia a 2 colonne invariata, la striscia a tutta larghezza sopra.
**Componenti:** `.card.al-stay` (id = `stay.id`), `.kv`, `.btn`, `.badge--done/--todo/--draft` (`payBadge` invariato), `routeStrip()`.
**Campi JSON:** `lodging.stays[].id/name/city/area/type/checkIn/checkOut/nights/checkInTime/checkOutTime/address/mapsQuery/costEurTotal/costEurPerPerson/costJpyTotal/paid/payment/notes`, `lodging.logistics.*` (invariato).
**Accettazione:**
- `alloggi.html` a 375 **≤ 3600px** con i `<details>` chiusi (oggi 5086);
- nessun `.btn--primary` dentro `.al-stay`;
- i 6 segmenti della striscia portano alle 6 card;
- la riga prezzo/pagamento è il 2° elemento visibile di ogni card.

### 2.6 Luoghi (`luoghi.html`, owner B)
**Problema.** Al caricamento 13 accordion chiusi: la pagina è fatta di chevron. Sì e Forse si distinguono solo per un badge. Non si vede il tipo di luogo.
**Decisione.**
1. **Sommario del gruppo informativo:** "Osaka" + date dal `layer` ("7-11 nov") + conteggi "12 sì · 12 forse · 5 in agenda".
   Si capisce il gruppo senza aprirlo.
2. **Apertura di default:** senza stato salvato si apre il gruppo della base di oggi o, prima del viaggio, della prossima base (prima città nell'ordine dei dati).
   Con un filtro città o ≤ 30 risultati si aprono tutti, come oggi.
3. **Sì/Forse diventano struttura, non badge:** dentro ogni gruppo, prima i "Sì" (righe complete), poi un sotto-titolo "Forse (n)" con righe compatte (nome, tipo, Maps).
   Il badge flag per riga sparisce. Restano solo "Un'altra volta" e "Da decidere", che si vedono solo con il loro filtro.
4. **Segno del tipo:** icona 16px davanti al nome, da una mappa `TYPE_ICON` in `pages-luoghi.js` (parole chiave sul campo `type`):
   tempio/santuario/castello/storic → `torii` · food/mercato/specialità → `food` · onsen → `onsen` · shopping/vintage → `bag` ·
   nightlife → `moon` · altro → `map-pin`. Anime/otaku/Love Live: **nessuna icona adatta nello sprite** (`star` è già "segnalato da voi"):
   richiesta `i-anime` in `NOTES_B.md`, nel frattempo `map-pin`.
5. Riga: [icona] nome (+★), poi "tipo · zona" (2 elementi), nota con clamp a 2 righe, chip giorni, Maps 44px.
```
375
Luoghi   [cerca………………]
[Tutte][Osaka][Kobe][Kyoto]…   (chip città, scroll orizz.)
[Sì][Forse][No]…   Ordina [per città]
166 luoghi su 326
▾ Osaka  7-11 nov                       24
  12 sì · 12 forse · 5 in agenda
  ⛩ Dōtonbori + insegna Glico ★          [⌖]
    Landmark/food · Namba
    Canale coi neon, cuore della movida…
    [📅 sab 7 nov]
  …
  Forse (12)
  ⛩ Shitennō-ji · Tempio                  [⌖]
› Kobe  10 nov                           7
  4 sì · 3 forse · 2 in agenda
```
**Componenti:** `details.lu-group`, `.list.card`, `.chip`, `mapsIconBtn`, `.icon`.
**Campi JSON:** `places[].name/city/area/type/flag/source/note/mapsQuery/layer/dayDates`, `lodging.stays[].city/checkIn` (per il gruppo da aprire) oppure `agenda.days[].base`.
**Accettazione:**
- al primo caricamento (stato vuoto) almeno un gruppo è aperto e il primo luogo sta sopra la piega a 375×812;
- ogni sommario mostra le date (se `layer` le contiene) e i conteggi Sì/Forse/in agenda, giusti rispetto ai filtri attivi;
- zero badge flag nelle righe con i filtri di default;
- ogni riga ha un'icona tipo con `aria-hidden` e il tipo scritto per esteso nella riga 2;
- ricerca, filtri e `localStorage` invariati (`filterPlaces`/`flagPass` restano esportate per i test).

### 2.7 Budget (`budget.html`, owner C)
**Problema.** Due card KPI da dashboard. Manca la composizione (pagato / prezzo noto / stima). `budget.daily` non è usato.
Le due tabelle con barre a scala comune vanno bene: si tengono.
**Decisione.**
1. **Hero:** "€2.765,61 a persona" (`.hero-fig`, cifre proporzionali), poi "¥511.640 · gruppo €11.062,44" su una riga. Una card sola (`card--accent`).
2. **Barra di composizione** (`stackBar`, §3.2) sotto l'hero: 3 segmenti ordinali **Pagato €1.189,61 · Prezzo noto €641,00 · Stima €935,00**.
   Legenda con importi sotto la barra (le etichette non vanno dentro i segmenti).
3. **Tabelle per categoria** invariate nella logica (scala comune, un colore). Il titolo di sezione porta il subtotale e la quota
   ("In viaggio · €1.882,55 · 68%", "Una tantum · €883,06 · 32%"). Così la divisione viaggio/una tantum si legge senza un altro grafico.
4. **Spesa per giorno** (`bulletRows`, §3.2): 18 righe, barra = costi in agenda (`eurAgenda`), tacca = budget previsto (`eurPlanned`).
   Etichette solo sul giorno più caro e sui giorni con budget ≥ 2× l'agenda (15-16 nov, ryokan: cena inclusa nell'alloggio). Il tooltip porta il resto.
5. Note in fondo, come oggi.
```
375                                         1280
[ €2.765,61                         ]       [ €2.765,61 a persona        ¥511.640 · gruppo €11.062,44 ]
[ a persona · ¥511.640              ]       [ ████████████▓▓▓▓▓▓░░░░░░░░░                             ]
[ gruppo (4) €11.062,44             ]       [ ■ Pagato €1.189,61  ■ Prezzo noto €641  ■ Stima €935    ]
[ ████████████▓▓▓▓▓░░░░░░░░░        ]
[ ■ Pagato €1.189,61                ]       In viaggio · €1.882,55 · 68%       Spesa per giorno
[ ■ Prezzo noto €641,00             ]       (tabella attuale)                  sab 7  ███▏      €35 / 60
[ ■ Stima €935,00                   ]                                          dom 8  █████▏    €54 / 70
In viaggio · €1.882,55 · 68%                Una tantum · €883,06 · 32%         …
(tabella attuale con barre)                 (tabella attuale)                  (grid 2 col ≥900: tabelle sx, giorni dx)
Una tantum · €883,06 · 32%
(tabella)
Spesa per giorno
sab 7  ███▏         €35
dom 8  █████▏
mer 11 ██████████▏  €103  ← etichetta max
lun 16 ██        ▏  €18 / budget €150
[ Mostra come tabella ]
Note
```
**Componenti:** `.card.card--accent`, `.hero-fig`, `table.bu-table` (resta), `stackBar()`, `bulletRows()`, `.section-title`. **CSS:** nuovo `assets/css/budget.css` + `charts.css`.
**Campi JSON:** `budget.perPerson.categories[]/common[]` (`name/eur/estimate/detail/note/links`), `perPerson.totalEur/commonTotalEur`, `group.totalEur`,
`paidSoFar.flightsEurGroup/lodgingEurGroupPaid/lodgingEurGroupToPay`, `daily[].date/eurPlanned/eurAgenda`, `trip.people/fx`, `notes`.
Formula dei segmenti (a persona, `people` = 4):
`pagato = (flightsEurGroup + lodgingEurGroupPaid) / people` = (3224 + 1534,42)/4 = **1189,61** ·
`stima = Σ eur con estimate=true` = **935** · `prezzoNoto = totalEur − pagato − stima` = **641,00**.
Limite noto: l'assicurazione (€47,86) è pagata secondo la nota testuale, ma non c'è un campo e finisce in "prezzo noto" (vedi §5).
**Accettazione:**
- la somma dei 3 segmenti = `totalEur` al centesimo; ogni segmento ha legenda con importo e percentuale;
- nessuna card KPI affiancata; un solo numero ≥ 48px nella pagina;
- `bulletRows` ha 18 righe, un solo asse € che parte da 0, nessuna etichetta su ogni barra (al massimo 3 etichette dirette);
- ogni grafico ha "Mostra come tabella" (`<details>` con `<table>`) che riporta tutti i valori;
- `budget.html` a 375 ≤ 2600px coi `<details>` chiusi (oggi 2282, sale per il grafico giornaliero).

---

## 3. Dataviz

Tutti i grafici sono **SVG inline generati in JS, senza librerie**, in `assets/js/charts.js` (owner C). Fa eccezione il nastro del giorno, in `agenda-day.js` (owner A).
Ogni funzione restituisce `html\`\`` (`Raw` di `pages.js`) e ha un `wire(root)` per hover e tastiera da chiamare dopo `mount`.
Colori **solo** da variabili CSS (`fill: var(--chart-…)` in `charts.css`), mai hex nel JS. Viewbox calcolato sulla larghezza misurata del contenitore (`ResizeObserver`), testo in HTML o `<text>` in `--fg`/`--fg-muted`.

### 3.1 Famiglie della timeline: validazione (da rifare per ogni tema)
Il nastro del giorno e la timeline mettono **qualunque famiglia accanto a qualunque altra**, quindi vale la regola **all-pairs**.
Ci sono etichette testuali su ogni blocco (codifica secondaria), quindi un ΔE CVD fra 6 e 8 sarebbe ammesso. La soglia di vista normale (≥ 15) è invece obbligatoria.
Comando: `node <skill dataviz>/scripts/validate_palette.js "<hex,…>" --mode light|dark --surface <card> --pairs all`.

**Stato attuale: FALLISCE in tutti e 3 i temi.**
```
== #3046a8,#8e2230,#0a6f52,#9c4600 (neutral light, surface #ffffff) all-pairs
  [PASS] Lightness band         all 4 inside L 0.43–0.77
  [FAIL] Chroma floor           below floor (reads gray): [["#0a6f52",0.096]]
  [FAIL] CVD separation         worst all-pairs #0a6f52↔#8e2230 ΔE 5.7 (deutan) · tritan 6.2
  [FAIL] Normal-vision floor    worst all-pairs #9c4600↔#8e2230 ΔE 9.9 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 4 >= 3:1
== #98b1f8,#f4948c,#5fd6b0,#eab45e (neutral dark, surface #18181b) all-pairs
  [FAIL] Lightness band         outside band: [["#98b1f8",0.769],["#f4948c",0.764],["#5fd6b0",0.797],["#eab45e",0.803]]
  [PASS] Chroma floor           all 4 >= 0.1
  [FAIL] CVD separation         worst all-pairs #5fd6b0↔#f4948c ΔE 5.1 (deutan) · tritan 6.5
  [FAIL] Normal-vision floor    worst all-pairs #eab45e↔#f4948c ΔE 11.1 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 4 >= 3:1
== #2b3f8a,#8a1f2e,#1e6f57,#964a08 (washi light, surface #fffcf6) all-pairs
  [FAIL] Lightness band         outside band: [["#2b3f8a",0.396],["#8a1f2e",0.421]]
  [FAIL] Chroma floor           below floor (reads gray): [["#1e6f57",0.086]]
  [WARN] CVD separation         worst all-pairs #1e6f57↔#8a1f2e ΔE 7.1 (deutan) · tritan 7.6
  [FAIL] Normal-vision floor    worst all-pairs #964a08↔#8a1f2e ΔE 10.9 (normal)
== #98b3f7,#f2918a,#6fd0ae,#e8b05a (washi dark, surface #1e2128)   → FAIL band, CVD 5.1, normal 11.0
== #8ba5e6,#e2867e,#5fc1a0,#d9a555 (night, surface #101219)        → FAIL band, chroma, CVD 4.8, normal 10.5
```
In pratica "orari fissi" (rosso) e "cibo e sera" (arancio) sono quasi uguali per tutti, e visite (verde) contro fissi (rosso) si confondono per chi è deuteranope.

**Proposta neutral (cercata per enumerazione in OKLCH vicino alle tinte attuali).** Vincoli: banda di luminosità, croma ≥ 0,10,
all-pairs CVD ≥ 8, vista normale ≥ 15, **e testo AA ≥ 4,5:1** sulla card e sulla tinta 11% (la legenda e l'orario usano la famiglia come colore del testo).
```
== #2b4aa4,#9d1172,#247a4b,#823b15 (light, surface #ffffff) all-pairs
  [PASS] Lightness band         all 4 inside L 0.43–0.77
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #823b15↔#247a4b ΔE 8.1 (deutan) · tritan 6.2
  [PASS] Normal-vision floor    worst all-pairs #823b15↔#9d1172 ΔE 16.8 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1
  → ALL CHECKS PASS
== #5390eb,#c76ab5,#53a473,#d47421 (dark, surface #18181b) all-pairs
  [PASS] Lightness band         all 4 inside L 0.48–0.67
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst all-pairs #c76ab5↔#5390eb ΔE 9.0 (protan) · tritan 4.1
  [PASS] Normal-vision floor    worst all-pairs #c76ab5↔#5390eb ΔE 18.6 (normal)
  [PASS] Contrast vs surface    all 4 >= 3:1
  → ALL CHECKS PASS
```
Contrasto del testo (calcolato con `contrast()` del validatore, mix sRGB come `color-mix(in srgb)`):
| | card | tinta 11% (testo legenda) | orario (80% verso fg) su tinta 20% |
|---|---|---|---|
| light move/fixed/culture/evening | 8,02 / 7,62 / 5,30 / 8,12 | 6,73 / 6,28 / 4,56 / 6,78 | 7,30 / 6,84 / 5,46 / 7,32 |
| dark move/fixed/culture/evening | 5,53 / 5,19 / 5,84 / 5,33 | 4,80 / 4,54 / 5,05 / 4,66 | 5,28 / 5,14 / 5,45 / 5,20 |

**[decisione cliente]** "Orari fissi" passa da cremisi a **prugna-lacca** (`#9d1172` / `#c76ab5`) e "cibo e sera" da arancio a **terra bruciata** in chiaro (`#823b15`).
Alternativa più vicina ai colori di oggi: light `#2b4aa4,#931157,#247a4b,#b44c0d`. Risultato: CVD 7,9 = **WARN** (ammesso solo perché ogni blocco ha il titolo scritto), vista normale 17,2 PASS.
Washi e night: stessa ricerca sulle loro card (`#fffcf6`/`#1e2128`, `#101219`). Lo script di ricerca è riproducibile: vedi §4, compito dell'orchestratore.

### 3.2 Budget
**(a) Composizione: `stackBar(segments, {total, labels})`**
- *Form:* parte-del-tutto con 3 classi ordinate (pagato → prezzo noto → stima) → **barra impilata orizzontale al 100%, una riga** (niente torta).
- *Colore per ruolo:* **ordinale**, una tinta (spostamenti/blu, `--fam-move`) a luminosità decrescente verso la superficie:
  `--chart-ord-1: var(--fam-move)` · `--chart-ord-2: color-mix(in srgb, var(--fam-move) 68%, var(--card))` · `--chart-ord-3: … 45% …`.
  Hex risultanti: light `#2b4aa4, #6f84c1, #a0aed6` · dark `#5390eb, #406aa8, #334e79`.
- *Validazione (`--ordinal`):*
```
Palette (light, surface #ffffff, ordinal ramp): 3 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #a0aed6 at 2.21:1 vs surface
  [PASS] Single hue             hue spread 4°
  → ALL CHECKS PASS
Palette (dark, surface #18181b, ordinal ramp): 3 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #334e79 at 2.11:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS
```
  (Se l'orchestratore non adotta la nuova palette, `--fam-move` resta `#3046a8`/`#98b1f8`: l'implementatore **rilancia** `--ordinal` sui mix risultanti.
  Gli hex si calcolano col mix sRGB canale per canale: `round(c·p + card·(1−p))`.)
- *Mark:* altezza 16px (≤ 24), raggio 4px solo agli estremi della barra, **2px di gap in `--card`** fra i segmenti, nessun bordo.
- *Etichette:* sotto la barra, legenda con quadratino 10px + "Pagato €1.189,61 · 43%" in `--fg`. Nessun testo dentro i segmenti.
- *Hover/focus:* ogni segmento `<rect tabindex="0" role="img" aria-label="Pagato: €1.189,61, 43% del totale">`; tooltip `--popover` con importo € e ¥. Area di hit = altezza 32px.
- *Accessibilità:* `<figure>` + `<figcaption>`, legenda sempre presente (3 serie), `<details>` "Mostra come tabella".
  In `forced-colors` i segmenti prendono `CanvasText` con tratteggio 45°/135° (texture solo qui).

**(b) Spesa per giorno: `bulletRows(rows, {value, target, label})`**
- *Form:* confronto per giorno fra valore e obiettivo → **bullet / barra con tacca di riferimento**, righe orizzontali (18 date leggibili a 375).
  Un solo asse €. Niente doppio asse, niente linea.
- *Colore per ruolo:* una serie → `--chart-series: var(--fam-move)` per la barra; la tacca obiettivo è un **segno di riferimento in inchiostro** (`--fg`), non una seconda tinta.
  Contrasto barra: 8,02:1 light, 5,53:1 dark; tacca 19,9:1 / 17,0:1. Griglia: hairline `--border`, piena, solo i tick 0/50/100/150.
- *Mark:* barra 10px di spessore in righe da 28px, estremo dati arrotondato 4px, base quadrata a 0. Tacca 2px × 16px. Righe distanziate (niente gap da gestire).
- *Etichette selettive (≤ 3):* il valore massimo dell'agenda (mer 11 nov, €103) e i giorni con `eurPlanned ≥ 2 × eurAgenda` (dom 15 nov €78 / €150, lun 16 nov €18 / €150), nella forma "€18 / budget €150" in `--fg-muted`.
  Asse X in alto con 0 · 50 · 100 · 150 €, `tabular-nums`.
- *Hover/focus:* riga intera come target (28px), tooltip "dom 15 nov · agenda €78 · budget €150 · margine €72"; tastiera ↑/↓ fra le righe.
- *Accessibilità:* legenda "barra = costi in agenda · tacca = budget previsto" (2 segni, quindi serve la legenda). Tabella gemella con 18 righe × (data, agenda, budget, differenza).

### 3.3 Trasporti: scadenze da oggi alla partenza, `dotTimeline(events, {from, to, today})`
- *Form:* eventi su un asse temporale → **strip plot / timeline a punti**. Un punto per scadenza, impilati in verticale se nella stessa data. Non è una serie nel tempo.
- *Colore per ruolo:* una serie, **enfasi**: la prossima scadenza è piena in `--fg`, le altre piene in `--fg-muted` (4,8:1 light, 6,75:1 su `#18181b` dark).
  "Oggi" = filo verticale 2px in `--accent`. Nessun colore di stato: "in ritardo" si dice a parole, con la parola nella lista sotto.
- *Mark:* punti r=4 (8px) con **anello 2px in `--card`** (si sovrappongono quando sono impilati), asse hairline `--border`, tick ogni lunedì con "12 ott", "19 ott"…
- *Etichette:* solo "oggi", la prossima scadenza ("dom 11 ott · 2 prenotazioni") e "partenza 7 nov". Mai una per punto.
- *Hover/focus:* hit area 24×24 attorno a ogni punto (rettangolo trasparente), tooltip con `what` + `deadlineLabel`; tap/Invio scorre alla voce della lista sotto (id da aggiungere alle `li`).
- *Accessibilità:* `role="img"` con `aria-label` riassuntivo ("16 scadenze da fare fra oggi e il 7 novembre; la prossima dom 11 ott"). La lista per mese sotto è la tabella gemella.

### 3.4 Striscia della rotta: `routeStrip(stays, {today, start, end, link})` (home, alloggi, trasporti)
- *Form:* parte-del-tutto **nel tempo** (17 notti) con classi già etichettate → **barra segmentata unica, larghezze proporzionali alle notti**.
- *Colore:* **enfasi**. Tutti i segmenti in `--fg-muted`, la base di oggi (o la prossima, prima del viaggio) in `--accent`. Nessuna tinta per base: la città è scritta.
  `--fg-muted` su card: 4,83:1 light, 6,75:1 dark → oltre 3:1 per i segni.
- *Mark:* altezza 12px, 2px di gap `--card` fra le basi (il gap è il cambio), estremi arrotondati 4px. Tacca "oggi" 2px in `--accent`, alta 20px, con l'etichetta sopra.
- *Etichette, misurate prima:* città sopra o sotto la striscia su 2 corsie. Algoritmo: per ogni segmento, nell'ordine, si prova la corsia sotto, poi quella sopra.
  Si misura il testo (`getComputedTextLength` o un `<span>` off-screen) e si controlla la sovrapposizione col vicino della stessa corsia (spazio minimo 6px).
  Se non c'è posto in nessuna delle due, si ripiega su una legenda in linea sotto ("Osaka 4 · Takayama 1 · …").
  Le notti ("4") vanno dentro il segmento solo se ci stanno con 4px di margine per lato.
- *Hover/focus:* ogni segmento è un `<a>` (se `link`) con `aria-label` "Osaka, 7-11 nov, 4 notti". Tooltip con le date.
- *Accessibilità:* lista `<ol class="sr-only">` con le stesse basi; in `forced-colors` segmenti `CanvasText` con l'accento a tratteggio.

### 3.5 Nastro del giorno (giorno.html, owner A, in `agenda-day.js`)
Asse 06-24 fisso (stessa scala dell'agenda), 1 segmento per tappa largo quanto la sua durata, colore = `var(--tc)` della famiglia (palette di §3.1, all-pairs validata),
2px di gap `--card` fra segmenti contigui. I facoltativi sono solo bordo 1,5px, senza riempimento (come in timeline). I buchi sono il binario vuoto (`--muted`).
Legenda compatta delle 4 famiglie sotto il nastro (≥ 2 serie). Tap = vai alla tappa. Etichette: solo le ore 06 · 12 · 18 · 24.

### 3.6 Anti-pattern controllati
Niente doppio asse, niente torte o ciambelle, niente numero su ogni punto, niente griglie tratteggiate, niente bordi attorno ai segni,
niente testo nel colore della serie, niente `tabular-nums` sui numeri hero, niente filtri dentro le card dei grafici, niente tooltip come unico accesso ai valori.

---

## 4. Partizione del lavoro: 3 implementatori in parallelo su file disgiunti

Regola SPEC: ognuno tocca solo i suoi file. Le richieste sui file condivisi vanno in `site/NOTES_<A|B|C>.md`. Nessun commit.

| Agente | Possiede (scrive) | Legge soltanto |
|---|---|---|
| **A** giorno + home + agenda | `giorno.html` · `index.html` · `agenda.html` · `assets/js/agenda.js` · `agenda-day.js` · `agenda-gaps.js` · `assets/js/pages-home.js` · `assets/css/agenda.css` · **nuovo** `assets/css/home.css` · `NOTES_A.md` | tutto il resto |
| **B** trasporti + alloggi + luoghi | `trasporti.html` · `alloggi.html` · `luoghi.html` · `assets/js/pages-trasporti.js` · `pages-alloggi.js` · `pages-luoghi.js` · **nuovo** `assets/css/pages-b.css` · `NOTES_B.md` | tutto il resto |
| **C** budget + grafici | `budget.html` · `assets/js/pages-budget.js` · **nuovo** `assets/js/charts.js` · **nuovo** `assets/css/charts.css` · **nuovo** `assets/css/budget.css` · **nuovo** `dev/test-charts.html` · `NOTES_C.md` | tutto il resto |
| **Condivisi (sola lettura per A/B/C)** | `base.css` · `pages.css` · `themes/*.css` · `app.js` · `pages.js` · `theme-boot.js` · `sw.js` · `manifest.webmanifest` · `_styleguide.html` · `assets/icons/sprite.svg` · `tools/check_site.py` · `data/*.json` · `dev/fixtures/*` · `dev/test-agenda.html` · `dev/test-pages.html` · `dev/test-shell.html` · `dev/contrast-check.js` · `DESIGN.md` · `SPEC.md` | orchestratore |

Conflitti reali risolti:
- **`pages.css` serve home, trasporti, alloggi, luoghi e budget.** Nessuno lo modifica. Ognuno linka il proprio CSS **dopo** `pages.css` nel proprio HTML
  (`home.css`, `pages-b.css`, `budget.css`) e sovrascrive con selettori della stessa specificità (stesse classi, regole in `:where()` dove serve).
  Le regole morte in `pages.css` le pulisce l'orchestratore dopo il merge.
- **`charts.js` serve anche A (home) e B (alloggi, trasporti).** C lo possiede. L'API è fissata qui e non cambia senza passare dall'orchestratore:
  ```js
  // charts.js (ES module; importa html/esc da pages.js e fmtEur/fmtJpy/fmtDate da app.js)
  export function routeStrip(stays, { today, start, end, link = false, emphasis = 'auto' } = {})  // → Raw
  export function stackBar(segments /* [{id,label,value}] */, { total, caption, fx } = {})     // → Raw
  export function bulletRows(rows /* [{date,value,target}] */, { caption, labelRule } = {})   // → Raw
  export function dotTimeline(events /* [{date,label,id,emph}] */, { from, to, today, caption } = {}) // → Raw
  export function wire(root)   // hover/focus/tooltip/resize per tutti i .chart dentro root; idempotente
  ```
  Contenitore comune: `<figure class="chart chart--<tipo>">…<figcaption>…</figcaption><details class="chart__table">…</details></figure>`.
  **Ordine:** C consegna per primo `routeStrip` + `dotTimeline` + `wire` (fase 1) e lo scrive in `NOTES_C.md`. A e B li importano con
  `import('./charts.js').catch(() => null)`: se il modulo non c'è ancora, la pagina mostra il fallback testuale (la rotta scritta, la lista) e non si rompe.
  A e B linkano `assets/css/charts.css` nel proprio HTML.
- **Il nastro del giorno** è timeline (famiglie, `--tc`): lo fa A in `agenda-day.js`, non C.
- **Test:** i file `dev/test-*.html` sono condivisi. Ognuno li fa girare e non li modifica. Se un test codifica il vecchio comportamento
  (es. "tipo = chip" nel giorno), l'agente lo scrive in NOTES con la modifica proposta. C crea il proprio `dev/test-charts.html`, nuovo e suo.

Richieste già note per l'orchestratore (da integrare dopo i tre agenti):
1. `sw.js` PRECACHE: + `assets/css/home.css`, `pages-b.css`, `budget.css`, `charts.css`, `assets/js/charts.js`.
   Senza questo `tools/check_site.py` fallisce (controlla che ogni file statico sia in PRECACHE). `CACHE_VERSION` → `v7`.
2. Temi: nuove `--fam-*` in neutral (§3.1), più ricerca e validazione per washi e night. Dopo, `dev/contrast-check.js` su 7 pagine × 3 temi × 2 modi.
3. `sprite.svg`: nuova icona `i-anime` (richiesta B).
4. `DESIGN.md`: aggiornare la tabella famiglie, la riga "tipo = chip" del giorno, la sezione grafici; `_styleguide.html`: esempio dei 4 grafici.
5. Pulizia di `pages.css` (regole `.home-*`, `.bu-kpi*` superate).

---

## 5. Richiede exporter (idee con dati assenti: NON da fare ora)

| Idea | Dato mancante | Oggi |
|---|---|---|
| Composizione "pagato" esatta | `perPerson.common[].paid` (e `paidDate`); l'assicurazione risulta pagata solo nel testo della nota | va in "prezzo noto" (€47,86 di troppo) |
| Pagato dei trasporti | `legs[].options[].booking.paidEur` o stato `done` dopo l'acquisto | tutti `todo`: corretto ad oggi |
| Orari di partenza/arrivo nella catena trasporti | `options[].dep` / `arr` strutturati (oggi dentro `name`: "Hida 12:48", "Gifu Bus 15:30 → … 18:16") | si mostra il `name` |
| Mappa dei luoghi, "Indicazioni a piedi" | `places[].lat/lon` (0 su 326) | solo Maps per ricerca |
| Tipo di luogo normalizzato | `places[].typeFamily` (oltre 40 valori liberi in `type`) | mappa a parole chiave nel JS (presentazione) |
| Scadenze per area (trasporti / alloggi / documenti) | `checklist[].category` | un solo elenco |
| Budget per giorno diviso per categoria | `daily[].byCategory` | solo totale agenda/previsto |
| Link fra tappa dell'agenda e card della tratta | `items[].legId` (alcuni item hanno `links`, non sistematico) | nessun link |
| Orari di check-in di 4 alloggi, indirizzi di 4 alloggi | `checkInTime`/`address` vuoti per takayama, nagoya, uchiura (e indirizzo shuzenji) | non mostrati |
| Foto delle basi | `trip.photos` (oggi `[]`) | nessuna, come da ibrido |

---

## 6. Rischi e cosa NON fare

**Rischi**
- *Palette famiglie:* cambiare i colori dell'agenda è visibile e tocca 3 temi. Senza ok del cliente si resta alla palette attuale,
  e i grafici di C funzionano lo stesso (derivano da `--fam-move`). Ma il difetto "fissi ≈ cibo" resta.
- *Dipendenza da charts.js:* A e B importano un modulo che C scrive in parallelo. Mitigazione: API fissata in §4, import dinamico con fallback, fase 1 di C prima.
- *Sovrascritture CSS* su `pages.css` senza poterlo toccare: rischio di specificità che si annullano. Stesse classi, stesso ordine di caricamento (pagina dopo condiviso), niente `!important` nuovi.
- *Test esistenti* che codificano l'ibrido (chip tipo, `.home-count`, `.tr-leg`, ≤ 4 colori di blocco): vanno tenuti verdi o motivati in NOTES.
- *Altezze target:* dipendono dai testi dei dati. Si misurano sui JSON di produzione (`data/`), non sulle fixture.
- *Contrasto:* le nuove tinte e i grafici si verificano col validatore **e** con `dev/contrast-check.js`. I due controlli misurano cose diverse (segni contro testo nel DOM).

**Cosa NON fare**
- **Niente versione B:** niente tema unico, titoli serif, home testuale senza card, slot foto. Lo scheletro A resta.
- **Niente font esterni:** né Google Fonts né file in `assets/fonts/`. Si usano gli stack di sistema già nei temi.
- **Niente librerie, CDN, npm o bundler:** grafici in SVG inline scritti a mano in `charts.js`.
- **Niente commit, push, stash, checkout, reset o clean:** lo stato git resta all'utente.
- Non eseguire `../build_xlsx_*.py` né `../export_site_data.py`. Non modificare `data/*.json`.
- Niente torte, ciambelle, doppio asse, numero su ogni punto, colori di stato come serie, icone decorative nei titoli,
  badge "bozza" fuori dalla testata dell'agenda, lucchetti fuori dal panel.
- Niente dati di viaggio scritti nel JS: le soglie delle etichette (es. "≥ 2× budget") sono regole; i valori arrivano dai JSON.
