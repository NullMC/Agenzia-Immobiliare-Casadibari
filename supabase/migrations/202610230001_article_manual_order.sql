-- Ordine manuale degli articoli nel magazine Casadibari.
-- Applicare questa migrazione DOPO 202610210001_articles_and_editorial.sql.
-- L'ordinamento iniziale conserva la logica precedente: pubblicazione piu recente prima.
alter table public.articles
  add column if not exists sort_order integer not null default 2147483647;

-- Normalizza le posizioni esistenti, mantenendo l'ordine attuale
-- ed evitando collisioni tra articoli gia pubblicati e bozze.
with ordered as (
  select
    id,
    row_number() over (
      order by sort_order asc, published_at desc nulls last, created_at desc, id asc
    )::integer as new_order
  from public.articles
)
update public.articles as article
set sort_order = ordered.new_order
from ordered
where article.id = ordered.id
  and article.sort_order is distinct from ordered.new_order;

create index if not exists articles_manual_order_idx
  on public.articles (published, sort_order asc, created_at desc);

-- Sposta un articolo alla posizione selezionata e riordina gli altri in
-- un'unica transazione. Eseguibile solo dagli amministratori attivi.
create or replace function public.move_article_to_position(
  p_article_id uuid,
  p_position integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_articles integer;
  target_position integer;
begin
  if not public.is_admin() then
    raise exception 'Non autorizzato a modificare l''ordine degli articoli.'
      using errcode = '42501';
  end if;

  if p_article_id is null or p_position is null or p_position < 1 then
    raise exception 'Posizione articolo non valida.'
      using errcode = '22023';
  end if;

  -- Serializza gli spostamenti concorrenti da piu sessioni amministrative.
  perform pg_advisory_xact_lock(840261023::bigint);

  if not exists (select 1 from public.articles where id = p_article_id) then
    raise exception 'Articolo non trovato.'
      using errcode = 'P0002';
  end if;

  select count(*) into total_articles from public.articles;
  target_position := least(p_position, total_articles);

  -- La posizione scelta si riferisce alla lista SENZA l'articolo spostato.
  -- In questo modo il risultato e lo stesso per nuove guide e guide gia esistenti.
  with remaining as (
    select
      id,
      row_number() over (
        order by sort_order asc, published_at desc nulls last, created_at desc, id asc
      )::integer as position
    from public.articles
    where id <> p_article_id
  ),
  desired as (
    select
      id,
      case when position >= target_position then position + 1 else position end
        as new_order
    from remaining

    union all

    select p_article_id, target_position
  )
  update public.articles as article
  set sort_order = desired.new_order
  from desired
  where article.id = desired.id
    and article.sort_order is distinct from desired.new_order;
end;
$$;

revoke all on function public.move_article_to_position(uuid, integer)
  from public, anon;
grant execute on function public.move_article_to_position(uuid, integer)
  to authenticated;
