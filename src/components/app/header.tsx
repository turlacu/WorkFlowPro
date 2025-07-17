
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, LogOut, ShieldCheck, ClipboardList, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { LanguageToggle } from '@/components/app/language-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter, usePathname } from 'next/navigation';
import { getTranslation, type Translations } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

// Mock user data - replace with actual auth context later
const mockUser = {
  name: "Bogdan Turlacu",
  email: "bogdan.turlacu@example.com",
  role: "Admin", // Possible values: "Admin", "Producer", "Operator"
};

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLang } = useLanguage(); 

  const handleLogout = () => {
    router.push('/login');
  };
  
  const userRoleKey = mockUser.role as keyof Translations; 
  const userRoleDisplay = getTranslation(currentLang, userRoleKey );
  const appName = getTranslation(currentLang, 'AppName');
  const homeAriaLabel = getTranslation(currentLang, 'AppHeaderHomeAriaLabel');

  let navButtonTextKey = '';
  let navButtonHref = '';
  let NavButtonIcon = null;

  if (pathname === '/assignments' || pathname === '/todays-schedule') {
    navButtonTextKey = 'GoToAdminPanel';
    navButtonHref = '/dashboard';
    NavButtonIcon = ShieldCheck;
  } else if (pathname === '/dashboard') {
    navButtonTextKey = 'GoToAssignments';
    navButtonHref = '/assignments';
    NavButtonIcon = ClipboardList;
  }
  const navButtonText = navButtonTextKey ? getTranslation(currentLang, navButtonTextKey) : '';


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section (Logo and App Name) */}
        <div className="flex items-center gap-2">
          <Link href="/assignments" className="flex items-center gap-2" aria-label={homeAriaLabel}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-2xl font-bold text-primary">{appName}</span>
          </Link>
        </div>
        
        {/* Right Section (Nav Button, Toggles, and User Menu) */}
        <div className="flex items-center gap-2">
          {/* Today's Schedule Button */}
          {(pathname === '/assignments' || pathname === '/dashboard') && (
            <Link href="/todays-schedule" passHref legacyBehavior>
              <Button variant="outline" size="default" asChild className="h-10 text-xs"> 
                <a>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {getTranslation(currentLang, 'TodaysScheduleButton')}
                </a>
              </Button>
            </Link>
          )}

          {/* Admin Panel / Go to Assignments Button */}
          {NavButtonIcon && navButtonText && navButtonHref && (
            <Link href={navButtonHref} passHref legacyBehavior>
              <Button variant="outline" size="default" asChild className="h-10 text-xs"> 
                <a>
                  <NavButtonIcon className="mr-2 h-4 w-4" />
                  {navButtonText}
                </a>
              </Button>
            </Link>
          )}

          <LanguageToggle />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-accent bg-accent">
                  <AvatarFallback>{mockUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{mockUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {mockUser.email} ({userRoleDisplay})
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{getTranslation(currentLang, 'Settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{getTranslation(currentLang, 'Logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
