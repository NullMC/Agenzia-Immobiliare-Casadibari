# Analisi e piano editoriale — Casadibari Immobiliare

**Fonte:** prompt consegnato dal cliente il 21 ottobre 2026.  
**Obiettivo operativo:** trasformare il sito da semplice vetrina di annunci a percorso informativo che favorisca richieste di valutazione e contatti da parte di proprietari di Bari, senza trascurare gli acquirenti.

## 1. Lettura critica del prompt originale

Il documento contiene:
- una proposta di posizionamento commerciale rivolta a chi desidera **vendere casa a Bari**, soprattutto nelle zone **Carrassi, Picone e San Pasquale**;
- una proposta di testo per una pagina «Vuoi vendere casa a Bari?»;
- cinque temi per articoli informativi e organici;
- un modulo di richiesta valutazione abbozzato, con opzioni su quartiere, tipologia e tempi;
- riferimenti illustrativi esterni, ripetizioni e residui non editoriali (ad esempio «Verifica dello stato dei preferiti in corso»);
- una frase ad effetto «TU HAI L'IMMOBILE, NOI ABBIAMO L'ACQUIRENTE!», utile come stimolo creativo ma troppo assertiva se non supportata da richieste attuali e verificabili.

**Pulizia:** esclusi i link alle immagini temporanee di ChatGPT e di terzi, i testi di interfaccia residui e le istruzioni rivolte all'agente anziché ai visitatori. Non sono stati inventati dati locali o testimonial.

## 2. Messaggio guida adottato

**«La tua casa merita un progetto, non soltanto un annuncio.»**

Secondo livello:
- Una valutazione ragionata parte da zona, piano, stato, ascensore, pertinenze e comparabili.
- L'annuncio deve rendere comprensibili le caratteristiche dell'immobile.
- La promozione va pianificata insieme al proprietario; non promettere canali o risultati non concordati.
- Il cliente viene accompagnato nel confronto, nell'organizzazione delle visite e nella trattativa, con i professionisti competenti per gli aspetti tecnici e giuridici.

Invito all'azione principale: **«Richiedi una valutazione gratuita»**.

Alternative: **«Scopri il nostro metodo»**, **«Leggi le nostre guide»**, **«Parla con noi»**.

## 3. Cosa è supportato e cosa non si può ancora affermare

| Tema | Trattamento editoriale |
|---|---|
| Operatività dal 2001 | Già dichiarata nel sito. Mantenerla, verificando con l'agenzia i dettagli storici se diventano oggetto di campagne. |
| Carrassi, Picone e San Pasquale | Zone di interesse suggerite dal cliente; non implicano da sole una quota di mercato o performance particolari. |
| Valutazione gratuita | Coerente con il modulo già operativo; il primo confronto non equivale a una perizia. |
| «Abbiamo l'acquirente» | Da usare solo per richieste REALI, aggiornate e consentite. In assenza di dati, non è pubblicato come fatto. |
| «Vendiamo in tempi record» | Non utilizzato: servirebbero casi verificabili e autorizzazione a divulgarli. |
| «Prezzi a Carrassi nel 2026» | Nessuna cifra senza fonte, data, perimetro e confronto; spiegati i fattori di stima. |
| Recensioni | Mantenere il widget reale di Google/Elfsight già presente; nessuna recensione inventata. |
| Foto dei portali o di altri siti | Non riutilizzate; solo asset già presenti nel progetto e upload autorizzati dall'agenzia. |

## 4. Contenuti incorporati

**Homepage:** sezione proprietari con metodo in tre passaggi, collegamenti a valutazione e pubblicazione; anteprima di tre articoli.

**Pagina valutazione:** spiegazione di come si effettua una prima analisi, includendo microzona, pertinenze, piano, ascensore, stato e immobili comparabili.

**Pagina «Pubblica con noi»:** testo più concreto sulla strategia e sul rapporto con il proprietario; rimando ai quartieri e agli articoli; conservati i canali immobiliari già impostati.

**Navigazione:** aggiunta la voce «Guide e consigli» e il collegamento nel footer.

**Layout:** in desktop il contenuto sinistro dell'hero è allineato al margine del logo navbar, mentre `Casa.webp` viene spostato più a destra. Sul mobile rimane logo sopra e testo sotto.

## 5. Primi cinque articoli (testi completi e modificabili)

1. **Quanto vale un appartamento a Carrassi nel 2026?** — spiegare la differenza fra prezzi richiesti e valori effettivi, l'importanza dei comparabili e delle caratteristiche specifiche. Niente valori numerici inventati.
2. **Vendere casa a Bari: 7 errori da evitare** — una guida concreta per preparare prezzo, immagini, visite, documentazione e trattativa.
3. **Meglio vendere casa da privato o tramite agenzia?** — confronto equilibrato tra autonomia e servizi professionali.
4. **Come vendere casa velocemente senza svenderla** — consigli senza promesse sui tempi o sul prezzo finale.
5. **Quali documenti servono per vendere casa a Bari?** — lista orientativa con invito a verifiche notarili e tecniche.

I cinque articoli iniziali sono contenuti redazionali da verificare con l'agenzia prima delle campagne a pagamento. Sono introdotti come contenuto iniziale del nuovo magazine e restano modificabili dal backoffice dopo l'applicazione della migrazione.

## 6. Nuova funzionalità magazine

- `/guide`: griglia responsive con categoria, immagine, titolo, anteprima e filtro per argomento.
- `/guide/:slug`: pagina completa con SEO, testo formattato, immagini, letture correlate e richiesta di valutazione.
- `/admin` > **Articoli**: editor WYSIWYG, creazione, modifica, eliminazione, bozza/pubblicazione, foto copertina, immagini inline, link e URL personalizzabile.
- Supabase: tabella `public.articles` con RLS per la lettura pubblica dei soli articoli pubblicati e modifiche riservate agli admin, bucket `article-images` protetto in scrittura.
- Anteprime iniziali nell'app: restano disponibili in lettura finché la migrazione non è stata eseguita. Una volta presente il DB, il DB diventa l'unica fonte per pubblicazione e rimozione.

**Attivazione del CMS reale:** applicare `supabase/migrations/202610210001_articles_and_editorial.sql` sul progetto Supabase esistente, con SQL Editor o Supabase CLI (`npx supabase db push` dopo aver verificato che le altre migrazioni risultino già applicate). Senza questo passo, il backoffice non può salvare articoli e il caricamento foto fallisce.

## 7. Miglioramenti futuri consigliati

- Richiedere al cliente *casi di vendita reali* e consenso per pubblicare eventuali risultati, fotografie e testimonianze.
- Per le guide sui quartieri, includere *fonti pubbliche datate* (ad es. dati ufficiali OMI) e intervalli correttamente contestualizzati, senza presentare una quotazione OMI come valutazione del singolo immobile.
- Integrare una raccolta strutturata di richieste di proprietari e compratori solo con basi privacy adeguate e dati effettivi.
- Configurare una sitemap dinamica per gli articoli futuri se il numero cresce; verificare l'URL canonico del sito in produzione e aggiornare la sitemap attualmente indirizzata al dominio Altervista.
- Monitorare in forma aggregata la lettura delle guide e i passaggi verso `/valutazione`, evitando promesse di incremento conversioni senza dati.
- Revisionare periodicamente guide su documenti e norme con il supporto dei professionisti competenti.

## 8. Indicazioni per l'agenzia

Prima della pubblicazione di un nuovo articolo: controllare titoli e fonti, usare solo fotografie autorizzate, scegliere una copertina pertinente, rileggere gli inviti al contatto, verificare i link, pubblicare e visualizzare la pagina da smartphone. Conservare le fonti quando si citano dati numerici o novità normative.
