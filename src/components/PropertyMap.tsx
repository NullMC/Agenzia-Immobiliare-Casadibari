import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, MapPin, Navigation, StreetView } from 'lucide-react';
import type { Property } from '../types';
import './property-map.css';

// Leaflet 1.9.4 is loaded with integrity checks from index.html.
// The map remains independent from Google Maps and its API key.
declare global {
  interface Window {
    L?: {
      map: (...args: any[]) => any;
      tileLayer: (...args: any[]) => any;
      marker: (...args: any[]) => any;
      divIcon: (...args: any[]) => any;
      featureGroup: (...args: any[]) => any;
    };
  }
}

const CURRENCY = new Intl.NumberFormat('it-IT', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});
const DEFAULT_CENTER: [number, number] = [41.1171, 16.8719];
const STREET_VIEW_KEY = (import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || '').trim();

function firstPhoto(property: Property) {
  return property.property_images
    ?.slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.public_url;
}

function validCoordinates(property: Property) {
  const lat = property.map_latitude;
  const lon = property.map_longitude;
  return typeof lat === 'number' && typeof lon === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function streetViewUrl(property: Property) {
  return (
    'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' +
    encodeURIComponent(property.map_latitude + ',' + property.map_longitude)
  );
}

function PropertyMapCard({ property }: { property: Property }) {
  const photo = firstPhoto(property);
  return (
    <div className="listing-map-card">
      <div className="listing-map-card__photo">
        <img src={photo || '/casadibari-logo.svg'} alt="" loading="lazy" />
      </div>
      <div className="listing-map-card__copy">
        <span>{property.transaction_type} · {property.property_type}</span>
        <h3>{property.title}</h3>
        <p>{property.neighborhood ? property.neighborhood + ', ' : ''}{property.city}</p>
        <strong>{property.price != null ? CURRENCY.format(property.price) : 'Prezzo su richiesta'}</strong>
        <Link to={'/immobile/' + property.slug}>
          Visualizza l’annuncio <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

export default function PropertyMap({ properties }: { properties: Property[] }) {
  const mappedProperties = useMemo(
    () => properties.filter(validCoordinates),
    [properties],
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [streetViewProperty, setStreetViewProperty] = useState<Property | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (streetViewProperty || !containerRef.current) return;
    const leaflet = window.L;
    if (!leaflet) {
      setMapUnavailable(true);
      return;
    }

    let map: any;
    try {
      map = leaflet.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        tap: true,
      }).setView(DEFAULT_CENTER, 12);

      const tilesUrl =
        import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      leaflet.tileLayer(tilesUrl, {
        maxZoom: 19,
        attribution:
          import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markers: any[] = [];
      for (const property of mappedProperties) {
        const icon = leaflet.divIcon({
          className: 'listing-map-marker-container',
          html: '<span class="listing-map-marker"><img src="/Casa.webp" alt="" /></span>',
          iconSize: [46, 59],
          iconAnchor: [23, 52],
        });
        const marker = leaflet.marker(
          [property.map_latitude!, property.map_longitude!],
          { icon, title: 'Visualizza la zona di ' + property.title, alt: property.title },
        ).addTo(map);
        marker.on('mouseover', () => setHoveredId(property.id));
        marker.on('focus', () => setHoveredId(property.id));
        marker.on('click', () => {
          setHoveredId(null);
          setStreetViewProperty(property);
        });
        markers.push(marker);
      }
      if (markers.length === 1) {
        map.setView(
          [mappedProperties[0].map_latitude!, mappedProperties[0].map_longitude!],
          15,
        );
      } else if (markers.length > 1) {
        map.fitBounds(leaflet.featureGroup(markers).getBounds(), {
          padding: [65, 65],
          maxZoom: 15,
        });
      }
      map.on('click', () => setHoveredId(null));
      setMapUnavailable(false);
    } catch {
      setMapUnavailable(true);
    }
    return () => { if (map) map.remove(); };
  }, [mappedProperties, streetViewProperty]);

  const hovered = mappedProperties.find((property) => property.id === hoveredId);
  const missingCount = properties.length - mappedProperties.length;

  return (
    <section className="listing-map-section" aria-labelledby="listing-map-heading">
      <div className="container">
        <div className="listing-map-section__heading">
          <div>
            <span className="eyebrow"><MapPin size={16} /> Immobili sulla mappa</span>
            <h2 id="listing-map-heading">Esplora le nostre proposte a Bari</h2>
            <p>
              Individua gli annunci nella città, passa sui punti per vedere le anteprime
              e seleziona un immobile per esplorare la strada con Google Street View.
            </p>
          </div>
          <span className="listing-map-section__count">
            {mappedProperties.length} {mappedProperties.length === 1 ? 'immobile localizzato' : 'immobili localizzati'}
          </span>
        </div>

        <div className="listing-map-shell">
          {streetViewProperty ? (
            <div className="listing-streetview">
              <div className="listing-streetview__topbar">
                <button type="button" className="listing-streetview__back" onClick={() => setStreetViewProperty(null)}>
                  <ArrowLeft size={18} /> Torna alla mappa
                </button>
                <div>
                  <strong>{streetViewProperty.title}</strong>
                  <span>{streetViewProperty.address}, {streetViewProperty.city}</span>
                </div>
                <Link to={'/immobile/' + streetViewProperty.slug}>Apri annuncio <ArrowRight size={15} /></Link>
              </div>
              {STREET_VIEW_KEY ? (
                <iframe
                  className="listing-streetview__iframe"
                  src={
                    'https://www.google.com/maps/embed/v1/streetview?key=' +
                    encodeURIComponent(STREET_VIEW_KEY) + '&location=' +
                    encodeURIComponent(streetViewProperty.map_latitude + ',' + streetViewProperty.map_longitude) +
                    '&fov=90&pitch=0'
                  }
                  title={'Google Street View: ' + streetViewProperty.title}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="listing-streetview__fallback">
                  <StreetView size={48} />
                  <h3>Esplora gli esterni con Street View</h3>
                  <p>
                    La visualizzazione panoramica integrata richiede
                    l’attivazione di Google Maps Embed API da parte dell’agenzia.
                    Nel frattempo puoi aprire la zona direttamente in Google Maps.
                  </p>
                  <a href={streetViewUrl(streetViewProperty)} target="_blank" rel="noopener noreferrer">
                    Apri Street View in Google Maps <ExternalLink size={17} />
                  </a>
                </div>
              )}
              {STREET_VIEW_KEY && (
                <a className="listing-streetview__external" href={streetViewUrl(streetViewProperty)} target="_blank" rel="noopener noreferrer">
                  Apri in Google Maps <ExternalLink size={15} />
                </a>
              )}
            </div>
          ) : (
            <div className="listing-map-interactive">
              <div className="listing-map-canvas" ref={containerRef} aria-label="Mappa interattiva delle proprietà" />
              {mapUnavailable && (
                <div className="listing-map-empty" role="status">
                  <Navigation size={24} />
                  <p>La mappa non è momentaneamente disponibile. Consulta gli annunci nella griglia.</p>
                </div>
              )}
              {!mapUnavailable && mappedProperties.length === 0 && (
                <div className="listing-map-empty" role="status">
                  <MapPin size={24} />
                  <p>Non ci sono immobili geolocalizzati per questa ricerca.</p>
                </div>
              )}
              {hovered && (
                <div className="listing-map-overlay" onMouseEnter={() => setHoveredId(hovered.id)}>
                  <button type="button" className="listing-map-overlay__close" aria-label="Chiudi anteprima" onClick={() => setHoveredId(null)}>
                    ×
                  </button>
                  <PropertyMapCard property={hovered} />
                  <button
                    type="button"
                    className="listing-map-overlay__street"
                    onClick={() => { setStreetViewProperty(hovered); setHoveredId(null); }}
                  >
                    <StreetView size={16} /> Esplora la strada
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="listing-map-section__foot">
          <span>
            {missingCount > 0
              ? missingCount + ' annunci senza coordinate non compaiono sulla mappa.'
              : 'Posizioni indicative; verifica i dettagli con l’agenzia.'}
          </span>
          <span>Street View mostra immagini panoramiche della zona, non un modello 3D dell’immobile; la disponibilità dipende da Google.</span>
        </div>
      </div>
    </section>
  );
}
