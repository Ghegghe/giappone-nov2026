# NOTES_design2 — passata "design-polish" + direttiva shadcn/ui (1 ott 2026)

## 0. URGENTE — tema di default = `neutral` (shadcn). Da fare in file non miei
Il CSS è pronto: `neutral.css` = token shadcn zinc; `washi`/`night` = stesso scheletro, altra palette. Serve:
1. `assets/js/theme-boot.js` r.13: `var theme = 'washi', mode = 'auto';` → `var theme = 'neutral', mode = 'auto';`
   e (facoltativo) mettere `neutral` primo in `THEMES` (r.5-9) così è il primo del select:
   ```js
   var THEMES = [ { id: 'neutral', label: 'Neutro' }, { id: 'washi', label: 'Washi' }, { id: 'night', label: 'Notte' } ];
   ```
2. `assets/js/app.js` r.183 `FALLBACK_THEMES`: stesso ordine (neutral primo); r.190 `|| 'washi'` → `|| 'neutral'`;
   r.200 commento «(washi|neutral|night)» ok.
3. Le 7 pagine + `404.html`: `<link rel="stylesheet" id="theme-css" href="assets/css/themes/washi.css">` → `…/neutral.css`
   (evita il doppio download e il flash del tema sbagliato prima di theme-boot) e `<meta name="theme-color" content="#f4efe4">`
   → `content="#ffffff"` (app.js lo risincronizza comunque da `--bg`).
4. `manifest.webmanifest`: `"background_color"` e `"theme_color"` `#f4efe4` → `#ffffff`.
5. `sw.js`: bump `CACHE_VERSION` (CSS riscritti). PRECACHE invariato (nessun file nuovo da servire).
Chi ha già `giappone.theme=washi` in localStorage resta su washi: è voluto (scelta dell'utente).

## 0b. Cosa cambia per chi scrive markup
- Classi §6 tutte invariate. Nuove (facoltative): `.btn--secondary .btn--outline .btn--destructive .btn--link .btn--sm .btn--lg`,
  `.badge--default .badge--secondary .badge--outline .badge--destructive`, `.card__header .card__title .card__description
  .card__content .card__footer`, `.xs`. Tabella token in `DESIGN.md` e `_styleguide.html`.
- `.btn` senza variante ora è *outline* shadcn (prima "neutro"): stesso uso. `.btn--ghost` ora è color testo (prima indaco).
- `.small` ora è text-sm 14/20 (prima 13px); `.h1` 30/36 → 36/40 da 900px, bold.
- Luoghi: ho tolto da `pages.css` le regole `.lu-card*`/`.lu-maps` (markup sostituito dall'accordion `details.lu-group` +
  `.lu-row`), e stilato `.lu-group__head` come Accordion shadcn (chevron che ruota) e `.lu-row*`.


File toccati: `assets/css/base.css` (riscritto, 598 righe), `assets/css/agenda.css`, `assets/css/pages.css`,
`assets/css/themes/{neutral,washi,night}.css` (riscritti: token shadcn + mappa §6), `_styleguide.html`, `DESIGN.md`, questo file.
Nuovi: `dev/contrast-check.js` (verifica AA sul DOM), `dev/shots_design2/{before,after}/`.
Nessuna classe né variabile di SPEC §6 rinominata o rimossa; aggiunti alias shadcn e variabili facoltative (elenco in DESIGN.md).

## Richieste all'agente ux-content / orchestratore

1. **sw.js** — bumpare `CACHE_VERSION` (CSS cambiati), altrimenti chi ha già la PWA vede i vecchi stili.
   Nessun file statico nuovo da aggiungere a `PRECACHE` (`dev/` è escluso dal deploy).

2. **giorno.html, buchi** (`agenda-day.js` ~r.53): la colonna ora ripete l'orario già nel testo
   («06:00 | 06:00-07:00 · libero (1h)»). Proposta: nel testo solo la durata.
   ```js
   el('div', { class: 'giorno__main tl-gap__label small muted' }, `libero · ${g.durLabel ?? g.label}`)
   ```
   (oppure lasciare `g.label` e svuotare `.giorno__time` per i gap.)

3. **Pannello agenda** (`agenda.js`): la riga `kv` «Tipo: Visita» duplica la chip type subito sotto il titolo → togliere la riga «Tipo».

4. **Home** (`pages-home.js`): le due azioni di coda delle card sono diverse («Tutto il giorno» = `.btn`, «Tutte le scadenze» =
   `.btn--ghost`). Usare `btn btn--ghost` per entrambe (l'unico pieno vermiglio della home resta «Mappa del viaggio»).
   Riga meta del primo giorno: «Osaka · OSAKA · Arrivo…» ripete la base → mostrare `day.base` una volta sola.

5. **Agenda, frecce giorno** (`agenda.html`): `‹ ›` come testo; meglio le icone dello sprite e la classe esplicita:
   ```html
   <button type="button" class="btn btn--ghost btn--icon agenda__nav" id="agenda-prev" aria-label="Giorno precedente"><svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons/sprite.svg#i-chevron-left"></use></svg></button>
   ```
   (idem `agenda-next` con `i-chevron-right`). Il CSS `.agenda__nav` resta valido.

6. **Testi in MAIUSCOLO dal dossier** (OSAKA, KYOTO g.1, PRENOTATO, VINCOLO FISSO, UNITÀ PRIVATA, TAKAYAMA → SHIRAKAWA-GO…):
   sul sito leggono come urla accanto alla tipografia sentence-case. Non correggibile da CSS senza rompere sigle (KIX, JR, QR).
   Proposta: `textFixes` mirati in `site_overrides.json` o normalizzazione nell'exporter per i soli `title`/`notes` dei giorni.

7. **Luoghi a 375**: la barra filtri sticky occupa ~185px su 812 (ricerca + 2 righe chip + conteggio). Proposta: spostare
   «Ordina» in fondo alla lista o dentro un `<details class="chip">Ordina</details>`; il conteggio può stare a destra della riga flag.

8. **Titolo viaggio**: «7-24» va a capo dopo il trattino in titoli stretti. Se si vuole evitarlo, in `trip.title` usare il
   trattino non separabile U+2011 («7‑24»). Facoltativo: in home ho già tolto `text-wrap: balance` dal titolo.

## Verifiche fatte
- `dev/contrast-check.js` su 8 pagine × 375/1280 × 5 combinazioni tema/modo: 0 errori AA (esclusi disabilitati e toast nascosto);
  corretto `--fg-muted` night (#8a8e9b → #9195a2, «.small» su blocco fisso era 4.42) e testo nav attiva desktop (4.31 → AA).
- Nessuno scroll orizzontale di pagina in nessuna combinazione. `python3 tools/check_site.py` → 0 errori.
