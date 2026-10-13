# NOTES_dati — mappa dei dati ripetuti: fonte unica, calcoli, controlli (13 ott 2026)

Domanda del cliente: «i dati sono unici o copiati? se cambia il costo di un trasporto, il budget cambia?»
Risposta breve: **ora sì**. Ogni numero ha UNA fonte; tutto il resto lo calcola l'exporter (`export_site_costs.py`,
chiamato da `export_site_data.py`) e `python3 export_site_data.py --check` fallisce (exit 1) se una copia inevitabile
(orari e ¥ scritti nei testi, check-in/out, totali) non coincide più con la fonte.

## 1. Fonti uniche

| Dato | Fonte unica (unico posto da modificare) |
|---|---|
| Cambio ¥/€ per ciò che si paga in yen e non è ancora pagato | `site_overrides.json › trip.fx.jpyPerEur` (176,425 dal 13 ott; prima 185 del build) |
| Spese già pagate (alloggi, assicurazione, treni/bus comprati) | `site_overrides.json › expenses.items` (€ addebitati, oppure ¥ + cambio effettivo) con `ref` |
| Prezzo in ¥ a testa di una tratta non ancora pagata | `costJpy` dell'opzione in `site_overrides.json › transport` |
| Supplemento in loco di una tratta pagata (es. locale Mishima→Numazu ¥190) | `extraJpy` dell'opzione |
| Prezzo in ¥ di un alloggio da pagare in loco (Yasudaya ¥110.000) | `costJpyTotal` (dal build) |
| Orari di una tratta scelta | nome dell'opzione (primo orario = partenza, ultimo = arrivo) o `dep`/`arr` in override |
| Check-in/out | `lodging.stays[].checkInTime/checkOutTime` (override) |
| Voci a stima del budget (Cibo, Attrazioni, Shopping, Extra, eSIM) e Voli €806 | build v33 (`cost`, `comuni`): stime dichiarate, non derivabili |
| Budget previsto dei giorni in bozza (13-24 nov) | build v33 (`itin`): stima, da rifare con l'agenda |

## 2. Cosa è calcolato (e dove)

| Numero | Dove compare | Come si calcola | Prima (13 ott mattina) |
|---|---|---|---|
| `costEurTotal` alloggio | alloggi, budget, conto | Σ `expenses` con `ref lodging:<id>`; se non pagato: `costJpyTotal ÷ fx` | copiato dal build (BON 318, Glocal 248) |
| `costEurPerPerson` alloggio | alloggi | `costEurTotal ÷ persone` | calcolato PRIMA dell'override → Yume-no-ya 242,10 (da 968,42) invece di 246,95 |
| `paid` alloggio | alloggi, budget | vero se c'è una spesa pagata | Country e Arai «da verificare» benché addebitati |
| `costEur` opzione trasporto | trasporti, agenda, budget | spesa pagata ÷ persone (+ `extraJpy ÷ fx`), oppure `costJpy ÷ fx` | scritto a mano in override (a 185) |
| `totalChosenEur` | trasporti | Σ costEur delle opzioni `chosen` | già ricalcolato dopo gli override |
| `costEur` della tappa di agenda della tratta | giorno, agenda, budget per giorno | = costEur dell'opzione scelta (aggancio: stessa data + `agendaKey` nel titolo, preferendo l'orario di partenza) | 0 nei giorni A/B (Hida, Nohi, Gifu, KATE), valori vecchi nei giorni in bozza (Tokai 6, Izuhakone 5) |
| Budget «Trasporti» | budget | = `totalChosenEur` | calcolato PRIMA degli override: €237,20 contro €207,32 delle tratte |
| Budget «Alloggi» | budget | Σ costEurTotal ÷ persone | ok, ma su importi vecchi (730,19) |
| Assicurazione (voce comune) | budget | spesa pagata ÷ persone | copiata (47,86) |
| Spedizione Yamato (voce comune) | budget | `costJpy` 2.470 ÷ fx | copiata 14,20 (nota «€57 ÷ 4, ¥2.630»; in alloggi «~¥2.500, ~€14»: tre valori diversi) |
| Totale a persona, gruppo, una tantum | budget | somme delle voci | ok (exporter) |
| `paidSoFar` (Pagato / Prezzo noto / Stima) | budget | da alloggi pagati + `expenses` (`advancedEurGroup`) | contava solo voli + alloggi pagati |
| `daily.eurAgenda` | budget (spesa per giorno) | Σ costEur delle tappe DOPO gli override | calcolato prima degli override (15 nov 78 vs 70,65; 17 nov 65 vs 58,68) |
| Budget previsto dei giorni confermati | giorno, budget | tolto: per i giorni `final` vale la somma delle tappe | stime della scaletta (11 nov 127 vs tappe 65; 12 nov 100 vs 51) |
| Conto rimborsi | conto.html | `budget.advanced` (righe, subtotali, totale) via `assets/js/conto.js` | HTML scritto a mano |
| Totale del giorno | giorno, agenda | JS `dayTotals(items)` nel browser | già calcolato |

## 3. Contraddizioni trovate (prima della correzione) e come sono state risolte

1. Budget Trasporti €237,20 ≠ somma delle tratte scelte €207,32 → calcolato dopo gli override (ora €213,46).
2. Yume-no-ya: `costEurTotal` 987,79 ma `costEurPerPerson` 242,10 (= 968,42 ÷ 4, importo errato di luglio) → 246,95.
3. BON 318 / Glocal 248 nel sito vs 317,24 / 247,36 reali del conto → dalle spese reali.
4. Country Hotel e Arai «pagamento da verificare» nel sito ma addebitati (conto) → `paid: true`.
5. Tappe di trasporto a €0 nei giorni A/B (Hida 25, Nohi, Gifu, bus KATE) → costo dalla tratta; il totale del giorno
   11 nov passa da €65 a €107,76, 12 nov da €51 a €86,64.
6. Tokai €6 e Izuhakone €5 in agenda vs €5,62/€4,65 in trasporti → costo dalla tratta.
7. Hikari: €46,65 a testa (¥8.440+190 a 185) vs pagato €191,36 per 4 a 176,425 → €47,84 + ¥190 = €48,92.
8. Limousine Bus 24 nov: durata «~2h10 da orario» vs 11:20 → 13:15 (1h55) → durata corretta.
9. Yamato: ¥2.630 (budget) vs ¥2.500 (alloggi) vs ¥2.470 verificato → ¥2.470 ovunque, € calcolato.
10. Budget del giorno nei giorni confermati diverso dalla somma delle tappe (7-12 nov) → tolto (vale la somma).
11. `daily.eurAgenda` diverso dal totale mostrato nella pagina giorno (15 e 17 nov) → calcolato dopo gli override.
12. Conto rimborsi scritto a mano (copia di 15 importi) → generato dai dati.
13. Cambio: il sito convertiva a 185 (BCE 10 lug); il cliente usa 176,425 per gli acquisti dal 13 ott → parametro unico
    del sito = 176,425 (Yasudaya ora €623,49 invece di €594,59).
Controllati e già coerenti: orari 11/12/15/17/24 nov fra agenda, trasporti, checklist e guida prenotazioni; check-in
BON 16:00, Country 15:00, Glocal 16:00, Arai 15:00, Yume-no-ya 15:00 (il «13:00» era solo nella bozza in
`data/piano/prenotazioni.md`, superato); notti e basi dei giorni.

## 4. Controlli automatici (`export_site_costs.coherence`, in export e in `--check`)
Errori (exit 1): partenza della tratta scelta ≠ orario della tappa · arrivo non citato nella tappa · costo tappa ≠ tratta ·
durata ≠ arrivo − partenza · «¥N a testa» nei testi della tratta ≠ `costJpy` · checklist/guida prenotazioni che citano la
tratta senza l'orario di partenza o con un arrivo diverso · notti ≠ date · base del giorno ≠ alloggio della notte ·
«check-in dalle/check-out entro» nei testi (note alloggio, tappe dei giorni di arrivo/partenza) ≠ orari dell'alloggio ·
tappa «check-in» prima dell'apertura / «check-out» dopo il limite · ¥ a testa nelle note alloggio ≠ costJpyTotal ÷ persone ·
costEurTotal/PerPerson ≠ fonte · categorie, totali, gruppo, paidSoFar, daily ≠ somme · righe del conto ≠ ¥ ÷ cambio.
Avvisi (solo report): tratta scelta senza tappa in un giorno in bozza (oggi: bus Nagashima/Nabana del 14 nov, che è nella
scaletta C non ancora confermata) · budget previsto su un giorno confermato.

## 5. Cosa resta scritto a mano (e perché)
- Testi descrittivi con prezzi indicativi di cose non scelte o non strutturate (taxi «~€4 a testa», «Corso Kobe beef
  €55-85», alternative di trasporto non scelte con € del build, `details.cost` dei transfer, che il sito non mostra).
- Stime di budget (Cibo, Attrazioni, Shopping, Extra, eSIM) e budget previsto dei giorni in bozza: sono stime, non derivabili.
- Voli €806 a persona (pagati da ciascuno, non nel conto).
- Orari nei testi delle tappe: restano testo, ma il controllo li confronta con la tratta.
- Il bus Nagashima (3 persone, il concertista no) è contato a testa per 4 nel totale trasporti: da sistemare quando si
  conferma il blocco C.
