// Run with: node supabase/functions/geocode-property/geocoding.test.ts
// Offline checks of the matching rules, then optional live checks (--live).
import assert from 'node:assert/strict';
import { cleanStreet, composeAddress, geocodeListing, pickBest, type Candidate } from './geocoding.ts';

const base: Candidate = {
  latitude: 41.12,
  longitude: 16.87,
  street: 'Via Isonzo',
  housenumber: '',
  city: 'Bari',
  area: 'Carrassi',
  county: 'Bari',
  countryCode: 'IT',
};

assert.equal(cleanStreet('Via F. P. Troccoli 18'), 'f p troccoli');
assert.equal(cleanStreet('Viale Enrico Dalfino'), 'enrico dalfino');
assert.equal(
  composeAddress({ address: ' Via Isonzo 125 ', neighborhood: 'Carrassi', city: 'Bari' }),
  'Via Isonzo 125, Carrassi, Bari, Italia',
);

// Street + city match is accepted.
assert.ok(pickBest([base], { address: 'Via Isonzo 125', neighborhood: 'Carrassi', city: 'Bari' }));
// Partial typed name matches the full OSM name.
assert.ok(
  pickBest([{ ...base, street: 'Via Francesco Paolo Troccoli', area: 'San Paolo' }], {
    address: 'Via Troccoli 18',
    neighborhood: 'San Paolo',
    city: 'Bari',
  }),
);
// Town stored in the neighbourhood field (Conversano) is accepted.
assert.ok(
  pickBest([{ ...base, street: 'Via Modigliani', city: 'Conversano', area: '' }], {
    address: 'Via Modigliani 25',
    neighborhood: 'Conversano',
    city: 'Bari',
  }),
);
// Same street in another town of the province (county = Bari) is rejected.
assert.equal(
  pickBest([{ ...base, street: 'Via Roma', city: 'Monopoli', area: '' }], {
    address: 'Via Roma 1',
    neighborhood: 'Poggiofranco',
    city: 'Bari',
  }),
  null,
);
// City alone (wrong street) is rejected.
assert.equal(pickBest([{ ...base, street: 'Via Picone' }], { address: 'Via Isonzo 1', city: 'Bari' }), null);
// Exact house number wins over the bare street.
const best = pickBest(
  [
    { ...base, latitude: 41.1 },
    { ...base, latitude: 41.2, housenumber: '125' },
  ],
  { address: 'Via Isonzo 125', city: 'Bari' },
);
assert.equal(best?.latitude, 41.2);
assert.equal(best?.exactNumber, true);
console.log('offline matching tests: OK');

if (process.argv.includes('--live')) {
  const samples = [
    { address: 'Via Troccoli 18', neighborhood: 'San Paolo', city: 'Bari' },
    { address: 'Via Modigliani 25', neighborhood: 'Conversano', city: 'Bari' },
    { address: 'Via Dalfino', neighborhood: 'San Paolo', city: 'Bari' },
    { address: 'Via Devitofrancesco 2', neighborhood: 'Picone', city: 'Bari' },
    { address: 'Via Isonzo 125', neighborhood: 'Carrassi', city: 'Bari' },
    { address: 'Via Giovene 17', neighborhood: 'Picone', city: 'Bari' },
    { address: 'Via Podgora 128', neighborhood: 'Carrassi', city: 'Bari' },
    { address: 'Via Sabotino 142', neighborhood: 'Carrassi', city: 'Bari' },
  ];
  for (const listing of samples) {
    const outcome = await geocodeListing(listing);
    console.log(composeAddress(listing), '->', JSON.stringify(outcome));
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
}
