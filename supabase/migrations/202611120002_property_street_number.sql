-- Numero civico separato dalla via negli annunci Casadibari.
-- `address` contiene solo la via, `street_number` il civico (es. "78A", "3/B").
-- Non distruttiva: sposta il civico finale degli indirizzi esistenti nella nuova colonna.
alter table public.properties
  add column if not exists street_number text not null default '';

comment on column public.properties.address is 'Via / piazza dell''immobile, senza numero civico';
comment on column public.properties.street_number is 'Numero civico dell''immobile (es. 78A, 3/B)';

-- Backfill: "Via Isonzo 125" -> address "Via Isonzo", street_number "125".
-- Indirizzi senza civico finale (es. "Via 24 Maggio") restano invariati.
update public.properties
set
  street_number = upper(regexp_replace(
    substring(address from '([0-9]+[[:space:]]*[A-Za-z]?([[:space:]]*/[[:space:]]*[A-Za-z0-9]+)?)[[:space:]]*$'),
    '[[:space:]]', '', 'g')),
  address = trim(both ' ,' from regexp_replace(address,
    '[[:space:],]+(n\.?[[:space:]]*)?[0-9]+[[:space:]]*[A-Za-z]?([[:space:]]*/[[:space:]]*[A-Za-z0-9]+)?[[:space:]]*$', ''))
where street_number = ''
  and address ~ '[[:space:],][0-9]+[[:space:]]*[A-Za-z]?([[:space:]]*/[[:space:]]*[A-Za-z0-9]+)?[[:space:]]*$';
