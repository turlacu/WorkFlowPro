
'use client'; // LoginPage needs to be a client component to use hooks

import { UserAuthForm } from '@/components/app/user-auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react'; 
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

export default function LoginPage() {
  const { currentLang } = useLanguage(); // Use context
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
             <CalendarCheck size={48} />
          </div>
          <CardTitle className="text-3xl font-bold">{getTranslation(currentLang, 'LoginTitle')}</CardTitle>
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
