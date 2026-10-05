# Report export dati sito

Sorgente: `build_xlsx_v33.py` (letto via `ast`, non eseguito) · CSV My Maps: `mymaps_csv/` · override: `site_overrides.json` · generatedAt (mtime sorgenti): 2026-10-05T09:03:06+02:00

## Conteggi

| File | Contenuto |
|---|---|
| trip.json | 7 sezioni · 15 link · 6 fatti |
| agenda.json | 18 giorni (4 `final` · 14 `draft`) · 147 item · 62 con `end` dedotto · 77 con `placeId` |
| transport.json | 8 tratte · 2 transfer · 7 righe guida · 26 checklist (16 da fare) · scelte = €237.2/pax |
| lodging.json | 6 basi · 7 passi giorno 1 · 7 domande bagagli |
| places.json | 326 luoghi · 108 abbinati ai CSV · 0 con coordinate · 71 con `dayDates` |
| budget.json | 6 categorie + 4 comuni · totale €2765.61/pax · €11062.44 gruppo |

Origine `place`/`mapsQuery` degli item agenda: alloggio 8, csv 6, destinazione 18, generico 14, places 67, places (testa) 9, titolo 5 (`titolo`/`destinazione` = euristica sul testo, da rivedere in revisione agenda).

## Ambiguità da decidere (orchestratore) (16)

- lodging Takayama: stato «✓ prenotato» → paid:false, payment «da confermare»
- lodging Shuzenji: stato «✓ prenotato» → paid:false, payment «da confermare»
- places: 23 luoghi senza flag (colonna Andiamo? vuota) → `flag: ""`
- agenda 2026-11-14: «ALTRI 3 — LIBERI: acquario del porto · castel» (14:30) è fuori ordine → parallel:true (traccia parallela)
- agenda 2026-11-21: item senza orario («Deliberatamente vuoto. Opzioni pronte: day-trip Ka…») → time "", allDay:true
- agenda 2026-11-24 11:20: il testo dice PRENOTATO ma la checklist dice «Da fare» (Limousine Bus Busta Shinjuku→NRT 24 nov ~11:45, 4 )
- agenda 2026-11-24: base '—' (giorno di partenza) → baseId ""
- transport: etichetta duplicata «LEG 1c» → id `leg-1c-2`
- testo con riferimenti al dossier rimasto: agenda.days[0].items[8].title: «Cena da Salmon Kat (scelta del cliente)»
- testo con riferimenti al dossier rimasto: agenda.days[2].items[6].note: «Mochi, spiedini, matcha, yatsuhashi · scelta del cliente: si mangia ca»
- testo con riferimenti al dossier rimasto: agenda.days[2].items[16].note: «Cena di compleanno: ristorante da scegliere (decisione A-09-4, il clie»
- testo con riferimenti al dossier rimasto: agenda.days[3].items[3].note: «Scelta del cliente. Non prende prenotazioni a pranzo e c'è coda: mette»
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

Blocchi fusi: A «Osaka · Kyoto · Kobe» · status `confermata`
Blocchi NON fusi (non confermati): nessuno

### Giorni sostituiti (4)

- 2026-11-07 (13 item, 4 extras)
- 2026-11-08 (13 item, 11 extras)
- 2026-11-09 (17 item, 9 extras)
- 2026-11-10 (13 item, 13 extras)

### Tappe dopo mezzanotte ripiegate nella nota (2)

- 2026-11-07 01:00 «Karaoke senza orari (facoltativo)» (placeId jankara-tenma → extras)
- 2026-11-07 02:30 «A casa a piedi (~15-18')»

### Item/extras senza foto (12)

- d07-09 «Il ristorante di salmone dietro il vicolo Hozenji» (salmon-kat-namba)
- d07-11 «Il bancone in piedi del pesce, pieno di ragazzi giapponesi» (tenma-uosho)
- d07-12 «Gli spiedini di pollo alla brace, seduti, fino alle 2» (tenma-mame)
- d07-13 «Il baretto-chiosco di okonomiyaki aperto fino alle 2» (tenma-source)
- 2026-11-07 extra «Il karaoke aperto 24 ore sotto casa» (jankara-tenma)
- d08-12 «Le terme vere sul tetto, vicino a casa» (naniwa-no-yu)
- d09-17 «L'osteria del sake nel vicolo, con pesce del mercato e il panino di manzo» (sake-terayama)
- d10-04 «Il soba fatto a mano con la farina macinata a pietra» (shuhari-kuromon)
- d10-08 «Il grande magazzino di manga, figure e cosplay usati» (mandarake-grand-chaos)
- d10-13 «Le terme vere sul tetto, vicino a casa» (naniwa-no-yu)
- 2026-11-10 extra «Il soba dei 100 migliori, piccolo e artigiano» (akari-soba)
- 2026-11-10 extra «La storica casa dell'udon di Osaka, col brodo leggendario» (imai-dotonbori)

### placeId non trovati nel catalogo (0)

- nessuno

### Luoghi del catalogo senza corrispondente in places.json (item senza `placeId`) (12)

- salmon-kat-namba
- tenma-uosho
- tenma-mame
- tenma-source
- naniwa-no-yu
- sannenzaka-ninenzaka
- pontocho
- shirakawa-gion
- sake-terayama
- shuhari-kuromon
- mandarake-grand-chaos
- janjan-yokocho

### Warning (3)

- blocco A CONFERMATO ma 2026-11-09 ha decisions senza `chosen`: A-09-4
- override `agendaItems[d07-01]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Atterraggio a KIX, controllo passaporti, valigie»
- override `agendaItems[d07-03]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Valigie nel deposito self-service del BON»

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

## Guide (SPEC §10) — 11 in `site/data/guides.json`

Sorgente: `data/guide`

### Guide lette (11)

- `bere.md` → `bere` (order 30, 7290 car. HTML, 2 luoghi)
- `concerto-nagoya.md` → `concerto-nagoya` (order 15, 11849 car. HTML, 0 luoghi)
- `izakaya-tachinomi.md` → `izakaya-tachinomi` (order 20, 8011 car. HTML, 0 luoghi)
- `mangiare.md` → `mangiare` (order 40, 7037 car. HTML, 2 luoghi)
- `muoversi.md` → `muoversi` (order 50, 8388 car. HTML, 0 luoghi)
- `onsen-sento.md` → `onsen-sento` (order 70, 6795 car. HTML, 2 luoghi)
- `quartieri-osaka.md` → `quartieri-osaka` (order 100, 6540 car. HTML, 13 luoghi)
- `soldi.md` → `soldi` (order 60, 6467 car. HTML, 0 luoghi)
- `sopravvivenza.md` → `sopravvivenza` (order 90, 8698 car. HTML, 0 luoghi)
- `templi-santuari.md` → `templi-santuari` (order 80, 7127 car. HTML, 5 luoghi)
- `tenma-sera.md` → `tenma-sera` (order 10, 14189 car. HTML, 6 luoghi)

### Errori di frontmatter (0)

- nessuno

### Blocchi <svg>/<figure> scartati (0)

- nessuno

### Luoghi (places) non trovati o presi da places.json (0)

- nessuno

### Link non ammessi (0)

- nessuno

### Avvisi (0)

- nessuno

## Foto locali dei luoghi (`--fetch-images`)

Modalità: download attivo · convertitore: Pillow (/Users/panteghininicolo/progetti/Giappone_Nov2026/.venv/bin/python3)
Cartella `site/assets/img/places/`: 50 file · 5939 KB totali

### Scaricate (3)

- gion-hanamikoji (gion-hanamikoji.webp, 153 KB)
- den-den-town (den-den-town.webp, 126 KB)
- sumiyoshi-taisha (sumiyoshi-taisha.webp, 155 KB)

### Riusate (file già presenti) (47)

- dotonbori (dotonbori.webp, 132 KB)
- hozenji-yokocho (hozenji-yokocho.webp, 79 KB)
- ohatsu-tenjin-ura-sando (ohatsu-tenjin-ura-sando.webp, 91 KB)
- kita-shinchi (kita-shinchi.webp, 100 KB)
- umeda-sky-building (umeda-sky-building.webp, 47 KB)
- kitano-ijinkan (kitano-ijinkan.webp, 67 KB)
- mouriya-sannomiya (mouriya-sannomiya.webp, 72 KB)
- nankinmachi (nankinmachi.webp, 116 KB)
- castello-osaka (castello-osaka.webp, 90 KB)
- tenma (tenma.webp, 117 KB)
- ura-namba (ura-namba.webp, 143 KB)
- arima-onsen (arima-onsen.webp, 120 KB)
- meriken-harborland (meriken-harborland.webp, 88 KB)
- nakazakicho (nakazakicho.webp, 88 KB)
- amerikamura (amerikamura.webp, 144 KB)
- nunobiki (nunobiki.webp, 47 KB)
- fushimi-inari (fushimi-inari.webp, 110 KB)
- kiyomizu-dera (kiyomizu-dera.webp, 134 KB)
- sannenzaka-ninenzaka (sannenzaka-ninenzaka.webp, 161 KB)
- yasaka-pagoda (yasaka-pagoda.webp, 91 KB)
- kennin-ji (kennin-ji.webp, 108 KB)
- nishiki-market (nishiki-market.webp, 114 KB)
- pontocho (pontocho.webp, 81 KB)
- shirakawa-gion (shirakawa-gion.webp, 199 KB)
- yasaka-jinja (yasaka-jinja.webp, 76 KB)
- kodai-ji (kodai-ji.webp, 46 KB)
- kinkaku-ji (kinkaku-ji.webp, 108 KB)
- sake-fushimi (sake-fushimi.webp, 182 KB)
- ginkaku-ji (ginkaku-ji.webp, 116 KB)
- tofuku-ji (tofuku-ji.webp, 165 KB)
- ippodo (ippodo.webp, 72 KB)
- philosophers-path (philosophers-path.webp, 215 KB)
- eikan-do (eikan-do.webp, 176 KB)
- nijo-jo (nijo-jo.webp, 96 KB)
- kyoto-tower-stazione (kyoto-tower-stazione.webp, 81 KB)
- kuromon (kuromon.webp, 130 KB)
- doguyasuji (doguyasuji.webp, 99 KB)
- super-potato (super-potato.webp, 177 KB)
- tsutenkaku (tsutenkaku.webp, 110 KB)
- shinsekai (shinsekai.webp, 174 KB)
- janjan-yokocho (janjan-yokocho.webp, 126 KB)
- todai-ji (todai-ji.webp, 77 KB)
- nara-park (nara-park.webp, 229 KB)
- kasuga-taisha (kasuga-taisha.webp, 243 KB)
- nakatanidou (nakatanidou.webp, 43 KB)
- ota-road (ota-road.webp, 128 KB)
- naramachi (naramachi.webp, 75 KB)

### Fallite (0)

- nessuna
