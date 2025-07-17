
'use client';

import * as React from 'react';
import AppHeader from '@/components/app/header';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext'; 

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { currentLang } = useLanguage();
  const currentYear = new Date().getFullYear();
  const footerText = getTranslation(currentLang, 'AppFooter', { year: currentYear.toString() });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
         {footerText}
      </footer>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayoutContent>{children}</AppLayoutContent>
  );
}

