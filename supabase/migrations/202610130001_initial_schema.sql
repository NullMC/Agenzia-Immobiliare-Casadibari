-- Casadibari Immobiliare: initial schema
-- Run once in Supabase SQL Editor or with Supabase CLI migrations.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username)),
  email text not null,
  full_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles p
    where p.user_id = auth.uid()
      and p.is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description_html text not null default '',
  property_type text not null default 'Appartamento',
  transaction_type text not null default 'Vendita' check (transaction_type in ('Vendita', 'Affitto')),
  status text not null default 'available' check (status in ('available', 'under_offer', 'sold', 'rented')),
  price numeric(12,2),
  city text not null default 'Bari',
  neighborhood text not null default '',
  address text not null default '',
  area_sqm numeric(10,2),
  rooms integer,
  bedrooms integer,
  bathrooms integer,
  floor text not null default '',
  energy_class text not null default '',
  features text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_public_listing_idx
  on public.properties (published, status, featured, created_at desc);
create index if not exists properties_search_idx
  on public.properties (transaction_type, property_type, city, price);
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists property_images_property_idx
  on public.property_images(property_id, sort_order);

create table if not exists public.valuation_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  property_type text not null,
  area_sqm numeric(10,2),
  message text not null default '',
  privacy_consent boolean not null default false,
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null default '',
  message text not null,
  privacy_consent boolean not null default false,
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.property_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  transaction_type text not null default 'Vendita' check (transaction_type in ('Vendita', 'Affitto')),
  property_type text not null default '',
  city text not null default 'Bari',
  min_price numeric(12,2),
  max_price numeric(12,2),
  min_area numeric(10,2),
  max_area numeric(10,2),
  min_rooms integer,
  consent boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);
create index if not exists property_alerts_active_idx on public.property_alerts(active, transaction_type, city);

create table if not exists public.property_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.property_alerts(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (alert_id, property_id)
);

create table if not exists public.property_notification_queue (
  id bigint generated by default as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  processed boolean not null default false,
  error text not null default '',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists property_notification_queue_pending_idx
  on public.property_notification_queue(processed, created_at);

create or replace function public.queue_property_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.published = true and new.status = 'available' then
      insert into public.property_notification_queue(property_id) values (new.id);
    end if;
  elsif tg_op = 'UPDATE' then
    if new.published = true
       and new.status = 'available'
       and (
         old.published is distinct from new.published
         or old.status is distinct from new.status
         or old.title is distinct from new.title
         or old.price is distinct from new.price
         or old.city is distinct from new.city
         or old.property_type is distinct from new.property_type
         or old.transaction_type is distinct from new.transaction_type
         or old.area_sqm is distinct from new.area_sqm
         or old.rooms is distinct from new.rooms
       ) then
      insert into public.property_notification_queue(property_id) values (new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists properties_queue_notification on public.properties;
create trigger properties_queue_notification
  after insert or update on public.properties
  for each row execute function public.queue_property_notification();

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger faqs_set_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null default '',
  bio text not null default '',
  photo_url text not null default '',
  email text not null default '',
  phone text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger team_members_set_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings(key, value) values
  ('contact', jsonb_build_object(
    'businessName', 'Casadibari Immobiliare sas di Casadibari Maurizio & C',
    'vatNumber', '08451090727',
    'address', 'Via Pasubio, 78A, 70125 Bari BA',
    'phone', '080 849 1745',
    'mobile', '',
    'whatsapp', '393338510522',
    'email', 'info@casadibari.it',
    'pec', '',
    'instagram', '',
    'facebook', '',
    'mapsEmbedUrl', 'https://www.google.com/maps?q=Via%20Pasubio%2078A%20Bari&output=embed',
    'publicityPlatforms', ''
  ))
on conflict (key) do nothing;

insert into public.faqs(question, answer, sort_order) values
  ('Come posso richiedere una valutazione del mio immobile?', 'Compila il modulo di valutazione con indirizzo, tipologia, metratura e recapiti. L’agenzia ti ricontatterà per approfondire le caratteristiche dell’immobile.', 1),
  ('Come posso visitare un immobile?', 'Apri la scheda dell’immobile e contattaci telefonicamente o tramite il pulsante di contatto per concordare un appuntamento.', 2),
  ('Posso ricevere nuovi annunci via email?', 'Sì. Nella pagina Immobili puoi registrare le tue preferenze e il tuo indirizzo email per ricevere proposte pertinenti quando vengono pubblicate nuove disponibilità.', 3),
  ('Offrite consulenza per mutui e prestiti?', 'Puoi richiedere un primo contatto per essere indirizzato a consulenti e referenti in materia di mutui e prestiti. Condizioni e approvazione dipendono dagli enti eroganti.', 4)
on conflict do nothing;

alter table public.admin_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.valuation_requests enable row level security;
alter table public.contact_requests enable row level security;
alter table public.property_alerts enable row level security;
alter table public.property_alert_deliveries enable row level security;
alter table public.property_notification_queue enable row level security;
alter table public.faqs enable row level security;
alter table public.team_members enable row level security;
alter table public.site_settings enable row level security;

create policy "Admins can read their own admin profile"
  on public.admin_profiles for select to authenticated
  using (user_id = auth.uid());

create policy "Public can read published properties"
  on public.properties for select to anon, authenticated
  using (published = true);
create policy "Admins can manage properties"
  on public.properties for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read images of published properties"
  on public.property_images for select to anon, authenticated
  using (exists (
    select 1 from public.properties p
    where p.id = property_id and p.published = true
  ));
create policy "Admins can manage property images"
  on public.property_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Visitors can send valuation requests"
  on public.valuation_requests for insert to anon, authenticated
  with check (privacy_consent = true);
create policy "Admins can manage valuation requests"
  on public.valuation_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Visitors can send contact requests"
  on public.contact_requests for insert to anon, authenticated
  with check (privacy_consent = true);
create policy "Admins can manage contact requests"
  on public.contact_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Visitors can subscribe to property alerts"
  on public.property_alerts for insert to anon, authenticated
  with check (consent = true);
create policy "Admins can manage property alerts"
  on public.property_alerts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can read alert delivery log"
  on public.property_alert_deliveries for select to authenticated
  using (public.is_admin());
create policy "Admins can read notification queue"
  on public.property_notification_queue for select to authenticated
  using (public.is_admin());
create policy "Admins can update notification queue"
  on public.property_notification_queue for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read published FAQs"
  on public.faqs for select to anon, authenticated
  using (published = true);
create policy "Admins can manage FAQs"
  on public.faqs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read active team members"
  on public.team_members for select to anon, authenticated
  using (active = true);
create policy "Admins can manage team members"
  on public.team_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated
  using (true);
create policy "Admins can manage site settings"
  on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.properties, public.property_images, public.faqs, public.team_members, public.site_settings to anon, authenticated;
grant insert on public.valuation_requests, public.contact_requests, public.property_alerts to anon, authenticated;
grant select, insert, update, delete on public.properties, public.property_images, public.faqs, public.team_members, public.site_settings, public.valuation_requests, public.contact_requests, public.property_alerts to authenticated;
grant select on public.admin_profiles to authenticated;
grant select, update on public.property_notification_queue to authenticated;
grant select on public.property_alert_deliveries to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 12582912, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Public can view property photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-images');
create policy "Admins can upload property photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and public.is_admin());
create policy "Admins can update property photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and public.is_admin())
  with check (bucket_id = 'property-images' and public.is_admin());
create policy "Admins can delete property photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and public.is_admin());