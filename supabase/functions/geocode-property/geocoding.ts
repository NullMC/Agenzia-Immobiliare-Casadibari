// Provider-independent geocoding for Casadibari listings.
// Pure TypeScript (no Deno/Node APIs besides fetch) so it can be unit-tested locally:
//   node supabase/functions/geocode-property/geocoding.test.ts

export type Candidate = {
  latitude: number;
  longitude: number;
  street: string;
  housenumber: string;
  city: string;
  area: string;
  county: string;
  countryCode: string;
};

export type ListingAddress = {
  address: string;
  city: string;
  neighborhood?: string | null;
};

export type Match = { latitude: number; longitude: number; score: number; exactNumber: boolean };

export type ProviderResult =
  | { ok: true; provider: string; candidates: Candidate[] }
  | { ok: false; provider: string; message: string };

const USER_AGENT = 'CasadibariImmobiliare/1.1 (+https://casadibari.com; info@casadibari.it)';
// Bias results towards Bari.
const BIAS = { lat: '41.1171', lon: '16.8719' };

export function normalize(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLocaleLowerCase('it-IT');
}

/** "Via F. P. Troccoli 18" -> "f p troccoli"; keeps only the street name words. */
export function cleanStreet(value: string | null | undefined): string {
  return normalize(value)
    .replace(/\b(via|viale|corso|piazza|piazzale|largo|strada|vico|vicolo|contrada|traversa|lungomare|numero|civico|n)\b\.?/g, ' ')
    .replace(/[0-9].*$/, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function houseNumber(value: string): string {
  return normalize(value).match(/\b(\d+)/)?.[1] || '';
}

/** Same composition as the admin editor, used as cache key in map_geocoded_address. */
export function composeAddress(listing: ListingAddress): string {
  return [listing.address.trim(), listing.neighborhood?.trim(), listing.city.trim() || 'Bari', 'Italia']
    .filter(Boolean)
    .join(', ');
}

function streetMatches(wanted: string, found: string): boolean {
  if (!wanted || !found) return false;
  if (found.includes(wanted) || wanted.includes(found)) return true;
  // "Troccoli" vs "Francesco Paolo Troccoli": every significant typed word must appear.
  const words = wanted.split(' ').filter((word) => word.length > 2);
  const foundWords = new Set(found.split(' '));
  return words.length > 0 && words.every((word) => foundWords.has(word));
}

/**
 * Pick the best candidate. A pin is accepted only when the street name matches
 * AND the municipality matches the listing city (or the neighbourhood when the
 * editor stored a town such as "Conversano" there). Matching on the province
 * alone is rejected: "Via Roma, Bari" must never land on Via Roma in Monopoli.
 */
export function pickBest(candidates: Candidate[], listing: ListingAddress): Match | null {
  const city = normalize(listing.city || 'Bari');
  const neighborhood = normalize(listing.neighborhood);
  const street = cleanStreet(listing.address.split(',')[0]);
  const number = houseNumber(listing.address.split(',')[0]);

  const scored = candidates
    .filter(
      (c) =>
        Number.isFinite(c.latitude) &&
        Number.isFinite(c.longitude) &&
        c.latitude >= 35 && c.latitude <= 48 &&
        c.longitude >= 6 && c.longitude <= 19,
    )
    .map((c) => {
      const candidateCity = normalize(c.city);
      const area = normalize(c.area);
      const townMatch =
        candidateCity === city ||
        (Boolean(neighborhood) && candidateCity === neighborhood);
      const exactNumber = Boolean(number) && houseNumber(c.housenumber) === number;
      const score =
        (streetMatches(street, cleanStreet(c.street)) ? 4 : 0) +
        (townMatch ? 4 : 0) +
        (neighborhood && area.includes(neighborhood) ? 1 : 0) +
        (exactNumber ? 1 : 0) +
        (normalize(c.countryCode) === 'it' ? 1 : 0);
      return { latitude: c.latitude, longitude: c.longitude, score, exactNumber, ok: score >= 8 };
    })
    .filter((item) => item.ok)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  return best
    ? { latitude: best.latitude, longitude: best.longitude, score: best.score, exactNumber: best.exactNumber }
    : null;
}

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: Record<string, string | undefined>;
};

function describeFailure(provider: string, error: unknown, status?: number): ProviderResult {
  if (status === 429) return { ok: false, provider, message: provider + ': troppe richieste (HTTP 429)' };
  if (status) return { ok: false, provider, message: provider + ' HTTP ' + status };
  if (error instanceof Error && error.name === 'TimeoutError')
    return { ok: false, provider, message: provider + ': nessuna risposta entro il tempo limite' };
  return { ok: false, provider, message: provider + ': ' + (error instanceof Error ? error.message : 'errore di rete') };
}

/** Photon (OSM). Note: Photon accepts only lang=default|de|en|fr; "it" returns HTTP 400. */
export async function searchPhoton(query: string, timeoutMs = 10000): Promise<ProviderResult> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lat', BIAS.lat);
  url.searchParams.set('lon', BIAS.lon);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      console.warn('Photon HTTP', response.status, (await response.text()).slice(0, 300));
      return describeFailure('Photon', null, response.status);
    }
    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const candidates = (payload.features || []).map((feature): Candidate => {
      const p = feature.properties || {};
      return {
        longitude: Number(feature.geometry?.coordinates?.[0]),
        latitude: Number(feature.geometry?.coordinates?.[1]),
        // Street features carry their name in "name"; house/POI features in "street".
        street: p.type === 'street' ? p.name || p.street || '' : p.street || p.name || '',
        housenumber: p.housenumber || '',
        city: p.city || '',
        area: [p.district, p.locality].filter(Boolean).join(' '),
        county: p.county || '',
        countryCode: p.countrycode || '',
      };
    });
    return { ok: true, provider: 'Photon / OpenStreetMap', candidates };
  } catch (error) {
    console.warn('Photon request failed:', error);
    return describeFailure('Photon', error);
  }
}

/** Nominatim (OSM) fallback. Usage policy: max 1 req/s, identifying User-Agent. */
export async function searchNominatim(listing: ListingAddress, timeoutMs = 10000): Promise<ProviderResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'it');
  url.searchParams.set('accept-language', 'it');
  url.searchParams.set('q', composeAddress(listing));
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      console.warn('Nominatim HTTP', response.status);
      return describeFailure('Nominatim', null, response.status);
    }
    const rows = (await response.json()) as Array<{
      lat: string;
      lon: string;
      name?: string;
      address?: Record<string, string | undefined>;
    }>;
    const candidates = rows.map((row): Candidate => {
      const a = row.address || {};
      return {
        latitude: Number(row.lat),
        longitude: Number(row.lon),
        street: a.road || a.pedestrian || a.square || row.name || '',
        housenumber: a.house_number || '',
        city: a.city || a.town || a.village || a.municipality || '',
        area: [a.suburb, a.quarter, a.city_district, a.neighbourhood].filter(Boolean).join(' '),
        county: a.county || '',
        countryCode: a.country_code || '',
      };
    });
    return { ok: true, provider: 'Nominatim / OpenStreetMap', candidates };
  } catch (error) {
    console.warn('Nominatim request failed:', error);
    return describeFailure('Nominatim', error);
  }
}

export type GeocodeOutcome =
  | { ok: true; match: Match; provider: string }
  | { ok: false; unavailable: boolean; message: string };

/** Photon first, Nominatim when Photon is down or finds no reliable match. */
export async function geocodeListing(listing: ListingAddress): Promise<GeocodeOutcome> {
  const failures: string[] = [];
  const photon = await searchPhoton(composeAddress(listing));
  if (photon.ok) {
    const match = pickBest(photon.candidates, listing);
    if (match) return { ok: true, match, provider: photon.provider };
  } else failures.push(photon.message);

  const nominatim = await searchNominatim(listing);
  if (nominatim.ok) {
    const match = pickBest(nominatim.candidates, listing);
    if (match) return { ok: true, match, provider: nominatim.provider };
  } else failures.push(nominatim.message);

  // Both providers unreachable: a service problem, not a bad address.
  if (failures.length === 2) {
    return {
      ok: false,
      unavailable: true,
      message: 'Servizi di geolocalizzazione non disponibili (' + failures.join('; ') + '). Riprova più tardi o inserisci le coordinate manualmente.',
    };
  }
  return {
    ok: false,
    unavailable: false,
    message: 'Indirizzo non localizzato con sufficiente precisione (via e comune devono corrispondere). Controlla via, civico e città oppure imposta le coordinate manualmente nel backoffice.',
  };
}
