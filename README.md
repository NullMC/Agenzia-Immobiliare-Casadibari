# Casadibari Immobiliare — piattaforma web

Applicazione React + TypeScript + Vite per il sito pubblico e il backoffice di Agenzia Immobiliare Casadibari. La grafica riprende il verde del marchio, il bianco e la comunicazione del sito attuale: “Il tuo Partner di fiducia nel mondo immobiliare”.

## Sviluppo locale

Requisiti: Node.js 20+ e npm.

1. Clona il repository e installa le dipendenze con `npm install`.
2. Copia `.env.example` in `.env.local`.
3. Inserisci URL del progetto Supabase e chiave anon/publishable in `.env.local`.
4. Avvia con `npm run dev`; verifica con `npm run build`.

Senza configurazione Supabase il sito apre una modalità dimostrativa con schede esemplificative. Le schede dimostrative non sono annunci reali e non devono essere utilizzate come disponibilità effettiva. Quando Supabase è configurato, il front-end usa i record pubblicati del database.

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
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` (URL canonico del sito pubblicato)

La chiave anon è destinata al client e resta protetta dalle policy RLS. La service role key è esclusivamente server-side.

## Edge Functions

Installa/aggiorna Supabase CLI e collega il progetto. Distribuisci entrambe le funzioni:

```sh
supabase functions deploy admin-login
supabase functions deploy notify-property-alerts
```

Configura nei Function Secrets del progetto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (per l'invio delle email; dominio mittente verificato su Resend)
- `NOTIFICATION_WEBHOOK_SECRET` (segreto casuale condiviso col webhook)

Per gli avvisi automatici, crea in Supabase Database → Webhooks un webhook sulla tabella `public.property_notification_queue`, evento **INSERT**, destinazione `https://PROJECT_REF.supabase.co/functions/v1/notify-property-alerts`, con header personalizzato `x-hook-secret: VALORE_DI_NOTIFICATION_WEBHOOK_SECRET`. La funzione abbina la nuova disponibilità alle preferenze salvate, prepara fino a tre proposte ancora non inviate per ciascun filtro compatibile e registra gli invii riusciti per evitare duplicazioni. Prima del go-live invia email di prova e controlla i log della funzione.

## Contenuti e gestione

Dal percorso `/admin` l'amministratore può gestire gli annunci (creazione, modifica, cancellazione, stato, prezzo, caratteristiche, foto, descrizione formattata e selezione “In evidenza”), le FAQ e le richieste ricevute. Le schede in evidenza appaiono in home; tutti gli immobili pubblicati sono raggiungibili dalla pagina Immobili e dalla ricerca. Le immagini sono caricate da locale sul bucket Supabase e scorrono in un carosello sulla scheda di dettaglio.

Per il primo accesso non esistono credenziali preimpostate: crea un utente Auth e il relativo record in `admin_profiles` come sopra. Le sessioni sono gestite da Supabase Auth e persistono tra gli accessi; il logout invalida la sessione locale.

## Prima della messa online

- Inserire in Impostazioni i recapiti ufficiali: PEC, email, numero mobile/WhatsApp, telefono fisso, pagine social e indirizzo Maps. Il sito attuale pubblica il numero 080 849 1745, l'indirizzo Via Pasubio 78A, Bari e la P.IVA 08451090727; PEC ed email non vengono inventate.
- Sostituire le immagini dimostrative con fotografie autorizzate dell'agenzia e degli immobili.
- Verificare informativa privacy, consenso per i contatti e per gli alert email, cookie/analytics eventualmente aggiunti e tempi di conservazione dei dati con il referente competente.
- Aggiornare `VITE_SITE_URL`, `public/robots.txt` e `public/sitemap.xml` al dominio definitivo. Per SEO avanzata, includere nel sitemap gli URL degli annunci effettivamente pubblicati.
- Configurare hosting SPA con fallback a `index.html`, HTTPS, variabili d'ambiente, dominio del mittente email e un invio di prova.
- Non abilitare RLS policy permissive aggiuntive per aggirare problemi. Correggere lo schema o la policy specifica.

## Funzionalità incluse

- Pagine responsive: Home, Immobili, dettaglio dinamico, Chi siamo, Valutazione immobile, Consulenza mutui e prestiti, Pubblica con noi, FAQ.
- Ricerca immobili per località, operazione, tipologia e budget.
- Schede SEO con titolo, descrizione, canonical, Open Graph e dati strutturati quando disponibili.
- Richiesta di valutazione, contatto e avvisi email basati sulle preferenze di ricerca.
- Backoffice con autenticazione username/password e CRUD protetto da Row Level Security.
