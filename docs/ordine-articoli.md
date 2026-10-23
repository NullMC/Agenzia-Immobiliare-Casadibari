# Ordine manuale degli articoli – Casadibari

## Funzionalità

Nel backoffice, aprire **Admin → Articoli → Modifica articolo** oppure **Nuovo articolo**. Nella scheda di stesura è disponibile il campo **Ordine di visualizzazione**, con le opzioni:

- **In prima posizione**;
- **Dopo: [titolo]**, per inserirlo tra due guide già presenti;
- **In ultima posizione** (valore predefinito per i nuovi articoli).

Dopo **Salva articolo** o **Aggiorna articolo**, tutte le posizioni vengono risistemate automaticamente. Nel riquadro **Articoli nell'ordine del sito** l'amministratore può controllare la nuova sequenza.

L'ordine viene applicato a:
1. La griglia **Guide e consigli** (`/guide`) e i suoi filtri per categoria.
2. L'anteprima dei **primi tre articoli pubblicati** secondo l'ordine scelto nella homepage.
3. I link agli articoli correlati nelle pagine delle guide.

Le **bozze** partecipano all'ordinamento amministrativo ma non sono visibili pubblicamente. Per esempio, se le prime due voci sono una bozza e una guida pubblicata, la prima card pubblica sarà la guida in seconda posizione dell'elenco completo.

## Attivazione su Supabase

Applicare la migrazione `supabase/migrations/202610230001_article_manual_order.sql` al database Supabase **dopo** `202610210001_articles_and_editorial.sql`, tramite SQL Editor o Supabase CLI dopo aver verificato lo stato delle altre migrazioni (`npx supabase db push`).

La migrazione:

- aggiunge la colonna `articles.sort_order` e l'indice per le liste pubbliche;
- assegna numeri progressivi agli articoli già presenti, mantenendo inizialmente la precedente disposizione dal più recente;
- crea la funzione `public.move_article_to_position(uuid, integer)`, riservata agli amministratori abilitati tramite `public.is_admin()`, che ricalcola l'ordine in un'unica transazione.

**Non serve ricreare né perdere gli articoli esistenti.** In assenza della nuova migrazione, il sito pubblico può ancora mostrare le guide nell'ordine precedente, ma il backoffice segnala che la modifica dell'ordine non è disponibile.

La migrazione modifica solo lo schema e l'ordinamento degli articoli: non influisce su proprietà immobiliari, utenti e richieste.
