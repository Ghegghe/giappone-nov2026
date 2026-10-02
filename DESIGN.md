# DESIGN — design system del sito

**Linguaggio visivo: shadcn/ui trasposto in CSS puro** (niente React, Tailwind, Radix o CDN; SPEC §0 invariata).
Ogni componente del vocabolario SPEC §6 segue la ricetta shadcn corrispondente; i tre temi condividono **lo stesso
scheletro** (forme, misure, raggi, ombre, stati) e cambiano solo **palette e famiglia dei titoli**.
- `neutral` = **default del sito**: trasposizione fedele dei token shadcn base color *zinc* (v4, OKLCH → hex sRGB,
  fonte `ui.shadcn.com/r/colors/zinc.json`, 1 ott 2026). Deroga: `--radius: 0.5rem` (richiesta cliente; shadcn 0.625rem).
- `washi` = stesso scheletro, palette carta/sumi/indaco con vermiglio come `--primary`, titoli Mincho/Iowan; in più tre
  variabili di superficie: carta (`--bg-texture`, gradienti CSS, 0 KB), sigillo 「旅」 (`--seal`), segno vermiglio dei
  titoli di sezione (`--section-mark`). Filtri attivi in sumi (`--chip-on-bg`) perché il vermiglio resti alle azioni.
- `night` = stesso scheletro, scuro profondo con primario ambra-lanterna, titoli serif, sigillo.

**Regola d'oro.** `base.css` e i CSS di pagina usano solo `var(--…)`: zero colori letterali. Tinte con
`color-mix(in srgb, var(--x) N%, var(--card))`. Nessun font esterno: stack di sistema "stile Inter"
(`"Inter"` se installato localmente, poi `ui-sans-serif, system-ui, -apple-system…`, Hiragino/Noto JP per i kanji).

## Ibrido 2 ott: cosa viene da A, cosa da B
Il cliente ha preferito la versione **A** (commit `4d4a952`, "shadcn") alla **B** (`dc1652a`, "editoriale": tema unico,
serif, niente card, home testuale, slot foto), giudicata "una pagina vuota". Il sito ora è **struttura e look di A** più
le sole pulizie di B elencate qui sotto. Questo file descrive il risultato; dove il resto del documento parla di A vale
con queste eccezioni.

**Da A (invariati):** i tre temi `neutral` (default), `washi`, `night` col selettore Tema/Modo nel footer e il pulsante modo
nella topbar; card con ombra, nav con icone (mobile e desktop), hero col conto alla rovescia in home, card "Primo giorno",
"Prossime scadenze", "In tasca" (mappa e voli); link e bottoni con le loro icone (Maps, esterno, chevron); tipografia
sans "stile Inter"; `_styleguide.html`, `manifest.webmanifest`, icone.

**Da B (portate in A):**
- **Badge**: al massimo uno per riga. Nel giorno il tipo è **pallino + parola, senza pillola** (presentazione 2 ott, [decisione cliente]), gli stati diventano parole
  ("orario fisso · facoltativo · in parallelo · prenotato") e l'unico badge è "da prenotare". Base e gita sono una riga
  di testo grigio ("Osaka · gita a Kyoto"), non due badge.
- **"bozza" una sola volta**: la riga `agenda.notice` in testa all'agenda. Niente badge bozza nelle colonne, nel pannello,
  nel giorno né in home.
- **Timeline a 4 famiglie di colore** (tabella sotto): i 13 `type` dei dati restano, i `--c-*` di ogni tema puntano a 4
  `--fam-*`. "Libero" è spazio: buchi senza tratteggio né pillola, orario in grigio; anche i facoltativi non sono più
  tratteggiati (senza fondo, bordo pieno).
- **Lucchetto solo nel pannello di dettaglio** (badge "orario fisso" / "non spostabile"); nei blocchi un orario fisso si
  riconosce dalla tinta più piena (`.tl-item--locked`, 20%). Niente lucchetto in home né nel giorno.
- **Niente slot foto**: il markup e il JS degli slot di B non ci sono (A non li aveva). `trip.photos` resta nei dati
  (l'exporter lo scrive, oggi `[]`) ma nessuna pagina lo legge.
- **Home**: tolte solo la griglia "Sezioni" (duplicava la nav) e la riga del tasso di cambio (resta nel budget).
- **Cifre**: `.mono` = solo `font-variant-numeric: tabular-nums` nel font del testo. Nessun elemento usa più
  `--font-mono` (la variabile resta nei temi per compatibilità).
- **Dati e copy di B** (`export_site_data.py`, `site_overrides.json`, `data/*.json`) invariati: testi riscritti, titoli
  puliti, bus Narita 11:20 ovunque, id stabili (`bg-*` diventa anche l'`id` della card guida in Trasporti).

## Token shadcn → variabili nostre
Ogni tema è in tre blocchi: **(A)** token shadcn grezzi, **(B)** mappa sulle variabili §6 (`--bg: var(--background)`…),
**(C)** 4 famiglie della timeline (`--fam-*`) e i 13 `--c-<type>` che vi puntano. I blocchi scuri ridefiniscono solo (A) e (C): (B) si risolve da sé.

| Token shadcn | Variabile nostra (SPEC §6) | Uso |
|---|---|---|
| `--background` | `--bg` | fondo pagina |
| `--foreground` | `--fg` | testo |
| `--card` / `--card-foreground` | `--bg-elev` | card, timeline |
| `--popover` / `-foreground` | (diretto) | sheet (`.panel`), toast |
| `--primary` / `-foreground` | `--accent` / `--fg-on-accent` | `.btn--primary`, "ora", chip premuto, conto alla rovescia |
| `--secondary` / `-foreground` | (diretto) | `.badge`, `.btn--secondary` |
| `--muted` / `-foreground` | `--bg-sunken` / `--fg-muted` | TabsList, incassi, testo secondario |
| `--accent` / `-foreground` | **`--accent-soft` / `--accent-soft-foreground`** | hover di ghost/outline/chip/nav. Rinominato: `--accent` è già la variabile §6 |
| `--destructive` | `--danger` (+ `--destructive-foreground`) | `.btn--destructive`, `.badge--destructive` |
| `--border` | `--border` | stesso nome |
| `--input` | (diretto) | bordo di input, chip, `.btn` outline |
| `--ring` | `--ring` (+ `--focus`) | focus 2px offset 2px; `--focus` = ring reso ≥3:1 dove zinc-400 non basta |
| `--radius` | `--radius` = 0.5rem | derivati `--radius-sm/md/lg/xl` = −4 / −2 / 0 / +4 px |

Altre variabili (estensioni, in ogni tema): `--accent-2` (link) · `--ok --warn` · `--overlay` · `--shadow-xs --shadow
(= shadow-sm) --shadow-lg` · `--font-sans --font-display --font-mono` · `--tracking-title` · `--space-1..6` (4 8 12 16 24 40)
· `--tl-hour-h` · `--fam-move/-fixed/-culture/-evening` · `--c-*` (13 type → famiglie). Facoltative: `--nav-active-fg/-bg/-fg-desk`, `--chip-on-bg/-fg`, `--tab-active-border`,
`--card-accent-tint`, `--bg-texture(-size)`, `--seal(-size/-rotate/-bg/-fg)`, `--section-mark(-w/-gap)`, `--tl-tint`.
Layout (in `base.css`): `--gutter --container --topbar-h --nav-h --card-p --tl-hours-w --tl-head-h --tl-span --tl-pad --tl-max-h --tl-col-min`.

## Tipografia (scala shadcn/Tailwind)
xs 12/16 (`.xs`) · sm 14/20 (`.small`) · base 16/24 · lg 18/28 (`.h3`, `.section-title`) · 2xl 24/32 (`.h2`) ·
3xl 30/36 → 4xl 36/40 ≥900 (`.h1`, bold). Titoli `letter-spacing: var(--tracking-title)` = −0.025em (tracking-tight;
washi/night −0.01em perché serif). `.mono` = cifre tabulari nel font del testo, **niente monospazio** (ibrido); `.h1.mono` = cifra-titolo (KPI) nella display del tema.
`.section-title` in sentence case, niente maiuscoletto né tracciato largo; nessun testo in maiuscolo da CSS.

## Componenti (ricette shadcn)
```html
<div class="card">…</div>                      <!-- rounded-lg border bg-card shadow-sm p-6 (20px sotto 640) -->
<div class="card"><div class="card__header"><p class="card__title">…</p><p class="card__description">…</p></div>
  <div class="card__content">…</div><div class="card__footer"><a class="btn btn--primary">…</a></div></div>
<a class="btn btn--primary">Default</a> <button class="btn btn--secondary">…</button> <button class="btn">Outline</button>
<button class="btn btn--ghost">…</button> <button class="btn btn--destructive">…</button> <a class="btn btn--link">…</a>
<button class="btn btn--sm|btn--lg">…</button> <button class="btn btn--icon" aria-label="…"><svg class="icon">…</svg></button>
<span class="badge">secondary</span> <span class="badge badge--default|--secondary|--outline|--destructive">…</span>
<span class="badge badge--fixed|--draft|--opt|--todo|--done">…</span> <span class="badge" style="--bc: var(--c-food)">cibo</span>
<button class="chip" aria-pressed="true">Kyoto</button>   <!-- Toggle outline; premuto = pieno -->
<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true">Tratte</button></div>
<input type="search">  <dl class="kv">…</dl>  <ul class="list"><li class="list-item">…</li></ul>  <p class="empty">…</p>
<aside class="panel is-open" role="dialog" aria-modal="true"><button class="panel__close" aria-label="Chiudi">…</button>…</aside>
<div class="toast toast--show" role="status">…</div>
```
- **Button**: h-10 (40px) px-4 rounded-md text-sm font-medium, icone 16px; `::after` porta l'area di tocco a 44px (SPEC).
  `.btn` senza variante = *outline* (bordo `--input`, `shadow-xs`, hover `--accent-soft`); focus ring 2px offset 2px.
- **Badge**: pill `rounded-full` px-2.5 text-xs semibold; base = secondary; stati tinti dal colore `--bc`.
- **Chip**: Toggle shadcn *outline* (h-9 + area 44px), premuto (`.chip--active` / `aria-pressed` / `aria-selected`) =
  pieno `--chip-on-bg` (default `--primary`). `span.chip` è un'etichetta: niente hover.
- **Tabs**: TabsList `bg-muted p-1 rounded-lg` (44px), tab 36px rounded-md, attiva = "card" (`--card` + `shadow-sm`).
  Su mobile la lista scorre in orizzontale.
- **Input**: h-10 rounded-md border-input shadow-xs; focus = bordo `--focus/--ring` + alone 3px `--ring` 45%. Mobile 44px e 16px.
- **Card**: una sola azione primaria; nelle liste lunghe l'azione è outline o `.btn--icon`. Sotto-parti header/title/
  description/content/footer facoltative (24px tra le parti).
- **Panel = Sheet**: mobile bottom-sheet `rounded-t-xl` con maniglia Drawer (100×6px, sticky in cima mentre il contenuto
  scorre), max 88dvh, scroll interno, padding + safe-area; ≥900 side sheet destro 28rem con bordo sinistro. Overlay
  `--overlay` (nero 50%). Chiudi: ghost 36px (area 44) opacità .7 → 1. Body bloccato con `body:has(.panel.is-open)`.
- **Toast** (Sonner): `--popover`, bordo, rounded-md, `shadow-lg`, text-sm; l'azione è un piccolo bottone pieno.
- **Topbar**: sticky h-14, fondo 92% + blur, filo sotto; marchio = quadrato `--primary` (sigillo 「旅」 se `--seal`).
- **Nav**: mobile bottom bar fissa con `env(safe-area-inset-bottom)`; voce attiva = pillola dietro l'icona + label 600.
  ≥900 NavigationMenu: voci h-9 px-3 rounded-md text-sm, hover e attiva su `--accent-soft` (washi/night: tinta del primario).
- **Empty**: bordo tratteggiato rounded-lg, p-8, text-sm muted, centrato. **Table**: text-sm, th medium muted, hover riga muted/50.
- **Icone**: `<svg class="icon" aria-hidden="true"><use href="assets/icons/sprite.svg#i-NOME"></use></svg>`; 1.25em, `currentColor`.
  Sprite: calendar train bus bed map-pin pin wallet home lock external close chevron-left/right sun moon auto search filter
  yen info warning check clock food onsen bag star walk torii anime (stella + scintilla: luoghi anime/otaku/Love Live; `star` resta "segnalato da voi").

## Timeline
```html
<div class="timeline" style="--tl-span:18">   <!-- scroll interno x/y, max-height --tl-max-h; header e ore sticky -->
  <div class="tl-hours"><div class="tl-hour">06</div>…(una per ora)</div>
  <div class="tl-day" aria-current="date">     <!-- aria-current: header evidenziato -->
    <header class="tl-day__header"><span>sab 7 nov</span><span class="small muted">Osaka</span></header>
    <button class="tl-item tl-item--food tl-item--optional tl-item--locked" style="--top:576px;--h:120px;--i:0;--n:2">
      <span class="mono">18:00–20:00</span><strong>Titolo</strong><span class="small">€ 25</span></button>
    <div class="tl-gap" style="--top:…;--h:…"><span>15:40–17:00 · libero</span></div>
    <div class="tl-now" style="--top:…"></div>
  </div>
</div>
```
Colore = famiglia (ibrido 2 ott, da B), definita in ogni tema; valori `neutral` chiaro / scuro:

| Famiglia | Variabile | neutral | Type |
|---|---|---|---|
| Spostamenti | `--fam-move` | `#2b4aa4` / `#5390eb` | train, bus, transfer, logistics |
| Orari fissi | `--fam-fixed` | `#9d1172` / `#c76ab5` | fixed, lodging |
| Visite e cultura | `--fam-culture` | `#247a4b` / `#53a473` | sight, anime, onsen, shopping |
| Cibo e sera | `--fam-evening` | `#823b15` / `#d47421` | food, nightlife |
| (spazio) | `--fg-muted` | — | free |

Valori del 2 ott (validati all-pairs col validatore dataviz, washi e night nella sezione "Presentazione dati"); prima erano i colori di A, che fallivano il validatore.
Densità: tinta 12% (`--tl-tint`); `fixed: true` → `.tl-item--locked` 20% (niente lucchetto nel blocco); `optional` →
senza fondo, bordo pieno al 40% e filo sinistro pieno; `free` 0% testo muted; i buchi `.tl-gap` sono **spazio vuoto**
con l'orario in grigio, senza tratteggio né pillola. Ora in testa al blocco nel colore della famiglia (80% verso `--fg`),
cifre tabulari. Legenda: le 4 famiglie (`.tl-fam--*`) + "tinta piena = orario fisso" e "senza fondo = facoltativo".
In `giorno.html` il filo sinistro di ogni riga ha il colore della famiglia (facoltativo = filo al 45%, libero = nessun filo).
Testo nel colore di famiglia (chip del pannello, `.badge--fixed`, badge con `--bc`): sempre `color-mix(--tc 80%, --fg)`, la stessa ricetta dell'orario.
Mappa JS: `FAMILY`, `FAMILY_LABEL`, `FAMILIES` in `agenda-gaps.js`.

`--top` = minuti dall'inizio scala × `--tl-hour-h`/60 (px, oppure `calc(N * var(--tl-hour-h))`); `--tl-head-h` è
sommato da base.css. `--i/--n` = colonna/colonne per sovrapposizioni. Blocchi ≤38px passano in automatico a una riga
(container query; `.small` nascosto). Mobile: un giorno per schermata con scroll-snap; ≥900px colonne ≥132px (7 visibili).

## Contrasto (verifica)
Ibrido, 2 ott 2026: 7 pagine × 375/1280 × neutral chiaro/scuro con tutti i `<details>` aperti, più il pannello agenda
aperto (chiaro e scuro) e le 7 pagine a 375 in washi e night chiaro/scuro → **0 errori AA**. Storico di A:
`dev/contrast-check.js` misura il DOM renderizzato (testo vs sfondo composto, soglie WCAG 4.5/3). In DevTools:
`(await import('./dev/contrast-check.js')).run()`. 1 ott 2026: 7 pagine + styleguide × 375/1280 × neutral chiaro/scuro,
washi chiaro/scuro, night → 0 errori (esclusi bottoni disabilitati e toast nascosto). Nessuno scroll orizzontale.
Ritocchi AA rispetto ai token shadcn puri: tab inattive `muted-foreground` mescolato 18% verso `--fg` (4.4 → AA su `--muted`);
`--focus` zinc-500 per il contorno di focus (zinc-400 = 2.6:1); `--ok/--warn` neutral = green-800/amber-800.

## Aggiungere un tema
1. Copia `assets/css/themes/neutral.css` in `<nome>.css` e cambia SOLO i valori di (A) e (C) (chiaro + i due blocchi scuri);
   il blocco (B) resta identico. Facoltative le variabili di superficie (vedi sopra).
2. Contrasto ≥4.5:1 per `--fg`, `--fg-muted`, `--accent-2`, le 4 `--fam-*` su `--card` e sulle tinte; i `--c-*` restano mappati sulle famiglie; `--primary-foreground` su `--primary`.
3. Registra il tema in `theme-boot.js` (`THEMES`) e in `PRECACHE` di `sw.js`; prova in `_styleguide.html?theme=<nome>&mode=dark`.

## Presentazione dati (2 ott, sera)
Fonte: `PLAN_PRESENTAZIONE.md` (piano), `PRESENTAZIONE_REPORT.md` (esiti). Lo scheletro A resta intero; cambiano la palette delle
famiglie, quattro grafici SVG e la densità di giorno, trasporti, alloggi, luoghi, budget.

**Palette delle famiglie, 3 temi.** Le 4 tinte precedenti fallivano il validatore dataviz in tutti i temi ("orari fissi" e "cibo e sera"
a ΔE 9,9 a vista normale; verde/rosso confusi dai deuteranopi). Nuove tinte cercate per enumerazione OKLCH vicino a quelle di prima, con
vincoli: banda di luminosità, croma ≥ 0,10, all-pairs CVD ≥ 8, vista normale ≥ 15, segno ≥ 3:1 sulla card, testo AA (orario 80% verso
`--fg` su tinta 20%, chip/badge 80% su tinta 12%). `node validate_palette.js "<hex>" --mode … --surface <card> --pairs all` → **tutto PASS**.

| Tema (card) | move | fixed | culture | evening | CVD peggiore | normale peggiore |
|---|---|---|---|---|---|---|
| neutral chiaro (`#ffffff`) | `#2b4aa4` | `#9d1172` | `#247a4b` | `#823b15` | 8,1 | 16,8 |
| neutral scuro (`#18181b`) | `#5390eb` | `#c76ab5` | `#53a473` | `#d47421` | 9,0 | 18,6 |
| washi chiaro (`#fffcf6`): indaco, prugna, pino, kaki | `#2e4b9a` | `#812a62` | `#1c7851` | `#a54d07` | 8,5 | 17,1 |
| washi scuro (`#1e2128`) | `#4a97e1` | `#ba79ac` | `#60a46f` | `#d37812` | 8,4 | 16,3 |
| night (`#101219`): fredde contro l'ambra del primario | `#5c93e4` | `#bc69ab` | `#42a878` | `#c18434` | 8,4 | 17,0 |

Washi scuro non arriva a 4,5:1 col colore puro sulla tinta 11% dentro la banda di luminosità: per questo il testo di famiglia usa
sempre la ricetta 80% verso `--fg` (vedi Timeline). I `--c-*` dei 13 type puntano sempre alle famiglie.

**Grafici: `assets/js/charts.js` + `assets/css/charts.css`.** SVG inline senza librerie, colori solo `var(--chart-*)` derivati da
`--fam-move --fg --fg-muted --accent --border --card`. Contenitore `<figure class="chart chart--<tipo>">`, `wire(root)` dopo `mount`.

| Forma | Quando | Dove | Regole |
|---|---|---|---|
| `routeStrip` | parte-del-tutto nel tempo con classi già scritte | home, alloggi (link alle card) | grigio + enfasi su una base (`--accent`), nomi su 2 corsie misurate, tacca "oggi"/"partenza" con etichetta sempre in `--fg` (si muove solo il filo) |
| `dotTimeline` | eventi datati, non una serie | trasporti › Scadenze | un punto per scadenza, impilati; etichette solo "oggi", prossima, "partenza"; se la prossima cade oggi un'etichetta sola "oggi · N scadenze" |
| `stackBar` | composizione ordinale (≤ 3 classi) | budget | barra 100% una riga, rampa di una tinta (100/68/45% verso la card), legenda con importo e %, tabella gemella |
| `bulletRows` | valore contro obiettivo per riga | budget per giorno | barra = agenda, tacca in inchiostro = budget, un asse € da 0, ≤ 3 etichette dirette, tabella gemella |

Niente torte, doppi assi, numero su ogni punto, testo nel colore della serie, `tabular-nums` sui numeri hero.
Il nastro del giorno (`giorno-strip`) è timeline, non charts.js: sta in `agenda-day.js` e usa le famiglie.

**Eccezioni allo scheletro, [decisione cliente da confermare].**
- Giorno: tipo = pallino + parola (niente chip); riga 2 = tipo · costo · nota costo · luogo · stati · badge "da prenotare" · dove/quando.
- Maps nelle liste (giorno, alloggi, luoghi): bottone **solo icona 44×44** (`mapsIconBtn`, ghost/outline) con `aria-label` "Apri <nome> in Google Maps (nuova scheda)". In alloggi nessun `.btn--primary` nelle card.
- Budget: **un solo numero grande** (`.hero-fig`, cifre proporzionali) invece di due card KPI.
- Luoghi: Sì/Forse sono **sotto-elenchi** dentro il gruppo (niente badge flag per riga); icona del tipo davanti al nome.
- Temi serif (washi, night) a < 480px: nomi alloggio 18px e titolo guida bagagli 17px, per non andare a capo (`pages-b.css`).
