import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

/**
 * Supabase's current hosted Edge Functions expose named API-key dictionaries.
 * Older projects may still expose the legacy ANON/SERVICE_ROLE variables.
 */
function readNamedKey(variable: string): string | undefined {
  const value = Deno.env.get(variable);
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const defaultKey = parsed.default;
    if (typeof defaultKey === 'string' && defaultKey.trim()) return defaultKey.trim();

    const firstKey = Object.values(parsed).find(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
    if (firstKey) return firstKey.trim();
  } catch {
    // Ignore non-JSON values; singular variables and legacy names are checked separately.
  }
  return undefined;
}

function readSupabaseKeys() {
  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ||
    readNamedKey('SUPABASE_PUBLISHABLE_KEYS') ||
    Deno.env.get('SUPABASE_ANON_KEY');
  const secretKey =
    Deno.env.get('SUPABASE_SECRET_KEY') ||
    readNamedKey('SUPABASE_SECRET_KEYS') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  return { url, publishableKey, secretKey };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Metodo non consentito.' }, 405);

  const { url: supabaseUrl, publishableKey: anonKey, secretKey: serviceKey } = readSupabaseKeys();
  if (!supabaseUrl || !anonKey || !serviceKey)
    return response({ error: 'Servizio di autenticazione non configurato: verifica le chiavi API disponibili per la Edge Function.' }, 500);

  let payload: { username?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return response({ error: 'Richiesta non valida.' }, 400);
  }
  const username = String(payload.username || '')
    .trim()
    .toLowerCase();
  const password = String(payload.password || '');
  if (!/^[a-z0-9._-]{3,64}$/.test(username) || password.length < 1 || password.length > 256) {
    return response({ error: 'Username o password non validi.' }, 401);
  }

  // The privileged key is used only here to resolve a username to an Auth email.
  // It is never returned to the browser.
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('admin_profiles')
    .select('user_id, email, is_active')
    .eq('username', username)
    .maybeSingle();

  if (profileError || !profile || profile.is_active !== true) {
    return response({ error: 'Username o password non validi.' }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({
    email: profile.email,
    password,
  });
  if (error || !data.session || data.user.id !== profile.user_id) {
    if (data.session) await authClient.auth.signOut();
    return response({ error: 'Username o password non validi.' }, 401);
  }

  return response({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    },
  });
});
