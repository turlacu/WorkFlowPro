
'use client';

import * as React from 'react';
import AppHeader from '@/components/app/header';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext'; 
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PresenceProvider } from '@/contexts/PresenceContext';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { currentLang } = useLanguage();
  const currentYear = new Date().getFullYear();
  const footerText = getTranslation(currentLang, 'AppFooter', { year: currentYear.toString() });

  return (
    <PresenceProvider>
      <NotificationProvider>
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background">
          <AppHeader />
          <main className="mx-auto w-full min-w-0 max-w-7xl flex-grow px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
            {children}
          </main>
          <footer className="py-4 text-center text-sm text-muted-foreground border-t px-3 sm:px-4">
            {footerText}
          </footer>
        </div>
      </NotificationProvider>
    </PresenceProvider>
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
