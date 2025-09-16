'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, LogOut, ShieldCheck, ClipboardList, CalendarClock, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession, signOut } from 'next-auth/react';

export default function MobileMenu() {
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
  
  const user = session?.user || { name: "Loading...", email: "", role: "OPERATOR" };
  const userRoleKey = String(user.role); 
  const userRoleDisplay = getTranslation(String(currentLang), userRoleKey );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden relative z-[10000]">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="h-10 w-10 relative z-[10000]"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay - Only show when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[9999] md:hidden"
          onClick={closeMobileMenu}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Menu Panel - Only show when menu is open */}
      {isMobileMenuOpen && (
        <div className="fixed top-14 sm:top-16 left-0 right-0 z-[9999] md:hidden bg-background border-t shadow-2xl max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-4 h-full overflow-hidden">
          {/* User Info Section - Compact */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="text-sm font-semibold bg-primary/10">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-base font-semibold leading-tight truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-primary font-medium">{userRoleDisplay}</p>
            </div>
          </div>

          {/* Navigation Links - Compact */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Navigation</h3>
            
            {/* Assignments */}
            <Link href="/assignments" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-11 text-sm rounded-lg">
                <ClipboardList className="mr-3 h-4 w-4" />
                {getTranslation(String(currentLang), 'GoToAssignments')}
              </Button>
            </Link>

            {/* Admin Panel/Dashboard - Only visible to ADMIN users */}
            {session?.user?.role === 'ADMIN' && (
              <Link href="/dashboard" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start h-11 text-sm rounded-lg">
                  <ShieldCheck className="mr-3 h-4 w-4" />
                  {getTranslation(String(currentLang), 'GoToAdminPanel')}
                </Button>
              </Link>
            )}

            {/* Today's Schedule */}
            <Link href="/todays-schedule" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-11 text-sm rounded-lg">
                <CalendarClock className="mr-3 h-4 w-4" />
                {getTranslation(String(currentLang), 'TodaysScheduleButton')}
              </Button>
            </Link>

            {/* Settings */}
            <Link href="/settings" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-11 text-sm rounded-lg">
                <Settings className="mr-3 h-4 w-4" />
                {getTranslation(String(currentLang), 'Settings')}
              </Button>
            </Link>
          </div>

          {/* Logout Section - Compact */}
          <div className="pt-3 border-t border-border">
            <Button 
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start h-11 text-sm rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {getTranslation(String(currentLang), 'Logout')}
            </Button>
          </div>
        </div>
        </div>
      )}
    </>
  );
}