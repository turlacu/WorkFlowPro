
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation'; 
import { signIn } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type UserAuthFormValues = z.infer<typeof loginSchema>;

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter();
  const { currentLang } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserAuthFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [authenticationError, setAuthenticationError] = React.useState<string | null>(null);

  async function onSubmit(data: UserAuthFormValues) {
    setIsLoading(true);
    setAuthenticationError(null);
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setAuthenticationError(getTranslation(currentLang, 'LoginFailedDescription'));
        toast({
          title: getTranslation(currentLang, 'LoginFailedTitle'),
          description: getTranslation(currentLang, 'LoginFailedDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: getTranslation(currentLang, 'LoginSuccessTitle'),
          description: getTranslation(currentLang, 'LoginSuccessDescription'),
        });
        router.replace('/assignments');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthenticationError(getTranslation(currentLang, 'LoginFailedDescription'));
      toast({
        title: getTranslation(currentLang, 'LoginFailedTitle'),
        description: getTranslation(currentLang, 'LoginFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const emailErrorMessage = errors.email ? getTranslation(currentLang, 'ZodEmailInvalid') : undefined;
  const passwordErrorMessage = errors.password ? getTranslation(currentLang, 'ZodPasswordRequired') : undefined;

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4" aria-busy={isLoading}>
          {authenticationError && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {authenticationError}
            </div>
          )}
          <div className="grid gap-2 sm:gap-2">
            <Label htmlFor="email">{getTranslation(currentLang, 'EmailLabel')}</Label>
            <Input
              id="email"
              placeholder={getTranslation(currentLang, 'EmailPlaceholder')}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="h-11 sm:h-10 text-base sm:text-sm"
              {...register('email')}
            />
            {errors?.email && (
              <p id="email-error" className="px-1 text-sm text-destructive">
                {emailErrorMessage || errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2 sm:gap-2">
            <Label htmlFor="password">{getTranslation(currentLang, 'PasswordLabel')}</Label>
            <Input
              id="password"
              placeholder={getTranslation(currentLang, 'PasswordPlaceholder')}
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="h-11 sm:h-10 text-base sm:text-sm"
              {...register('password')}
            />
            {errors?.password && (
              <p id="password-error" className="px-1 text-sm text-destructive">
                {passwordErrorMessage || errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-11 sm:h-10 text-base sm:text-sm">
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {getTranslation(currentLang, 'SignInButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
