import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Home, Phone } from 'lucide-react';
import { Button } from '@mui/material';
import DOMPurify from 'dompurify';
import Seo from '../components/Seo';
import { isSupabaseConfigured, publicSiteUrl, supabase } from '../lib/supabase';
import { editorialArticles } from '../content/editorialArticles';
import type { BlogArticle } from '../types';

function formatDate(date: string | null) {
  if (!date) return '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function useArticles() {
  const [articles, setArticles] = useState<BlogArticle[]>(editorialArticles);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        // Before the SQL migration, display initial editorial guides. Once the
        // table is available, it is the only source of truth (even when empty).
        if (!error) setArticles((data || []) as BlogArticle[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);
  return { articles, loading };
}

function ArticleCard({ article }: { article: BlogArticle }) {
  return (
    <article className="magazine-card">
      <Link to={'/guide/' + article.slug} className="magazine-card__media" aria-label={'Leggi: ' + article.title}>
        <img
          src={article.cover_image_url || '/VetrinaEsterna.webp'}
          alt=""
          loading="lazy"
        />
      </Link>
      <div className="magazine-card__body">
        <span className="magazine-card__category">{article.category}</span>
        <h2>
          <Link to={'/guide/' + article.slug}>{article.title}</Link>
        </h2>
        <p>{article.excerpt}</p>
        <Link className="magazine-card__read" to={'/guide/' + article.slug}>
          Leggi l'articolo <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}

export function BlogPage() {
  const { articles, loading } = useArticles();
  const [category, setCategory] = useState('Tutte');
  const categories = useMemo(
    () => ['Tutte', ...Array.from(new Set(articles.map((article) => article.category)))],
    [articles],
  );
  const filtered = articles.filter((article) => category === 'Tutte' || article.category === category);

  return (
    <>
      <Seo
        title="Guide immobiliari a Bari | Consigli di Casadibari"
        description="Guide pratiche per chi vuole vendere o acquistare casa a Bari: valutazione, trattative, documenti e mercato locale."
        path="/guide"
      />
      <section className="magazine-intro">
        <div className="container magazine-intro__inner">
          <span className="eyebrow eyebrow--light">Il magazine di Casadibari</span>
          <h1>Le scelte migliori iniziano dalle domande giuste.</h1>
          <p>
            Prezzi, documenti, strategie e quartieri: un punto di riferimento per
            conoscere meglio il mercato immobiliare di Bari e affrontare ogni passo
            con maggiore consapevolezza.
          </p>
          <Link className="magazine-intro__cta" to="/valutazione">
            Vuoi conoscere il valore della tua casa? <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section magazine-section">
        <div className="container">
          <div className="magazine-section__heading">
            <div>
              <span className="eyebrow">Approfondimenti</span>
              <h2>Consigli da leggere, idee da mettere in pratica.</h2>
              <p>Esplora i temi che interessano a chi vuole vendere o comprare casa.</p>
            </div>
          </div>
          {articles.length > 0 && (
            <div className="magazine-filters" role="group" aria-label="Filtra per argomento">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? 'is-active' : ''}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          {filtered.length > 0 ? (
            <div className="magazine-grid">
              {filtered.map((article) => <ArticleCard key={article.id} article={article} />)}
            </div>
          ) : (
            <div className="empty-state">
              <Home size={28} />
              <h3>{loading ? 'Caricamento articoli…' : 'Nessun articolo in questa sezione'}</h3>
              <p>Scopri le altre guide o torna a trovarci presto.</p>
            </div>
          )}
        </div>
      </section>
      <section className="magazine-bottom-cta">
        <div className="container magazine-bottom-cta__inner">
          <div>
            <span className="eyebrow eyebrow--light">Dalle informazioni ai prossimi passi</span>
            <h2>Hai una casa a Bari e stai pensando di venderla?</h2>
            <p>Raccontaci dove si trova e quali sono i tuoi obiettivi: partiamo da un confronto concreto e senza impegno.</p>
          </div>
          <Button component={Link} to="/valutazione" variant="contained" size="large" endIcon={<ArrowRight size={18} />}>
            Richiedi una valutazione
          </Button>
        </div>
      </section>
    </>
  );
}

export function BlogArticlePage() {
  const { slug } = useParams();
  const { articles, loading } = useArticles();
  const article = articles.find((entry) => entry.slug === slug);
  const related = articles.filter((entry) => entry.slug !== slug).slice(0, 3);

  if (!article) {
    return (
      <section className="section">
        <Seo title="Articolo non disponibile | Casadibari" description="L'articolo richiesto non è disponibile." noIndex />
        <div className="container magazine-not-found">
          <h1>{loading ? 'Stiamo caricando l’articolo…' : 'Questo articolo non è disponibile.'}</h1>
          <Link className="text-link" to="/guide"><ArrowLeft size={17} /> Torna alle guide</Link>
        </div>
      </section>
    );
  }

  const canonical = publicSiteUrl() + '/guide/' + article.slug;
  const publishedTime = article.published_at || article.created_at || '';
  return (
    <>
      <Seo
        title={article.title + ' | Casadibari Immobiliare'}
        description={article.excerpt}
        image={article.cover_image_url.startsWith('/') ? publicSiteUrl() + article.cover_image_url : article.cover_image_url || undefined}
        path={'/guide/' + article.slug}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.excerpt,
          mainEntityOfPage: canonical,
          datePublished: publishedTime || undefined,
          dateModified: article.updated_at || publishedTime || undefined,
          author: { '@type': 'Organization', name: 'Casadibari Immobiliare' },
          publisher: { '@type': 'Organization', name: 'Casadibari Immobiliare' },
        }}
      />
      <article>
        <header className="magazine-article-hero">
          <div className="container magazine-article-hero__inner">
            <Link to="/guide" className="magazine-back"><ArrowLeft size={16} /> Tutte le guide</Link>
            <div className="magazine-article-hero__text">
              <span className="eyebrow eyebrow--light">{article.category}</span>
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
              {publishedTime && (
                <span className="magazine-article-date">
                  <CalendarDays size={16} /> {formatDate(publishedTime)}
                </span>
              )}
            </div>
          </div>
        </header>
        <div className="container magazine-article-layout">
          <div className="magazine-article-main">
            {article.cover_image_url && (
              <img className="magazine-article-cover" src={article.cover_image_url} alt="" />
            )}
            <div
              className="magazine-article-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.body_html || '', {
                  USE_PROFILES: { html: true },
                  FORBID_TAGS: ['script', 'iframe', 'form', 'style'],
                }),
              }}
            />
            <div className="magazine-article-cta">
              <span className="eyebrow">Parliamo della tua casa</span>
              <h2>Ogni immobile ha una storia. Iniziamo dalla tua.</h2>
              <p>Hai dubbi sul valore, sui documenti o su come vendere? Ti ascoltiamo e valutiamo insieme i passi più utili.</p>
              <div className="magazine-article-cta__buttons">
                <Button component={Link} to="/valutazione" variant="contained" endIcon={<ArrowRight size={16} />}>
                  Valutazione gratuita
                </Button>
                <a className="text-link" href="tel:+390808491745"><Phone size={16} /> 080 849 1745</a>
              </div>
            </div>
          </div>
          <aside className="magazine-article-sidebar">
            <span className="eyebrow">Altre letture</span>
            <h2>Continua a scoprire.</h2>
            {related.map((item) => (
              <Link className="magazine-related" key={item.id} to={'/guide/' + item.slug}>
                <span>{item.category}</span>
                <strong>{item.title}</strong>
                <ChevronRight size={17} />
              </Link>
            ))}
            <Link className="text-link" to="/guide">Esplora tutte le guide <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </article>
    </>
  );
}

export function MagazinePreview() {
  const { articles } = useArticles();
  const preview = articles.slice(0, 3);
  if (!preview.length) return null;
  return (
    <section className="section magazine-preview">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Il magazine di Casadibari</span>
            <h2>Conoscere il mercato aiuta a scegliere meglio.</h2>
            <p>Guide e consigli per vendere casa a Bari, dalla valutazione ai documenti.</p>
          </div>
          <Button component={Link} to="/guide" variant="outlined" endIcon={<ArrowRight size={16} />}>
            Tutte le guide
          </Button>
        </div>
        <div className="magazine-grid magazine-grid--preview">
          {preview.map((article) => <ArticleCard key={article.id} article={article} />)}
        </div>
      </div>
    </section>
  );
}
