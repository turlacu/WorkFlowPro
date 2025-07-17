
'use client';

import * as React from 'react';
import type { Translations } from '@/lib/translations'; // Assuming this type exists

interface LanguageContextType {
  currentLang: keyof Translations; // 'en' | 'ro'
  setLanguage: (lang: keyof Translations) => void;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = React.useState<keyof Translations>('en');

  const setLanguage = (lang: keyof Translations) => {
    setCurrentLang(lang);
    // Optionally, persist language preference (e.g., localStorage)
    // localStorage.setItem('appLanguage', lang);
  };

  // Optionally, load preference on initial mount
  // React.useEffect(() => {
  //   const storedLang = localStorage.getItem('appLanguage') as keyof Translations | null;
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
