import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { ArrowRight, Home, KeyRound, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import ElfsightReviews from '../components/ElfsightReviews';
import { ValuationSection } from './StaticPages';
import { MagazinePreview } from './BlogPages';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { demoFaqs, type Faq, type Property } from '../types';

const heroSlides = [
  {
    image:
      '/Poggiofranco.webp',
    title: 'Il posto giusto\nper la tua prossima storia.',
  },
  {
    image:
      '/chiesarussa.webp',
    title: 'Troviamo insieme\nla casa che ti somiglia.',
  },
  {
    image:
      'Lungomare.webp',
    title: 'Le scelte importanti\nmeritano una guida.',
  },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>(demoFaqs);

  useEffect(() => {
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % heroSlides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    Promise.all([
      supabase
        .from('properties')
        .select('*, property_images(id, public_url, alt_text, sort_order)')
        .eq('published', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('faqs')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .limit(4),
    ]).then(([propertyResult, faqResult]) => {
      if (!alive) return;
      if (!propertyResult.error) setProperties((propertyResult.data || []) as Property[]);
      if (!faqResult.error && faqResult.data?.length) setFaqs(faqResult.data as Faq[]);
    });
    return () => {
      alive = false;
    };
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
      addressCountry: 'IT',
    },
  };

  return (
    <>
      <Seo
        title="Casadibari Immobiliare | Case in vendita e affitto a Bari"
        description="Dal 2001, il tuo partner di fiducia nel mondo immobiliare a Bari. Cerca casa, scopri gli annunci e richiedi una valutazione gratuita del tuo immobile."
        path="/"
        jsonLd={businessJsonLd}
      />
      <section className="hero">
        {heroSlides.map((item, index) => (
          <div
            key={item.image}
            className={'hero__visual' + (index === slide ? ' is-active' : '')}
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(10, 26, 15, .78) 0%, rgba(10, 26, 15, .43) 52%, rgba(10, 26, 15, .12) 100%), url("' +
                item.image +
                '")',
            }}
          />
        ))}
        <div className="container hero__content">
          <div className="hero__text">
            <h1>
              {activeSlide.title.split('\n').map((line, index) => (
                <span key={line}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </h1>
            <p>Dal 2001 al fianco di chi cerca, vende o valorizza casa a Bari. Un confronto concreto, una scelta più consapevole.</p>
            <div className="hero__actions">
              <Button
                component={Link}
                to="/valutazione"
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={18} />}
              >
                Valuta la tua casa gratuitamente
              </Button>
              <Button
                component={Link}
                to="/immobili"
                variant="outlined"
                color="primary"
                size="large"
                className="hero__secondary-cta"
              >
                Scopri gli immobili
              </Button>
            </div>
          </div>
          <div className="hero__brand-panel" aria-hidden="true">
            <img src="/Casa.webp" alt="" className="hero__brand-image" />
          </div>
          <div className="hero__pagination" aria-label="Seleziona immagine principale">
            {heroSlides.map((item, index) => (
              <button
                type="button"
                key={item.image}
                className={index === slide ? 'is-active' : ''}
                onClick={() => setSlide(index)}
                aria-label={'Mostra immagine ' + (index + 1)}
              />
            ))}
          </div>
        </div>
      </section>
      <div className="container search-overlap">
        <SearchBar />
      </div>

      <section className="section section--featured">
        <div className="container">
          <div className="section-heading">
            <div>
              <h2>
                Le nostre <span>proposte in evidenza</span>
              </h2>
            </div>
            <Button
              component={Link}
              to="/immobili"
              variant="outlined"
              color="primary"
              endIcon={<ArrowRight size={17} />}
            >
              Tutti gli immobili
            </Button>
          </div>
          {properties.length ? (
            <div className="property-grid">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Home size={32} />
              <h3>Stiamo preparando nuove proposte</h3>
              <p>
                Contattaci per raccontarci cosa stai cercando: ti aiuteremo a trovare la soluzione
                adatta.
              </p>
              <Button component={Link} to="/contatti" variant="contained">
                Parla con noi
              </Button>
            </div>
          )}
        </div>
      </section>

      <ValuationSection />

      <section className="section story-section">
        <div className="container story-grid">
          <div className="story-image">
            <img
              src="/VetrinaEsterna.webp"
              alt="Ambiente accogliente e luminoso"
              loading="lazy"
            />
            <div className="story-stamp">
              <strong>Dal 2001</strong>
              <span>al tuo fianco</span>
            </div>
          </div>
          <div className="story-copy">
            <h2>
              Non cerchiamo solo case. <br></br>
              <span>Troviamo la soluzione che fa per te.</span>
            </h2>
            <p>
              La nostra esperienza nasce dall'ascolto delle persone e dalla conoscenza del
              territorio. Ogni acquisto, vendita o locazione è una scelta importante: per questo ti
              accompagniamo con chiarezza, competenza e presenza, passo dopo passo.
            </p>
            <p>
              Dalla prima valutazione alla consegna delle chiavi, lavoriamo per rendere il percorso più
              semplice e sereno.
            </p>
            <Link className="text-link" to="/chi-siamo">
              Scopri la nostra storia <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section service-section">
        <div className="container">
          <div className="section-heading section-heading--center">
            <div>
              <h2>Un unico punto di riferimento</h2>
            </div>
          </div>
          <div className="service-grid">
            <Link className="service-card" to="/valutazione">
              <span className="service-card__icon">
                <Home size={24} />
              </span>
              <h3>Valuta il tuo immobile gratuitamente</h3>
              <p>Richiedi una prima valutazione e scopri come valorizzare la tua proprietà.</p>
              <span className="text-link">
                Richiedi una valutazione <ArrowRight size={16} />
              </span>
            </Link>
            <Link className="service-card" to="/pubblica-con-noi">
              <span className="service-card__icon">
                <KeyRound size={24} />
              </span>
              <h3>Vendi o affitta con noi</h3>
              <p>Costruiamo insieme un percorso adatto al tuo immobile e ai tuoi obiettivi.</p>
              <span className="text-link">
                Scopri come funziona <ArrowRight size={16} />
              </span>
            </Link>
            <Link className="service-card" to="/consulenza-mutui">
              <span className="service-card__icon">
                <ShieldCheck size={24} />
              </span>
              <h3>Mutui e prestiti</h3>
              <p>Un primo orientamento per capire a chi rivolgerti e quali passi valutare.</p>
              <span className="text-link">
                Richiedi informazioni <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <MagazinePreview />

      <section className="review-section section">
        <div className="container review-section__inner">
          <div className="review-intro">
            <span className="eyebrow eyebrow--light">Le relazioni sono il nostro risultato più importante.</span>
            <h2>Scopri le esperienze condivise dai nostri clienti.</h2>
            <Button component={Link} to="/chi-siamo" variant="outlined" color="primary" endIcon={<ArrowRight size={16} />}>Scopri chi siamo</Button>
          </div>
          <div className="review-widget-panel">
            <ElfsightReviews />
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container faq-layout">
          <div>
            <span className="eyebrow">Hai qualche dubbio?</span>
            <h2>Le risposte alle domande più frequenti.</h2>
            <p>
              Abbiamo raccolto alcune informazioni utili per accompagnarti nella ricerca o nella
              vendita di casa.
            </p>
            <Button
              component={Link}
              to="/contatti"
              variant="outlined"
              endIcon={<ArrowRight size={16} />}
            >
              Hai altre domande? Contattaci
            </Button>
          </div>
          <div className="faq-list" aria-label="Domande frequenti">
            {faqs.slice(0, 4).map((faq, index) => (
              <details className="faq-item" key={faq.id} open={index === 0}>
                <summary>
                  <span>{faq.question}</span>
                  <span className="faq-plus" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="container closing-cta__inner">
          <div>
            <span className="eyebrow">Parliamone insieme</span>
            <h2>Il prossimo passo può cominciare da qui.</h2>
            <p>Raccontaci di cosa hai bisogno: siamo qui per ascoltarti.</p>
          </div>
          <div className="closing-cta__actions">
            <Button
              component={Link}
              to="/contatti"
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={18} />}
            >
              Contattaci
            </Button>
            <Button component={Link} to="/valutazione" variant="outlined" size="large">
              Valuta il tuo immobile
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
