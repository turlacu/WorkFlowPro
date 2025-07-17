
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

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

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

  async function onSubmit(data: UserAuthFormValues) {
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
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
        router.push('/assignments');
      }
    } catch (error) {
      console.error('Login error:', error);
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
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{getTranslation(currentLang, 'EmailLabel')}</Label>
            <Input
              id="email"
              placeholder={getTranslation(currentLang, 'EmailPlaceholder')}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-destructive">
                {emailErrorMessage || errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{getTranslation(currentLang, 'PasswordLabel')}</Label>
            <Input
              id="password"
              placeholder={getTranslation(currentLang, 'PasswordPlaceholder')}
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-destructive">
                {passwordErrorMessage || errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
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
