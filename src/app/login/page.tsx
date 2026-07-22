
'use client'; // LoginPage needs to be a client component to use hooks

import { UserAuthForm } from '@/components/app/user-auth-form';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react'; 
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage
import { LanguageToggle } from '@/components/app/language-toggle';
import { ThemeToggle } from '@/components/app/theme-toggle';

export default function LoginPage() {
  const { currentLang } = useLanguage(); // Use context
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
             <CalendarCheck size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{getTranslation(currentLang, 'LoginTitle')}</h1>
          <CardDescription>{getTranslation(currentLang, 'LoginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        {getTranslation(currentLang, 'LoginFooter', { year: currentYear.toString() })}
      </footer>
    </div>
  );
}
