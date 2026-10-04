# Report export dati sito

Sorgente: `build_xlsx_v33.py` (letto via `ast`, non eseguito) · CSV My Maps: `mymaps_csv/` · override: `site_overrides.json` · generatedAt (mtime sorgenti): 2026-10-02T08:46:16+02:00

## Conteggi

| File | Contenuto |
|---|---|
| trip.json | 6 sezioni · 15 link · 6 fatti |
| agenda.json | 18 giorni (tutti `draft`) · 127 item · 11 con `end` dedotto · 82 con `placeId` |
| transport.json | 8 tratte · 2 transfer · 7 righe guida · 26 checklist (16 da fare) · scelte = €237.2/pax |
| lodging.json | 6 basi · 7 passi giorno 1 · 7 domande bagagli |
| places.json | 326 luoghi · 108 abbinati ai CSV · 0 con coordinate · 77 con `dayDates` |
| budget.json | 6 categorie + 4 comuni · totale €2765.61/pax · €11062.44 gruppo |

Origine `place`/`mapsQuery` degli item agenda: alloggio 8, csv 6, destinazione 18, generico 14, places 67, places (testa) 9, titolo 5 (`titolo`/`destinazione` = euristica sul testo, da rivedere in revisione agenda).

## Ambiguità da decidere (orchestratore) (12)

- lodging Takayama: stato «✓ prenotato» → paid:false, payment «da confermare»
- lodging Shuzenji: stato «✓ prenotato» → paid:false, payment «da confermare»
- places: 23 luoghi senza flag (colonna Andiamo? vuota) → `flag: ""`
- agenda 2026-11-14: «ALTRI 3 — LIBERI: acquario del porto · castel» (14:30) è fuori ordine → parallel:true (traccia parallela)
- agenda 2026-11-21: item senza orario («Deliberatamente vuoto. Opzioni pronte: day-trip Ka…») → time "", allDay:true
- agenda 2026-11-24 11:20: il testo dice PRENOTATO ma la checklist dice «Da fare» (Limousine Bus Busta Shinjuku→NRT 24 nov ~11:45, 4 )
- agenda 2026-11-24: base '—' (giorno di partenza) → baseId ""
- transport: etichetta duplicata «LEG 1c» → id `leg-1c-2`
- lodging takayama (Country Hotel Takayama): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json
- lodging nagoya (Glocal Nagoya Backpackers): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json
- lodging uchiura (Yasudaya Ryokan): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json
- lodging shuzenji (Arai Ryokan): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json

## Fallback applicati (8)

- checklist: quando='giu' (solo mese) → sortDate 2026-06-30
- checklist: quando='ott-nov' (revisione agenda) → sortDate 2026-11-05 (prima della partenza)
- lodging Uchiura: € non letterale (formula ¥/tasso) → 110000/185 = 594.59
- agenda: tipo '—' ma testo logistico («Check-out (valigie al seguito)») → logistics invece di free
- agenda: tipo '—' ma testo logistico («Aeroporto NRT») → logistics invece di free
- agenda: tipo 'volo' → type 'transfer' (non previsto da SPEC)
- budget «Trasporti»: valore non letterale `f'={TRASP_TOT}'` → somma opzioni scelte = 237.2
- budget «Alloggi (tutte le basi)»: nello script è 0 poi sovrascritto da formula (=G tot alloggi/pax) → 725.35

## Nodi non letterali nello script (1)

- `cost[0][2]` = `f'={TRASP_TOT}'`

## Pin My Maps NON abbinati a Cosa vedere (4)

- «Gamers Numazu» · Love Live - Numazu-Uchiura (15-16) · query «Gamers Numazu» · nota «(opz.) 15 · merch»
- «Porto di Numazu» · Love Live - Numazu-Uchiura (15-16) · query «Numazu Port» · nota «15 · pranzo»
- «Scuola Nagaisaki (Uranohoshi)» · Love Live - Numazu-Uchiura (15-16) · query «Numazu Municipal Nagaisaki Junior High School» · nota «15 · esterno!»
- «Kamakura: Grande Buddha» · Day-trip 21 nov (opzioni) · query «Kotokuin Great Buddha Kamakura» · nota «opzione A»

## Abbinamenti per contenimento (verificare) (13)

- «Doguyasuji» (Osaka (7-11 nov)) → «Doguyasuji / Sennichimae» [contenimento]
- «Den Den Town» (Osaka (7-11 nov)) → «Nipponbashi Den Den Town» [contenimento]
- «Distretto del sake (Gekkeikan)» (Kyoto (8-9 nov)) → «Distretto del sake di Fushimi» [contenimento]
- «Ogimachi (Shirakawa-gō)» (Takayama & Shirakawa-gō (11-12)) → «Villaggio di Ogimachi» [contenimento]
- «Myōzen-ji» (Takayama & Shirakawa-gō (11-12)) → «Myōzen-ji & museo» [contenimento]
- «Mirai Tower» (Nagoya (12-14)) → «Chubu Electric Mirai Tower» [contenimento]
- «Minato Shinsenkan» (Love Live - Numazu-Uchiura (15-16)) → «Numazu Minato Shinsenkan» [contenimento]
- «View-O (Water Gate)» (Love Live - Numazu-Uchiura (15-16)) → «Numazu Port View-O (Water Gate)» [contenimento]
- «Molo di Awashima» (Love Live - Numazu-Uchiura (15-16)) → «Awashima (Marine Park)» [contenimento]
- «Kabukichō + Godzilla Head» (Tokyo (17-24)) → «Godzilla Head» [contenimento]
- «★ Torafugutei Shinjuku» (Tokyo (17-24)) → «Torafugutei Shinjuku Annex» [contenimento]
- «Kōenji (live house)» (Tokyo (17-24)) → «Scena live house di Kōenji» [contenimento]
- «Lago Ashi (vista Fuji)» (Day-trip 21 nov (opzioni)) → «Vista Fuji dal Lago Ashi» [contenimento]

## Privacy (4)

- rimossi metodo di pagamento/tasso da: «Revolut · tasso 184,79»
- rimossi metodo di pagamento/tasso da: «Revolut · 184,75 · bagno in comune»
- rimossi metodo di pagamento/tasso da: «BPER addebito in € · tasso 185,34»
- rimossi metodo di pagamento/tasso da: «Revolut/BPER · Booking/AirHost»

## Note (32)

- CSV `01_Osaka_(7-11_nov).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `02_Kyoto_(8-9_nov).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `03_Kobe_(10_nov).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `04_Takayama_&_Shirakawa-gō_(11-12).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `05_Nagoya_(12-14).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `06_Love_Live_-_Numazu-Uchiura_(15-16).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `07_Shuzenji_(16-17).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `08_Tokyo_(17-24).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `09_Day-trip_21_nov_(opzioni).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- pin My Maps «Ghibli Park» ignorato (site_overrides.json `ignorePins`: eliminato dal viaggio il 18 set 2026)
- agenda: tipo 'natura' (non elencato nella mappa) → sight
- agenda: tipo 'giardino' (non elencato nella mappa) → sight
- agenda: tipo 'santuario' (non elencato nella mappa) → sight
- budget: la categoria «Spese comuni» del dossier NON è in `categories` (è in `common`) per evitare doppio conteggio
- textFixes transport: «. Niente ticketless sulla versione inglese» → «» (2×)
- textFixes agenda: «Narita T1 13:35 (PRENOTATO online)» → «Narita T1 13:35 (da prenotare online, ~fine ott)» (1×)
- textFixes budget: «destinazione da decidere (📎 Dettagli)» → «destinazione: ufficio Yamato Yoyogi» (1×)
- textFixes transport: «revisione da zero giorno per giorno con il cliente (la 2.0 è» → «revisione giorno per giorno (quella attuale è una bozza)» (1×)
- textFixes lodging: «(le compra il cliente)» → «(da comprare)» (1×)
- textFixes lodging: «Orario atterraggio dal biglietto (dossier: 12:10)» → «Controllare l'orario di atterraggio sul biglietto (previsto » (1×)
- textFixes lodging: «Serviva solo per A1» → «Serviva solo per la consegna all'appartamento (scartata)» (1×)
- textFixes lodging: «NON SERVE: con A2 si ritira direttamente» → «NON SERVE: si ritira direttamente» (1×)
- textFixes lodging: «Serve per compilare la bolla in opzione A2» → «Serve per compilare la bolla di spedizione» (1×)
- textFixes lodging: «Serviva solo per E» → «Serviva solo per la spedizione al ryokan (scartata)» (1×)
- textFixes lodging: «NON SERVE: opzione E scartata.» → «NON SERVE: spedizione al ryokan scartata.» (1×)
- textFixes transport: «BAGAGLI: opzione A2 scelta (ufficio Yamato Yoyogi)» → «BAGAGLI: spediti all'ufficio Yamato Yoyogi» (1×)
- textFixes transport: «Nozomi/Hikari ris.» → «Nozomi/Hikari (posto riservato)» (1×)
- textFixes transport: «JR Hida LTD EXP ris. 12:48» → «JR Hida Limited Express 12:48 (posto riservato)» (1×)
- textFixes transport: «NRT 24 nov ~11:45» → «Narita 24 nov 11:20» (1×)
- textFixes lodging: «aperta 7/7 9-19» → «aperta tutti i giorni 9-19» (1×)
- textFixes transport: «NRT 24/11 ~11:45» → «Narita 24/11 11:20» (1×)
- agenda 2026-11-24: base '—' → base del giorno prima «Tokyo» (baseId resta vuoto)

## Scaletta / piano definitivo (SPEC §9.1)

Blocchi fusi: nessuno
Blocchi NON fusi (non confermati): A (proposta)

### Giorni sostituiti (0)

- nessuno

### Item/extras senza foto (0)

- nessuno

### placeId non trovati nel catalogo (0)

- nessuno

### Luoghi del catalogo senza corrispondente in places.json (item senza `placeId`) (0)

- nessuno

### Warning (0)

- nessuno

## Validazione schemi

- ✅ tutti i file conformi a SPEC §2

## Scansione dati sensibili (carte/IBAN/n. prenotazione)

- nessun match

## Scelte di modellazione

- `budget.perPerson.totalEur` = categorie + `common` (la riga «Spese comuni» del dossier è esplosa in `common`).
- `paidSoFar.lodgingEurGroup` = totale alloggi PRENOTATI (incl. Yasudaya da pagare in contanti); il pagato è `lodgingEurGroupPaid`.
- Telefoni di esercizi commerciali (ristoranti, ryokan, numero Yamato) mantenuti nei testi: nessun telefono personale nelle sorgenti.
- Note alloggi: rimossi metodo di pagamento e tasso applicato (registro acquisti); niente importi ¥ addebitati salvo Yasudaya (prezzo in struttura).
- `checkInTime`/`checkOutTime`: solo orari ufficiali noti (in `site_overrides.json`); l'orario d'arrivo pianificato è nell'agenda.
- Item con orario fuori sequenza (14 nov «ALTRI 3») marcati `parallel:true`; giorno libero 21 nov: item `allDay:true`, `time:""`.
- Testi per il sito (`ux_clean`, regole generali): maiuscole d'enfasi → minuscole; titoli item ≤ ~60 car. (spiegazioni/logistica in `note`); titolo giorno senza base ripetuta + `dayTrip`; checklist con `endDate`/`whenDetail`/`dateApprox`; opzioni trasporto con `id`, `noteShort`, `noteMore`; riferimenti al dossier (📎/🗓/«vedi riga») tolti e tradotti in `links` interni; note alloggi deduplicate; Giorno 1 `open` → `remember` (deciso) o `todo` (aperto).
