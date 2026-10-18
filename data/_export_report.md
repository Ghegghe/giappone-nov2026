# Report export dati sito

Sorgente: `build_xlsx_v33.py` (letto via `ast`, non eseguito) · CSV My Maps: `mymaps_csv/` · override: `site_overrides.json` · generatedAt (mtime sorgenti): 2026-10-18T19:58:54+02:00

## Conteggi

| File | Contenuto |
|---|---|
| trip.json | 7 sezioni · 15 link · 6 fatti |
| agenda.json | 18 giorni (10 `final` · 8 `draft`) · 242 item · 196 con `end` dedotto · 75 con `placeId` |
| transport.json | 7 tratte · 2 transfer · 8 righe guida · 31 checklist (12 da fare) · scelte = €199.77/pax |
| lodging.json | 6 basi · 7 passi giorno 1 · 7 domande bagagli |
| places.json | 326 luoghi · 108 abbinati ai CSV · 0 con coordinate · 71 con `dayDates` |
| budget.json | 6 categorie + 4 comuni · totale €2739.7/pax · €10958.8 gruppo |

Origine `place`/`mapsQuery` degli item agenda: alloggio 8, csv 6, destinazione 18, generico 14, places 67, places (testa) 9, titolo 5 (`titolo`/`destinazione` = euristica sul testo, da rivedere in revisione agenda).

## Ambiguità da decidere (orchestratore) (17)

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
- testo con riferimenti al dossier rimasto: agenda.days[3].items[3].note: «Scelta del cliente. Non prende prenotazioni a pranzo e c'è coda: mette»
- testo con riferimenti al dossier rimasto: agenda.days[5].items[19].note: «Bus Gifu n. 13803 Shirakawa-gō 15:55 → Nagoya Meitetsu Bus Center 18:4»
- override `transport.legs[leg-14]`: da togliere ma inesistente, ignorato
- lodging takayama (Country Hotel Takayama): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json
- lodging nagoya (Glocal Nagoya Backpackers): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json
- lodging uchiura (Yasudaya Ryokan): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json
- lodging shuzenji (Arai Ryokan): indirizzo mancante (non nei .md) → "" — da inserire in site_overrides.json

## Fallback applicati (8)

- checklist: quando='giu' (solo mese) → sortDate 2026-06-30
- checklist: quando='ott-nov' (revisione agenda) → sortDate 2026-11-05 (prima della partenza)
- lodging Uchiura: € non letterale (formula ¥/tasso) → 110000/176.425 = 623.49
- agenda: tipo '—' ma testo logistico («Check-out (valigie al seguito)») → logistics invece di free
- agenda: tipo '—' ma testo logistico («Aeroporto NRT») → logistics invece di free
- agenda: tipo 'volo' → type 'transfer' (non previsto da SPEC)
- budget «Trasporti»: valore non letterale `f'={TRASP_TOT}'` → somma delle opzioni scelte (valore finale ricalcolato da export_site_costs.derive dopo gli override)
- budget «Alloggi (tutte le basi)»: nello script è 0 poi sovrascritto da formula (=G tot alloggi/pax) → somma alloggi ÷ persone (valore finale ricalcolato da export_site_costs.derive)

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

## Note (62)

- CSV `01_Osaka_(7-11_nov).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `02_Kyoto_(8-9_nov).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `03_Kobe_(10_nov).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `04_Takayama_&_Shirakawa-gō_(11-12).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `05_Nagoya_(12-14).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `06_Love_Live_-_Numazu-Uchiura_(15-16).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `07_Shuzenji_(16-17).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `08_Tokyo_(17-24).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- CSV `09_Day-trip_21_nov_(opzioni).csv`: nessuna colonna coordinate (colonne: Luogo, Nome, Note) → lat/lon omessi
- cambio del sito: 176.425 ¥/€ da `site_overrides.json` › trip.fx (il build ha 185)
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
- textFixes agenda: «Scelta del cliente (B-11-2). » → «» (1×)
- textFixes agenda: «Scelta del cliente (B-11-3). » → «» (1×)
- textFixes agenda: «Scelta del cliente (B-11-4). » → «» (1×)
- agenda 2026-11-24: base '—' → base del giorno prima «Tokyo» (baseId resta vuoto)
- override `transport.legs[leg-1b]`: elemento tolto
- override `transport.legs[leg-1].options[leg-1-1]`: elemento tolto
- override `transport.legs[leg-1].options[leg-1-2]`: elemento tolto
- override `transport.legs[leg-1].options[leg-1-4]`: elemento tolto
- override `transport.legs[leg-2].options[leg-2-2]`: elemento tolto
- override `transport.legs[leg-2].options[leg-2-3]`: elemento tolto
- override `transport.legs[leg-5].options[leg-5-2]`: elemento tolto
- override `transport.legs[leg-5].options[leg-5-3]`: elemento tolto
- override `transport.bookingGuide[bg-kodama]`: elemento aggiunto
- override `transport.checklist[ck-13]`: elemento tolto
- override `transport.checklist[ck-bon-indirizzi]`: elemento aggiunto
- override `transport.checklist[ck-yume-modulo]`: elemento aggiunto
- override `transport.checklist[ck-bon-portone]`: elemento aggiunto
- override `transport.checklist[ck-hida-ritiro]`: elemento aggiunto
- override `transport.checklist[ck-yamato]`: elemento aggiunto
- override `transport.checklist[ck-yasudaya]`: elemento aggiunto
- agenda 2026-11-07 (final): `budgetEur` 75 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-08 (final): `budgetEur` 164 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-09 (final): `budgetEur` 75 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-10 (final): `budgetEur` 58 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-11 (final): `budgetEur` 127 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-12 (final): `budgetEur` 100 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-13 (final): `budgetEur` 112 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-14 (final): `budgetEur` 121 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-15 (final): `budgetEur` 35 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe
- agenda 2026-11-16 (final): `budgetEur` 40 (stima della scaletta) tolto — il costo del giorno è la somma delle tappe

## Scaletta / piano definitivo (SPEC §9.1)

Blocchi fusi: A «Osaka · Kyoto · Kobe» · status `confermata`; B «Osaka → Takayama → Shirakawa-gō → Nagoya» · status `confermata`; C «Nagoya · anguilla, Osu, la notte di Nishiki e il concerto» · status `confermata`; D «Numazu · Uchiura (Love Live!) · Shuzenji» · status `confermata`
Blocchi NON fusi (non confermati): E (proposta)

### Giorni sostituiti (10)

- 2026-11-07 (13 item, 4 extras)
- 2026-11-08 (13 item, 11 extras)
- 2026-11-09 (17 item, 9 extras)
- 2026-11-10 (16 item, 13 extras)
- 2026-11-11 (25 item, 9 extras)
- 2026-11-12 (24 item, 6 extras)
- 2026-11-13 (17 item, 5 extras)
- 2026-11-14 (14 item, 8 extras)
- 2026-11-15 (32 item, 12 extras)
- 2026-11-16 (28 item, 13 extras)

### Tappe dopo mezzanotte ripiegate nella nota (2)

- 2026-11-07 01:00 «Karaoke senza orari (facoltativo)» (placeId jankara-tenma → extras)
- 2026-11-07 02:30 «A casa a piedi (~15-18')»

### Tappe con opzioni (linea guida, SPEC §13) (22)

- 2026-11-07 d07-04 «Giro veloce attorno a casa»: 2 opzioni
- 2026-11-07 d07-11 «1° locale in piedi: il bancone del pesce»: 2 opzioni
- 2026-11-07 d07-12 «2° locale seduti: spiedini di pollo alla»: 2 opzioni
- 2026-11-07 d07-13 «3° locale: il baretto di mezzanotte»: 2 opzioni
- 2026-11-09 d09-17 «Cena di compleanno (linea guida: Kappō U»: 6 opzioni · flex
- 2026-11-12 d12-18 «Tempo libero nel villaggio»: 2 opzioni
- 2026-11-12 d12-23 «Cena a caso a Nagoya»: 4 opzioni
- 2026-11-12 d12-24 «Serata libera: letto presto o primo giro»: 1 opzioni
- 2026-11-13 d13-04 «Pranzo: l'anguilla alla brace (scelta: U»: 3 opzioni · flex
- 2026-11-13 d13-09 «Akamon-dōri (Osu)»: 2 opzioni
- 2026-11-13 d13-11 «1° giro: l'osteria del 1907 (scelta: Dai»: 3 opzioni · flex
- 2026-11-13 d13-13 «2° giro: le alette di Nagoya (DA SCEGLIE»: 3 opzioni · flex
- 2026-11-13 d13-15 «3° giro: cocktail di frutta fresca (scel»: 3 opzioni · flex
- 2026-11-13 d13-16 «Chiusura: udon al curry di mezzanotte (f»: 3 opzioni · flex
- 2026-11-14 d14-05 «Pranzo tutti e 4: udon cotti nel miso (s»: 3 opzioni · flex
- 2026-11-14 d14-13 «Ritrovo: ultima cena di Nagoya (scelta: »: 3 opzioni · flex
- 2026-11-15 d15-15 «Pranzo di pesce al porto (linea guida)»: 3 opzioni · flex
- 2026-11-15 d15-32 «Serata al ryokan: 10' su spiaggia e molo»: 2 opzioni
- 2026-11-16 d16-11 «Tempo libero a Mito: spiaggia di Chika, »: 3 opzioni
- 2026-11-16 d16-17 «Pranzo di soba in paese (linea guida)»: 3 opzioni · flex
- 2026-11-16 d16-27 «Un bicchiere al bar del paese (linea gui»: 2 opzioni · flex
- 2026-11-16 d16-28 «Rientro dal vialetto di bambù illuminato»: 2 opzioni

### Item/extras senza foto (33)

- d07-09 «Il ristorante di salmone dietro il vicolo Hozenji» (salmon-kat-namba)
- d07-11 «Il bancone in piedi del pesce, pieno di ragazzi giapponesi» (tenma-uosho)
- opzione «Il bancone in piedi del pesce, pieno di ragazzi giapponesi» (tenma-uosho)
- opzione «Il bar in piedi del pesce attaccato alla stazione» (tenma-daiyasu)
- d07-12 «Gli spiedini di pollo alla brace, seduti, fino alle 2» (tenma-mame)
- opzione «Gli spiedini di pollo alla brace, seduti, fino alle 2» (tenma-mame)
- opzione «L'izakaya-mercato del pesce dove si griglia da soli» (tenma-sanchoku)
- d07-13 «Il baretto-chiosco di okonomiyaki aperto fino alle 2» (tenma-source)
- opzione «Il baretto-chiosco di okonomiyaki aperto fino alle 2» (tenma-source)
- opzione «Il karaoke aperto 24 ore sotto casa» (jankara-tenma)
- 2026-11-07 extra «Il karaoke aperto 24 ore sotto casa» (jankara-tenma)
- d08-12 «Le terme vere sul tetto, vicino a casa» (naniwa-no-yu)
- d10-04 «Il soba fatto a mano con la farina macinata a pietra» (shuhari-kuromon)
- d10-08 «Il grande magazzino di manga, figure e cosplay usati» (mandarake-grand-chaos)
- d10-15 «L'ufficio del corriere dove si lasciano le valigie per Tokyo» (yamato-umeda)
- d10-16 «Le terme vere sul tetto, vicino a casa» (naniwa-no-yu)
- 2026-11-10 extra «Il soba dei 100 migliori, piccolo e artigiano» (akari-soba)
- 2026-11-10 extra «La storica casa dell'udon di Osaka, col brodo leggendario» (imai-dotonbori)
- d15-06 «Il negozio ufficiale di gadget di Love Live! Sunshine!!» (gamers-numazu)
- d15-08 «La via dei negozi che ha fatto di Yohane una cittadina onoraria» (agetsuchi-shotengai)
- d15-12 «Il caffè-ristorante dove nell'anime c'è la casa di You» (oranda-kan)
- d15-14 «Il chiosco di hamburger di pesce degli abissi dove scappa Yoshiko» (numazu-burger)
- d15-22 «Il santuarietto dal torii rosso dove balla Kanan» (nagaisaki-bana-cape)
- d15-25 «Il punto info pieno di poster e pupazzi delle Aqours» (sannoura-info)
- 2026-11-15 extra «La trattoria del curry nero di Yohane» (tosawaya)
- opzione «La trattoria del curry nero di Yohane» (tosawaya)
- d16-27 «Il bar del paese con birre artigianali e whisky» (j-cafe-bar)
- opzione «Il bar del paese con birre artigianali e whisky» (j-cafe-bar)
- opzione «Il pub-karaoke dei locali, aperto fino a mezzanotte» (pub-house-sumiya)
- opzione «Il pub-karaoke dei locali, aperto fino a mezzanotte» (pub-house-sumiya)
- 2026-11-16 extra «La trattoria del curry nero di Yohane» (tosawaya)
- 2026-11-16 extra «Il laboratorio dei budini al caramello in barattolino» (shuzenji-purin)
- 2026-11-16 extra «Il bosco di aceri sulla collina sopra il paese» (momiji-bayashi)

### placeId non trovati nel catalogo (0)

- nessuno

### Luoghi del catalogo senza corrispondente in places.json (item senza `placeId`) (55)

- salmon-kat-namba
- tenma-uosho
- tenma-mame
- tenma-source
- naniwa-no-yu
- sannenzaka-ninenzaka
- pontocho
- shirakawa-gion
- kappo-umetsu
- shuhari-kuromon
- mandarake-grand-chaos
- janjan-yokocho
- yamato-umeda
- kikyoya-ramen
- funasaka-sake
- tenryo-no-yu
- ajihei
- dekonaru-yokocho
- nagase-house
- irori-shirakawa
- unafuji-honten
- osu-kannon
- osu-shotengai
- mandarake-nagoya
- osu-akamon
- daijin-honten
- tebasaki-mutsumi
- bar-curacao
- udon-nishiki
- honmaru-palace
- yamamotoya-sohonke
- nagashima-spa-land
- akaboshi
- nakamise-numazu
- gamers-numazu
- agetsuchi-shotengai
- agetsuchi-asahi-inari
- onari-bashi
- oranda-kan
- numazu-burger
- iriichi
- nagaisaki-school
- nagaisaki-bana-cape
- nagahama-castle
- ohmos
- mitohama
- yasudaya
- mito-ko
- kisho-mikan
- awashima-pier
- matsuzuki
- izu-nagaoka-station
- zenputei-nanaban
- arai-ryokan
- j-cafe-bar

### Warning (16)

- blocco A CONFERMATO ma 2026-11-09 ha decisions senza `chosen`: A-09-4
- blocco B CONFERMATO ma 2026-11-11 ha decisions senza `chosen`: B-11-1, B-11-2, B-11-3, B-11-4
- blocco B CONFERMATO ma 2026-11-12 ha decisions senza `chosen`: B-12-1
- blocco C CONFERMATO ma 2026-11-13 ha decisions senza `chosen`: C-13-3
- override `agendaItems[d07-01]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Atterraggio a KIX, controllo passaporti, valigie»
- override `agendaItems[d07-03]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Valigie nel deposito self-service del BON»
- override `agendaItems[d14-04]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Metro Meijō Shiyakusho → Yabachō (3 fermate) + 7' »
- override `agendaItems[d10-15]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Consegna delle 4 valigie all'ufficio Yamato»
- override `agendaItems[d11-05]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «A piedi al Country Hotel»
- override `agendaItems[d12-06]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Bus Nohi Takayama 7:50 → Shirakawa-gō (Ogimachi) 8»
- override `agendaItems[d12-19]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Fila per il bus delle 15:55; bagno al terminal pri»
- override `agendaItems[d12-20]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Bus Gifu n. 13803 Shirakawa-gō 15:55 → Nagoya Meit»
- override `agendaItems[d11-04]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Limited Express Hida 25 diretto Osaka → Takayama 1»
- override `agendaItems[d08-05]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Pranzo di manzo di Kobe»
- override `agendaItems[d15-03]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Shinkansen Hikari 640 Nagoya 8:43 → Mishima 9:57»
- override `agendaItems[d16-21]` applicato a un giorno sostituito dalla scaletta: era scritto per l'item del build, verificare che valga ancora per «Check-in all'Arai (dalle 15:00)»

## Coerenza dei dati (export_site_costs.py: copie inevitabili vs fonte unica)

Errori (bloccano `--check`):
- nessuno

Avvisi (giorni in bozza o stime):
- nessuno

## Validazione schemi

- ✅ tutti i file conformi a SPEC §2

## Scansione dati sensibili (carte/IBAN/n. prenotazione)

- nessun match

## Scelte di modellazione

- `budget.perPerson.totalEur` = categorie + `common` (la riga «Spese comuni» del dossier è esplosa in `common`).
- Costi (13 ott, export_site_costs.py): spese pagate = `site_overrides.json › expenses` (€ reali) · da pagare in ¥ = `costJpy`/`costJpyTotal` ÷ `trip.fx.jpyPerEur` (parametro unico) · tutto il resto (tratte, alloggi, categorie, totali, paidSoFar, daily, conto, costo delle tappe collegate a una tratta) è calcolato; `--check` fallisce se una copia (orari, check-in/out, ¥ nei testi, totali) non coincide.
- `paidSoFar.lodgingEurGroup` = totale alloggi PRENOTATI (incl. Yasudaya da pagare in contanti); il pagato è `lodgingEurGroupPaid`.
- Telefoni di esercizi commerciali (ristoranti, ryokan, numero Yamato) mantenuti nei testi: nessun telefono personale nelle sorgenti.
- Note alloggi: rimossi metodo di pagamento e tasso applicato (registro acquisti); niente importi ¥ addebitati salvo Yasudaya (prezzo in struttura).
- `checkInTime`/`checkOutTime`: solo orari ufficiali noti (in `site_overrides.json`); l'orario d'arrivo pianificato è nell'agenda.
- Item con orario fuori sequenza (14 nov «ALTRI 3») marcati `parallel:true`; giorno libero 21 nov: item `allDay:true`, `time:""`.
- Testi per il sito (`ux_clean`, regole generali): maiuscole d'enfasi → minuscole; titoli item ≤ ~60 car. (spiegazioni/logistica in `note`); titolo giorno senza base ripetuta + `dayTrip`; checklist con `endDate`/`whenDetail`/`dateApprox`; opzioni trasporto con `id`, `noteShort`, `noteMore`; riferimenti al dossier (📎/🗓/«vedi riga») tolti e tradotti in `links` interni; note alloggi deduplicate; Giorno 1 `open` → `remember` (deciso) o `todo` (aperto).

## Guide (SPEC §10) — 12 in `site/data/guides.json`

Sorgente: `data/guide`

### Guide lette (12)

- `bere.md` → `bere` (order 30, 7290 car. HTML, 2 luoghi)
- `cena-compleanno-kyoto.md` → `cena-compleanno-kyoto` (order 12, 103995 car. HTML, 6 luoghi)
- `concerto-nagoya.md` → `concerto-nagoya` (order 15, 12754 car. HTML, 0 luoghi)
- `izakaya-tachinomi.md` → `izakaya-tachinomi` (order 20, 8011 car. HTML, 0 luoghi)
- `mangiare.md` → `mangiare` (order 40, 7037 car. HTML, 2 luoghi)
- `muoversi.md` → `muoversi` (order 50, 9487 car. HTML, 0 luoghi)
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

### Foto scaricate (1)

- cena-compleanno-kyoto-523fd730.webp (14 KB) ← https://s3-ap-northeast-1.amazonaws.com/files.jpneazy.com/restaurants/18/images/eyecatch.jpg

### Foto riusate (file già presenti) (108)

- cena-compleanno-kyoto-24483c4c.webp (45 KB)
- cena-compleanno-kyoto-0cde6226.webp (30 KB)
- cena-compleanno-kyoto-e84a0047.webp (20 KB)
- cena-compleanno-kyoto-e3fc63be.webp (24 KB)
- cena-compleanno-kyoto-fb12f1ba.webp (30 KB)
- cena-compleanno-kyoto-95b7f3d0.webp (23 KB)
- cena-compleanno-kyoto-5aa3f72d.webp (8 KB)
- cena-compleanno-kyoto-baa04e01.webp (23 KB)
- cena-compleanno-kyoto-4dfada3e.webp (56 KB)
- cena-compleanno-kyoto-468f4e28.webp (27 KB)
- cena-compleanno-kyoto-e9a0ac3c.webp (43 KB)
- cena-compleanno-kyoto-b0387bb3.webp (27 KB)
- cena-compleanno-kyoto-b73e178d.webp (25 KB)
- cena-compleanno-kyoto-1934d06d.webp (19 KB)
- cena-compleanno-kyoto-728a653e.webp (21 KB)
- cena-compleanno-kyoto-a21f84d0.webp (23 KB)
- cena-compleanno-kyoto-d2ca59a8.webp (19 KB)
- cena-compleanno-kyoto-b54cccbe.webp (16 KB)
- cena-compleanno-kyoto-c5f2df7e.webp (15 KB)
- cena-compleanno-kyoto-f1905433.webp (10 KB)
- cena-compleanno-kyoto-744970d6.webp (28 KB)
- cena-compleanno-kyoto-2b9737f0.webp (20 KB)
- cena-compleanno-kyoto-a4409a94.webp (16 KB)
- cena-compleanno-kyoto-fea1ed8a.webp (59 KB)
- cena-compleanno-kyoto-779a9441.webp (20 KB)
- cena-compleanno-kyoto-42b0b72b.webp (36 KB)
- cena-compleanno-kyoto-ad263258.webp (25 KB)
- cena-compleanno-kyoto-0a68d028.webp (17 KB)
- cena-compleanno-kyoto-7c7ad05f.webp (20 KB)
- cena-compleanno-kyoto-37372d85.webp (20 KB)
- cena-compleanno-kyoto-b1e6f6b3.webp (21 KB)
- cena-compleanno-kyoto-400059ea.webp (22 KB)
- cena-compleanno-kyoto-0f0dd028.webp (36 KB)
- cena-compleanno-kyoto-835129d9.webp (23 KB)
- cena-compleanno-kyoto-b620f802.webp (21 KB)
- cena-compleanno-kyoto-9fa44862.webp (21 KB)
- cena-compleanno-kyoto-004958f7.webp (20 KB)
- cena-compleanno-kyoto-c4cf1c7c.webp (26 KB)
- cena-compleanno-kyoto-5c815de6.webp (21 KB)
- cena-compleanno-kyoto-29ae084d.webp (26 KB)
- cena-compleanno-kyoto-152bd406.webp (19 KB)
- cena-compleanno-kyoto-f66ddb92.webp (35 KB)
- cena-compleanno-kyoto-fbe33191.webp (23 KB)
- cena-compleanno-kyoto-42d60105.webp (26 KB)
- cena-compleanno-kyoto-14989925.webp (26 KB)
- cena-compleanno-kyoto-f6a0a2ca.webp (26 KB)
- cena-compleanno-kyoto-6b4aafe2.webp (22 KB)
- cena-compleanno-kyoto-e1286907.webp (58 KB)
- cena-compleanno-kyoto-59202fad.webp (26 KB)
- cena-compleanno-kyoto-d14dc47c.webp (28 KB)
- cena-compleanno-kyoto-3c7c86ca.webp (16 KB)
- cena-compleanno-kyoto-e804a542.webp (22 KB)
- cena-compleanno-kyoto-13c229e0.webp (22 KB)
- cena-compleanno-kyoto-6ae95df2.webp (31 KB)
- cena-compleanno-kyoto-a35449ce.webp (20 KB)
- cena-compleanno-kyoto-44ca209c.webp (9 KB)
- cena-compleanno-kyoto-75aa72a2.webp (30 KB)
- cena-compleanno-kyoto-2a46ab3f.webp (25 KB)
- cena-compleanno-kyoto-29ee82ab.webp (18 KB)
- cena-compleanno-kyoto-394b1824.webp (25 KB)
- cena-compleanno-kyoto-1e9e7b4c.webp (13 KB)
- cena-compleanno-kyoto-95fffee9.webp (9 KB)
- cena-compleanno-kyoto-2cd47580.webp (30 KB)
- cena-compleanno-kyoto-b445bce7.webp (37 KB)
- cena-compleanno-kyoto-841f2fe9.webp (58 KB)
- cena-compleanno-kyoto-755f0710.webp (37 KB)
- cena-compleanno-kyoto-6d8154cb.webp (31 KB)
- cena-compleanno-kyoto-8cb8db75.webp (25 KB)
- cena-compleanno-kyoto-262eb7aa.webp (15 KB)
- cena-compleanno-kyoto-fa106c3f.webp (24 KB)
- cena-compleanno-kyoto-5fbfa70c.webp (33 KB)
- cena-compleanno-kyoto-91469975.webp (14 KB)
- cena-compleanno-kyoto-457dbdb5.webp (29 KB)
- cena-compleanno-kyoto-fecb7f32.webp (23 KB)
- cena-compleanno-kyoto-cbfa88dd.webp (19 KB)
- cena-compleanno-kyoto-59ec7c0e.webp (14 KB)
- cena-compleanno-kyoto-af367c6b.webp (23 KB)
- cena-compleanno-kyoto-67ba3523.webp (32 KB)
- cena-compleanno-kyoto-db62897d.webp (17 KB)
- cena-compleanno-kyoto-03bea6f3.webp (12 KB)
- cena-compleanno-kyoto-83eee99e.webp (23 KB)
- cena-compleanno-kyoto-8e97b8c1.webp (9 KB)
- cena-compleanno-kyoto-f7c527ca.webp (10 KB)
- cena-compleanno-kyoto-0f9d8eef.webp (8 KB)
- cena-compleanno-kyoto-fb59df94.webp (17 KB)
- cena-compleanno-kyoto-c01b0de6.webp (19 KB)
- cena-compleanno-kyoto-0aa5abff.webp (28 KB)
- cena-compleanno-kyoto-e6c9ee68.webp (27 KB)
- cena-compleanno-kyoto-c302e186.webp (24 KB)
- cena-compleanno-kyoto-320a2847.webp (13 KB)
- cena-compleanno-kyoto-e29e70b2.webp (14 KB)
- cena-compleanno-kyoto-1438d89b.webp (27 KB)
- cena-compleanno-kyoto-6cbd973f.webp (19 KB)
- cena-compleanno-kyoto-8af486b9.webp (20 KB)
- cena-compleanno-kyoto-e9608443.webp (24 KB)
- cena-compleanno-kyoto-0ef90384.webp (29 KB)
- cena-compleanno-kyoto-f1ca4ef3.webp (22 KB)
- cena-compleanno-kyoto-5c110eba.webp (34 KB)
- cena-compleanno-kyoto-7b373db4.webp (24 KB)
- cena-compleanno-kyoto-055a029f.webp (20 KB)
- cena-compleanno-kyoto-5ea39d01.webp (30 KB)
- cena-compleanno-kyoto-40957e4e.webp (28 KB)
- cena-compleanno-kyoto-224bbdfc.webp (11 KB)
- cena-compleanno-kyoto-764809dc.webp (28 KB)
- cena-compleanno-kyoto-aae3c623.webp (22 KB)
- cena-compleanno-kyoto-3c7be5bf.webp (27 KB)
- cena-compleanno-kyoto-5611ac56.webp (16 KB)
- cena-compleanno-kyoto-1e41b52c.webp (20 KB)

### Foto fallite (0)

- nessuno

### Foto senza copia locale (solo online) (0)

- nessuno

## Foto locali dei luoghi (`--fetch-images`)

Modalità: download attivo · convertitore: Pillow (/Users/panteghininicolo/progetti/Giappone_Nov2026/.venv/bin/python3)
Cartella `site/assets/img/places/`: 173 file · 18102 KB totali

### Scaricate (0)

- nessuna

### Riusate (file già presenti) (171)

- hankyu-higashi-dori (hankyu-higashi-dori.webp, 90 KB)
- nakazakicho (nakazakicho.webp, 88 KB)
- dotonbori (dotonbori.webp, 132 KB)
- hozenji-yokocho (hozenji-yokocho.webp, 79 KB)
- ohatsu-tenjin-ura-sando (ohatsu-tenjin-ura-sando.webp, 91 KB)
- kita-shinchi (kita-shinchi.webp, 100 KB)
- umeda-sky-building (umeda-sky-building.webp, 47 KB)
- kitano-ijinkan (kitano-ijinkan.webp, 67 KB)
- nankinmachi (nankinmachi.webp, 116 KB)
- mouriya-sannomiya (mouriya-sannomiya.webp, 72 KB)
- castello-osaka (castello-osaka.webp, 90 KB)
- tenma (tenma.webp, 117 KB)
- ura-namba (ura-namba.webp, 143 KB)
- arima-onsen (arima-onsen.webp, 120 KB)
- meriken-harborland (meriken-harborland.webp, 88 KB)
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
- gion-hanamikoji (gion-hanamikoji.webp, 153 KB)
- kappo-umetsu (kappo-umetsu.webp, 50 KB)
- wabiya-korekido (wabiya-korekido.webp, 23 KB)
- gion-sushi-taku (gion-sushi-taku.webp, 51 KB)
- kikukawa-gion (kikukawa-gion.webp, 29 KB)
- gion-tsuzaki (gion-tsuzaki.webp, 29 KB)
- mamehachi-pontocho (mamehachi-pontocho.webp, 26 KB)
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
- den-den-town (den-den-town.webp, 126 KB)
- super-potato (super-potato.webp, 177 KB)
- tsutenkaku (tsutenkaku.webp, 110 KB)
- shinsekai (shinsekai.webp, 174 KB)
- janjan-yokocho (janjan-yokocho.webp, 126 KB)
- todai-ji (todai-ji.webp, 77 KB)
- nara-park (nara-park.webp, 229 KB)
- kasuga-taisha (kasuga-taisha.webp, 243 KB)
- nakatanidou (nakatanidou.webp, 43 KB)
- ota-road (ota-road.webp, 128 KB)
- sumiyoshi-taisha (sumiyoshi-taisha.webp, 155 KB)
- naramachi (naramachi.webp, 75 KB)
- kikyoya-ramen (kikyoya-ramen.webp, 40 KB)
- takayama-jinya (takayama-jinya.webp, 133 KB)
- nakabashi (nakabashi.webp, 143 KB)
- funasaka-sake (funasaka-sake.webp, 66 KB)
- sanmachi-suji (sanmachi-suji.webp, 72 KB)
- showa-kan (showa-kan.webp, 78 KB)
- higashiyama-walk (higashiyama-walk.webp, 130 KB)
- tenryo-no-yu (tenryo-no-yu.webp, 82 KB)
- ajihei (ajihei.webp, 66 KB)
- dekonaru-yokocho (dekonaru-yokocho.webp, 56 KB)
- hida-kotte-ushi (hida-kotte-ushi.webp, 57 KB)
- maruaki (maruaki.webp, 56 KB)
- yatai-kaikan (yatai-kaikan.webp, 152 KB)
- sakurayama-hachimangu (sakurayama-hachimangu.webp, 142 KB)
- kyoya (kyoya.webp, 54 KB)
- hida-kokubunji (hida-kokubunji.webp, 180 KB)
- hie-jinja (hie-jinja.webp, 107 KB)
- hida-no-sato (hida-no-sato.webp, 114 KB)
- yoshijima-house (yoshijima-house.webp, 73 KB)
- miyagawa-asaichi (miyagawa-asaichi.webp, 124 KB)
- shiroyama-viewpoint (shiroyama-viewpoint.webp, 188 KB)
- wada-house (wada-house.webp, 120 KB)
- kanda-house (kanda-house.webp, 106 KB)
- nagase-house (nagase-house.webp, 191 KB)
- irori-shirakawa (irori-shirakawa.webp, 50 KB)
- myozen-ji (myozen-ji.webp, 212 KB)
- gassho-minkaen (gassho-minkaen.webp, 167 KB)
- ochiudo (ochiudo.webp, 187 KB)
- ogimachi (ogimachi.webp, 182 KB)
- yamachan-meieki (yamachan-meieki.webp, 84 KB)
- yabaton-esca (yabaton-esca.webp, 102 KB)
- misen-jr-nagoya (misen-jr-nagoya.webp, 102 KB)
- sakae-nishiki (sakae-nishiki.webp, 65 KB)
- jinya-mae-asaichi (jinya-mae-asaichi.webp, 84 KB)
- atsuta-jingu (atsuta-jingu.webp, 173 KB)
- unafuji-honten (unafuji-honten.webp, 125 KB)
- horaiken-jingu (horaiken-jingu.webp, 51 KB)
- horaiken-honten (horaiken-honten.webp, 87 KB)
- osu-kannon (osu-kannon.webp, 109 KB)
- osu-shotengai (osu-shotengai.webp, 112 KB)
- mandarake-nagoya (mandarake-nagoya.webp, 128 KB)
- osu-akamon (osu-akamon.webp, 81 KB)
- komehyo-nagoya (komehyo-nagoya.webp, 93 KB)
- daijin-honten (daijin-honten.webp, 100 KB)
- atarayo (atarayo.webp, 74 KB)
- kamoshiya-oden (kamoshiya-oden.webp, 54 KB)
- tebasaki-mutsumi (tebasaki-mutsumi.webp, 100 KB)
- furaibo-sakae (furaibo-sakae.webp, 111 KB)
- sekai-no-yamachan (sekai-no-yamachan.webp, 84 KB)
- bar-curacao (bar-curacao.webp, 63 KB)
- bar-barns (bar-barns.webp, 89 KB)
- kreis (kreis.webp, 53 KB)
- udon-nishiki (udon-nishiki.webp, 34 KB)
- yabaton (yabaton.webp, 127 KB)
- saunalab-nagoya (saunalab-nagoya.webp, 61 KB)
- miya-kishimen (miya-kishimen.webp, 164 KB)
- shirotori-garden (shirotori-garden.webp, 68 KB)
- honmaru-palace (honmaru-palace.webp, 79 KB)
- nagoya-castle (nagoya-castle.webp, 95 KB)
- yamamotoya-sohonke (yamamotoya-sohonke.webp, 107 KB)
- kadomaru (kadomaru.webp, 67 KB)
- nagashima-spa-land (nagashima-spa-land.webp, 60 KB)
- nabana-no-sato (nabana-no-sato.webp, 145 KB)
- akaboshi (akaboshi.webp, 73 KB)
- sake-kitaru (sake-kitaru.webp, 85 KB)
- port-aquarium (port-aquarium.webp, 18 KB)
- inuyama-castle (inuyama-castle.webp, 146 KB)
- tokugawa-en (tokugawa-en.webp, 201 KB)
- scmaglev (scmaglev.webp, 107 KB)
- toyota-museum (toyota-museum.webp, 83 KB)
- midland-square (midland-square.webp, 62 KB)
- numazu-station (numazu-station.webp, 80 KB)
- nakamise-numazu (nakamise-numazu.webp, 89 KB)
- agetsuchi-asahi-inari (agetsuchi-asahi-inari.webp, 97 KB)
- onari-bashi (onari-bashi.webp, 66 KB)
- iriichi (iriichi.webp, 66 KB)
- gotetsu (gotetsu.webp, 78 KB)
- nishiyo (nishiyo.webp, 38 KB)
- minato-shinsenkan (minato-shinsenkan.webp, 120 KB)
- nagaisaki-school (nagaisaki-school.webp, 115 KB)
- nagahama-castle (nagahama-castle.webp, 140 KB)
- ohmos (ohmos.webp, 60 KB)
- fujimi-hiroba (fujimi-hiroba.webp, 55 KB)
- mitohama (mitohama.webp, 114 KB)
- mito-ko (mito-ko.webp, 21 KB)
- awashima-pier (awashima-pier.webp, 55 KB)
- izu-mito-sea-paradise (izu-mito-sea-paradise.webp, 96 KB)
- numazu-hie-jinja (numazu-hie-jinja.webp, 216 KB)
- senbon-matsubara (senbon-matsubara.webp, 57 KB)
- maguro-kick (maguro-kick.webp, 31 KB)
- numazu-deep-sea-aquarium (numazu-deep-sea-aquarium.webp, 68 KB)
- numazu-imperial-villa (numazu-imperial-villa.webp, 94 KB)
- mishima-skywalk (mishima-skywalk.webp, 123 KB)
- mishima-taisha (mishima-taisha.webp, 95 KB)
- kisho-mikan (kisho-mikan.webp, 190 KB)
- matsuzuki (matsuzuki.webp, 60 KB)
- hamanoya (hamanoya.webp, 45 KB)
- izu-nagaoka-station (izu-nagaoka-station.webp, 90 KB)
- zenputei-nanaban (zenputei-nanaban.webp, 44 KB)
- sakuda-soba (sakuda-soba.webp, 44 KB)
- tokko-soba-oto (tokko-soba-oto.webp, 35 KB)
- tokko-no-yu (tokko-no-yu.webp, 216 KB)
- shuzen-ji (shuzen-ji.webp, 187 KB)
- arai-ryokan (arai-ryokan.webp, 147 KB)
- chikurin-no-komichi (chikurin-no-komichi.webp, 222 KB)
- ponti-rossi-del-katsura (ponti-rossi-del-katsura.webp, 173 KB)
- awashima (awashima.webp, 98 KB)
- shuzenji-onsen (shuzenji-onsen.webp, 219 KB)
- ikesuya (ikesuya.webp, 64 KB)
- niji-no-sato (niji-no-sato.webp, 180 KB)
- shigetsuden (shigetsuden.webp, 177 KB)
- izu-panorama-park (izu-panorama-park.webp, 56 KB)
- osaka-mikan (osaka-mikan.webp, 83 KB)
- cascata-di-joren (cascata-di-joren.webp, 144 KB)

### Fallite (5)

- endoji-shikemichi: HTTP Error 429: Too Many Requests (015d12c) · https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Endoji_Shopping_Street_2021-10_ac.jpg/960px-Endoji_Shopping_Street_2021-10_ac.jpg
- view-o: HTTP Error 429: Too Many Requests (015d12c) · https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Byuo.jpg/960px-Byuo.jpg
- yasudaya: HTTP Error 429: Too Many Requests (015d12c) · https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Yasudaya-Ryokan.jpg/960px-Yasudaya-Ryokan.jpg
- kanukiyama-park: HTTP Error 429: Too Many Requests (015d12c) · https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mount_Kanuki_20120730.jpg/960px-Mount_Kanuki_20120730.jpg
- hie-shrine: HTTP Error 429: Too Many Requests (015d12c) · https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Shuzenji_Onsen_area_Hie_Shrine_2024_11_4_various_12.jpg/960px-Shuzenji_Onsen_area_Hie_Shrine_2024_11_4_various_12.jpg

## Schede dei luoghi (SPEC §12) — 1 in `site/data/place-details.json`

Sorgente: `data/luoghi`

### Schede lette (1)

- `mouriya-sannomiya.md` → `mouriya-sannomiya` (14549 car. HTML, 1 tappe in agenda)

### Errori di frontmatter (0)

- nessuno

### Blocchi <svg>/<figure> scartati (0)

- nessuno

### Luoghi non trovati (0)

- nessuno

### Link non ammessi (0)

- nessuno

### Avvisi (0)

- nessuno

### Foto scaricate (0)

- nessuno

### Foto riusate (file già presenti) (2)

- mouriya-sannomiya-56828ac9.webp (76 KB)
- mouriya-sannomiya-8baf6cc9.webp (19 KB)

### Foto fallite (0)

- nessuno

### Foto senza copia locale (solo online) (0)

- nessuno
