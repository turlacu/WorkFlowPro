
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
    // Optionally, persist language preference (e.g., localStorage)
    // localStorage.setItem('appLanguage', lang);
  };

  // Optionally, load preference on initial mount
  // React.useEffect(() => {
  //   const storedLang = localStorage.getItem('appLanguage') as keyof AppTranslations | null;
  //   if (storedLang) {
  //     setCurrentLang(storedLang);
  //   }
  // }, []);

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
