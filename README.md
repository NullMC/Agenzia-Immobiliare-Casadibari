# Casadibari Immobiliare — piattaforma web

Applicazione React + TypeScript + Vite per il sito pubblico e il backoffice di Agenzia Immobiliare Casadibari. La grafica riprende il verde del marchio, il bianco e la comunicazione del sito attuale: “Il tuo Partner di fiducia nel mondo immobiliare”.

## Sviluppo locale

Requisiti: Node.js 20+ e npm.

1. Clona il repository e installa le dipendenze con `npm install`.
2. Copia `.env.example` in `.env.local`.
3. Inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` usando la chiave publishable del progetto.
4. Imposta `VITE_ELFSIGHT_REVIEWS_WIDGET_ID` con l’ID del widget Elfsight (la parte dopo `elfsight-app-` nel codice di incorporamento).
5. Avvia con `npm run dev`; verifica con `npm run build`.

Senza configurazione Supabase il sito non mostra annunci. Le sezioni immobili mostrano uno stato vuoto finché non sono disponibili record reali pubblicati nel database. Non sono incluse schede immobiliari di esempio.

## Supabase: database e immagini

1. Crea un progetto Supabase.
2. In SQL Editor esegui il file `supabase/migrations/202610130001_initial_schema.sql`.
3. In Storage verifica che esista il bucket pubblico `property-images` (creato dalla migrazione). Le policy permettono di caricare, modificare ed eliminare immagini solo a un admin autenticato.
4. In Authentication crea l'utente amministratore con email e password sicure. Non è prevista una registrazione admin pubblica.
5. In SQL Editor associa l'utente alla tabella `public.admin_profiles`, sostituendo UUID, username ed email con i valori reali:

```sql
insert into public.admin_profiles (user_id, username, email, is_active)
values ('UUID_UTENTE_AUTH', 'nomeutente', 'admin@example.it', true);
```

L'UUID si trova in Authentication → Users. Il login nel sito usa username e password; la Edge Function risolve lo username lato server e poi usa Supabase Auth. Non inserire mai la service role key nel front-end.

Imposta le variabili Vite in locale e nell'hosting:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (oppure `VITE_SUPABASE_ANON_KEY` per compatibilità con configurazioni precedenti)
- `VITE_SITE_URL` (URL canonico del sito pubblicato)
- `VITE_ELFSIGHT_REVIEWS_WIDGET_ID` (ID del widget recensioni Elfsight, senza il prefisso `elfsight-app-`)

La chiave anon è destinata al client e resta protetta dalle policy RLS. La service role key è esclusivamente server-side.

## Edge Functions: deploy e attivazione

Le chiavi `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` configurano il front-end, ma **non distribuiscono le Edge Functions**.

Apri un terminale nella cartella del repository, autentica la Supabase CLI, identifica il progetto e collegalo:

```powershell
npx supabase login
npx supabase projects list
npx supabase link --project-ref TUO_PROJECT_REF
```

Per un progetto nuovo, applica tramite SQL Editor `supabase/migrations/202610130001_initial_schema.sql` oppure usa `npx supabase db push`. Se il database era già stato inizializzato con una versione precedente del progetto, applica anche la migrazione `supabase/migrations/202610140001_remove_reviews_table_use_elfsight.sql` (con `npx supabase db push` oppure eseguendo quel file in SQL Editor): rimuove la tabella `reviews`, perché le recensioni saranno fornite dal widget Elfsight e non salvate in Supabase. Non rieseguire alla cieca la migrazione iniziale su un database già attivo.

Distribuisci le funzioni dal repository:

```powershell
npx supabase functions deploy admin-login --use-api
npx supabase functions deploy notify-property-alerts --use-api
npx supabase functions list
```

Le Edge Functions Supabase possono ricevere `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` e `SUPABASE_SECRET_KEYS` (dizionari JSON nominati), oltre alle variabili legacy `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. La funzione `admin-login` legge i nomi nuovi e quelli legacy. Non inserire mai chiavi secret/service role nel bundle React e non creare Function Secrets personalizzati con prefisso riservato `SUPABASE_`.

Per inviare email ai clienti, crea in Resend un dominio di invio dedicato, preferibilmente un sottodominio come `send.casadibari.it`, e verifica i record DNS che Resend mostra per quel sottodominio. Non è necessario creare una nuova casella di posta: il sottodominio serve solo a separare l'autenticazione dell'invio dal dominio principale. Lascia invariati i record MX del dominio principale usati per ricevere la posta dell'ufficio. Usa come mittente un indirizzo del sottodominio verificato, ad esempio `Casadibari Immobiliare <notifiche@send.casadibari.it>`.

Poi imposta in **Project Settings → Edge Functions → Secrets** (oppure con `npx supabase secrets set`) questi segreti personalizzati:

- `RESEND_API_KEY`: la chiave API Resend.
- `RESEND_FROM_EMAIL`: il mittente sul sottodominio verificato, ad esempio `Casadibari Immobiliare <notifiche@send.casadibari.it>`.
- `SITE_URL`: URL pubblico canonico del sito, senza slash finale; usato nei link agli annunci.
- `NOTIFICATION_WEBHOOK_SECRET`: stringa casuale lunga, privata, usata identica nell'header `x-hook-secret` del webhook degli avvisi.

Non aggiungere queste credenziali al front-end e non salvarle in GitHub. Le email vengono inviate esclusivamente ai clienti che hanno salvato una ricerca attiva e dato il consenso, quando un nuovo immobile disponibile corrisponde ai loro criteri. I moduli di Contatto e Valutazione restano salvati in Supabase e sono consultabili dal backoffice; non è previsto l'invio di email alla casella dell'ufficio.

Per completare il login amministratore, crea prima un utente in **Authentication → Users**, poi inserisci il suo UUID, uno username minuscolo e la stessa email in `public.admin_profiles` (vedi query SQL nella sezione precedente).

**Webhook A — avvisi ai clienti per nuovi immobili**

In **Database → Webhooks**, crea un webhook con:
- tabella: `public.property_notification_queue`;
- evento: `INSERT`;
- URL: `https://TUO_PROJECT_REF.supabase.co/functions/v1/notify-property-alerts`;
- metodo: `POST`, payload JSON del record;
- header HTTP personalizzato: `x-hook-secret`, con lo stesso valore di `NOTIFICATION_WEBHOOK_SECRET`.

Quando viene pubblicato o aggiornato un annuncio disponibile, il trigger SQL inserisce un record nella coda. La funzione seleziona fino a tre proposte compatibili per ogni ricerca attiva e invia la comunicazione al cliente.

**Verifica del salvataggio e degli avvisi ai clienti**

Invia una richiesta dal modulo Contatti e una dal modulo Valutazione: le compilazioni devono essere registrate integralmente rispettivamente in `public.contact_requests` e `public.valuation_requests`, inclusi i campi del modulo, il consenso privacy e lo stato. Le richieste sono consultabili dal backoffice nella sezione Richieste.

Per gli avvisi ai clienti, registra un indirizzo email in `public.property_alerts` con consenso attivo. In **Database → Webhooks** configura un solo webhook:
- tabella: `public.property_notification_queue`;
- evento: `INSERT`;
- URL: `https://TUO_PROJECT_REF.supabase.co/functions/v1/notify-property-alerts`;
- metodo: `POST`, con payload JSON del record;
- header HTTP personalizzato `x-hook-secret`, con lo stesso valore di `NOTIFICATION_WEBHOOK_SECRET`.

Pubblica poi un immobile disponibile compatibile con la ricerca di prova: il trigger inserisce un evento nella coda e la funzione invia al cliente fino a tre proposte pertinenti. Controlla `public.property_notification_queue`, i log della Edge Function e la dashboard Resend. Non vengono inviate notifiche email all'ufficio. Il solo deploy non crea il webhook: deve essere configurato e abilitato in Supabase.

## Contenuti e gestione

Dal percorso `/admin` l'amministratore può gestire gli annunci (creazione, modifica, cancellazione, stato, prezzo, caratteristiche, foto, descrizione formattata e selezione “In evidenza”), le FAQ mostrate in home e le richieste ricevute. Le recensioni sono caricate tramite il widget Elfsight, non da Supabase. Le schede in evidenza appaiono in home; tutti gli immobili pubblicati sono raggiungibili dalla pagina Immobili e dalla ricerca. Le immagini sono caricate da locale sul bucket Supabase e scorrono in un carosello sulla scheda di dettaglio.

Per il primo accesso non esistono credenziali preimpostate: crea un utente Auth e il relativo record in `admin_profiles` come sopra. Le sessioni sono gestite da Supabase Auth e persistono tra gli accessi; il logout invalida la sessione locale.

## Prima della messa online

- Inserire in Impostazioni i recapiti ufficiali: PEC, email, numero mobile/WhatsApp, telefono fisso, pagine social e indirizzo Maps. Il sito attuale pubblica il numero 080 849 1745, l'indirizzo Via Pasubio 78A, Bari e la P.IVA 08451090727; PEC ed email non vengono inventate.
- Sostituire le immagini dimostrative con fotografie autorizzate dell'agenzia e degli immobili.
- Verificare informativa privacy, consenso per i contatti e per gli alert email, cookie/analytics eventualmente aggiunti e tempi di conservazione dei dati con il referente competente.
- Aggiornare `VITE_SITE_URL`, `public/robots.txt` e `public/sitemap.xml` al dominio definitivo. Per SEO avanzata, includere nel sitemap gli URL degli annunci effettivamente pubblicati.
- Configurare hosting SPA con fallback a `index.html`, HTTPS, variabili d'ambiente, dominio del mittente email e un invio di prova.
- Non abilitare RLS policy permissive aggiuntive per aggirare problemi. Correggere lo schema o la policy specifica.

## Funzionalità incluse

- Pagine responsive: Home (incluse FAQ e widget recensioni Elfsight), Immobili, dettaglio dinamico, Chi siamo, Valutazione immobile, Consulenza mutui e prestiti, Pubblica con noi.
- Ricerca immobili per località, operazione, tipologia e budget.
- Schede SEO con titolo, descrizione, canonical, Open Graph e dati strutturati quando disponibili.
- Richiesta di valutazione, contatto e avvisi email basati sulle preferenze di ricerca.
- Backoffice con autenticazione username/password e CRUD protetto da Row Level Security.

## Sistema grafico Material UI

Il tema globale si trova in `src/theme.ts` ed è applicato nell'entry point `src/main.tsx` tramite `ThemeProvider` e `CssBaseline`. La palette mantiene il verde Casadibari e la tipografia Roboto. Componenti Material UI sono utilizzati per pulsanti, card e badge degli immobili, barra di ricerca, controlli di navigazione, carosello, campi login, feedback/alert e azioni del backoffice. Gli stili condivisi e responsive sono in `src/index.css`.
