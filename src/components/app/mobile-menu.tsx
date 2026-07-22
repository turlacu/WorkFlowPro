'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarClock, ClipboardList, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MobileMenu() {
  const pathname = usePathname();
  const { currentLang } = useLanguage();
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const user = session?.user || { name: 'Loading…', email: '', role: 'OPERATOR' };
  const initials = user.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();

  const links = [
    { href: '/assignments', label: getTranslation(currentLang, 'GoToAssignments'), icon: ClipboardList },
    { href: '/todays-schedule', label: getTranslation(currentLang, 'TodaysScheduleButton'), icon: CalendarClock },
    ...(session?.user?.role === 'ADMIN'
      ? [{ href: '/dashboard/scheduling/manual', label: getTranslation(currentLang, 'GoToAdminPanel'), icon: ShieldCheck }]
      : []),
    { href: '/settings', label: getTranslation(currentLang, 'Settings'), icon: Settings },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={getTranslation(currentLang, 'OpenNavigation')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[min(88vw,22rem)] flex-col overflow-y-auto p-0">
        <SheetHeader className="border-b px-5 py-5 text-left">
          <SheetTitle>{getTranslation(currentLang, 'Navigation')}</SheetTitle>
          <SheetDescription>{getTranslation(currentLang, 'NavigationDescription')}</SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-3 border-b px-5 py-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label={getTranslation(currentLang, 'PrimaryNavigation')}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href.startsWith('/dashboard') && pathname.startsWith('/dashboard'));
            return (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="min-h-11 w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {getTranslation(currentLang, 'Logout')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
