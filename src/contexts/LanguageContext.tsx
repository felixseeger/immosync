import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Dictionary, getDictionary, Language } from '../i18n';

const STORAGE_KEY = 'ui-language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'de';
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored === 'en' || stored === 'de' || stored === 'zh' || stored === 'ja' || stored === 'fr' ? stored : 'de';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t: getDictionary(language) }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
