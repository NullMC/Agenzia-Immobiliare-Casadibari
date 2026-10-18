-- Set the public agency contact email while preserving the other site settings.
insert into public.site_settings (key, value)
values (
  'contact',
  jsonb_build_object('email', 'info@casadibari.it')
)
on conflict (key) do update
set
  value = coalesce(public.site_settings.value, '{}'::jsonb)
          || jsonb_build_object('email', 'info@casadibari.it'),
  updated_at = now();
