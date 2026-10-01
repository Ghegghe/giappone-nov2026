# DESIGN — design system del sito

**Principi.** Carta e inchiostro: superfici calde, testo sumi, un solo accento forte (vermiglio 朱) e un secondario
per link/focus (indaco 藍). Gerarchia netta: titoli `.h1/.h2` in serif di sistema (Mincho/Iowan) nel tema washi,
tutto il resto sans di sistema; numeri sempre `.mono` (cifre tabulari). Densità alta nella timeline, aria fuori.
Nessun font esterno (0 KB): stack di sistema con kana/kanji (Hiragino / Noto JP).

**Regola d'oro.** `base.css` e i CSS di pagina usano solo `var(--…)`: zero colori letterali. Tinte e sfumature con
`color-mix(in srgb, var(--x) N%, var(--bg-elev))`.

## Token (definiti in OGNI tema)
| Gruppo | Variabili |
|---|---|
| Superfici/testo | `--bg --bg-elev --bg-sunken* --fg --fg-muted --fg-on-accent* --border --overlay*` |
| Accenti/stati | `--accent` (azione primaria, "ora") · `--accent-2` (link, focus) · `--ok* --warn* --danger*` |
| Forma/font | `--radius --shadow --font-sans --font-display* --font-mono` |
| Spazi | `--space-1..6` = 4 · 8 · 12 · 16 · 24 · 40 px |
| Timeline | `--tl-hour-h` (48px, 56px ≥900px) |
| Type agenda | `--c-train --c-bus --c-transfer --c-sight --c-food --c-nightlife --c-lodging --c-logistics --c-free --c-fixed --c-anime --c-onsen --c-shopping` |

`*` = estensioni oltre SPEC §6 (servono a contrasto e stati). Layout (in `base.css`, non nei temi):
`--gutter --container --topbar-h --nav-h --tl-hours-w --tl-head-h --tl-span --tl-pad --tl-max-h --tl-col-min`.
Contrasto verificato AA (≥4.5:1) per testo, badge e `--c-*` su `--bg-elev` e sulle tinte al 16%, in chiaro e scuro.

## Componenti (classi SPEC §6)
```html
<main class="container stack">                 <!-- .stack: gap verticale (override: style="--stack-gap:8px") -->
<div class="row">…</div>  <div class="grid-2|grid-3">…</div>
<h2 class="section-title">Prossime scadenze</h2>  <!-- etichetta maiuscoletto con trattino accent -->
<div class="card">…</div>  <a class="card card--accent" href="…">…</a>
<button class="chip chip--active">Kyoto</button>  <!-- o aria-pressed="true" -->
<a class="btn btn--primary">…</a> <button class="btn btn--ghost">…</button>
<button class="btn btn--icon" aria-label="Precedente"><svg class="icon"><use href="assets/icons/sprite.svg#i-chevron-left"/></svg></button>
<span class="badge badge--fixed|--draft|--opt|--todo|--done">bozza</span>
<span class="badge" style="--bc: var(--c-food)">cibo</span>   <!-- legenda type -->
<dl class="kv"><dt>Check-in</dt><dd>16:00</dd></dl>
<ul class="list"><li class="list-item"><svg class="icon">…</svg><span>Testo</span><span class="badge">…</span></li></ul>
<div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true">Tratte</button></div>
<div class="filter-bar"><input type="search">…chip…</div>   <!-- mobile: riga scorrevole a filo; ≥900 va a capo -->
<p class="empty">Nessun risultato</p>   <span class="mono">12:10</span> <span class="small muted">…</span>
<aside class="panel" role="dialog" aria-modal="true"><button class="panel__close" aria-label="Chiudi">…</button>…</aside>
<div class="toast" role="status">…</div>   <!-- visibile con .toast--show -->
```
- **Icone**: `<svg class="icon" aria-hidden="true"><use href="assets/icons/sprite.svg#i-NOME"></use></svg>`; 1.25em, `currentColor`.
  Sprite: calendar train bus bed map-pin pin wallet home lock external close chevron-left/right sun moon auto search filter
  yen info warning check + extra clock food onsen bag star walk torii.
- **Panel**: `.is-open` lo apre (bottom-sheet ≤899px, drawer destro 440px ≥900px). Overlay = ombra a tutto schermo
  (i click fuori arrivano alla pagina: il JS chiude). Con `<dialog class="panel">` + `showModal()` si usa `::backdrop`.
  Con panel aperto il body non scrolla (`body:has(.panel.is-open)`).
- **Nav/shell**: markup di app.js (NOTES_shell §4). Mobile bottom bar fissa (body ha già `padding-bottom`);
  ≥900px la `.nav` si sovrappone alla `.topbar` a destra; `.topbar__subtitle` resta nascosto sotto 1600px.

## Timeline
```html
<div class="timeline" style="--tl-span:18">   <!-- scroll interno x/y, max-height --tl-max-h; header e ore sticky -->
  <div class="tl-hours"><div class="tl-hour">06</div>…(una per ora)</div>
  <div class="tl-day" aria-current="date">     <!-- aria-current: header evidenziato -->
    <header class="tl-day__header"><span>sab 7 nov</span><span class="small muted">Osaka</span></header>
    <button class="tl-item tl-item--food tl-item--optional" style="--top:576px;--h:120px;--i:0;--n:2">
      <span class="mono"><svg class="icon">…#i-lock</svg> 18:00–20:00</span><strong>Titolo</strong><span class="small">€ 25</span></button>
    <div class="tl-gap" style="--top:…;--h:…"><span>15:40–17:00 · libero</span></div>
    <div class="tl-now" style="--top:…"></div>
  </div>
</div>
```
`--top` = minuti dall'inizio scala × `--tl-hour-h`/60 (px, oppure `calc(N * var(--tl-hour-h))`); `--tl-head-h` è
sommato da base.css. `--i/--n` = colonna/colonne per sovrapposizioni. Blocchi ≤38px passano in automatico a una riga
(container query; `.small` nascosto). Mobile: un giorno per schermata con scroll-snap; ≥900px colonne ≥132px (7 visibili).

## Aggiungere un tema
1. Copia `assets/css/themes/washi.css` in `<nome>.css`, cambia i valori (tutte le variabili, chiaro + i due blocchi scuri).
2. Contrasto ≥4.5:1 per `--fg`, `--fg-muted`, `--accent-2`, `--c-*` su `--bg-elev` e sulle tinte 16%; `--fg-on-accent` su `--accent`.
3. Registra il tema in `theme-boot.js` (`THEMES`) e in `PRECACHE` di `sw.js`; prova in `_styleguide.html?theme=<nome>&mode=dark`.
