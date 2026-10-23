export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body_html: string;
  cover_image_url: string;
  published: boolean;
  published_at: string | null;
  /** Posizione manuale nel magazine; le posizioni minori vengono mostrate per prime. */
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export type PropertyStatus = 'available' | 'under_offer' | 'sold' | 'rented';

export interface PropertyImage {
  id?: string;
  storage_path?: string;
  public_url: string;
  alt_text?: string;
  sort_order?: number;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description_html: string;
  property_type: string;
  transaction_type: 'Vendita' | 'Affitto';
  status: PropertyStatus;
  price: number | null;
  city: string;
  neighborhood: string;
  address: string;
  area_sqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string;
  energy_class: string;
  features: string[];
  featured: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  property_images?: PropertyImage[];
}

export interface SearchFilters {
  q: string;
  transaction: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
}

export interface ContactSettings {
  businessName?: string;
  vatNumber?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  pec?: string;
  instagram?: string;
  facebook?: string;
  mapsEmbedUrl?: string;
  publicityPlatforms?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  bio: string;
  photo_url: string;
  email: string;
  phone: string;
  active: boolean;
  sort_order: number;
}

export const demoFaqs: Faq[] = [
  {
    id: 'faq-1',
    question: 'Come posso richiedere una valutazione del mio immobile?',
    answer:
      'Compila il modulo di valutazione con indirizzo, tipologia e metratura. Ti ricontatteremo per approfondire le caratteristiche dell’immobile.',
    published: true,
    sort_order: 1,
  },
  {
    id: 'faq-2',
    question: 'Come posso visitare un immobile?',
    answer: 'Apri la scheda dell’immobile e contattaci per concordare un appuntamento.',
    published: true,
    sort_order: 2,
  },
  {
    id: 'faq-3',
    question: 'Posso ricevere nuovi annunci via email?',
    answer:
      'Sì. Nella pagina Immobili puoi salvare le tue preferenze e ricevere via email proposte pertinenti quando vengono pubblicate nuove disponibilità.',
    published: true,
    sort_order: 3,
  },
  {
    id: 'faq-4',
    question: 'Offrite consulenza per mutui e prestiti?',
    answer:
      'Puoi richiedere un primo contatto per essere indirizzato a referenti e consulenti. Condizioni e approvazione restano in capo agli enti eroganti.',
    published: true,
    sort_order: 4,
  },
];
