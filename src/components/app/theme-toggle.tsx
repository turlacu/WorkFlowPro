
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { currentLang } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === 'dark' || theme === 'system' ? 'light' : 'dark');
  };

  const buttonAriaLabel = getTranslation(currentLang, 'ToggleTheme_aria');

  return (
    <Button className="hover:bg-accent hover:text-accent-foreground h-10 w-10 p-0" onClick={toggleTheme} aria-label={buttonAriaLabel}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{buttonAriaLabel}</span>
    </Button>
  );
}
