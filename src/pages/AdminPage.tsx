import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  FileText,
  Home,
  ImagePlus,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Alert, Button, IconButton, TextField } from '@mui/material';
import Seo from '../components/Seo';
import RichTextEditor from '../components/RichTextEditor';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ContactSettings, Faq, Property, PropertyImage, TeamMember } from '../types';

type Tab = 'properties' | 'faqs' | 'requests' | 'team' | 'settings';
type PropertyForm = {
  title: string;
  subtitle: string;
  description_html: string;
  property_type: string;
  transaction_type: 'Vendita' | 'Affitto';
  status: 'available' | 'under_offer' | 'sold' | 'rented';
  price: string;
  city: string;
  neighborhood: string;
  address: string;
  area_sqm: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  energy_class: string;
  features: string;
  featured: boolean;
  published: boolean;
};
type TeamForm = {
  full_name: string;
  role: string;
  bio: string;
  photo_url: string;
  email: string;
  phone: string;
  active: boolean;
};
type Inquiry = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  property_type?: string;
  area_sqm?: number;
  subject?: string;
  message?: string;
  status: string;
  created_at: string;
  kind: 'Valutazione' | 'Contatto';
};

const blankProperty: PropertyForm = {
  title: '',
  subtitle: '',
  description_html: '<p></p>',
  property_type: 'Appartamento',
  transaction_type: 'Vendita',
  status: 'available',
  price: '',
  city: 'Bari',
  neighborhood: '',
  address: '',
  area_sqm: '',
  rooms: '',
  bedrooms: '',
  bathrooms: '',
  floor: '',
  energy_class: '',
  features: '',
  featured: false,
  published: false,
};
const blankTeam: TeamForm = {
  full_name: '',
  role: '',
  bio: '',
  photo_url: '',
  email: '',
  phone: '',
  active: true,
};
const blankContact: ContactSettings = {
  businessName: 'Casadibari Immobiliare sas di Casadibari Maurizio & C',
  vatNumber: '08451090727',
  address: 'Via Pasubio, 78A, 70125 Bari BA',
  phone: '080 849 1745',
  mobile: '',
  whatsapp: '',
  email: '',
  pec: '',
  instagram: '',
  facebook: '',
  mapsEmbedUrl: 'https://www.google.com/maps?q=Via%20Pasubio%2078A%20Bari&output=embed',
  publicityPlatforms: '',
};

function slugify(value: string) {
  return value
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function money(value: number | null) {
  return value == null
    ? 'Prezzo su richiesta'
    : new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value);
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionBooting, setSessionBooting] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<{
    username: string;
    full_name: string;
    is_active: boolean;
  } | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const [dashboardError, setDashboardError] = useState('');
  const [notice, setNotice] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [valuations, setValuations] = useState<Inquiry[]>([]);
  const [contacts, setContacts] = useState<Inquiry[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contactSettings, setContactSettings] = useState<ContactSettings>(blankContact);
  const [dataLoading, setDataLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState<PropertyForm>(blankProperty);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [propertySaving, setPropertySaving] = useState(false);

  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', published: true });
  const [faqSaving, setFaqSaving] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<TeamForm>(blankTeam);
  const [teamSaving, setTeamSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionBooting(false);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setSessionBooting(false);
      })
      .catch(() => setSessionBooting(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let alive = true;
    setProfileLoading(true);
    supabase
      .from('admin_profiles')
      .select('username, full_name, is_active')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!alive) return;
        if (error || !data || data.is_active !== true) {
          setLoginError('Questo account non è abilitato al backoffice.');
          setProfile(null);
          await supabase.auth.signOut();
        } else {
          setProfile(data);
        }
        setProfileLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [session]);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setDataLoading(true);
    setDashboardError('');
    const [
      propertyResult,
      faqResult,
      valuationResult,
      contactResult,
      teamResult,
      settingResult,
    ] = await Promise.all([
      supabase
        .from('properties')
        .select('*, property_images(id, storage_path, public_url, alt_text, sort_order)')
        .order('created_at', { ascending: false }),
      supabase.from('faqs').select('*').order('sort_order'),
      supabase.from('valuation_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('*').order('sort_order'),
      supabase.from('site_settings').select('value').eq('key', 'contact').maybeSingle(),
    ]);
    const anyError =
      propertyResult.error ||
      faqResult.error ||
      valuationResult.error ||
      contactResult.error ||
      teamResult.error ||
      settingResult.error;
    if (propertyResult.data) setProperties(propertyResult.data as Property[]);
    if (faqResult.data) setFaqs(faqResult.data as Faq[]);
    if (valuationResult.data)
      setValuations(
        (valuationResult.data as Record<string, unknown>[]).map(
          (row) =>
            ({
              ...row,
              id: String(row.id),
              status: String(row.status),
              created_at: String(row.created_at),
              email: String(row.email),
              kind: 'Valutazione' as const,
            }) as Inquiry,
        ),
      );
    if (contactResult.data)
      setContacts(
        (contactResult.data as Record<string, unknown>[]).map(
          (row) =>
            ({
              ...row,
              id: String(row.id),
              status: String(row.status),
              created_at: String(row.created_at),
              email: String(row.email),
              kind: 'Contatto' as const,
            }) as Inquiry,
        ),
      );
    if (teamResult.data) setTeam(teamResult.data as TeamMember[]);
    if (settingResult.data?.value)
      setContactSettings({ ...blankContact, ...(settingResult.data.value as ContactSettings) });
    if (anyError)
      setDashboardError(
        'Alcuni dati non sono stati caricati. Verifica le policy RLS e che la migrazione Supabase sia stata eseguita.',
      );
    setDataLoading(false);
  }, [profile]);

  useEffect(() => {
    if (profile?.is_active) void loadData();
  }, [profile, loadData]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');
    if (!isSupabaseConfigured) {
      setLoginError('Configura prima VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
      return;
    }
    setLoginBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-login', {
      body: { username: loginUsername.trim(), password: loginPassword },
    });
    if (error || !data?.session?.access_token || !data?.session?.refresh_token) {
      setLoginError(
        data?.error ||
          'Accesso non riuscito. Verifica username e password oppure controlla la Edge Function admin-login.',
      );
      setLoginBusy(false);
      return;
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (sessionError) setLoginError('Impossibile avviare la sessione. Riprova.');
    setLoginPassword('');
    setLoginBusy(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setLoginError('Hai effettuato la disconnessione.');
  };

  const startNewProperty = () => {
    setEditingId(null);
    setPropertyForm({ ...blankProperty });
    setSelectedPhotos([]);
    setNotice('');
  };
  const editProperty = (property: Property) => {
    setEditingId(property.id);
    setPropertyForm({
      title: property.title || '',
      subtitle: property.subtitle || '',
      description_html: property.description_html || '<p></p>',
      property_type: property.property_type || 'Appartamento',
      transaction_type: property.transaction_type || 'Vendita',
      status: property.status || 'available',
      price: property.price == null ? '' : String(property.price),
      city: property.city || 'Bari',
      neighborhood: property.neighborhood || '',
      address: property.address || '',
      area_sqm: property.area_sqm == null ? '' : String(property.area_sqm),
      rooms: property.rooms == null ? '' : String(property.rooms),
      bedrooms: property.bedrooms == null ? '' : String(property.bedrooms),
      bathrooms: property.bathrooms == null ? '' : String(property.bathrooms),
      floor: property.floor || '',
      energy_class: property.energy_class || '',
      features: (property.features || []).join(', '),
      featured: Boolean(property.featured),
      published: Boolean(property.published),
    });
    setSelectedPhotos([]);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice('');
    if (!propertyForm.title.trim()) {
      setNotice('Inserisci il titolo dell’annuncio.');
      return;
    }
    setPropertySaving(true);
    const payload = {
      slug: slugify(propertyForm.title) || 'immobile-' + Date.now(),
      title: propertyForm.title.trim(),
      subtitle: propertyForm.subtitle.trim(),
      description_html: propertyForm.description_html,
      property_type: propertyForm.property_type,
      transaction_type: propertyForm.transaction_type,
      status: propertyForm.status,
      price: propertyForm.price ? Number(propertyForm.price) : null,
      city: propertyForm.city.trim() || 'Bari',
      neighborhood: propertyForm.neighborhood.trim(),
      address: propertyForm.address.trim(),
      area_sqm: propertyForm.area_sqm ? Number(propertyForm.area_sqm) : null,
      rooms: propertyForm.rooms ? Number(propertyForm.rooms) : null,
      bedrooms: propertyForm.bedrooms ? Number(propertyForm.bedrooms) : null,
      bathrooms: propertyForm.bathrooms ? Number(propertyForm.bathrooms) : null,
      floor: propertyForm.floor.trim(),
      energy_class: propertyForm.energy_class.trim(),
      features: propertyForm.features
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      featured: propertyForm.featured,
      published: propertyForm.published,
    };
    let propertyId = editingId;
    let writeError: string | null = null;
    if (editingId) {
      const { error } = await supabase.from('properties').update(payload).eq('id', editingId);
      if (error) writeError = error.message;
    } else {
      const { data, error } = await supabase
        .from('properties')
        .insert(payload)
        .select('id')
        .single();
      if (error) writeError = error.message;
      else propertyId = data.id;
    }
    if (writeError || !propertyId) {
      setNotice('Salvataggio non riuscito: ' + (writeError || 'ID dell’immobile non disponibile.'));
      setPropertySaving(false);
      return;
    }

    const imageRows: {
      property_id: string;
      storage_path: string;
      public_url: string;
      alt_text: string;
      sort_order: number;
    }[] = [];
    for (let index = 0; index < selectedPhotos.length; index += 1) {
      const photo = selectedPhotos[index];
      if (!photo.type.startsWith('image/')) continue;
      const path =
        propertyId +
        '/' +
        Date.now() +
        '-' +
        index +
        '-' +
        photo.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(path, photo, { upsert: false, contentType: photo.type });
      if (uploadError) {
        writeError = 'Immobile salvato ma upload immagine non riuscito: ' + uploadError.message;
        break;
      }
      const publicUrl = supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
      imageRows.push({
        property_id: propertyId,
        storage_path: path,
        public_url: publicUrl,
        alt_text: propertyForm.title,
        sort_order:
          (properties.find((p) => p.id === propertyId)?.property_images?.length || 0) + index,
      });
    }
    if (imageRows.length) {
      const { error } = await supabase.from('property_images').insert(imageRows);
      if (error)
        writeError =
          'Immobile salvato, ma non è stato possibile associare tutte le foto: ' + error.message;
    }
    await loadData();
    setPropertySaving(false);
    setSelectedPhotos([]);
    if (writeError) setNotice(writeError);
    else {
      setNotice(
        propertyForm.published
          ? 'Annuncio salvato e pubblicato.'
          : 'Bozza salvata. Pubblica l’annuncio selezionando la casella dedicata.',
      );
      startNewProperty();
      setNotice(propertyForm.published ? 'Annuncio salvato e pubblicato.' : 'Bozza salvata.');
    }
  };

  const deleteProperty = async (property: Property) => {
    if (!window.confirm('Eliminare definitivamente “' + property.title + '”?')) return;
    const images = property.property_images || [];
    const paths = images
      .map((image) => image.storage_path)
      .filter((path): path is string => Boolean(path));
    if (paths.length) await supabase.storage.from('property-images').remove(paths);
    const { error } = await supabase.from('properties').delete().eq('id', property.id);
    setNotice(error ? 'Eliminazione non riuscita: ' + error.message : 'Annuncio eliminato.');
    await loadData();
  };

  const deleteImage = async (image: PropertyImage) => {
    if (!image.id || !window.confirm('Rimuovere questa foto dall’annuncio?')) return;
    const { error } = await supabase.from('property_images').delete().eq('id', image.id);
    if (!error && image.storage_path)
      await supabase.storage.from('property-images').remove([image.storage_path]);
    if (error) setNotice('Impossibile eliminare la foto: ' + error.message);
    await loadData();
  };

  const saveFaq = async (event: React.FormEvent) => {
    event.preventDefault();
    setFaqSaving(true);
    setNotice('');
    const payload = {
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      published: faqForm.published,
      sort_order: editingFaqId
        ? faqs.find((faq) => faq.id === editingFaqId)?.sort_order || 0
        : faqs.length + 1,
    };
    const result = editingFaqId
      ? await supabase.from('faqs').update(payload).eq('id', editingFaqId)
      : await supabase.from('faqs').insert(payload);
    setFaqSaving(false);
    if (result.error) setNotice('Salvataggio FAQ non riuscito: ' + result.error.message);
    else {
      setFaqForm({ question: '', answer: '', published: true });
      setEditingFaqId(null);
      setNotice('FAQ salvata.');
      await loadData();
    }
  };
  const deleteFaq = async (faq: Faq) => {
    if (!window.confirm('Eliminare questa FAQ?')) return;
    const { error } = await supabase.from('faqs').delete().eq('id', faq.id);
    setNotice(error ? error.message : 'FAQ eliminata.');
    await loadData();
  };

  const saveTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamSaving(true);
    setNotice('');
    const payload = {
      ...teamForm,
      full_name: teamForm.full_name.trim(),
      sort_order: editingTeamId
        ? team.find((m) => m.id === editingTeamId)?.sort_order || 0
        : team.length + 1,
    };
    const result = editingTeamId
      ? await supabase.from('team_members').update(payload).eq('id', editingTeamId)
      : await supabase.from('team_members').insert(payload);
    setTeamSaving(false);
    if (result.error) setNotice('Salvataggio profilo non riuscito: ' + result.error.message);
    else {
      setTeamForm({ ...blankTeam });
      setEditingTeamId(null);
      setNotice('Profilo salvato.');
      await loadData();
    }
  };
  const deleteTeam = async (member: TeamMember) => {
    if (!window.confirm('Eliminare il profilo di ' + member.full_name + '?')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', member.id);
    setNotice(error ? error.message : 'Profilo eliminato.');
    await loadData();
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSettingsSaving(true);
    setNotice('');
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'contact', value: contactSettings, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    setSettingsSaving(false);
    setNotice(
      error
        ? 'Salvataggio contatti non riuscito: ' + error.message
        : 'Contatti e impostazioni salvati.',
    );
    if (!error) await loadData();
  };

  const updateInquiryStatus = async (item: Inquiry, status: string) => {
    const table = item.kind === 'Valutazione' ? 'valuation_requests' : 'contact_requests';
    const { error } = await supabase.from(table).update({ status }).eq('id', item.id);
    setNotice(
      error
        ? 'Impossibile aggiornare la richiesta: ' + error.message
        : 'Stato della richiesta aggiornato.',
    );
    await loadData();
  };

  if (sessionBooting || (session && profileLoading))
    return (
      <div className="admin-loading">
        <div className="loader-dot" />
        <p>Verifica della sessione amministrativa…</p>
      </div>
    );

  if (!session || !profile?.is_active) {
    return (
      <div className="admin-login-page">
        <Seo
          title="Accesso amministratore | Casadibari"
          description="Area riservata di gestione Casadibari Immobiliare."
          noIndex
        />
        <div className="admin-login-brand">
          <Link to="/">
            <img src="/Logo%20Agenzia%20Casadibari.webp" alt="Casadibari Immobiliare" />
          </Link>
          <Link className="back-home" to="/">
            <ArrowLeft size={16} /> Torna al sito
          </Link>
        </div>
        <div className="admin-login-card">
          <span className="admin-login-icon">
            <ShieldCheck size={27} />
          </span>
          <span className="eyebrow">Area riservata</span>
          <h1>Benvenuto nel backoffice.</h1>
          <p>Accedi per gestire annunci, fotografie, richieste e contenuti del sito.</p>
          {!isSupabaseConfigured && (
            <div className="admin-warning">
              La configurazione di Supabase non è disponibile in questa build del sito.
              Imposta le variabili VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
              nell'ambiente usato per compilare il progetto, quindi ricompila e ripubblica il sito.
              In locale, inseriscile nel file .env.local e riavvia Vite. Non inserire qui la chiave
              SUPABASE_SECRET_KEY: deve restare esclusivamente lato server.
            </div>
          )}
          <form onSubmit={login}>
            <TextField
              className="admin-login-mui-field"
              label="Username"
              autoComplete="username"
              required
              fullWidth
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Il tuo username"
            />
            <TextField
              className="admin-login-mui-field"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="La tua password"
            />
            {loginError && (
              <p className="form-feedback form-feedback--error" role="alert">
                {loginError}
              </p>
            )}
            <Button
              variant="contained"
              fullWidth
              size="large"
              type="submit"
              disabled={loginBusy || !isSupabaseConfigured}
              endIcon={<ArrowLeft className="login-arrow" size={17} />}
            >
              {loginBusy ? 'Accesso in corso…' : 'Accedi'}
            </Button>
          </form>
          <small className="admin-login-note">
            <ShieldCheck size={14} /> Accesso protetto e sessione persistente tramite Supabase Auth.
          </small>
        </div>
        <p className="admin-login-copyright">© {new Date().getFullYear()} Casadibari Immobiliare</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'properties', label: 'Annunci', icon: <Home size={18} /> },
    { id: 'faqs', label: 'FAQ', icon: <MessageSquare size={18} /> },
    { id: 'requests', label: 'Richieste', icon: <ClipboardList size={18} /> },
    { id: 'team', label: 'Team', icon: <Users size={18} /> },
    { id: 'settings', label: 'Contatti e sito', icon: <Settings size={18} /> },
  ];
  const newRequestCount =
    valuations.filter((item) => item.status === 'new').length +
    contacts.filter((item) => item.status === 'new').length;
  const currentImages =
    properties.find((property) => property.id === editingId)?.property_images || [];

  return (
    <div className="admin-app">
      <Seo
        title="Dashboard amministratore | Casadibari"
        description="Area privata di amministrazione Casadibari Immobiliare."
        noIndex
      />
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar__brand">
          <img src="/Logo%20Agenzia%20Casadibari.webp" alt="Casadibari" />
          <span>BACKOFFICE</span>
        </Link>
        <div className="admin-profile-chip">
          <span className="admin-profile-avatar">
            {(profile.full_name || profile.username).slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{profile.full_name || profile.username}</strong>
            <small>Amministratore</small>
          </div>
          <span className="admin-online-dot" />
        </div>
        <nav className="admin-menu" aria-label="Menu backoffice">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => {
                setActiveTab(tab.id);
                setNotice('');
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'requests' && newRequestCount > 0 && <em>{newRequestCount}</em>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <Link to="/" target="_blank">
            <ArrowLeft size={16} /> Visualizza sito
          </Link>
          <button type="button" onClick={logout}>
            <LogOut size={16} /> Esci
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">CASADIBARI IMMOBILIARE</span>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label || 'Dashboard'}</h1>
          </div>
          <div className="admin-topbar__right">
            <span className="admin-session">
              <span /> Sessione attiva
            </span>
            <button className="admin-topbar-logout" type="button" onClick={logout}>
              <LogOut size={16} /> Esci
            </button>
          </div>
        </header>
        <div className="admin-content">
          {dashboardError && (
            <Alert severity="error" className="admin-mui-alert">
              {dashboardError}
            </Alert>
          )}
          {notice && (
            <Alert
              severity={
                notice.toLowerCase().includes('non riuscito') ||
                notice.toLowerCase().includes('impossibile')
                  ? 'error'
                  : 'success'
              }
              className="admin-mui-alert"
              onClose={() => setNotice('')}
            >
              {notice}
            </Alert>
          )}
          {dataLoading && <div className="admin-loading-inline">Aggiornamento dei dati…</div>}

          {activeTab === 'properties' && (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h2>Gestione annunci</h2>
                  <p>
                    {properties.length} annunci registrati ·{' '}
                    {properties.filter((property) => property.published).length} pubblicati
                  </p>
                </div>
                <Button
                  variant="contained"
                  type="button"
                  onClick={startNewProperty}
                  startIcon={<Plus size={17} />}
                >
                  Nuovo annuncio
                </Button>
              </div>
              <form className="admin-editor" onSubmit={saveProperty}>
                <div className="admin-editor__title">
                  <div>
                    <span className="eyebrow">
                      {editingId ? 'Modifica annuncio' : 'Nuovo immobile'}
                    </span>
                    <h3>
                      {editingId
                        ? propertyForm.title || 'Modifica i dati'
                        : 'Inserisci una nuova proposta'}
                    </h3>
                  </div>
                  {editingId && (
                    <button
                      className="button button--outline button--small"
                      type="button"
                      onClick={startNewProperty}
                    >
                      <X size={15} /> Annulla modifica
                    </button>
                  )}
                </div>
                <div className="admin-form-grid">
                  <label className="field field--wide">
                    <span>Titolo annuncio *</span>
                    <input
                      required
                      value={propertyForm.title}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, title: e.target.value }))
                      }
                      placeholder="Es. Trilocale luminoso in zona Carrassi"
                    />
                  </label>
                  <label className="field field--wide">
                    <span>Sottotitolo</span>
                    <input
                      value={propertyForm.subtitle}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, subtitle: e.target.value }))
                      }
                      placeholder="Una breve frase che valorizza l’immobile"
                    />
                  </label>
                  <label className="field">
                    <span>Operazione</span>
                    <select
                      value={propertyForm.transaction_type}
                      onChange={(e) =>
                        setPropertyForm((current) => ({
                          ...current,
                          transaction_type: e.target.value as PropertyForm['transaction_type'],
                        }))
                      }
                    >
                      <option>Vendita</option>
                      <option>Affitto</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Tipologia</span>
                    <select
                      value={propertyForm.property_type}
                      onChange={(e) =>
                        setPropertyForm((current) => ({
                          ...current,
                          property_type: e.target.value,
                        }))
                      }
                    >
                      {[
                        'Appartamento',
                        'Casa indipendente',
                        'Villa',
                        'Attico',
                        'Locale commerciale',
                        'Ufficio',
                        'Terreno',
                        'Box / Garage',
                        'Altro',
                      ].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Prezzo (€)</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={propertyForm.price}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, price: e.target.value }))
                      }
                      placeholder="Es. 185000"
                    />
                  </label>
                  <label className="field">
                    <span>Stato annuncio</span>
                    <select
                      value={propertyForm.status}
                      onChange={(e) =>
                        setPropertyForm((current) => ({
                          ...current,
                          status: e.target.value as PropertyForm['status'],
                        }))
                      }
                    >
                      <option value="available">Disponibile</option>
                      <option value="under_offer">In trattativa</option>
                      <option value="sold">Venduto</option>
                      <option value="rented">Locato</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Città *</span>
                    <input
                      required
                      value={propertyForm.city}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, city: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Quartiere / zona</span>
                    <input
                      value={propertyForm.neighborhood}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, neighborhood: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field field--wide">
                    <span>Indirizzo</span>
                    <input
                      value={propertyForm.address}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, address: e.target.value }))
                      }
                      placeholder="Indirizzo visualizzato nella scheda"
                    />
                  </label>
                  <label className="field">
                    <span>Superficie (m²)</span>
                    <input
                      type="number"
                      min="0"
                      value={propertyForm.area_sqm}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, area_sqm: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Locali</span>
                    <input
                      type="number"
                      min="0"
                      value={propertyForm.rooms}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, rooms: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Camere</span>
                    <input
                      type="number"
                      min="0"
                      value={propertyForm.bedrooms}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, bedrooms: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Bagni</span>
                    <input
                      type="number"
                      min="0"
                      value={propertyForm.bathrooms}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, bathrooms: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Piano</span>
                    <input
                      value={propertyForm.floor}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, floor: e.target.value }))
                      }
                      placeholder="Es. 2° piano con ascensore"
                    />
                  </label>
                  <label className="field">
                    <span>Classe energetica</span>
                    <input
                      value={propertyForm.energy_class}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, energy_class: e.target.value }))
                      }
                      placeholder="Es. C"
                    />
                  </label>
                  <label className="field field--wide">
                    <span>Caratteristiche (separate da virgola)</span>
                    <input
                      value={propertyForm.features}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, features: e.target.value }))
                      }
                      placeholder="Balcone, ascensore, termoautonomo…"
                    />
                  </label>
                </div>
                <div className="admin-field-block">
                  <span className="admin-field-label">Descrizione dell’annuncio</span>
                  <RichTextEditor
                    value={propertyForm.description_html}
                    onChange={(value) =>
                      setPropertyForm((current) => ({ ...current, description_html: value }))
                    }
                  />
                  <small>Usa grassetto, titoli, elenchi e link per strutturare il testo.</small>
                </div>
                <div className="admin-field-block">
                  <span className="admin-field-label">Fotografie</span>
                  <label className="upload-drop">
                    <ImagePlus size={23} />
                    <span>
                      <strong>Seleziona foto dal computer</strong>
                      <small>JPEG, PNG, WEBP o AVIF · massimo 12 MB per file</small>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(e) => setSelectedPhotos(Array.from(e.target.files || []))}
                    />
                  </label>
                  {selectedPhotos.length > 0 && (
                    <div className="selected-files">
                      {selectedPhotos.map((file) => (
                        <span key={file.name + file.size}>
                          {file.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPhotos((current) =>
                                current.filter((item) => item !== file),
                              )
                            }
                            aria-label={'Rimuovi ' + file.name}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {currentImages.length > 0 && (
                    <div className="admin-photo-grid">
                      {currentImages
                        .slice()
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .map((image, index) => (
                          <div key={image.id || image.public_url}>
                            <img
                              src={image.public_url}
                              alt={image.alt_text || 'Foto annuncio ' + (index + 1)}
                            />
                            <button
                              type="button"
                              onClick={() => void deleteImage(image)}
                              aria-label="Elimina foto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="admin-publish-options">
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={propertyForm.featured}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, featured: e.target.checked }))
                      }
                    />
                    <span>
                      <strong>In evidenza</strong>
                      <small>Mostra questo annuncio nella selezione della homepage.</small>
                    </span>
                  </label>
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={propertyForm.published}
                      onChange={(e) =>
                        setPropertyForm((current) => ({ ...current, published: e.target.checked }))
                      }
                    />
                    <span>
                      <strong>Pubblica online</strong>
                      <small>Rende l’annuncio visibile nella pagina Immobili.</small>
                    </span>
                  </label>
                </div>
                <div className="admin-form-footer">
                  <p>La pubblicazione può attivare gli avvisi email per ricerche compatibili.</p>
                  <Button
                    variant="contained"
                    size="large"
                    type="submit"
                    disabled={propertySaving}
                    startIcon={<Save size={17} />}
                  >
                    {propertySaving ? 'Salvataggio…' : 'Salva annuncio'}
                  </Button>
                </div>
              </form>
              <div className="admin-table-card">
                <div className="admin-table-heading">
                  <h3>Annunci presenti</h3>
                  <span>{properties.length} totali</span>
                </div>
                {properties.length ? (
                  <div className="admin-listings-table">
                    <div className="admin-table-row admin-table-row--head">
                      <span>Immobile</span>
                      <span>Prezzo</span>
                      <span>Stato</span>
                      <span>Visibilità</span>
                      <span>Azioni</span>
                    </div>
                    {properties.map((property) => (
                      <div className="admin-table-row" key={property.id}>
                        <div className="admin-property-cell">
                          <img
                            src={
                              property.property_images?.[0]?.public_url ||
                              '/Logo%20Agenzia%20Casadibari.webp'
                            }
                            alt=""
                          />
                          <div>
                            <strong>{property.title}</strong>
                            <small>
                              {property.neighborhood ? property.neighborhood + ' · ' : ''}
                              {property.city}
                            </small>
                            {property.featured && <em>IN EVIDENZA</em>}
                          </div>
                        </div>
                        <span className="admin-table-price">{money(property.price)}</span>
                        <span>
                          <span className={'admin-status admin-status--' + property.status}>
                            {property.status === 'available'
                              ? 'Disponibile'
                              : property.status === 'under_offer'
                                ? 'In trattativa'
                                : property.status === 'sold'
                                  ? 'Venduto'
                                  : 'Locato'}
                          </span>
                        </span>
                        <span
                          className={
                            'admin-visibility ' + (property.published ? 'is-published' : '')
                          }
                        >
                          {property.published ? 'Pubblicato' : 'Bozza'}
                        </span>
                        <div className="admin-actions">
                          <button
                            type="button"
                            onClick={() => editProperty(property)}
                            aria-label="Modifica annuncio"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteProperty(property)}
                            aria-label="Elimina annuncio"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty">
                    <Home size={27} />
                    <p>Non ci sono ancora annunci. Crea il primo con il modulo qui sopra.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'faqs' && (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h2>Domande frequenti</h2>
                  <p>Gestisci le risposte mostrate nella pagina FAQ.</p>
                </div>
              </div>
              <div className="admin-two-col">
                <form className="admin-editor admin-editor--simple" onSubmit={saveFaq}>
                  <div className="admin-editor__title">
                    <h3>{editingFaqId ? 'Modifica FAQ' : 'Nuova FAQ'}</h3>
                    {editingFaqId && (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          setEditingFaqId(null);
                          setFaqForm({ question: '', answer: '', published: true });
                        }}
                        aria-label="Annulla modifica"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <label className="field">
                    <span>Domanda *</span>
                    <input
                      required
                      value={faqForm.question}
                      onChange={(e) =>
                        setFaqForm((current) => ({ ...current, question: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Risposta *</span>
                    <textarea
                      required
                      rows={6}
                      value={faqForm.answer}
                      onChange={(e) =>
                        setFaqForm((current) => ({ ...current, answer: e.target.value }))
                      }
                    />
                  </label>
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={faqForm.published}
                      onChange={(e) =>
                        setFaqForm((current) => ({ ...current, published: e.target.checked }))
                      }
                    />
                    <span>Pubblica nella pagina FAQ</span>
                  </label>
                  <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={faqSaving}
                    startIcon={<Save size={16} />}
                  >
                    {faqSaving ? 'Salvataggio…' : 'Salva FAQ'}
                  </Button>
                </form>
                <div className="admin-stack">
                  {faqs.map((faq) => (
                    <article className="admin-content-item" key={faq.id}>
                      <div>
                        <span
                          className={'admin-visibility ' + (faq.published ? 'is-published' : '')}
                        >
                          {faq.published ? 'Pubblicata' : 'Bozza'}
                        </span>
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                      </div>
                      <div className="admin-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqId(faq.id);
                            setFaqForm({
                              question: faq.question,
                              answer: faq.answer,
                              published: faq.published,
                            });
                          }}
                          aria-label="Modifica FAQ"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteFaq(faq)}
                          aria-label="Elimina FAQ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                  {!faqs.length && (
                    <div className="admin-empty">
                      <MessageSquare size={27} />
                      <p>Nessuna FAQ presente.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'requests' && (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h2>Richieste ricevute</h2>
                  <p>Valutazioni immobiliari e messaggi inviati dai moduli del sito.</p>
                </div>
                <span className="admin-total-badge">
                  {valuations.length + contacts.length} richieste
                </span>
              </div>
              <div className="inquiry-groups">
                <div>
                  <h3>
                    Richieste di valutazione <span>{valuations.length}</span>
                  </h3>
                  {valuations.map((item) => (
                    <article className="inquiry-card" key={item.id}>
                      <div className="inquiry-card__top">
                        <span className="eyebrow">{item.kind}</span>
                        <small>{formatDate(item.created_at)}</small>
                      </div>
                      <h4>
                        {item.first_name} {item.last_name}
                      </h4>
                      <p>
                        <strong>{item.address}</strong>
                        {item.property_type ? ' · ' + item.property_type : ''}
                        {item.area_sqm ? ' · ' + item.area_sqm + ' m²' : ''}
                      </p>
                      <p>{item.message || 'Nessun dettaglio aggiuntivo.'}</p>
                      <div className="inquiry-card__contacts">
                        <a href={'mailto:' + item.email}>{item.email}</a>
                        {item.phone && (
                          <a href={'tel:' + item.phone.replace(/[^+\d]/g, '')}>{item.phone}</a>
                        )}
                      </div>
                      <label className="field">
                        <span>Stato richiesta</span>
                        <select
                          value={item.status}
                          onChange={(e) => void updateInquiryStatus(item, e.target.value)}
                        >
                          <option value="new">Nuova</option>
                          <option value="in_progress">In lavorazione</option>
                          <option value="closed">Chiusa</option>
                        </select>
                      </label>
                    </article>
                  ))}
                  {!valuations.length && (
                    <div className="admin-empty">Nessuna valutazione ricevuta.</div>
                  )}
                </div>
                <div>
                  <h3>
                    Messaggi di contatto <span>{contacts.length}</span>
                  </h3>
                  {contacts.map((item) => (
                    <article className="inquiry-card" key={item.id}>
                      <div className="inquiry-card__top">
                        <span className="eyebrow">{item.kind}</span>
                        <small>{formatDate(item.created_at)}</small>
                      </div>
                      <h4>{item.name}</h4>
                      {item.subject && <strong>{item.subject}</strong>}
                      <p>{item.message || 'Nessun testo inserito.'}</p>
                      <div className="inquiry-card__contacts">
                        <a href={'mailto:' + item.email}>{item.email}</a>
                        {item.phone && (
                          <a href={'tel:' + item.phone.replace(/[^+\d]/g, '')}>{item.phone}</a>
                        )}
                      </div>
                      <label className="field">
                        <span>Stato richiesta</span>
                        <select
                          value={item.status}
                          onChange={(e) => void updateInquiryStatus(item, e.target.value)}
                        >
                          <option value="new">Nuova</option>
                          <option value="in_progress">In lavorazione</option>
                          <option value="closed">Chiusa</option>
                        </select>
                      </label>
                    </article>
                  ))}
                  {!contacts.length && (
                    <div className="admin-empty">Nessun messaggio ricevuto.</div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'team' && (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h2>Team e personale</h2>
                  <p>Gestisci i profili mostrati nella pagina Chi siamo.</p>
                </div>
              </div>
              <div className="admin-two-col">
                <form className="admin-editor admin-editor--simple" onSubmit={saveTeam}>
                  <div className="admin-editor__title">
                    <h3>{editingTeamId ? 'Modifica profilo' : 'Aggiungi persona'}</h3>
                    {editingTeamId && (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          setEditingTeamId(null);
                          setTeamForm({ ...blankTeam });
                        }}
                        aria-label="Annulla modifica"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <label className="field">
                    <span>Nome e cognome *</span>
                    <input
                      required
                      value={teamForm.full_name}
                      onChange={(e) =>
                        setTeamForm((current) => ({ ...current, full_name: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Ruolo</span>
                    <input
                      value={teamForm.role}
                      onChange={(e) =>
                        setTeamForm((current) => ({ ...current, role: e.target.value }))
                      }
                      placeholder="Es. Consulente immobiliare"
                    />
                  </label>
                  <label className="field">
                    <span>Foto (URL pubblico)</span>
                    <input
                      type="url"
                      value={teamForm.photo_url}
                      onChange={(e) =>
                        setTeamForm((current) => ({ ...current, photo_url: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Presentazione</span>
                    <textarea
                      rows={4}
                      value={teamForm.bio}
                      onChange={(e) =>
                        setTeamForm((current) => ({ ...current, bio: e.target.value }))
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={teamForm.email}
                        onChange={(e) =>
                          setTeamForm((current) => ({ ...current, email: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Telefono</span>
                      <input
                        value={teamForm.phone}
                        onChange={(e) =>
                          setTeamForm((current) => ({ ...current, phone: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={teamForm.active}
                      onChange={(e) =>
                        setTeamForm((current) => ({ ...current, active: e.target.checked }))
                      }
                    />
                    <span>Mostra nella pagina Chi siamo</span>
                  </label>
                  <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={teamSaving}
                    startIcon={<Save size={16} />}
                  >
                    {teamSaving ? 'Salvataggio…' : 'Salva profilo'}
                  </Button>
                </form>
                <div className="admin-stack">
                  {team.map((member) => (
                    <article className="admin-content-item" key={member.id}>
                      <div className="admin-team-listing">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt="" />
                        ) : (
                          <span className="admin-team-initials">
                            {member.full_name.slice(0, 1)}
                          </span>
                        )}
                        <div>
                          <span
                            className={'admin-visibility ' + (member.active ? 'is-published' : '')}
                          >
                            {member.active ? 'Visibile' : 'Nascosto'}
                          </span>
                          <h3>{member.full_name}</h3>
                          <p>{member.role}</p>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeamId(member.id);
                            setTeamForm({
                              full_name: member.full_name,
                              role: member.role,
                              bio: member.bio,
                              photo_url: member.photo_url,
                              email: member.email,
                              phone: member.phone,
                              active: member.active,
                            });
                          }}
                          aria-label="Modifica profilo"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteTeam(member)}
                          aria-label="Elimina profilo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                  {!team.length && (
                    <div className="admin-empty">
                      <Users size={27} />
                      <p>Aggiungi le persone che desideri presentare nella pagina Chi siamo.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h2>Contatti e informazioni del sito</h2>
                  <p>Questi recapiti alimentano header, footer, mappa e pagina Contatti.</p>
                </div>
              </div>
              <form className="admin-editor" onSubmit={saveSettings}>
                <div className="admin-editor__title">
                  <h3>Informazioni pubbliche</h3>
                  <span className="admin-settings-note">
                    <CheckCircle2 size={16} /> Modifiche visibili sul sito
                  </span>
                </div>
                <div className="admin-form-grid">
                  <label className="field field--wide">
                    <span>Ragione sociale</span>
                    <input
                      value={contactSettings.businessName || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({
                          ...current,
                          businessName: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Partita IVA</span>
                    <input
                      value={contactSettings.vatNumber || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, vatNumber: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Telefono fisso</span>
                    <input
                      value={contactSettings.phone || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, phone: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Cellulare</span>
                    <input
                      value={contactSettings.mobile || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, mobile: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Numero WhatsApp internazionale</span>
                    <input
                      value={contactSettings.whatsapp || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, whatsapp: e.target.value }))
                      }
                      placeholder="Es. 393331234567"
                    />
                  </label>
                  <label className="field field--wide">
                    <span>Indirizzo ufficio</span>
                    <input
                      value={contactSettings.address || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, address: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Email pubblica</span>
                    <input
                      type="email"
                      value={contactSettings.email || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, email: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>PEC</span>
                    <input
                      type="email"
                      value={contactSettings.pec || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, pec: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field field--wide">
                    <span>URL pagina Instagram</span>
                    <input
                      type="url"
                      value={contactSettings.instagram || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, instagram: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field field--wide">
                    <span>URL pagina Facebook</span>
                    <input
                      type="url"
                      value={contactSettings.facebook || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({ ...current, facebook: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field field--wide">
                    <span>URL embed Google Maps</span>
                    <input
                      type="url"
                      value={contactSettings.mapsEmbedUrl || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({
                          ...current,
                          mapsEmbedUrl: e.target.value,
                        }))
                      }
                    />
                    <small>
                      Incolla l’URL di incorporamento della mappa, non una chiave API privata.
                    </small>
                  </label>
                  <label className="field field--wide">
                    <span>Piattaforme e canali promozionali per “Pubblica con noi”</span>
                    <textarea
                      rows={3}
                      value={contactSettings.publicityPlatforms || ''}
                      onChange={(e) =>
                        setContactSettings((current) => ({
                          ...current,
                          publicityPlatforms: e.target.value,
                        }))
                      }
                      placeholder="Inserisci i canali confermati dall’agenzia…"
                    />
                  </label>
                </div>
                <div className="admin-form-footer">
                  <p>Email e PEC sono mostrate sul sito solo dopo essere state compilate.</p>
                  <Button
                    variant="contained"
                    size="large"
                    type="submit"
                    disabled={settingsSaving}
                    startIcon={<Save size={17} />}
                  >
                    {settingsSaving ? 'Salvataggio…' : 'Salva impostazioni'}
                  </Button>
                </div>
              </form>
              <div className="admin-security-note">
                <ShieldCheck size={20} />
                <div>
                  <strong>Sessione e permessi</strong>
                  <p>
                    La sessione di accesso è mantenuta da Supabase Auth. Le operazioni sono protette
                    dalle policy RLS: non aggiungere mai chiavi di servizio alle impostazioni
                    pubbliche.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
