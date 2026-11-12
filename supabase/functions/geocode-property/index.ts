import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { composeAddress, geocodeListing } from './geocoding.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });

function serviceKey(): string | undefined {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!keys) return undefined;
  try {
    const parsed = JSON.parse(keys) as Record<string, string>;
    return parsed.default || Object.values(parsed)[0];
  } catch {
    return undefined;
  }
}

// This endpoint geocodes only listings owned by an authenticated agency admin.
// It does not expose an unrestricted public geocoding proxy.
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS')
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const key = serviceKey();
  if (!supabaseUrl || !key) return json({ error: 'Configurazione server mancante' }, 500);
  const bearer = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return json({ error: 'Autenticazione richiesta' }, 401);

  const db = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await db.auth.getUser(bearer);
  if (authError || !auth.user) return json({ error: 'Sessione non valida' }, 401);
  const { data: profile, error: profileError } = await db
    .from('admin_profiles')
    .select('is_active')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (profileError || !profile?.is_active) return json({ error: 'Accesso riservato all’amministratore' }, 403);

  let propertyId: unknown;
  try {
    ({ property_id: propertyId } = await request.json());
  } catch {
    return json({ error: 'Payload non valido' }, 400);
  }
  if (typeof propertyId !== 'string' || !/^[a-f0-9-]{36}$/i.test(propertyId))
    return json({ error: 'ID immobile non valido' }, 400);

  const { data: property, error: propertyError } = await db
    .from('properties')
    // '*' keeps working before and after the street_number migration.
    .select('*')
    .eq('id', propertyId)
    .maybeSingle();
  if (propertyError || !property) return json({ error: 'Immobile non trovato' }, 404);
  if (!property.address?.trim()) {
    return json({ error: 'Inserisci l’indirizzo completo per localizzare l’immobile' }, 422);
  }

  const listing = {
    // Street and house number are stored in separate columns.
    address: [property.address?.trim(), property.street_number?.trim()].filter(Boolean).join(' '),
    neighborhood: property.neighborhood,
    city: property.city?.trim() || 'Bari',
  };
  const address = composeAddress(listing);

  // Reuse cached coordinates when the address has not changed.
  if (
    property.map_geocoded_address === address &&
    property.map_latitude != null &&
    property.map_longitude != null
  ) {
    return json({
      latitude: property.map_latitude,
      longitude: property.map_longitude,
      cached: true,
      address,
    });
  }

  // OpenStreetMap geocoders (Photon, then Nominatim) are called only during an
  // admin save/backfill and the result is cached in DB, never on public page views.
  try {
    const outcome = await geocodeListing(listing);
    if (!outcome.ok) {
      console.warn('geocode-property: no match for', address, '-', outcome.message);
      return json({ error: outcome.message }, outcome.unavailable ? 503 : 422);
    }
    const { latitude, longitude, exactNumber } = outcome.match;
    const { error: saveError } = await db
      .from('properties')
      .update({
        map_latitude: latitude,
        map_longitude: longitude,
        map_geocoded_address: address,
      })
      .eq('id', property.id);
    if (saveError) throw saveError;
    return json({
      latitude,
      longitude,
      address,
      provider: outcome.provider,
      note: exactNumber
        ? 'Verifica il punto sulla mappa.'
        : 'Numero civico non trovato: il punto indica la via. Verificalo sulla mappa e correggi le coordinate se necessario.',
    });
  } catch (error) {
    console.error('geocode-property failed:', error);
    const message = (error as { message?: unknown } | null)?.message;
    return json({
      error: typeof message === 'string' ? 'Geolocalizzazione fallita: ' + message : 'Geolocalizzazione fallita',
    }, 500);
  }
});
