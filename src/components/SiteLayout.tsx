import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { Button, IconButton } from '@mui/material';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ContactSettings } from '../types';

const defaultContact: ContactSettings = {
  businessName: 'Casadibari Immobiliare sas di Casadibari Maurizio & C',
  vatNumber: '08451090727',
  address: 'Via Pasubio, 78A, 70125 Bari BA',
  phone: '080 849 1745',
  email: 'info@casadibari.it',
  whatsapp: '393338510522',
  mapsEmbedUrl: 'https://www.google.com/maps?q=Via%20Pasubio%2078A%20Bari&output=embed',
};

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactMenuOpen, setContactMenuOpen] = useState(false);
  const [contact, setContact] = useState<ContactSettings>(defaultContact);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
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
            phone: savedContact.phone?.trim() || defaultContact.phone,
            email: savedContact.email?.trim() || defaultContact.email,
            whatsapp: savedContact.whatsapp?.replace(/\D/g, '') || defaultContact.whatsapp,
          });
        }
      });
  }, []);

  useEffect(() => {
    if (!contactMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContactMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [contactMenuOpen]);

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/immobili', label: 'Immobili' },
    { to: '/valutazione', label: 'Valuta il tuo immobile' },
    { to: '/guide', label: 'Guide e consigli' },
    { to: '/chi-siamo', label: 'Chi siamo' },
    { to: '/consulenza-mutui', label: 'Mutui e prestiti' },
  ];
  const closeMenu = () => setMenuOpen(false);
  const publicPhone = contact.phone?.trim() || defaultContact.phone || '';
  const publicEmail = contact.email?.trim() || defaultContact.email || '';
  const tel = publicPhone ? 'tel:' + publicPhone.replace(/[^+\d]/g, '') : undefined;
  const mobileTel = contact.mobile ? 'tel:' + contact.mobile.replace(/[^+\d]/g, '') : undefined;
  const whatsappNumber = (contact.whatsapp || defaultContact.whatsapp || '').replace(/\D/g, '');
  const closeContactMenu = () => setContactMenuOpen(false);

  return (
    <div className="app-shell">
      <div className="top-strip">
        <div className="container top-strip__inner">
          <span>
            <MapPin size={13} /> Bari, Puglia
          </span>
          <div className="top-strip__contacts">
            {contact.phone && (
              <a href={tel}>
                <Phone size={13} /> {contact.phone}
              </a>
            )}
            {publicEmail && (
              <a href={'mailto:' + publicEmail}>
                <Mail size={13} /> {publicEmail}
              </a>
            )}
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link
            className="brand"
            to="/"
            onClick={closeMenu}
            aria-label="Casadibari Immobiliare, homepage"
          >
            <img src="/Logo%20Agenzia%20Casadibari.webp" alt="Casadibari Agenzia Immobiliare" />
          </Link>
          <IconButton
            className="mobile-menu-toggle"
            color="primary"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>
          <nav
            className={'main-nav' + (menuOpen ? ' main-nav--open' : '')}
            aria-label="Navigazione principale"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                onClick={closeMenu}
                className={({ isActive }) => 'main-nav__link' + (isActive ? ' is-active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
            <Button
              component={Link}
              to="/contatti"
              variant="contained"
              color="primary"
              className="nav-cta"
              onClick={closeMenu}
            >
              Contattaci <span aria-hidden="true"></span>
            </Button>
          </nav>
        </div>
      </header>

      <main id="contenuto-principale">
        <Outlet />
      </main>

      <footer className="site-footer" id="contatti">
        <div className="container footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/Logo%20Agenzia%20Casadibari.webp" alt="Casadibari Immobiliare" />
            </Link>
            <p>Il tuo Partner di fiducia nel mondo immobiliare.</p>
            <p className="footer-muted">Dal 2001 ti accompagniamo nelle scelte che contano.</p>
            <div className="social-links">
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
              )}
            </div>
          </div>
          <div className="footer-column">
            <h3>Esplora</h3>
            <Link to="/immobili">Tutti gli immobili</Link>
            <Link to="/guide">Guide e consigli</Link>
            <Link to="/valutazione">Valuta casa</Link>
            <Link to="/pubblica-con-noi">Pubblica con noi</Link>
            <Link to="/consulenza-mutui">Mutui e prestiti</Link>
          </div>
          <div className="footer-column">
            <h3>Contatti</h3>
            {contact.address && (
              <p>
                <MapPin size={16} /> {contact.address}
              </p>
            )}
            {contact.phone && (
              <a href={tel}>
                <Phone size={16} /> {contact.phone}
              </a>
            )}
            {contact.mobile && (
              <a href={mobileTel}>
                <Phone size={16} /> {contact.mobile}
              </a>
            )}
            {publicEmail && (
              <a href={'mailto:' + publicEmail}>
                <Mail size={16} /> {publicEmail}
              </a>
            )}
            {contact.pec && (
              <p>
                <Mail size={16} /> PEC: {contact.pec}
              </p>
            )}
            {contact.vatNumber && <p className="footer-muted">P. IVA {contact.vatNumber}</p>}
          </div>
          <div className="footer-map">
            <h3>Vieni a trovarci</h3>
            <iframe
              title="Posizione Agenzia Casadibari a Bari"
              src={contact.mapsEmbedUrl || defaultContact.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              className="text-link"
              href={
                'https://www.google.com/maps/search/?api=1&query=' +
                encodeURIComponent(
                  contact.address || defaultContact.address || 'Via Pasubio 78A Bari',
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              Apri indicazioni su Maps
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container footer-bottom__inner">
            <span>
              © {new Date().getFullYear()} {contact.businessName || 'Casadibari Immobiliare'}. Tutti
              i diritti riservati.
            </span>
            <div>
              <Link to="/privacy">Privacy</Link>
              <Link to="/admin">Area riservata</Link>
            </div>
          </div>
        </div>
      </footer>
      <div className={'contact-radial' + (contactMenuOpen ? ' is-open' : '')}>
        <div
          className="contact-radial__actions"
          id="contact-radial-actions"
          aria-hidden={!contactMenuOpen}
        >
          <a
            className="contact-radial__action contact-radial__action--whatsapp"
            href={'https://wa.me/' + whatsappNumber}
            target="_blank"
            rel="noreferrer"
            aria-label="Contatta l’agenzia su WhatsApp"
            title="WhatsApp"
            onClick={closeContactMenu}
            tabIndex={contactMenuOpen ? 0 : -1}
          >
            <MessageCircle size={19} aria-hidden="true" />
          </a>
          {tel && (
            <a
              className="contact-radial__action contact-radial__action--phone"
              href={tel}
              aria-label="Chiama l’agenzia"
              title="Chiama l’agenzia"
              onClick={closeContactMenu}
              tabIndex={contactMenuOpen ? 0 : -1}
            >
              <Phone size={18} aria-hidden="true" />
            </a>
          )}
          <a
            className="contact-radial__action contact-radial__action--email"
            href={'mailto:' + publicEmail}
            aria-label="Scrivi un’email all’agenzia"
            title="Email"
            onClick={closeContactMenu}
            tabIndex={contactMenuOpen ? 0 : -1}
          >
            <Mail size={18} aria-hidden="true" />
          </a>
        </div>
        <button
          className="contact-radial__toggle"
          type="button"
          aria-label={contactMenuOpen ? 'Chiudi il menu contatti' : 'Apri il menu contatti'}
          aria-expanded={contactMenuOpen}
          aria-controls="contact-radial-actions"
          onClick={() => setContactMenuOpen((open) => !open)}
        >
          {contactMenuOpen ? <X size={24} /> : <MessageCircle size={25} />}
        </button>
      </div>
    </div>
  );
}
