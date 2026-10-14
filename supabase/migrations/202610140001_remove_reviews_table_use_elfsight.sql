-- Reviews are embedded from Elfsight and must not be stored in Supabase.
-- Also clean up the table on projects that applied an earlier version of the schema.
drop table if exists public.reviews cascade;
