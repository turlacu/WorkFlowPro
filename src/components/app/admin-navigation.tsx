'use client';

import Link from 'next/link';
import { BarChart3, CalendarDays, DatabaseBackup, FileCog, History, KeyRound, Palette, Sheet, Trash2, Upload, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

const items = [
  { href: '/dashboard/scheduling/manual', key: 'AdminNavScheduling', icon: CalendarDays, permission: 'TEAM_SCHEDULE_VIEW' },
  { href: '/dashboard/users', key: 'AdminNavUsers', icon: Users, permission: 'USER_DIRECTORY_VIEW' },
  { href: '/dashboard/statistics', key: 'AdminNavStatistics', icon: BarChart3, permission: 'ORGANIZATION_STATS_VIEW' },
  { href: '/dashboard/activity', key: 'AdminNavActivity', icon: History, permission: 'ACTIVITY_LOG_VIEW' },
  { href: '/dashboard/backups', key: 'AdminNavBackups', icon: DatabaseBackup, permission: 'BACKUP_MANAGE' },
  { href: '/dashboard/permissions', key: 'AdminNavPermissions', icon: KeyRound, permission: 'ROLE_PERMISSION_MANAGE' },
];

const schedulingItems = [
  { href: '/dashboard/scheduling/manual', key: 'ScheduleNavManual', icon: Sheet, permission: 'TEAM_SCHEDULE_MANAGE' },
  { href: '/dashboard/scheduling/import', key: 'ScheduleNavImport', icon: Upload, permission: 'SCHEDULE_IMPORT' },
  { href: '/dashboard/scheduling/delete', key: 'ScheduleNavDelete', icon: Trash2, permission: 'TEAM_SCHEDULE_MANAGE' },
  { href: '/dashboard/scheduling/excel-configurations', key: 'ScheduleNavExcelConfigurations', icon: FileCog, permission: 'EXCEL_CONFIG_MANAGE' },
  { href: '/dashboard/scheduling/color-legend', key: 'ScheduleNavColorLegend', icon: Palette, permission: 'SHIFT_LEGEND_MANAGE' },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currentLang } = useLanguage();
  const scheduling = pathname.startsWith('/dashboard/scheduling');
  const schedulingLanding = schedulingItems.find((item) => session?.user && hasPermission(session.user, item.permission as PermissionKey))?.href
    ?? '/dashboard/permissions';
  const canSee = (permission: PermissionKey, href: string) => Boolean(session?.user && (
    hasPermission(session.user, permission)
    || (href === '/dashboard/scheduling/manual' && [
      'TEAM_SCHEDULE_MANAGE', 'SCHEDULE_IMPORT', 'EXCEL_CONFIG_MANAGE', 'SHIFT_LEGEND_MANAGE',
    ].some((candidate) => hasPermission(session.user, candidate as PermissionKey)))
  ));

  const link = (item: { href: string; key: string; icon: typeof CalendarDays; permission: PermissionKey }, nested = false) => {
    const active = nested ? pathname === item.href : pathname === item.href || (item.href.includes('/scheduling/') && scheduling);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          nested && 'lg:pl-3',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {getTranslation(currentLang, item.key)}
      </Link>
    );
  };

  return (
    <aside className="min-w-0 max-w-full lg:sticky lg:top-24 lg:self-start" aria-label={getTranslation(currentLang, 'AdminNavigation')}>
      <nav className="min-w-0 max-w-full space-y-2 overflow-hidden border-b pb-4 lg:space-y-3 lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
        <div className="flex max-w-full gap-1 overflow-x-auto overscroll-x-contain pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.filter((item) => canSee(item.permission as PermissionKey, item.href)).map((item) => link({
            ...item,
            href: item.href === '/dashboard/scheduling/manual' ? schedulingLanding : item.href,
          } as Parameters<typeof link>[0]))}
        </div>
        {scheduling && (
          <div className="flex max-w-full gap-1 overflow-x-auto overscroll-x-contain border-t pt-2 lg:flex-col lg:overflow-visible">
            {schedulingItems.filter((item) => session?.user && hasPermission(session.user, item.permission as PermissionKey)).map((item) => link(item as Parameters<typeof link>[0], true))}
          </div>
        )}
      </nav>
    </aside>
  );
}
