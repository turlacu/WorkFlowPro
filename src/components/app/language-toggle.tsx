
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { toast } = useToast();
  const { currentLang, setLanguage } = useLanguage();

  const handleToggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ro' : 'en';
    setLanguage(newLang);

    const langName = getTranslation(newLang, newLang === 'en' ? 'LanguageName_en' : 'LanguageName_ro');
    
    let description = getTranslation(newLang, 'LanguageSetTo_description', { langName });
    // The partial translation message was previously removed, keeping it that way.
    // if (newLang === 'ro') {
    //   description += getTranslation(newLang, 'PartialTranslation_message');
    // }
    
    toast({
        title: getTranslation(newLang, 'LanguageChanged_title'),
        description: description,
    });
  };

  const toggleButtonLabel = getTranslation(currentLang, 'ToggleLanguage_aria');
  // Display the current language on the button
  const displayLangText = currentLang === 'en' ? 'EN' : 'RO';

  return (
    <Button variant="ghost" size="icon" onClick={handleToggleLanguage} aria-label={toggleButtonLabel}>
      <span className="text-xs font-bold" aria-hidden="true">{displayLangText}</span>
      <span className="sr-only">{toggleButtonLabel}</span>
    </Button>
  );
}
