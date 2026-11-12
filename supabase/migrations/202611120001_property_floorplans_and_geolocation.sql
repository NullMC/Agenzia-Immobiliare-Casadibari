-- Planimetrie e coordinate per la mappa degli immobili Casadibari.
-- Nessuna modifica distruttiva agli annunci esistenti.
-- Applicare dopo le migrazioni già presenti.
alter table public.properties
  add column if not exists floor_plan_url text,
  add column if not exists floor_plan_storage_path text,
  add column if not exists map_latitude double precision,
  add column if not exists map_longitude double precision,
  add column if not exists map_geocoded_address text;

-- Impedisce coordinate fuori intervallo; consente immobili non ancora geolocalizzati.
alter table public.properties
  drop constraint if exists properties_map_coordinates_valid;
alter table public.properties
  add constraint properties_map_coordinates_valid
  check (
    (map_latitude is null and map_longitude is null)
    or (
      map_latitude between -90 and 90
      and map_longitude between -180 and 180
      and map_latitude is not null
      and map_longitude is not null
    )
  );

create index if not exists properties_published_map_idx
  on public.properties (published)
  where map_latitude is not null and map_longitude is not null;

comment on column public.properties.floor_plan_url is 'URL pubblico della planimetria (immagine)';
comment on column public.properties.floor_plan_storage_path is 'Percorso del file nel bucket property-images per sostituzione/eliminazione';
comment on column public.properties.map_latitude is 'Latitudine del punto sulla mappa catalogo';
comment on column public.properties.map_longitude is 'Longitudine del punto sulla mappa catalogo';
comment on column public.properties.map_geocoded_address is 'Indirizzo usato durante la geocodifica, per riconoscere aggiornamenti';
