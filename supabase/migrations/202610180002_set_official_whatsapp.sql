-- Set the official WhatsApp contact while preserving other public contact settings.
insert into public.site_settings (key, value)
values (
  'contact',
  jsonb_build_object('whatsapp', '393338510522')
)
on conflict (key) do update
set
  value = coalesce(public.site_settings.value, '{}'::jsonb)
          || jsonb_build_object('whatsapp', '393338510522'),
  updated_at = now();
