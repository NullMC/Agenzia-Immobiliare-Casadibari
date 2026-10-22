import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BellRing, CheckCircle2, House, Search } from 'lucide-react';
import { Button, TextField } from '@mui/material';
import Seo from '../components/Seo';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { type Property, type SearchFilters } from '../types';

const defaultFilters: SearchFilters = {
  q: '',
  transaction: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
};
const readFilters = (search: string): SearchFilters => {
  const params = new URLSearchParams(search);
  return {
    q: params.get('q') || '',
    transaction: params.get('transaction') || '',
    propertyType: params.get('type') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
  };
};

export default function PropertiesPage() {
  const location = useLocation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [sending, setSending] = useState(false);
  const filters = useMemo(() => readFilters(location.search), [location.search]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    setLoading(true);
    supabase
      .from('properties')
      .select('*, property_images(id, public_url, alt_text, sort_order)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        setProperties(error ? [] : ((data || []) as Property[]));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      properties
        .filter((property) => {
          const search = filters.q.trim().toLocaleLowerCase('it-IT');
          const matchesSearch =
            !search ||
            [
              property.title,
              property.address,
              property.city,
              property.neighborhood,
              property.subtitle,
            ].some((value) => (value || '').toLocaleLowerCase('it-IT').includes(search));
          const matchesTransaction =
            !filters.transaction || property.transaction_type === filters.transaction;
          const matchesType =
            !filters.propertyType || property.property_type === filters.propertyType;
          const matchesMin =
            !filters.minPrice ||
            (property.price != null && property.price >= Number(filters.minPrice));
          const matchesMax =
            !filters.maxPrice ||
            (property.price != null && property.price <= Number(filters.maxPrice));
          return matchesSearch && matchesTransaction && matchesType && matchesMin && matchesMax;
        })
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            String(b.created_at || '').localeCompare(String(a.created_at || '')),
        ),
    [properties, filters],
  );

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    setAlertMessage('');
    if (!consent) {
      setAlertMessage(
        'Per attivare gli avvisi devi confermare il consenso al trattamento dei dati.',
      );
      return;
    }
    if (!isSupabaseConfigured) {
      setAlertMessage('Gli avvisi email saranno attivi dopo la configurazione di Supabase.');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('property_alerts').insert({
      email: email.trim(),
      transaction_type: filters.transaction || 'Vendita',
      property_type: filters.propertyType,
      city: filters.q || 'Bari',
      min_price: filters.minPrice ? Number(filters.minPrice) : null,
      max_price: filters.maxPrice ? Number(filters.maxPrice) : null,
      consent: true,
      active: true,
    });
    setSending(false);
    if (error)
      setAlertMessage(
        'Non siamo riusciti a salvare la ricerca. Controlla l’indirizzo email e riprova.',
      );
    else {
      setAlertMessage(
        'Ricerca salvata! Ti invieremo via email fino a 3 proposte pertinenti quando saranno disponibili nuovi immobili.',
      );
      setEmail('');
      setConsent(false);
    }
  };

  return (
    <>
      <Seo
        title="Immobili in vendita e affitto a Bari | Casadibari"
        description="Cerca appartamenti, case e locali in vendita o affitto a Bari. Filtra gli annunci per zona, tipologia e budget e contatta Casadibari Immobiliare."
        path="/immobili"
      />
      <section className="page-hero page-hero--listings">
        <div className="container">
          <span className="eyebrow eyebrow--light">Trova il tuo spazio</span>
          <h1>
            Le nostre <span>case</span>
          </h1>
          <p>Una ricerca semplice, pensata intorno a ciò che conta per te.</p>
        </div>
      </section>
      <section className="container listings-page">
        <div className="listings-search">
          <SearchBar compact key={location.search} initialFilters={filters} />
        </div>
        <div className="listings-title-row">
          <div>
            <span className="eyebrow">Annunci immobiliari</span>
            <h2>
              {filtered.length} {filtered.length === 1 ? 'proposta' : 'proposte'}{' '}
              {filters.q ? 'per “' + filters.q + '”' : 'per te'}
            </h2>
          </div>
          <p>
            <Search size={16} /> Ordinate per pertinenza e selezione dell’agenzia
          </p>
        </div>
        {loading ? (
          <div className="loading-state">Caricamento annunci…</div>
        ) : filtered.length ? (
          <div className="property-grid">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <House size={34} />
            <h3>Nessun immobile disponibile</h3>
            <p>
              Non ci sono annunci che corrispondono ai criteri selezionati. Prova a modificare i
              filtri oppure salva la ricerca per ricevere aggiornamenti sulle nuove disponibilità.
            </p>
            <Button component="a" href="/immobili" variant="text" color="primary">
              Rimuovi i filtri →
            </Button>
          </div>
        )}
      </section>
      <section className="alert-section">
        <div className="container alert-section__inner">
          <div className="alert-section__copy">
            <span className="alert-section__icon">
              <BellRing size={23} />
            </span>
            <span className="eyebrow">Rimani aggiornato</span>
            <h2>La prossima occasione potrebbe arrivare da un momento all'altro</h2>
            <p>
              Salva le tue preferenze: quando una nuova disponibilità corrisponde alla ricerca,
              riceverai un’email con fino a tre proposte pertinenti.
            </p>
          </div>
          <form className="alert-form" onSubmit={subscribe}>
            <h3>Salva la tua ricerca</h3>
            <TextField
              className="alert-email-field"
              label="La tua email"
              type="email"
              autoComplete="email"
              required
              size="small"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@email.it"
            />
            <div className="alert-form__summary">
              <span>Operazione</span>
              <strong>{filters.transaction || 'Vendita e affitto'}</strong>
              <span>Zona</span>
              <strong>{filters.q || 'Bari e dintorni'}</strong>
              <span>Tipologia</span>
              <strong>{filters.propertyType || 'Tutte'}</strong>
              <span>Budget</span>
              <strong>
                {filters.minPrice || filters.maxPrice
                  ? (filters.minPrice
                      ? 'da ' + Number(filters.minPrice).toLocaleString('it-IT') + ' € '
                      : '') +
                    (filters.maxPrice
                      ? 'a ' + Number(filters.maxPrice).toLocaleString('it-IT') + ' €'
                      : '')
                  : 'Da definire'}
              </strong>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                Acconsento al trattamento dei dati per ricevere gli avvisi immobiliari e dichiaro di
                aver letto l’informativa privacy.
              </span>
            </label>
            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={sending}
              endIcon={<BellRing size={17} />}
            >
              {sending ? 'Salvataggio…' : 'Attiva gli avvisi email'}
            </Button>
            {alertMessage && (
              <p className="form-feedback" role="status">
                {alertMessage}
              </p>
            )}
            <small>Potrai chiedere la cancellazione degli avvisi contattando l’agenzia.</small>
          </form>
        </div>
      </section>
    </>
  );
}
