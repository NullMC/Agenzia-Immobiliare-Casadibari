import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Handshake,
  Home,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Seo from '../components/Seo';
import ElfsightReviews from '../components/ElfsightReviews';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { type ContactSettings, type TeamMember } from '../types';

const defaultContact: ContactSettings = {
  businessName: 'Casadibari Immobiliare sas di Casadibari Maurizio & C',
  vatNumber: '08451090727',
  address: 'Via Pasubio, 78A, 70125 Bari BA',
  phone: '080 849 1745',
  email: 'info@casadibari.it',
  mapsEmbedUrl: 'https://www.google.com/maps?q=Via%20Pasubio%2078A%20Bari&output=embed',
};

function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero page-hero--simple">
      <div className="container">
        <span className="eyebrow eyebrow--light">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

export function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contact, setContact] = useState<ContactSettings>(defaultContact);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from('team_members').select('*').eq('active', true).order('sort_order'),
      supabase.from('site_settings').select('value').eq('key', 'contact').maybeSingle(),
    ]).then(([teamResult, settingsResult]) => {
      if (!teamResult.error) setTeam((teamResult.data || []) as TeamMember[]);
      if (settingsResult.data?.value) {
        const savedContact = settingsResult.data.value as ContactSettings;
        setContact({
          ...defaultContact,
          ...savedContact,
          email: savedContact.email?.trim() || defaultContact.email,
        });
      }
    });
  }, []);

  return (
    <>
      <Seo
        title="Chi siamo | Casadibari Immobiliare Bari"
        description="Scopri Casadibari Immobiliare: esperienza dal 2001, conoscenza del territorio di Bari e attenzione personale in ogni scelta immobiliare."
        path="/chi-siamo"
      />
      <PageHero
        eyebrow="La nostra storia"
        title="La casa è un luogo. La fiducia è il punto di partenza."
        description="Dal 2001 accompagniamo le persone nelle loro scelte immobiliari, con esperienza, ascolto e conoscenza del territorio."
      />
      <section className="section">
        <div className="container about-intro-grid">
          <div>
            <span className="eyebrow">Agenzia Immobiliare Casadibari</span>
            <h2>
              Il tuo Partner di fiducia <span>nel mondo immobiliare.</span>
            </h2>
            <p>
              Qui la passione per il settore
              immobiliare si unisce a una lunga esperienza al servizio della comunità.
            </p>
            <p>
              Dal 2001 lavoriamo per aiutare le persone a trovare un luogo accogliente da chiamare
              “la mia casa”. Nel corso degli anni abbiamo costruito il nostro percorso dando valore
              all’affidabilità, alla competenza e alla dedizione verso chi ci sceglie.
            </p>
            <p>
              Ogni situazione è diversa. Per questo mettiamo al centro l’ascolto e la chiarezza:
              dall’idea iniziale alla visita, dalla valutazione alla conclusione della trattativa.
            </p>
            <Button
              component={Link}
              to="/contatti"
              variant="contained"
              endIcon={<ArrowRight size={17} />}
            >
              Conosciamoci
            </Button>
          </div>
          <div className="about-photo">
            <img
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85"
              alt="Interni contemporanei e luminosi"
              loading="lazy"
            />
            <div className="about-photo__caption">
              <strong>Dal 2001</strong>
              <span>al fianco di chi cerca casa</span>
            </div>
          </div>
        </div>
      </section>
      {team.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Le persone</span>
                <h2>Il nostro team</h2>
                <p>Le persone che ti accompagneranno nel tuo percorso.</p>
              </div>
            </div>
            <div className="team-grid">
              {team.map((member) => (
                <article className="team-card" key={member.id}>
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} loading="lazy" />
                  ) : (
                    <div className="team-card__initials">
                      {member.full_name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                  )}
                  <h3>{member.full_name}</h3>
                  <span>{member.role}</span>
                  {member.bio && <p>{member.bio}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="section section--soft">
        <div className="container office-grid">
          <div>
            <span className="eyebrow">Vieni a trovarci</span>
            <h2>Ci trovi a Bari, in via Pasubio.</h2>
            <p>
              Siamo felici di incontrarti per ascoltare le tue esigenze e parlare del tuo progetto
              immobiliare.
            </p>
            <p className="office-contact">
              <MapPin size={18} /> {contact.address}
            </p>
            {contact.phone && (
              <p className="office-contact">
                <Phone size={18} />{' '}
                <a href={'tel:' + contact.phone.replace(/[^+\d]/g, '')}>{contact.phone}</a>
              </p>
            )}
            {contact.email && (
              <p className="office-contact">
                <Mail size={18} /> <a href={'mailto:' + contact.email}>{contact.email}</a>
              </p>
            )}
            <Link className="button button--primary" to="/contatti">
              Scrivici <ArrowRight size={17} />
            </Link>
          </div>
          <div className="office-map">
            <iframe
              title="Mappa ufficio Casadibari Immobiliare"
              src={contact.mapsEmbedUrl || defaultContact.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}

export function ValuationPage() {
  const [form, setForm] = useState({
    address: '',
    property_type: 'Appartamento',
    area_sqm: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    message: '',
    privacy_consent: false,
  });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');
    if (!form.privacy_consent) {
      setStatus('Per inviare la richiesta devi accettare il trattamento dei dati.');
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus(
        'Il modulo è in anteprima. La ricezione delle richieste sarà attiva dopo la configurazione di Supabase.',
      );
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from('valuation_requests')
      .insert({ ...form, area_sqm: form.area_sqm ? Number(form.area_sqm) : null });
    setSending(false);
    if (error)
      setStatus(
        'Non siamo riusciti a inviare la richiesta. Riprova oppure contatta l’agenzia telefonicamente.',
      );
    else {
      setStatus(
        'Richiesta inviata correttamente. Grazie, ti ricontatteremo per approfondire la valutazione.',
      );
      setForm({
        address: '',
        property_type: 'Appartamento',
        area_sqm: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        message: '',
        privacy_consent: false,
      });
    }
  };

  return (
    <>
      <Seo
        title="Valutazione gratuita immobile a Bari | Casadibari"
        description="Richiedi una prima valutazione del tuo appartamento, casa o locale a Bari. Compila il modulo con i dati essenziali e ti ricontatteremo."
        path="/valutazione"
      />
      <PageHero eyebrow="" title="Quanto vale casa tua?" description="" />
      <section className="section valuation-section">
        <div className="container valuation-layout">
          <div className="valuation-copy">
            <h2>Partiamo dalle informazioni essenziali.</h2>
            <p>
              Ci vogliono pochi minuti per inviarci i dati principali. L’obiettivo è capire meglio
              la tua proprietà e offrirti un primo confronto basato sulle sue caratteristiche.
            </p>
            <div className="process-list">
              <div>
                <span>01</span>
                <div>
                  <strong>Compila il modulo</strong>
                  <p>Indirizzo, tipologia e metratura, se disponibile.</p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <strong>Ti ricontattiamo</strong>
                  <p>Approfondiamo insieme le caratteristiche dell’immobile.</p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <strong>Definiamo i prossimi passi</strong>
                  <p>Confrontiamo le tue esigenze e le possibilità di valorizzazione.</p>
                </div>
              </div>
            </div>
            <p className="small-note">
              La stima iniziale non sostituisce una perizia tecnica né un incarico di valutazione
              formale.
            </p>
          </div>
          <form className="form-card" onSubmit={submit}>
            <div className="form-card__heading">
              <span className="form-card__icon">
                <Home size={22} />
              </span>
              <div>
                <h2>Richiedi la valutazione</h2>
                <p>I campi con * sono obbligatori.</p>
              </div>
            </div>
            <label className="field">
              <span>Indirizzo dell’immobile *</span>
              <input
                required
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Via, numero civico, città"
              />
            </label>
            <div className="form-row">
              <label className="field">
                <span>Tipologia *</span>
                <select
                  required
                  value={form.property_type}
                  onChange={(e) => update('property_type', e.target.value)}
                >
                  <option>Appartamento</option>
                  <option>Casa indipendente</option>
                  <option>Villa</option>
                  <option>Attico</option>
                  <option>Locale commerciale</option>
                  <option>Ufficio</option>
                  <option>Terreno</option>
                  <option>Altro</option>
                </select>
              </label>
              <label className="field">
                <span>Superficie (m²)</span>
                <input
                  type="number"
                  min="1"
                  value={form.area_sqm}
                  onChange={(e) => update('area_sqm', e.target.value)}
                  placeholder="Es. 95"
                />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                <span>Nome *</span>
                <input
                  required
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Cognome *</span>
                <input
                  required
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                <span>Telefono *</span>
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Email *</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              <span>Informazioni aggiuntive</span>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Piano, stato dell’immobile, disponibilità, altre informazioni…"
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.privacy_consent}
                onChange={(e) => update('privacy_consent', e.target.checked)}
              />
              <span>
                Ho letto l’informativa privacy e acconsento al trattamento dei dati per essere
                ricontattato in merito alla richiesta. *
              </span>
            </label>
            <Button
              variant="contained"
              fullWidth
              size="large"
              type="submit"
              disabled={sending}
              endIcon={<ArrowRight size={18} />}
            >
              {sending ? 'Invio in corso…' : 'Invia la richiesta'}
            </Button>
            {status && (
              <p className="form-feedback" role="status">
                {status}
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

export function MortgagePage() {
  return (
    <>
      <Seo
        title="Consulenza mutui e prestiti | Casadibari Immobiliare"
        description="Richiedi informazioni sui referenti per consulenze mutui e prestiti collegate al tuo progetto immobiliare a Bari."
        path="/consulenza-mutui"
      />
      <PageHero
        eyebrow="Mutui e prestiti"
        title="Orientati con serenità."
        description="Ti aiutiamo a individuare i prossimi passi e i referenti da coinvolgere."
      />
      <section className="section">
        <div className="container mortgage-layout">
          <div>
            <span className="eyebrow">Un supporto in più</span>
            <h2>Il tuo progetto casa non si ferma alla ricerca dell’immobile.</h2>
            <p>
              Capire come sostenere l’acquisto è una parte importante del percorso. Attraverso
              contatti e referenze da confermare, puoi chiedere un primo orientamento su mutui e
              prestiti e capire quali informazioni preparare prima di parlare con un consulente.
            </p>
            <p>
              La disponibilità di consulenti, prodotti e condizioni deve essere verificata caso per
              caso. Casadibari non garantisce l’approvazione di finanziamenti e le decisioni restano
              in capo agli enti eroganti.
            </p>
            <Button
              component={Link}
              to="/contatti"
              variant="contained"
              endIcon={<ArrowRight size={17} />}
            >
              Chiedi informazioni
            </Button>
          </div>
          <div className="mortgage-benefits">
            <article>
              <span>
                <Landmark size={23} />
              </span>
              <div>
                <h3>Orientamento iniziale</h3>
                <p>Inquadra le domande principali sul finanziamento del tuo progetto.</p>
              </div>
            </article>
            <article>
              <span>
                <Users size={23} />
              </span>
              <div>
                <h3>Referenze</h3>
                <p>Chiedi informazioni sui contatti disponibili e sui prossimi passi.</p>
              </div>
            </article>
            <article>
              <span>
                <ShieldCheck size={23} />
              </span>
              <div>
                <h3>Chiarezza</h3>
                <p>Valuta con attenzione condizioni, costi, durata e sostenibilità della rata.</p>
              </div>
            </article>
            <div className="small-note">
              Le consulenze e le referenze specifiche devono essere confermate dall’agenzia prima
              della pubblicazione definitiva.
            </div>
          </div>
        </div>
      </section>
      <section className="closing-cta">
        <div className="container closing-cta__inner">
          <div>
            <span className="eyebrow">Parliamone</span>
            <h2>Hai già individuato un immobile?</h2>
            <p>Possiamo aiutarti a organizzare i prossimi passi del percorso.</p>
          </div>
          <Link className="button button--light button--large" to="/contatti">
            Contatta l’agenzia <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

export function PublishPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Vorrei pubblicare il mio immobile',
    message: '',
    privacy_consent: false,
  });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');
    if (!form.privacy_consent) {
      setStatus('Per inviare la richiesta devi accettare il trattamento dei dati.');
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus(
        'Modulo dimostrativo: la ricezione delle richieste sarà attiva dopo la configurazione di Supabase.',
      );
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from('contact_requests')
      .insert({ ...form, privacy_consent: true });
    setSending(false);
    if (error) setStatus('Invio non riuscito. Riprova o contattaci telefonicamente.');
    else {
      setStatus('Richiesta inviata. Ti ricontatteremo per conoscere il tuo immobile.');
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: 'Vorrei pubblicare il mio immobile',
        message: '',
        privacy_consent: false,
      });
    }
  };

  return (
    <>
      <Seo
        title="Vendi o affitta con Casadibari | Pubblica il tuo immobile"
        description="Affidaci il tuo immobile: raccontaci la tua esigenza e confrontiamoci su come presentarlo e promuoverlo al meglio."
        path="/pubblica-con-noi"
      />
      <PageHero
        eyebrow="Pubblica con noi"
        title="Il tuo immobile merita la giusta attenzione."
        description="Conosciamo il territorio e possiamo aiutarti a valorizzare i punti di forza della tua proprietà con un percorso condiviso."
      />
      <section className="section">
        <div className="container publish-layout">
          <div>
            <span className="eyebrow">Dalla prima chiacchierata alla pubblicazione</span>
            <h2>Un percorso pensato per il tuo immobile.</h2>
            <div className="process-list">
              <div>
                <span>01</span>
                <div>
                  <strong>Ascoltiamo la tua esigenza</strong>
                  <p>Ci racconti il tuo obiettivo, i tempi e le caratteristiche dell’immobile.</p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <strong>Prepariamo la presentazione</strong>
                  <p>
                    Raccogliamo informazioni, caratteristiche e materiali necessari a raccontarlo in
                    modo chiaro.
                  </p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <strong>Definiamo la promozione</strong>
                  <p>
                    Concordiamo insieme canali, tempistiche e attività di pubblicizzazione
                    disponibili.
                  </p>
                </div>
              </div>
            </div>
            <div className="platforms-note">
              <strong>Canali di pubblicazione</strong>
              <p>
                Le piattaforme e i canali promozionali specifici sono da inserire e confermare
                manualmente dall’agenzia prima del lancio.
              </p>
            </div>
          </div>
          <form className="form-card" onSubmit={submit}>
            <div className="form-card__heading">
              <span className="form-card__icon">
                <Home size={22} />
              </span>
              <div>
                <h2>Parliamo del tuo immobile</h2>
                <p>Lasciaci un recapito, ti ricontatteremo.</p>
              </div>
            </div>
            <label className="field">
              <span>Nome e cognome *</span>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="field">
              <span>Email *</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Telefono</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Come possiamo aiutarti? *</span>
              <textarea
                rows={5}
                required
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Zona, tipologia di immobile, vendita o affitto…"
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.privacy_consent}
                onChange={(e) => update('privacy_consent', e.target.checked)}
              />
              <span>
                Acconsento al trattamento dei dati per ricevere risposta alla richiesta. *
              </span>
            </label>
            <Button
              variant="contained"
              fullWidth
              disabled={sending}
              type="submit"
              endIcon={<ArrowRight size={17} />}
            >
              {sending ? 'Invio…' : 'Invia la richiesta'}
            </Button>
            {status && (
              <p className="form-feedback" role="status">
                {status}
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    privacy_consent: false,
  });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState<ContactSettings>(defaultContact);
  useEffect(() => {
    if (isSupabaseConfigured)
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'contact')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) {
            const savedContact = data.value as ContactSettings;
            setContact({
              ...defaultContact,
              ...savedContact,
              email: savedContact.email?.trim() || defaultContact.email,
            });
          }
        });
  }, []);
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');
    if (!form.privacy_consent) {
      setStatus('Per inviare la richiesta devi accettare il trattamento dei dati.');
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus('Modulo dimostrativo: collega Supabase per salvare le richieste.');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('contact_requests').insert(form);
    setSending(false);
    if (error) setStatus('Non siamo riusciti a inviare la richiesta. Riprova oppure chiamaci.');
    else {
      setStatus('Grazie, la tua richiesta è stata inviata. Ti ricontatteremo appena possibile.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '', privacy_consent: false });
    }
  };
  const tel = contact.phone ? 'tel:' + contact.phone.replace(/[^+\d]/g, '') : undefined;
  return (
    <>
      <Seo
        title="Contatti | Casadibari Immobiliare Bari"
        description="Contatta Agenzia Immobiliare Casadibari a Bari, in via Pasubio 78A. Telefona o invia una richiesta per immobili, valutazioni e consulenze."
        path="/contatti"
      />
      <PageHero
        eyebrow="Siamo a tua disposizione"
        title="Parliamone insieme."
        description="Che tu stia cercando casa, pensando di vendere o abbia una domanda, siamo qui per ascoltarti."
      />
      <section className="section">
        <div className="container contact-layout">
          <div className="contact-info">
            <span className="eyebrow">Dove siamo</span>
            <h2>Passa a trovarci.</h2>
            <p>
              Puoi contattarci utilizzando i recapiti qui sotto o inviarci un messaggio attraverso
              il modulo.
            </p>
            <div className="contact-detail">
              <MapPin size={20} />
              <div>
                <strong>Indirizzo</strong>
                <span>{contact.address}</span>
              </div>
            </div>
            {contact.phone && (
              <div className="contact-detail">
                <Phone size={20} />
                <div>
                  <strong>Telefono</strong>
                  <a href={tel}>{contact.phone}</a>
                </div>
              </div>
            )}
            {contact.mobile && (
              <div className="contact-detail">
                <Phone size={20} />
                <div>
                  <strong>Cellulare</strong>
                  <a href={'tel:' + contact.mobile.replace(/[^+\d]/g, '')}>{contact.mobile}</a>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="contact-detail">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <a href={'mailto:' + contact.email}>{contact.email}</a>
                </div>
              </div>
            )}
            {contact.pec && (
              <div className="contact-detail">
                <Mail size={20} />
                <div>
                  <strong>PEC</strong>
                  <span>{contact.pec}</span>
                </div>
              </div>
            )}
            {contact.vatNumber && <p className="small-note">P. IVA {contact.vatNumber}</p>}
            <div className="contact-map">
              <iframe
                title="Mappa Agenzia Casadibari"
                src={contact.mapsEmbedUrl || defaultContact.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <form className="form-card" onSubmit={submit}>
            <div className="form-card__heading">
              <span className="form-card__icon">
                <Mail size={22} />
              </span>
              <div>
                <h2>Scrivici</h2>
                <p>Ti risponderemo appena possibile.</p>
              </div>
            </div>
            <label className="field">
              <span>Nome e cognome *</span>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="field">
              <span>Email *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Telefono</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Oggetto</span>
              <input
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                placeholder="Es. Informazioni su un immobile"
              />
            </label>
            <label className="field">
              <span>Messaggio *</span>
              <textarea
                rows={5}
                required
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.privacy_consent}
                onChange={(e) => update('privacy_consent', e.target.checked)}
              />
              <span>
                Acconsento al trattamento dei dati per ricevere risposta alla richiesta. *
              </span>
            </label>
            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={sending}
              endIcon={<ArrowRight size={17} />}
            >
              {sending ? 'Invio…' : 'Invia messaggio'}
            </Button>
            {status && (
              <p className="form-feedback" role="status">
                {status}
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Seo
        title="Informativa privacy | Casadibari Immobiliare"
        description="Informazioni sul trattamento dei dati raccolti attraverso i moduli del sito Casadibari Immobiliare."
        path="/privacy"
      />
      <PageHero
        eyebrow="Informazioni"
        title="Privacy e trattamento dei dati"
        description="Questa sezione riepiloga i principi generali applicati ai moduli del sito."
      />
      <section className="section">
        <div className="container legal-copy">
          
          <h2>Titolare del trattamento</h2>
          <p>
            Casadibari Immobiliare sas di Casadibari Maurizio &amp; C, con sede in Via Pasubio 78A,
            70125 Bari. P. IVA 08451090727. I recapiti email e PEC devono essere completati nella
            sezione Contatti.
          </p>
          <h2>Quali dati raccogliamo</h2>
          <p>
            I moduli possono raccogliere nome, cognome, email, telefono, informazioni sull’immobile
            e contenuti del messaggio. Per gli avvisi immobiliari viene raccolta anche la preferenza
            di ricerca e il consenso a ricevere comunicazioni pertinenti.
          </p>
          <h2>Perché li utilizziamo</h2>
          <p>
            I dati dei moduli di contatto e valutazione sono utilizzati per rispondere alla
            richiesta. I dati degli avvisi immobiliari sono utilizzati per selezionare annunci
            compatibili con i criteri scelti e inviare un massimo di tre proposte pertinenti per
            comunicazione.
          </p>
          <h2>Conservazione e diritti</h2>
          <p>
            I tempi di conservazione e i recapiti per le richieste di accesso, rettifica,
            cancellazione o revoca del consenso devono essere definiti nell’informativa definitiva.
          </p>
          <h2>Servizi esterni</h2>
          <p>
            Il sito utilizza Supabase per la gestione dei dati e può utilizzare un fornitore di
            posta elettronica per inviare gli avvisi. La mappa incorporata è fornita da Google Maps, mentre il widget recensioni é fornito da Elfsight.
          </p>
          <Button
            component={Link}
            to="/contatti"
            variant="outlined"
            endIcon={<ArrowRight size={16} />}
          >
            Hai bisogno di informazioni?
          </Button>
        </div>
      </section>
    </>
  );
}
