
'use client';

import * as React from 'react';
import type { AppTranslations } from '@/lib/translations';

interface LanguageContextType {
  currentLang: keyof AppTranslations; // 'en' | 'ro'
  setLanguage: (lang: keyof AppTranslations) => void;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = React.useState<keyof AppTranslations>('en');

  const setLanguage = (lang: keyof AppTranslations) => {
    setCurrentLang(lang);
    window.localStorage.setItem('workflowpro-language', lang);
    document.documentElement.lang = lang;
    document.cookie = `workflowpro-language=${lang}; path=/; max-age=31536000; samesite=lax`;
  };

  React.useEffect(() => {
    const storedLang = window.localStorage.getItem('workflowpro-language');
    const lang = storedLang === 'ro' ? 'ro' : 'en';
    setCurrentLang(lang);
    document.documentElement.lang = lang;
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
