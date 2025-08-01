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
      <div className="md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="h-10 w-10"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

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
        fixed top-14 sm:top-16 left-0 right-0 bottom-0 z-50 md:hidden bg-background transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* User Info Section */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="text-lg font-semibold bg-primary/10">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-lg font-semibold leading-tight truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {user.email}
              </p>
              <p className="text-sm text-primary font-medium mt-0.5">
                {userRoleDisplay}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-3">Navigation</h3>
            
            {/* Assignments */}
            <Link href="/assignments" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-14 text-base rounded-xl">
                <ClipboardList className="mr-4 h-6 w-6" />
                {getTranslation(String(currentLang), 'GoToAssignments')}
              </Button>
            </Link>

            {/* Admin Panel/Dashboard */}
            <Link href="/dashboard" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-14 text-base rounded-xl">
                <ShieldCheck className="mr-4 h-6 w-6" />
                {getTranslation(String(currentLang), 'GoToAdminPanel')}
              </Button>
            </Link>

            {/* Today's Schedule */}
            <Link href="/todays-schedule" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-14 text-base rounded-xl">
                <CalendarClock className="mr-4 h-6 w-6" />
                {getTranslation(String(currentLang), 'TodaysScheduleButton')}
              </Button>
            </Link>

            {/* Settings */}
            <Link href="/settings" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start h-14 text-base rounded-xl">
                <Settings className="mr-4 h-6 w-6" />
                {getTranslation(String(currentLang), 'Settings')}
              </Button>
            </Link>
          </div>

          {/* Logout Section */}
          <div className="pt-6 mt-auto">
            <div className="border-t border-border pt-6">
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start h-14 text-base rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <LogOut className="mr-4 h-6 w-6" />
                {getTranslation(String(currentLang), 'Logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}