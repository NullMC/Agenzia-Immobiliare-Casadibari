import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Feature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

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

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('it-IT');
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
    .select('id,address,city,neighborhood,map_latitude,map_longitude,map_geocoded_address')
    .eq('id', propertyId)
    .maybeSingle();
  if (propertyError || !property) return json({ error: 'Immobile non trovato' }, 404);
  if (!property.address?.trim()) {
    return json({ error: 'Inserisci l’indirizzo completo per localizzare l’immobile' }, 422);
  }

  const address = [
    property.address.trim(),
    property.neighborhood?.trim(),
    property.city?.trim() || 'Bari',
    'Italia',
  ].filter(Boolean).join(', ');

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

  // Photon is an open-source OSM-based geocoder. Use only during an admin save,
  // cache results in DB, never call it on every public page view.
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', address);
  url.searchParams.set('limit', '5');
  url.searchParams.set('lang', 'it');
  url.searchParams.set('lat', '41.1171');
  url.searchParams.set('lon', '16.8719');

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CasadibariImmobiliare/1.0 (+https://casadibari.com; info@casadibari.it)',
      },
      signal: AbortSignal.timeout(8500),
    });
    if (!response.ok) return json({ error: 'Servizio di geolocalizzazione non disponibile' }, 503);
    const payload = await response.json() as { features?: Feature[] };
    const candidates = payload.features || [];
    const city = normalize(property.city || 'Bari');
    const street = normalize(property.address || '').replace(/\b(via|viale|corso|piazza|largo|strada|numero|civico)\b/g, '').trim();
    const scored = candidates
      .map((feature) => {
        const coordinates = feature.geometry?.coordinates;
        const longitude = Number(coordinates?.[0]);
        const latitude = Number(coordinates?.[1]);
        const props = feature.properties || {};
        const location = normalize([props.city, props.county].filter(Boolean).join(' '));
        const line = normalize([props.street, props.name].filter(Boolean).join(' '));
        const country = normalize(props.country || '');
        const score =
          (location.includes(city) ? 4 : 0) +
          (street && line && (line.includes(street) || street.includes(line)) ? 3 : 0) +
          (country.includes('ital') ? 1 : 0);
        return { latitude, longitude, score };
      })
      .filter((item) =>
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude) &&
        item.latitude >= 35 &&
        item.latitude <= 48 &&
        item.longitude >= 6 &&
        item.longitude <= 19
      )
      .sort((a, b) => b.score - a.score);
    const first = scored[0];
    if (!first || first.score < 4) {
      return json({
        error: 'Indirizzo non localizzato con sufficiente precisione. Imposta le coordinate manualmente nel backoffice.',
      }, 422);
    }
    const { error: saveError } = await db
      .from('properties')
      .update({
        map_latitude: first.latitude,
        map_longitude: first.longitude,
        map_geocoded_address: address,
      })
      .eq('id', property.id);
    if (saveError) throw saveError;
    return json({
      latitude: first.latitude,
      longitude: first.longitude,
      address,
      provider: 'Photon / OpenStreetMap',
      note: 'Verifica il punto sulla mappa, soprattutto per indirizzi senza numero civico.',
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? 'Geolocalizzazione fallita: ' + error.message : 'Geolocalizzazione fallita',
    }, 503);
  }
});
