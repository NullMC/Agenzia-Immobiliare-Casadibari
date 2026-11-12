# Casadibari — Planimetrie, mappa immobili e Street View

## Funzionalità

### Planimetrie
- **Backoffice → Annunci → Nuovo/Modifica:** nell'editor è disponibile un caricamento immagine **Planimetria**, separato dalle normali fotografie. Si può aggiungere, sostituire o rimuovere; vengono accettati JPG, PNG, WEBP e AVIF fino a 12 MB.
- La planimetria è archiviata nel bucket esistente `property-images`; l'URL e il percorso di Storage sono salvati su `public.properties.floor_plan_url` e `floor_plan_storage_path`.
- Nella **pagina del singolo annuncio**, appare dopo la galleria e prima delle informazioni sull'immobile. Facendo clic si apre ingrandita.
- **Smartphone:** planimetria **a sinistra** e specifiche **a destra**, affiancate e separate da una linea.

### Mappa immobili
- Soltanto in **/immobili** (non nella homepage): sezione con mappa Leaflet/OSM, punti geografici con il simbolo originale **Casa.webp**, anteprime in hover con pulsante per aprire il dettaglio.
- Clic sul segnaposto: si passa alla **modalità Street View** nella stessa sezione, con pulsante **Torna alla mappa** e link al singolo annuncio.
- La panoramica Google viene caricata solo dopo il clic di consenso al contenuto esterno; in assenza di configurazione Google Embed viene proposto il collegamento diretto a Google Maps.
- **Street View è una panoramica navigabile a 360°, non il modello 3D garantito del singolo edificio.** La disponibilità e la data delle immagini dipendono da Google.
- Sono mostrati solo annunci pubblicati che hanno coordinate valide. La mappa segue i filtri già scelti dal visitatore.

### Indirizzo
- Nell'editor l'indirizzo è diviso in **Via / piazza** (`properties.address`) e **Numero civico** (`properties.street_number`, es. `78A`, `3/B`). Il sito e la geolocalizzazione li uniscono automaticamente.
- Migrazione: `supabase/migrations/202611120002_property_street_number.sql` (aggiunge la colonna e sposta il civico finale degli indirizzi esistenti). Gli annunci non ancora migrati vengono separati automaticamente quando si aprono in modifica.

### Coordinate
- Il salvataggio di un annuncio con indirizzo e coordinate vuote richiama la Edge Function **geocode-property**. Solo gli amministratori autenticati e abilitati possono richiamarla.
- La funzione cerca l'indirizzo con Photon/OSM e, se Photon non risponde o non trova una corrispondenza, con **Nominatim/OSM** come riserva; salva poi le coordinate. Il punto è accettato solo se **via e comune** coincidono (il comune può essere indicato anche nel campo Zona, es. "Conversano"); se non c'è una corrispondenza affidabile, il backoffice segnala che occorre indicare manualmente latitudine e longitudine.
- **Nota tecnica:** Photon accetta solo `lang=default|de|en|fr`; con `lang=it` risponde HTTP 400 (era la causa dell'errore "Indirizzo non geolocalizzato"). Test della logica: `node supabase/functions/geocode-property/geocoding.test.ts --live`.
- Più annunci con le stesse coordinate (es. unità nello stesso stabile) vengono affiancati sulla mappa, così ciascuno resta selezionabile.
- Nell'editor si possono impostare o correggere le coordinate manualmente. **Controllare sempre il punto** se l'indirizzo non è preciso.
- Il pulsante **Localizza indirizzi mancanti** sotto l'elenco annunci permette di tentare la geocodifica anche per gli immobili pubblicati prima di questa implementazione, in ordine e con pause fra le richieste.

## Attivazione obbligatoria su Supabase Casadibari

**Progetto corretto:** `dfijkanqfhkmzythqlvl` — non utilizzare altri progetti Supabase.

1. Aprire il **SQL Editor** di Supabase e applicare solo la nuova migrazione
   `supabase/migrations/202611120001_property_floorplans_and_geolocation.sql`.
   È compatibile con gli annunci già presenti e non cancella alcun dato.
2. Dalla cartella della codebase eseguire:
   ```powershell
   npx supabase login
   npx supabase functions deploy geocode-property --project-ref dfijkanqfhkmzythqlvl --no-verify-jwt
   ```
   La funzione contiene controlli sul token utente e su `admin_profiles.is_active`; il bypass JWT della piattaforma è necessario alla compatibilità delle chiavi, non rende la funzione pubblicamente utilizzabile.
3. Verificare che il progetto fornisca `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` oppure `SUPABASE_SECRET_KEYS` fra i segreti gestiti dal runtime Supabase.
4. Pubblicare il frontend aggiornato. Nel backoffice controllare un indirizzo reale, salvare l'immobile e verificare la posizione della relativa icona sulla mappa di **/immobili**.
5. Per gli annunci già presenti usare **Localizza indirizzi mancanti**, poi correggere manualmente gli indirizzi eventualmente non trovati.

**Nota:** la migrazione SQL e il deploy Edge Function non sono stati eseguiti dal solo push GitHub. Il progetto Supabase Casadibari deve essere collegato a una sessione autorizzata o aggiornato dal suo amministratore.

## Street View integrato (Google)

È necessaria una **chiave Google Maps Embed API** (Maps Embed API abilitata, Google Cloud con account di fatturazione). Secondo la documentazione Google, le richieste alla **Maps Embed API** sono gratuite, ma la chiave e l'account di fatturazione sono obbligatori.

1. Google Cloud Console → API e servizi → abilita **Maps Embed API**.
2. Crea una chiave e limita **Application restrictions** ai referrer HTTP(S) effettivi del sito (incluso `www` e il dominio di produzione corretto); limita **API restrictions** alla sola **Maps Embed API**.
3. Nel build frontend imposta `VITE_GOOGLE_MAPS_EMBED_KEY=...` (il valore viene inserito nel bundle, quindi **non** inserire secret API server o service role; proteggi la chiave con restrizioni referrer e API).
4. Ricompila e pubblica il frontend.

Se la chiave non è stata impostata, **la mappa OSM continua a funzionare**, ma la panoramica integrata non si attiva; il visitatore può aprire Street View su Google Maps in una scheda esterna.

## Map tiles e geocodifica

- Leaflet 1.9.4 è caricato da CDN con SRI; il livello predefinito usa `https://tile.openstreetmap.org/{z}/{x}/{y}.png` e attribuzione © OpenStreetMap contributors. Rispetta la [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). I server comunitari non garantiscono un servizio commerciale continuo: per traffico crescente configura un provider con SLA usando `VITE_MAP_TILE_URL` e `VITE_MAP_TILE_ATTRIBUTION`.
- Photon (`photon.komoot.io`) e Nominatim (`nominatim.openstreetmap.org`, max 1 richiesta/secondo) sono servizi pubblici a uso ragionevole. L'integrazione limita le richieste agli amministratori durante salvataggi/backfill e ne salva l'esito; per utilizzo estensivo sostituisci il provider con uno autorizzato o un'istanza propria.
- Non sono mai eseguite ricerche automatiche degli indirizzi dai browser pubblici.
- **Privacy e autorizzazioni:** verifica che le planimetrie siano autorizzate alla pubblicazione e che l'immobile possa essere mostrato all'indirizzo preciso. Aggiorna l'informativa privacy e la lista dei servizi terzi per OpenStreetMap, Photon e Google Maps, e gestisci l'eventuale consenso ai contenuti esterni.
