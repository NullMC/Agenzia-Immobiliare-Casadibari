import { Navigate, Route, Routes } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyPage from './pages/PropertyPage';
import { AboutPage, ContactPage, FaqPage, MortgagePage, PrivacyPage, PublishPage, ValuationPage } from './pages/StaticPages';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/immobili" element={<PropertiesPage />} />
        <Route path="/immobile/:slug" element={<PropertyPage />} />
        <Route path="/chi-siamo" element={<AboutPage />} />
        <Route path="/valutazione" element={<ValuationPage />} />
        <Route path="/consulenza-mutui" element={<MortgagePage />} />
        <Route path="/pubblica-con-noi" element={<PublishPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contatti" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}