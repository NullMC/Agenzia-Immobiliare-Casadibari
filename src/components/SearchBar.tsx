import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { SearchFilters } from '../types';

const blankFilters: SearchFilters = { q: '', transaction: 'Vendita', propertyType: '', minPrice: '', maxPrice: '' };

export default function SearchBar({ compact = false, initialFilters }: { compact?: boolean; initialFilters?: Partial<SearchFilters> }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({ ...blankFilters, ...initialFilters });
  const update = (key: keyof SearchFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.transaction) params.set('transaction', filters.transaction);
    if (filters.propertyType) params.set('type', filters.propertyType);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    navigate('/immobili' + (params.toString() ? '?' + params.toString() : ''));
  };

  return (
    <form className={'search-panel' + (compact ? ' search-panel--compact' : '')} onSubmit={submit}>
      {!compact && <div className="search-panel__heading"><span className="search-panel__icon"><SlidersHorizontal size={19} /></span><div><strong>Trova la tua casa</strong><small>Imposta i tuoi criteri di ricerca</small></div></div>}
      <div className="search-panel__fields">
        <label className="field field--location"><span>Zona o città</span><input value={filters.q} onChange={e => update('q', e.target.value)} placeholder="Es. Bari, Carrassi…" /></label>
        <label className="field"><span>Operazione</span><select value={filters.transaction} onChange={e => update('transaction', e.target.value)}><option value="">Tutte</option><option>Vendita</option><option>Affitto</option></select></label>
        <label className="field"><span>Tipologia</span><select value={filters.propertyType} onChange={e => update('propertyType', e.target.value)}><option value="">Tutte</option><option>Appartamento</option><option>Villa</option><option>Attico</option><option>Locale commerciale</option><option>Ufficio</option><option>Terreno</option><option>Casa indipendente</option></select></label>
        <label className="field"><span>Prezzo minimo</span><select value={filters.minPrice} onChange={e => update('minPrice', e.target.value)}><option value="">Nessun minimo</option><option value="50000">50.000 €</option><option value="100000">100.000 €</option><option value="150000">150.000 €</option><option value="200000">200.000 €</option><option value="300000">300.000 €</option></select></label>
        <label className="field"><span>Prezzo massimo</span><select value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)}><option value="">Nessun massimo</option><option value="100000">100.000 €</option><option value="150000">150.000 €</option><option value="200000">200.000 €</option><option value="300000">300.000 €</option><option value="500000">500.000 €</option></select></label>
        <button className="button button--primary search-panel__submit" type="submit"><Search size={18} /> Cerca immobili</button>
      </div>
    </form>
  );
}