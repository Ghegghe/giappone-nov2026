# DIRECTION — redesign "presentabile, senza artefatti AI" (2 ott 2026)

Decisione del cliente: il sito deve sembrare fatto da una persona con gusto, non da un generatore. Tema UNICO.

## Diagnosi (dagli screenshot a 375 e 1280, chiaro e scuro)
1. Tutto è una card: ogni contenuto in un rettangolo con bordo e stesso raggio.
2. Hero con numerone "36 giorni" a 72px in un riquadro: pattern da template.
3. Badge e pillole ovunque ("bozza" ×3 nella stessa schermata, "scelta", "oggi", chip per tutto).
4. Icona davanti a ogni voce (nav, lucchetto su ogni orario fisso, info, esterno).
5. Griglia "Sezioni" in home che duplica la nav.
6. Testi da documentazione interna: "3 modi (verificati):", "(Nessun account, da ospite)", parentesi annidate.
7. Orari in monospazio e 13 colori nella timeline.
8. Nessuna immagine, font di sistema, grigi: pulito ma anonimo.

## Direzione (10 righe)
- UN tema: base zinc/shadcn già presente, chiaro e scuro automatici. Il selettore temi sparisce dall'interfaccia
  (i file washi/night restano nel repo ma non sono linkati né precacheati).
- Tipografia: titoli in un serif di sistema con carattere (stack: "Iowan Old Style", "Palatino", Georgia, serif) a peso normale,
  testo in sans di sistema. Orari e cifre nel font del testo con `font-variant-numeric: tabular-nums`, niente mono.
- Un solo accento (vermiglio tenue o indaco: scegliere uno e usarlo per link, stato attivo, "oggi"). Tutto il resto neutro.
- Card SOLO per oggetti ripetuti e confrontabili (alloggi, opzioni di trasporto, luoghi). Home, intestazioni, logistica,
  budget: tipografia, linee sottili e spazio, niente riquadri.
- Badge: al massimo uno per riga; "bozza" una sola volta in testa all'agenda; niente badge dove basta una parola nel testo.
- Icone: nav sì (sono convenzione mobile) ma senza etichetta ridondante su desktop; lucchetto solo nel dettaglio item;
  nessuna icona decorativa nei titoli.
- Timeline: 4 famiglie di colore (spostamenti · fissi · visite/cultura · cibo e sera), tinte morbide, i "libero" come
  semplice spazio con l'orario in grigio, senza tratteggi.
- Home = pagina, non dashboard: titolo, una riga "sab 7 → mar 24 nov · 4 persone · tra 36 giorni", poi "Prossimo giorno"
  come lista semplice, poi le 3 scadenze più vicine, poi fine. Via hero, via griglia Sezioni, via tasso di cambio.
- Fotografie: 6 slot (una per base) in testa a giorno.html e nelle card alloggi, da `assets/img/<baseId>.jpg`,
  max 160KB l'una, con `loading="lazy"` e fallback a un blocco colore se il file manca. Le immagini le fornisce il cliente;
  per ora SOLO il fallback (nessuna immagine inventata, nessun download da internet).
- Copy: frasi complete e corte, voce "tu/voi", niente parentesi annidate, niente "(verificato)", niente sigle interne.
  Esempio: "Si prenota su smartEX. Serve un account con la Revolut fisica. Apre l'11 ottobre alle 3 di notte italiane."
