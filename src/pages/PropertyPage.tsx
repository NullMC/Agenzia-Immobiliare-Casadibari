import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, ChevronLeft, ChevronRight, HeartHandshake, MapPin, Maximize2, Phone } from 'lucide-react';
import Seo from '../components/Seo';
import DOMPurify from 'dompurify';
import { IconButton } from '@mui/material';
import PropertyCard from '../components/PropertyCard';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { demoProperties, type Property } from '../types';

const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function PropertyPage() {
  const { slug } = useParams();
  const [property, setProperty] = useState<Property | null>(isSupabaseConfigured ? null : demoProperties.find(item => item.slug === slug) || null);
  const [related, setRelated] = useState<Property[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
    if (!isSupabaseConfigured) {
      setProperty(demoProperties.find(item => item.slug === slug) || null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    supabase.from('properties').select('*, property_images(id, storage_path, public_url, alt_text, sort_order)').eq('slug', slug || '').eq('published', true).maybeSingle().then(({ data, error }) => {
      if (!alive) return;
      setProperty(!error && data ? data as Property : null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!property || !isSupabaseConfigured) return;
    supabase.from('properties').select('*, property_images(id, public_url, alt_text, sort_order)').eq('published', true).eq('property_type', property.property_type).neq('id', property.id).limit(3).then(({ data }) => setRelated((data || []) as Property[]));
  }, [property]);

  if (loading) return <div className="page-loading">Stiamo caricando i dettagli dell’immobile…</div>;
  if (!property) return <><Seo title="Immobile non trovato | Casadibari" description="L’annuncio richiesto non è disponibile." noIndex /><section className="not-found container"><span className="eyebrow">Annuncio non disponibile</span><h1>Non troviamo questo immobile.</h1><p>Potrebbe essere stato aggiornato o non essere più disponibile.</p><Link className="button button--primary" to="/immobili"><ArrowLeft size={17} /> Torna agli immobili</Link></section></>;

  const images = property.property_images?.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) || [];
  const statusLabel = property.status === 'under_offer' ? 'In trattativa' : property.status === 'sold' ? 'Venduto' : property.status === 'rented' ? 'Locato' : 'Disponibile';
  const nextPhoto = (direction: number) => setPhotoIndex(index => (index + direction + images.length) % images.length);
  const plainDescription = property.subtitle || ('Immobile ' + property.property_type + ' a ' + property.city);
  const schema = { '@context': 'https://schema.org', '@type': 'RealEstateListing', name: property.title, description: plainDescription, url: window.location.href, image: images.map(image => image.public_url), offers: property.price != null ? { '@type': 'Offer', price: property.price, priceCurrency: 'EUR', availability: property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability' } : undefined };

  return (
    <>
      <Seo title={property.title + ' | Casadibari Immobiliare'} description={plainDescription} path={'/immobile/' + property.slug} image={images[0]?.public_url} jsonLd={schema} />
      <div className="container property-detail">
        <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/immobili">Immobili</Link><span>/</span><span>{property.title}</span></div>
        <div className="property-detail__headline"><div><span className="eyebrow">{property.transaction_type} · {property.property_type}</span><h1>{property.title}</h1><p><MapPin size={17} /> {property.address || property.neighborhood || property.city}{property.city ? ', ' + property.city : ''}</p></div><div className="property-detail__price"><span className={'badge ' + (property.status === 'available' ? 'badge--green' : 'badge--light')}>{statusLabel}</span><strong>{property.price != null ? money.format(property.price) : 'Prezzo su richiesta'}</strong></div></div>
        <div className="property-detail__gallery">
          <div className="property-gallery__main"><img src={images[photoIndex]?.public_url || '/Logo%20Agenzia%20Casadibari.webp'} alt={images[photoIndex]?.alt_text || property.title} />{images.length > 1 && <><IconButton className="gallery-arrow gallery-arrow--left" type="button" onClick={() => nextPhoto(-1)} aria-label="Foto precedente"><ChevronLeft size={24} /></IconButton><IconButton className="gallery-arrow gallery-arrow--right" type="button" onClick={() => nextPhoto(1)} aria-label="Foto successiva"><ChevronRight size={24} /></IconButton><div className="gallery-counter">{photoIndex + 1} / {images.length}</div></>}</div>
          {images.length > 1 && <div className="property-gallery__thumbs">{images.map((image, index) => <button type="button" key={image.id || image.public_url} onClick={() => setPhotoIndex(index)} className={index === photoIndex ? 'is-active' : ''} aria-label={'Mostra foto ' + (index + 1)}><img src={image.public_url} alt={image.alt_text || property.title} loading="lazy" /></button>)}</div>}
        </div>
        <div className="property-detail__layout">
          <article className="property-description"><div className="property-facts">
              {property.area_sqm != null && <div><Maximize2 size={20} /><span><strong>{property.area_sqm} m²</strong><small>Superficie</small></span></div>}
              {property.rooms != null && <div><BedDouble size={20} /><span><strong>{property.rooms}</strong><small>Locali</small></span></div>}
              {property.bathrooms != null && <div><Bath size={20} /><span><strong>{property.bathrooms}</strong><small>Bagni</small></span></div>}
              {property.floor && <div><span className="fact-icon">⌂</span><span><strong>{property.floor}</strong><small>Piano</small></span></div>}
            </div>
            <h2>Descrizione dell’immobile</h2>
            <div className="rich-description" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(property.description_html || '<p>Per maggiori dettagli su questo immobile, contatta la nostra agenzia.</p>') }} />
            {property.features?.length > 0 && <><h2>Caratteristiche</h2><div className="feature-list">{property.features.map(feature => <span key={feature}><Check size={16} /> {feature}</span>)}</div></>}
            {property.energy_class && <p className="energy-note">Classe energetica: <strong>{property.energy_class}</strong></p>}
            <div className="property-disclaimer"><HeartHandshake size={20} /><p>Vuoi saperne di più o fissare una visita? Ti accompagniamo con chiarezza in ogni fase.</p></div>
          </article>
          <aside className="property-contact-card"><span className="eyebrow">Ti interessa?</span><h2>Vieni a vedere se è casa tua.</h2><p>Contattaci per ricevere maggiori informazioni o fissare una visita.</p><a className="button button--primary button--full" href="tel:+390808491745"><Phone size={17} /> 080 849 1745</a><Link className="button button--outline button--full" to="/contatti">Invia una richiesta <ArrowRight size={17} /></Link><div className="property-contact-card__note"><Check size={15} /> Consulenza dedicata, senza impegno</div></aside>
        </div>
        {related.length > 0 && <section className="related-properties"><div className="section-heading"><div><span className="eyebrow">Potrebbero interessarti</span><h2>Altre proposte simili</h2></div><Link className="text-link" to="/immobili">Vedi tutti <ArrowRight size={16} /></Link></div><div className="property-grid">{related.map(item => <PropertyCard key={item.id} property={item} />)}</div></section>}
        {!isSupabaseConfigured && <p className="demo-note">Scheda dimostrativa: collega Supabase per mostrare solo annunci reali pubblicati dall’agenzia.</p>}
      </div>
    </>
  );
}