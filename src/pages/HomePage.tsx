import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Home, KeyRound, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { demoProperties, type Property, type Review } from '../types';

const heroSlides = [
  { image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2200&q=90', eyebrow: 'La casa dei tuoi progetti', title: 'Il posto giusto\nper la tua prossima storia.' },
  { image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90', eyebrow: 'Vicini alle tue scelte', title: 'Troviamo insieme\nla casa che ti somiglia.' },
  { image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2200&q=90', eyebrow: 'Esperienza, ascolto, fiducia', title: 'Le scelte importanti\nmeritano una guida.' }
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [properties, setProperties] = useState<Property[]>(isSupabaseConfigured ? [] : demoProperties.filter(p => p.featured));
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide(current => (current + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    Promise.all([
      supabase.from('properties').select('*, property_images(id, public_url, alt_text, sort_order)').eq('published', true).eq('featured', true).order('created_at', { ascending: false }).limit(3),
      supabase.from('reviews').select('*').eq('approved', true).order('sort_order', { ascending: true }).limit(3)
    ]).then(([propertyResult, reviewResult]) => {
      if (!alive) return;
      if (!propertyResult.error) setProperties((propertyResult.data || []) as Property[]);
      if (!reviewResult.error) setReviews((reviewResult.data || []) as Review[]);
    });
    return () => { alive = false; };
  }, []);

  const activeSlide = heroSlides[slide];
  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Casadibari Immobiliare',
    url: (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin,
    telephone: '+39 080 8491745',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via Pasubio, 78A',
      addressLocality: 'Bari',
      postalCode: '70125',
      addressCountry: 'IT'
    }
  };

  return (
    <>
      <Seo title="Casadibari Immobiliare | Case in vendita e affitto a Bari" description="Dal 2001, il tuo partner di fiducia nel mondo immobiliare a Bari. Cerca casa, scopri gli annunci e richiedi una valutazione gratuita del tuo immobile." path="/" jsonLd={businessJsonLd} />
      <section className="hero">
        <div className="hero__visual" style={{ backgroundImage: 'linear-gradient(90deg, rgba(10, 26, 15, .78) 0%, rgba(10, 26, 15, .43) 52%, rgba(10, 26, 15, .12) 100%), url("' + activeSlide.image + '")' }} />
        <div className="container hero__content">
          <div className="hero__text">
            <span className="eyebrow eyebrow--light"><span className="eyebrow__dot" /> {activeSlide.eyebrow}</span>
            <h1>{activeSlide.title.split('\n').map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h1>
            <p>Il tuo Partner di fiducia nel mondo immobiliare. Dal 2001, esperienza e attenzione per accompagnarti a casa.</p>
            <div className="hero__actions"><Link className="button button--primary button--large" to="/immobili">Scopri gli immobili <ArrowRight size={18} /></Link><Link className="hero__secondary-link" to="/valutazione">Valuta la tua casa gratuitamente</Link></div>
          </div>
          <div className="hero__pagination" aria-label="Seleziona immagine principale">
            {heroSlides.map((item, index) => <button type="button" key={item.image} className={index === slide ? 'is-active' : ''} onClick={() => setSlide(index)} aria-label={'Mostra immagine ' + (index + 1)} />)}
          </div>
          <div className="hero__trust"><div><ShieldCheck size={19} /><span>Esperienza dal 2001</span></div><div><BadgeCheck size={19} /><span>Consulenza su misura</span></div></div>
        </div>
      </section>
      <div className="container search-overlap"><SearchBar /></div>

      <section className="section section--featured">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">Una selezione per te</span><h2>Le nostre <span>proposte in evidenza</span></h2><p>Immobili selezionati per aiutarti a trovare lo spazio giusto per i tuoi progetti.</p></div><Link className="button button--outline" to="/immobili">Tutti gli immobili <ArrowRight size={17} /></Link></div>
          {properties.length ? <div className="property-grid">{properties.map(property => <PropertyCard key={property.id} property={property} demo={!isSupabaseConfigured} />)}</div> : <div className="empty-state"><Home size={32} /><h3>Stiamo preparando nuove proposte</h3><p>Contattaci per raccontarci cosa stai cercando: ti aiuteremo a trovare la soluzione adatta.</p><Link className="button button--primary" to="/contatti">Parla con noi</Link></div>}
          {!isSupabaseConfigured && <p className="demo-note">Anteprima grafica: le schede contrassegnate “Esempio” sono contenuti dimostrativi.</p>}
        </div>
      </section>

      <section className="section story-section">
        <div className="container story-grid">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1300&q=85" alt="Ambiente accogliente e luminoso" loading="lazy" /><div className="story-stamp"><strong>Dal 2001</strong><span>al tuo fianco</span></div></div>
          <div className="story-copy"><span className="eyebrow">Piacere, siamo Casadibari</span><h2>Non cerchiamo solo case. <span>Aiutiamo a trovare casa.</span></h2><p>La nostra esperienza nasce dall'ascolto delle persone e dalla conoscenza del territorio. Ogni acquisto, vendita o locazione è una scelta importante: per questo ti accompagniamo con chiarezza, competenza e presenza, passo dopo passo.</p><p>Dal primo incontro alla consegna delle chiavi, lavoriamo per rendere il percorso più semplice e sereno.</p><Link className="text-link" to="/chi-siamo">Scopri la nostra storia <ArrowRight size={16} /></Link><div className="story-metrics"><div><strong>2001</strong><span>La nostra esperienza</span></div><div><strong>Bari</strong><span>Il territorio che conosciamo</span></div><div><strong>1:1</strong><span>Attenzione personale</span></div></div></div>
        </div>
      </section>

      <section className="section service-section">
        <div className="container"><div className="section-heading section-heading--center"><div><span className="eyebrow">Ti accompagniamo in ogni passo</span><h2>Un unico punto di riferimento</h2><p>Un approccio concreto, pensato intorno alle tue esigenze.</p></div></div>
          <div className="service-grid">
            <Link className="service-card" to="/valutazione"><span className="service-card__icon"><Home size={24} /></span><h3>Valuta il tuo immobile</h3><p>Richiedi una prima valutazione e scopri come valorizzare la tua proprietà.</p><span className="text-link">Richiedi una valutazione <ArrowRight size={16} /></span></Link>
            <Link className="service-card" to="/pubblica-con-noi"><span className="service-card__icon"><KeyRound size={24} /></span><h3>Vendi o affitta con noi</h3><p>Costruiamo insieme un percorso adatto al tuo immobile e ai tuoi obiettivi.</p><span className="text-link">Scopri come funziona <ArrowRight size={16} /></span></Link>
            <Link className="service-card" to="/consulenza-mutui"><span className="service-card__icon"><ShieldCheck size={24} /></span><h3>Mutui e prestiti</h3><p>Un primo orientamento per capire a chi rivolgerti e quali passi valutare.</p><span className="text-link">Richiedi informazioni <ArrowRight size={16} /></span></Link>
          </div>
        </div>
      </section>

      <section className="review-section section">
        <div className="container review-section__inner"><div className="review-intro"><span className="eyebrow eyebrow--light">La fiducia, prima di tutto</span><h2>Le relazioni sono il nostro risultato più importante.</h2><p>Il percorso immobiliare si costruisce con ascolto, chiarezza e cura. Ogni esperienza condivisa ci aiuta a fare meglio.</p><Link className="button button--light" to="/chi-siamo#recensioni">Scopri chi siamo <ArrowRight size={16} /></Link></div>
          <div className="review-cards">{reviews.length ? reviews.map(review => <article className="review-card" key={review.id}><div className="review-stars" aria-label={review.rating + ' su 5 stelle'}>{Array.from({ length: review.rating }).map((_, i) => <Star size={15} fill="currentColor" key={i} />)}</div><p>“{review.content}”</p><strong>{review.author_name}</strong>{review.source && <small>{review.source}</small>}</article>) : <article className="review-card review-card--empty"><MessageCircle size={26} /><strong>Il tuo parere conta.</strong><p>Il nostro obiettivo è costruire un rapporto di fiducia in ogni fase del percorso.</p><Link to="/contatti">Scrivici per raccontarci la tua esperienza →</Link></article>}</div>
        </div>
      </section>

      <section className="closing-cta"><div className="container closing-cta__inner"><div><span className="eyebrow">Parliamone insieme</span><h2>Il prossimo passo può cominciare da qui.</h2><p>Raccontaci di cosa hai bisogno: siamo qui per ascoltarti.</p></div><div className="closing-cta__actions"><Link className="button button--primary button--large" to="/contatti">Contattaci <ArrowRight size={18} /></Link><Link className="button button--outline button--large" to="/valutazione">Valuta il tuo immobile</Link></div></div></section>
    </>
  );
}