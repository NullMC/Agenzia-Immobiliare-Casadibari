import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://dfijkanqfhkmzythqlvl.supabase.co';
const defaultSupabasePublishableKey =
  'sb_publishable_mux_w8y7J1vIbl3nUkjj7w_Q3AC0-OW';

const envSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseUrl =
  envSupabaseUrl.startsWith('https://') && envSupabaseUrl.includes('.supabase.co')
    ? envSupabaseUrl
    : defaultSupabaseUrl;

const envSupabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim();
const supabaseAnonKey =
  envSupabaseKey.length > 20 && !envSupabaseKey.includes('YOUR_')
    ? envSupabaseKey
    : defaultSupabasePublishableKey;

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('YOUR_');

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'casadibari-auth',
    },
  },
);

export function publicSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  return (configured || window.location.origin).replace(/\/$/, '');
}
