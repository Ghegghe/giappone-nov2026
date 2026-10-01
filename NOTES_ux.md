# NOTES_ux — agente "ux-content" (1 ott 2026)

File miei: `site/*.html` (tranne `_styleguide.html`), `site/assets/js/*`, `../export_site_data.py`, `../site_overrides.json`,
`site/data/*` (rigenerati), `site/dev/*`, questo file. Nessun CSS, icona o `_styleguide.html` toccato.

## Principio
I testi si correggono nell'exporter (`ux_clean`, regole generali, idempotenti) o in `site_overrides.json` (eccezioni).
Ordine nell'exporter: `textFixes` (testo grezzo) → `ux_clean` → override puntuali (`agendaItems`, `agendaDays`, `transport`), che sono già testo finale.
`--check` ora fallisce anche se: un titolo item supera ~70 caratteri, un titolo giorno comincia in MAIUSCOLO, restano 📎/🗓 nei testi.

## Audit (375 e 1280) → cosa ho trovato e corretto
| Pagina | Problema | Correzione |
|---|---|---|
| Tutte | footer «generato da build_xlsx_v33.py» | «Dati aggiornati al 1 ott 2026, 21:58» |
| Tutte | MAIUSCOLE d'enfasi del dossier (PRENOTARE, SOLO CONTANTI, UFFICIO…) | `fix_caps` nell'exporter (sigle e nomi propri preservati) |
| Tutte | «h10 JP = 3:00 IT», «11/11», «3:00-16:30 IT» | «le 10:00 in Giappone = le 3:00 in Italia», «11 nov», «3:00-16:30 (ora italiana)» |
| Tutte | riferimenti al dossier («📎 Dettagli → Punti aperti», «🗓 Agenda», «vedi riga…», «(scelte in 📎 Dettagli)») | tolti, sostituiti da `links` interni (es. «Procedura bagagli» → `alloggi.html#bagagli`) |
| Tutte | URL lunghi nel testo (westjr.co.jp/travel-information/…) e «Takayama→Shirakawa→…» senza spazi: scroll orizzontale su Alloggi a 375 | testo = dominio (link completo in `url`); spazi attorno a «→» |
| Agenda | titoli item con logistica (KATE 120 car.) | `short_title`: titolo = nome, resto in `note`; 6 eccezioni in `agendaItems` |
| Agenda | «OSAKA · OSAKA · Arrivo &…», «KYOTO g.1 · …» | `title` normale, `base`, `dayTrip`; UI «Osaka · gita a Kyoto» |
| Agenda | «Agenda in revisione: leggi» + badge «bozza» su ogni giorno | una riga: «Bozza del 14 lug, in revisione: orari e tappe possono cambiare.»; badge per giorno solo se non sono tutti bozza |
| Agenda | pannello: righe «Tipo» (doppia del chip), «Prenotazione: nessuna prenotazione», «Costo €0» | tolte quando vuote/ridondanti |
| Giorno | «gratis / incluso» con costo semplicemente assente; «Budget previsto dal dossier»; cambio ripetuto in ogni giorno | tolti / «budget previsto €X a testa» |
| Agenda/giorno | 24 nov base «—» | base del giorno prima (Tokyo), `baseId` resta vuoto |
| Home | «in ritardo» su scadenza di oggi; date «11 ott 3:00-16:30 IT» | stato su `endDate‖sortDate` < oggi **in fuso italiano**, badge «oggi»; data «dom 11 ott» + dettaglio orario |
| Trasporti | Prenota/Pagamento/Ritiro come paragrafi + nota lunga ripetuta | card: opzione scelta, durata, €/¥, badge prenotazione, UNA riga (`leg.summary`‖`noteShort`), `<details>` «Come si prenota e si ritira»; Prenotazioni = vista estesa |
| Trasporti | titoli tratta «Osaka→Nagoya (11/11)» con data ripetuta | «Osaka → Nagoya» (+ `subtitle` «atterraggio 12:10») |
| Trasporti | scadenze fatte mescolate alle da fare | da fare per mese, «Già fatte (10)» ripiegate; «vedi riga 13-14 nov» tolto |
| Alloggi | note duplicate (Takayama/Nagoya/Arai 2-3 volte), «PRENOTATO 10 lug», «Ostello» (= badge), `mapNote` | `stay_notes` (dedup per sovrapposizione), note Arai riscritte in override |
| Alloggi | ordine info; check-in «—» quando vuoto; badge «prenotato» sempre uguale | nome → città/zona/tipo → date → orari (solo se noti) → Maps → note → costo + badge pagamento piccolo |
| Alloggi | colonna «Da chiudere» del dossier nei passi | Giorno 1: deciso → «Ricorda:», aperto → sezione «Da chiarire» in fondo (con la domanda bagagli aperta) |
| Alloggi | domande bagagli risolte sempre visibili, «Opzioni valutate» con lettere A1/E/✗ | «Alternative scartate» e «Domande già risolte» ripiegate, nomi senza codici |
| Luoghi | 166 card alte con bottone Maps enorme | righe compatte in gruppi `<details>` per città con conteggio; Maps = `.btn--icon` 44px; filtri + gruppi aperti in localStorage; con ≤30 risultati gruppi tutti aperti |
| Luoghi | «Senza flag», «senza flag nel dossier», «Futuro» | «Da decidere», «Un'altra volta», gruppo filtri «Andiamo?» |
| Luoghi | zone «11 nov)», «Shinjuku [base]» (bug `split_zone`) | zona senza parentesi/quadre |
| Budget | tabella categorie con totale = categorie + comuni (non tornava con le righe) | totale per tabella = somma righe; KPI = totale complessivo |
| Budget | barre su due scale diverse, stima in `--warn` | una scala condivisa, un colore, «stima» solo come badge testuale (dataviz); tasso scritto una volta |
| Shell | toast «Dati non disponibili: trip.json», «Aggiornamento disponibile · ricarica» | «Non riesco a caricare i dati (trip)», «È disponibile una versione aggiornata» |

## Richieste al design agent (CSS, non miei)
1. **Luoghi**: righe `li.list-item.lu-row` dentro `ul.list.card` (non più `.lu-card`): serve `padding-inline` (oggi il testo tocca il bordo
   della card), gap verticale ridotto in `.lu-row__body` (nome+badge, meta, nota, chip giorni ≈ 2-3 righe), `.lu-row__name` con badge in linea.
   `.lu-card*` e `.lu-maps` in pages.css ora non sono più usati.
2. **Luoghi**: `details.lu-group > summary.lu-group__head` (h3 + badge conteggio): min-height 44px, marker/chevron che ruota se si toglie quello nativo,
   eventuale sticky sotto i filtri. `.lu-group` ha già margin-top in pages.css.
3. **Alloggi**: passi = `ol.list.card.al-steps > li.list-item > .row.al-step__head` (numero + `.stack`): `.al-step__head .stack { min-width: 0 }`
   e `overflow-wrap: anywhere` di sicurezza. `.al-step` (card per passo) non è più usato.
4. **Trasporti**: `.tr-opt--chosen` ora è un `div` (non `li`); `details.tr-done` (scadenze fatte); `kv` dentro `.tr-opt__details`: su 375 la colonna
   dt «Come funziona» è larga, valutare `dt` sopra `dd` sotto 480px.
5. **Budget**: `.bu-bar__fill--est` non è più usato (la stima con `--warn` = colore di stato usato come serie). Se si vuole distinguere la stima
   nella barra: stessa tinta più chiara o texture 45°, mai un colore di stato. Le barre hanno ora una scala unica (Voli = 100%).
6. **Agenda**: `.agenda__notice` ora è un `div.row` (icona info + testo), non più `details`: le regole `> summary`/`> div` di agenda.css sono morte.
7. **Home**: la card countdown ripete il titolo della topbar («Giappone · 7-24 novembre 2026») — valutare di nasconderlo o ridurlo.
8. Classe nuova `.ext-link.small` usata per i link interni (`internalLinks`, con chevron) — oggi eredita lo stile dei link esterni.

## Per l'orchestratore
- `sw.js` non è mio: al deploy bumpare `CACHE_VERSION` (v3), nessun file statico nuovo aggiunto.
- Override aggiunti: `agendaItems` d07-03, d11-01, d11-03, d14-04, d15-06, d21-01 (titoli che la regola generale non può indovinare);
  `lodging.stays.shuzenji.notes` (riscritte); `transport` summary di leg-1b, transfer-kix, transfer-tokyo-yoyogi + nome opzione KATE;
  `textFixes` «cliente» (2) e «(dossier: 12:10)». Rimossi 2 `textFixes` obsoleti (testo già corretto in v33, 0 occorrenze verificate).
- Da decidere: telefoni dei ristoranti nella checklist (restano); indirizzi di 4 basi mancanti; pagato/da confermare Takayama e Shuzenji
  (badge «pagamento da verificare»); «No backtracking»/«pax» lasciati (gergo di viaggio, non del dossier).
