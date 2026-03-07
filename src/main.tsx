import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import App from './App.tsx';
import NotFoundPage from './components/NotFoundPage';
import ImprintPage from './components/ImprintPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CookieConsentProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/imprint" element={<ImprintPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CookieConsentProvider>
    </BrowserRouter>
  </StrictMode>,
);
