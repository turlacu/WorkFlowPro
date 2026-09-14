'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { ACTIVITY_EVENT_TYPES, type ActivityLogRecord } from '@/lib/activity-log-types';
import { activityEventLabel, formatActivityParts } from '@/lib/activity-log-format';
import { USER_ROLES } from '@/lib/roles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserOption = { id: string; name: string; role: UserRole };

function actionClassName(eventType: ActivityLogRecord['eventType']): string {
  if (eventType.includes('DELETED')) return 'text-red-700 dark:text-red-400';
  if (eventType.includes('CREATED') || eventType === 'APP_OPENED' || eventType === 'AUTH_LOGIN') return 'text-emerald-700 dark:text-emerald-400';
  if (eventType === 'APP_CLOSED' || eventType === 'AUTH_LOGOUT') return 'text-slate-600 dark:text-slate-300';
  if (eventType.includes('COMPLETED') || eventType.includes('IMPORTED')) return 'text-blue-700 dark:text-blue-400';
  return 'text-amber-700 dark:text-amber-400';
}

export function ActivityLogDashboard() {
  const { currentLang } = useLanguage();
  const language = currentLang === 'ro' ? 'ro' : 'en';
  const [date, setDate] = React.useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [actorId, setActorId] = React.useState('ALL');
  const [role, setRole] = React.useState('ALL');
  const [eventType, setEventType] = React.useState('ALL');
  const [events, setEvents] = React.useState<ActivityLogRecord[]>([]);
  const [users, setUsers] = React.useState<UserOption[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [retentionDays, setRetentionDays] = React.useState(30);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState(false);

  const loadEvents = React.useCallback(async (cursor?: string, quiet = false) => {
    if (!quiet) {
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      setError(false);
    }
    try {
      const params = new URLSearchParams({ date, limit: '50' });
      if (actorId !== 'ALL') params.set('actorId', actorId);
      if (role !== 'ALL') params.set('role', role);
      if (eventType !== 'ALL') params.set('eventType', eventType);
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/admin/activity-logs?${params}`);
      if (!response.ok) throw new Error('Failed to load activity');
      const data = await response.json();
      setEvents((current) => cursor ? [...current, ...data.events] : data.events);
      setNextCursor(data.nextCursor);
      setRetentionDays(data.retentionDays);
    } catch {
      if (!quiet) setError(true);
    } finally {
      if (!quiet) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [actorId, date, eventType, role]);

  React.useEffect(() => { loadEvents(); }, [loadEvents]);
  React.useEffect(() => {
    const interval = window.setInterval(() => void loadEvents(undefined, true), 15_000);
    return () => window.clearInterval(interval);
  }, [loadEvents]);
  React.useEffect(() => {
    fetch('/api/users')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  const moveDay = (amount: number) => {
    const [year, month, day] = date.split('-').map(Number);
    setDate(format(addDays(new Date(year, month - 1, day), amount), 'yyyy-MM-dd'));
  };

  return (
    <section className="min-w-0" aria-label={getTranslation(currentLang, 'ActivityLogTitle')}>
      <div className="grid gap-3 border-b pb-4 lg:grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(11rem,1.35fr)_auto]">
        <Select value={actorId} onValueChange={setActorId}>
          <SelectTrigger aria-label={getTranslation(currentLang, 'ActivityFilterUser')}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{getTranslation(currentLang, 'ActivityAllUsers')}</SelectItem>
            {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger aria-label={getTranslation(currentLang, 'ActivityFilterRole')}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{getTranslation(currentLang, 'ActivityAllRoles')}</SelectItem>
            {USER_ROLES.map((item) => <SelectItem key={item} value={item}>{getTranslation(currentLang, item)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger aria-label={getTranslation(currentLang, 'ActivityFilterAction')}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{getTranslation(currentLang, 'ActivityAllActions')}</SelectItem>
            {ACTIVITY_EVENT_TYPES.map((item) => <SelectItem key={item} value={item}>{activityEventLabel(item, language)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => moveDay(-1)} aria-label={getTranslation(currentLang, 'ActivityPreviousDay')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="date" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} className="min-w-0 flex-1 lg:w-40" aria-label={getTranslation(currentLang, 'ActivityDate')} />
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => moveDay(1)} aria-label={getTranslation(currentLang, 'ActivityNextDay')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="py-2 text-[11px] text-muted-foreground">
        {getTranslation(currentLang, 'ActivityLogRetention', { count: String(retentionDays) })}
      </p>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin" /><span className="ml-2">{getTranslation(currentLang, 'Loading')}</span></div>
      ) : error ? (
        <div className="py-12 text-center"><p className="text-sm text-destructive">{getTranslation(currentLang, 'ActivityLoadFailed')}</p><Button variant="outline" className="mt-3" onClick={() => loadEvents()}>{getTranslation(currentLang, 'Retry')}</Button></div>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{getTranslation(currentLang, 'ActivityEmpty')}</p>
      ) : (
        <div className="rounded-md border" aria-live="polite">
          <Table className="min-w-[760px] table-fixed text-xs">
            <TableHeader className="bg-muted/45">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 w-[18%] px-3 text-[11px] font-normal">{getTranslation(currentLang, 'ActivityTableTime')}</TableHead>
                <TableHead className="h-9 w-[18%] px-3 text-[11px] font-normal">{getTranslation(currentLang, 'ActivityTableUser')}</TableHead>
                <TableHead className="h-9 w-[15%] px-3 text-[11px] font-normal">{getTranslation(currentLang, 'ActivityTableRole')}</TableHead>
                <TableHead className="h-9 w-[22%] px-3 text-[11px] font-normal">{getTranslation(currentLang, 'ActivityTableAction')}</TableHead>
                <TableHead className="h-9 w-[27%] px-3 text-[11px] font-normal">{getTranslation(currentLang, 'ActivityTableDetails')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const parts = formatActivityParts(event, language);
                const details = `${parts.target.trim()}${parts.extra}`.trim();
                return (
                  <TableRow key={event.id} className="hover:bg-muted/30">
                    <TableCell className="min-h-0 whitespace-nowrap px-3 py-1.5 font-normal">
                      <span className="text-muted-foreground">{parts.date}</span>{' '}
                      <span className="text-foreground">{parts.time}</span>
                    </TableCell>
                    <TableCell className="min-h-0 truncate px-3 py-1.5 font-normal text-sky-700 dark:text-sky-300" title={parts.user}>{parts.user}</TableCell>
                    <TableCell className="min-h-0 truncate px-3 py-1.5 font-normal text-foreground">{getTranslation(currentLang, event.actorRole)}</TableCell>
                    <TableCell className={`min-h-0 px-3 py-1.5 font-normal ${actionClassName(event.eventType)}`}>{parts.action}{details ? '' : '.'}</TableCell>
                    <TableCell className="min-h-0 truncate px-3 py-1.5 font-normal text-muted-foreground" title={details || undefined}>{details ? `${details}.` : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {nextCursor && !loading && (
        <div className="border-t pt-4 text-center">
          <Button variant="outline" onClick={() => loadEvents(nextCursor)} disabled={loadingMore}>
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{getTranslation(currentLang, 'LoadMore')}
          </Button>
        </div>
      )}
    </section>
  );
}
