# NOTES_design — per orchestratore e altri agenti

File miei: `assets/css/base.css`, `assets/css/themes/{washi,neutral,night}.css`, `assets/icons/{sprite.svg,favicon.svg,icon.svg,icon-192.png,icon-512.png}`,
`_styleguide.html`, `DESIGN.md`, questo file. PNG generati con `rsvg-convert -w 192 -h 192 assets/icons/icon.svg -o assets/icons/icon-192.png` (idem 512).

## Richieste
1. **shell / sw.js** — aggiungere a `PRECACHE`: `assets/icons/sprite.svg`, `assets/icons/favicon.svg`, i tre temi, `icon-192.png`, `icon-512.png`.
   Facoltativo: `<link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">` prima del png. Manifest: le icone hanno
   area sicura ~80% → si possono dichiarare `"purpose": "any maskable"`. `theme-color` washi chiaro = `#f4efe4` (= `--bg`), già allineato.
2. **tutti** — variabili estese disponibili in ogni tema: `--bg-sunken --fg-on-accent --ok --warn --danger --overlay --font-display`.
   Testo su `--accent` → `--fg-on-accent`. Stati sì/no/attenzione → `--ok/--warn/--danger`.
3. **tutti** — bottone solo-icona: classe esplicita `.btn--icon` + `aria-label` (44×44). Il vecchio selettore `:has(> .icon:only-child)` è stato rimosso in integrazione (scattava anche con testo nudo).
4. **agenda** — base.css somma già `--tl-head-h` a `--top`; supporta `--i/--n`, `--tl-span` (ore visibili, default 18),
   `--tl-max-h` (altezza scroller), `--tl-col-min` (larghezza minima colonna desktop, 132px), `aria-current="date"` su `.tl-day`.
   Contenuto consigliato del blocco: `.mono` (ora, colorata per type) + `strong` (titolo, max 3 righe) + `.small` facoltativo.
5. **shell** — `.topbar__subtitle` è nascosto sotto 1600px (accanto alla nav non c'è spazio): se serve, mostrarlo nel corpo pagina.
