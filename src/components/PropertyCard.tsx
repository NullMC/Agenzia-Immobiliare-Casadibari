import { BedDouble, Bath, Maximize2, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Property } from '../types';

const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function PropertyCard({ property, demo = false }: { property: Property; demo?: boolean }) {
  const photo = property.property_images?.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  const status = property.status === 'under_offer' ? 'In trattativa' : property.status === 'sold' ? 'Venduto' : property.status === 'rented' ? 'Locato' : null;
  return (
    <article className="property-card">
      <Link className="property-card__image-link" to={'/immobile/' + property.slug} aria-label={'Apri: ' + property.title}>
        <img className="property-card__image" src={photo?.public_url || '/casadibari-logo.svg'} alt={photo?.alt_text || property.title} loading="lazy" />
        <div className="property-card__badges">
          {property.featured && <span className="badge badge--green">In evidenza</span>}
          {status && <span className="badge badge--light">{status}</span>}
          {demo && <span className="badge badge--demo">Esempio</span>}
        </div>
        <span className="property-card__open"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="property-card__body">
        <div className="property-card__eyebrow">{property.transaction_type} · {property.property_type}</div>
        <h3><Link to={'/immobile/' + property.slug}>{property.title}</Link></h3>
        <p className="property-card__location"><MapPin size={15} /> {property.neighborhood ? property.neighborhood + ', ' : ''}{property.city}</p>
        {property.subtitle && <p className="property-card__subtitle">{property.subtitle}</p>}
        <div className="property-card__facts">
          {property.area_sqm != null && <span><Maximize2 size={15} /> {property.area_sqm} m²</span>}
          {property.rooms != null && <span><BedDouble size={15} /> {property.rooms} locali</span>}
          {property.bathrooms != null && property.bathrooms > 0 && <span><Bath size={15} /> {property.bathrooms} bagni</span>}
        </div>
        <div className="property-card__bottom">
          <strong>{property.price != null ? money.format(property.price) : 'Prezzo su richiesta'}</strong>
          <Link className="text-link" to={'/immobile/' + property.slug}>Scopri di più <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}