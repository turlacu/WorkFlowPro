'use client';

import Link from 'next/link';
import { BarChart3, CalendarDays, DatabaseBackup, FileCog, Palette, Sheet, Trash2, Upload, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard/scheduling/manual', key: 'AdminNavScheduling', icon: CalendarDays },
  { href: '/dashboard/users', key: 'AdminNavUsers', icon: Users },
  { href: '/dashboard/statistics', key: 'AdminNavStatistics', icon: BarChart3 },
  { href: '/dashboard/backups', key: 'AdminNavBackups', icon: DatabaseBackup },
];

const schedulingItems = [
  { href: '/dashboard/scheduling/manual', key: 'ScheduleNavManual', icon: Sheet },
  { href: '/dashboard/scheduling/import', key: 'ScheduleNavImport', icon: Upload },
  { href: '/dashboard/scheduling/delete', key: 'ScheduleNavDelete', icon: Trash2 },
  { href: '/dashboard/scheduling/excel-configurations', key: 'ScheduleNavExcelConfigurations', icon: FileCog },
  { href: '/dashboard/scheduling/color-legend', key: 'ScheduleNavColorLegend', icon: Palette },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const { currentLang } = useLanguage();
  const scheduling = pathname.startsWith('/dashboard/scheduling');

  const link = (item: typeof items[number], nested = false) => {
    const active = nested ? pathname === item.href : pathname === item.href || (item.href.includes('/scheduling/') && scheduling);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          nested && 'min-h-10 pl-5 text-[0.8125rem]',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {getTranslation(currentLang, item.key)}
      </Link>
    );
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={getTranslation(currentLang, 'AdminNavigation')}>
      <nav className="flex gap-1 overflow-x-auto border-b pb-3 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
        {items.map((item) => link(item))}
        {scheduling && (
          <div className="contents lg:mt-2 lg:block lg:space-y-1 lg:border-t lg:pt-2">
            {schedulingItems.map((item) => link(item, true))}
          </div>
        )}
      </nav>
    </aside>
  );
}
