'use client';

import Link from 'next/link';
import { CalendarClock, ClipboardList, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageToggle } from '@/components/app/language-toggle';
import MobileMenu from '@/components/app/mobile-menu';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';

export default function AppHeader() {
  const pathname = usePathname();
  const { currentLang } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user || { name: 'Loading…', email: '', role: 'OPERATOR' };
  const initials = user.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();
  const links = [
    { href: '/assignments', label: getTranslation(currentLang, 'GoToAssignments'), icon: ClipboardList },
    { href: '/todays-schedule', label: getTranslation(currentLang, 'TodaysScheduleButton'), icon: CalendarClock },
    ...(session?.user?.role === 'ADMIN'
      ? [{ href: '/dashboard/scheduling/manual', label: getTranslation(currentLang, 'GoToAdminPanel'), icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-3 sm:px-4 lg:px-6">
        <MobileMenu />
        <Link href="/assignments" className="flex min-w-0 items-center gap-2" aria-label={getTranslation(currentLang, 'AppHeaderHomeAriaLabel')}>
          <CalendarClock className="h-6 w-6 shrink-0 text-primary" />
          <span className="truncate text-base font-bold text-foreground sm:text-lg">{getTranslation(currentLang, 'AppName')}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label={getTranslation(currentLang, 'PrimaryNavigation')}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href.startsWith('/dashboard') && pathname.startsWith('/dashboard'));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageToggle />
          <ThemeToggle />
          <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label={user.name}>
                <Avatar className="h-8 w-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" />{getTranslation(currentLang, 'Settings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />{getTranslation(currentLang, 'Logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
