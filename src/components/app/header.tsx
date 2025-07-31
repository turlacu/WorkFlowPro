
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, LogOut, ShieldCheck, ClipboardList, CalendarClock, Menu, X } from 'lucide-react';
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
import { useSession, signOut } from 'next-auth/react';

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLang } = useLanguage();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  // Use session data or fallback to default
  const user = session?.user || { name: "Loading...", email: "", role: "OPERATOR" };
  const userRoleKey = String(user.role); 
  const userRoleDisplay = getTranslation(String(currentLang), userRoleKey );
  const appName = getTranslation(String(currentLang), 'AppName');
  const homeAriaLabel = getTranslation(String(currentLang), 'AppHeaderHomeAriaLabel');

  let navButtonTextKey = '';
  let navButtonHref = '';
  let NavButtonIcon = null;
  
  // Assignments button for Today's Schedule page
  let assignmentsButtonTextKey = '';
  let assignmentsButtonHref = '';
  let AssignmentsButtonIcon = null;

  if (pathname === '/assignments') {
    navButtonTextKey = 'GoToAdminPanel';
    navButtonHref = '/dashboard';
    NavButtonIcon = ShieldCheck;
  } else if (pathname === '/dashboard') {
    navButtonTextKey = 'GoToAssignments';
    navButtonHref = '/assignments';
    NavButtonIcon = ClipboardList;
  } else if (pathname === '/todays-schedule') {
    // Show both Admin Panel and Assignments buttons
    navButtonTextKey = 'GoToAdminPanel';
    navButtonHref = '/dashboard';
    NavButtonIcon = ShieldCheck;
    
    assignmentsButtonTextKey = 'GoToAssignments';
    assignmentsButtonHref = '/assignments';
    AssignmentsButtonIcon = ClipboardList;
  }
  
  const navButtonText = navButtonTextKey ? getTranslation(String(currentLang), navButtonTextKey) : '';
  const assignmentsButtonText = assignmentsButtonTextKey ? getTranslation(String(currentLang), assignmentsButtonTextKey) : '';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* Left Section (Logo and App Name) */}
          <div className="flex items-center gap-2">
            <Link href="/assignments" className="flex items-center gap-2" aria-label={homeAriaLabel}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{appName}</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Today's Schedule Button */}
            {(pathname === '/assignments' || pathname === '/dashboard') && (
              <Link href="/todays-schedule" passHref legacyBehavior>
                <Button asChild variant="outline" size="sm"> 
                  <a>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {getTranslation(String(currentLang), 'TodaysScheduleButton')}
                  </a>
                </Button>
              </Link>
            )}

            {/* Assignments Button (only for Today's Schedule page) */}
            {AssignmentsButtonIcon && assignmentsButtonText && assignmentsButtonHref && (
              <Link href={assignmentsButtonHref} passHref legacyBehavior>
                <Button asChild variant="outline" size="sm"> 
                  <a>
                    <AssignmentsButtonIcon className="mr-2 h-4 w-4" />
                    {assignmentsButtonText}
                  </a>
                </Button>
              </Link>
            )}

            {/* Admin Panel / Go to Assignments Button */}
            {NavButtonIcon && navButtonText && navButtonHref && (
              <Link href={navButtonHref} passHref legacyBehavior>
                <Button asChild variant="outline" size="sm"> 
                  <a>
                    <NavButtonIcon className="mr-2 h-4 w-4" />
                    {navButtonText}
                  </a>
                </Button>
              </Link>
            )}

            <LanguageToggle />
            <ThemeToggle />
            
            {/* Desktop User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email} ({userRoleDisplay})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{getTranslation(String(currentLang), 'Settings')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{getTranslation(String(currentLang), 'Logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button - Visible only on mobile */}
          <div className="md:hidden flex items-center gap-1">
            {/* Mobile Theme and Language toggles */}
            <LanguageToggle />
            <ThemeToggle />
            
            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={closeMobileMenu}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        fixed top-14 sm:top-16 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-sm border-b shadow-lg transform transition-transform duration-300 ease-in-out max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto
        ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <div className="px-4 py-4 space-y-4">
          {/* User Info Section */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
            <Avatar className="h-12 w-12 border-2 border-accent/30">
              <AvatarFallback className="text-sm font-medium">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-medium leading-none truncate">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1.5 truncate">
                {user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground mt-0.5">
                ({userRoleDisplay})
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2 pb-2">
            {/* Today's Schedule Button */}
            {(pathname === '/assignments' || pathname === '/dashboard') && (
              <Link href="/todays-schedule" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start h-12 text-sm">
                  <CalendarClock className="mr-3 h-5 w-5" />
                  {getTranslation(String(currentLang), 'TodaysScheduleButton')}
                </Button>
              </Link>
            )}

            {/* Assignments Button (only for Today's Schedule page) */}
            {AssignmentsButtonIcon && assignmentsButtonText && assignmentsButtonHref && (
              <Link href={assignmentsButtonHref} onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start h-12 text-sm">
                  <AssignmentsButtonIcon className="mr-3 h-5 w-5" />
                  {assignmentsButtonText}
                </Button>
              </Link>
            )}

            {/* Admin Panel / Go to Assignments Button */}
            {NavButtonIcon && navButtonText && navButtonHref && (
              <Link href={navButtonHref} onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start h-12 text-sm">
                  <NavButtonIcon className="mr-3 h-5 w-5" />
                  {navButtonText}
                </Button>
              </Link>
            )}

            {/* Settings Link */}
            <Link href="/settings" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-12 text-sm">
                <Settings className="mr-3 h-5 w-5" />
                {getTranslation(String(currentLang), 'Settings')}
              </Button>
            </Link>

            {/* Logout Button */}
            <Button 
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start h-12 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {getTranslation(String(currentLang), 'Logout')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
