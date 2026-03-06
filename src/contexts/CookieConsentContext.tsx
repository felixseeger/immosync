import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sitesync-cookie-consent';

export interface CookieConsentState {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface StoredConsent {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  choiceMade: boolean;
}

const defaultConsent: CookieConsentState = {
  analytics: false,
  marketing: false,
  preferences: false,
};

function loadStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.preferences !== 'boolean') return null;
    return {
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      preferences: !!parsed.preferences,
      choiceMade: !!parsed.choiceMade,
    };
  } catch {
    return null;
  }
}

function saveStored(consent: CookieConsentState, choiceMade: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...consent, choiceMade }));
  } catch {
    // ignore
  }
}

interface CookieConsentContextValue {
  consent: CookieConsentState;
  showBanner: boolean;
  showSettings: boolean;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: CookieConsentState) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentState>(defaultConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setConsent({
        analytics: stored.analytics,
        marketing: stored.marketing,
        preferences: stored.preferences,
      });
      setHasConsented(stored.choiceMade);
      setShowBanner(!stored.choiceMade);
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const next = { analytics: true, marketing: true, preferences: true };
    setConsent(next);
    setHasConsented(true);
    setShowBanner(false);
    setShowSettings(false);
    saveStored(next, true);
  }, []);

  const rejectAll = useCallback(() => {
    const next = { analytics: false, marketing: false, preferences: false };
    setConsent(next);
    setHasConsented(true);
    setShowBanner(false);
    setShowSettings(false);
    saveStored(next, true);
  }, []);

  const savePreferences = useCallback((prefs: CookieConsentState) => {
    setConsent(prefs);
    setHasConsented(true);
    setShowBanner(false);
    setShowSettings(false);
    saveStored(prefs, true);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const value: CookieConsentContextValue = {
    consent,
    showBanner,
    showSettings,
    hasConsented,
    acceptAll,
    rejectAll,
    savePreferences,
    openSettings,
    closeSettings,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
