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

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  source: string;
  approved: boolean;
  sort_order: number;
}

export const demoProperties: Property[] = [
  {
    id: 'demo-1',
    slug: 'appartamento-luminoso-bari',
    title: 'Appartamento luminoso a Bari',
    subtitle: 'Spazi accoglienti in una zona servita',
    description_html: '<p>Questa è una scheda dimostrativa. Collega Supabase e pubblica gli annunci reali dalla dashboard amministrativa.</p>',
    property_type: 'Appartamento',
    transaction_type: 'Vendita',
    status: 'available',
    price: 185000,
    city: 'Bari',
    neighborhood: 'Carrassi',
    address: 'Bari, zona Carrassi',
    area_sqm: 95,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 1,
    floor: '3° piano',
    energy_class: '',
    features: ['Balcone', 'Luminoso', 'Zona servita'],
    featured: true,
    published: true,
    property_images: [{ public_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85', alt_text: 'Interni luminosi di un appartamento' }]
  },
  {
    id: 'demo-2',
    slug: 'casa-con-terrazzo-bari',
    title: 'Casa con terrazzo',
    subtitle: 'Un ambiente esterno da vivere ogni giorno',
    description_html: '<p>Questa è una scheda dimostrativa. Le immagini e i dettagli definitivi vengono gestiti dal backoffice.</p>',
    property_type: 'Appartamento',
    transaction_type: 'Vendita',
    status: 'available',
    price: 248000,
    city: 'Bari',
    neighborhood: 'Poggiofranco',
    address: 'Bari, zona Poggiofranco',
    area_sqm: 110,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    floor: 'Piano medio',
    energy_class: '',
    features: ['Terrazzo', 'Ascensore', 'Riscaldamento autonomo'],
    featured: true,
    published: true,
    property_images: [{ public_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85', alt_text: 'Soggiorno e terrazza' }]
  },
  {
    id: 'demo-3',
    slug: 'locale-commerciale-bari',
    title: 'Locale commerciale',
    subtitle: 'Soluzione versatile per la tua attività',
    description_html: '<p>Questa è una scheda dimostrativa. Non rappresenta un annuncio immobiliare effettivamente disponibile.</p>',
    property_type: 'Locale commerciale',
    transaction_type: 'Affitto',
    status: 'available',
    price: 850,
    city: 'Bari',
    neighborhood: 'Libertà',
    address: 'Bari, zona Libertà',
    area_sqm: 55,
    rooms: 1,
    bedrooms: 0,
    bathrooms: 1,
    floor: 'Piano terra',
    energy_class: '',
    features: ['Vetrina su strada', 'Piano terra'],
    featured: true,
    published: true,
    property_images: [{ public_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85', alt_text: 'Spazio interno commerciale' }]
  }
];

export const demoFaqs: Faq[] = [
  { id: 'faq-1', question: 'Come posso richiedere una valutazione del mio immobile?', answer: 'Compila il modulo di valutazione con indirizzo, tipologia e metratura. Ti ricontatteremo per approfondire le caratteristiche dell’immobile.', published: true, sort_order: 1 },
  { id: 'faq-2', question: 'Come posso visitare un immobile?', answer: 'Apri la scheda dell’immobile e contattaci per concordare un appuntamento.', published: true, sort_order: 2 },
  { id: 'faq-3', question: 'Posso ricevere nuovi annunci via email?', answer: 'Sì. Nella pagina Immobili puoi salvare le tue preferenze e ricevere via email proposte pertinenti quando vengono pubblicate nuove disponibilità.', published: true, sort_order: 3 },
  { id: 'faq-4', question: 'Offrite consulenza per mutui e prestiti?', answer: 'Puoi richiedere un primo contatto per essere indirizzato a referenti e consulenti. Condizioni e approvazione restano in capo agli enti eroganti.', published: true, sort_order: 4 }
];