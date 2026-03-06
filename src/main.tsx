import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookieConsentProvider>
      <App />
    </CookieConsentProvider>
  </StrictMode>,
);
