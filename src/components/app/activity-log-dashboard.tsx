'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { ChevronLeft, ChevronRight, History, Loader2 } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { ACTIVITY_EVENT_TYPES, type ActivityLogRecord } from '@/lib/activity-log-types';
import { activityEventLabel, formatActivityParts } from '@/lib/activity-log-format';
import { USER_ROLES } from '@/lib/roles';

type UserOption = { id: string; name: string; role: UserRole };

const roleClassName: Record<UserRole, string> = {
  ADMIN: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  PRODUCER: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  CONTRIBUTOR: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  OPERATOR: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

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
    <section className="min-w-0" aria-labelledby="activity-log-heading">
      <div className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h3 id="activity-log-heading" className="text-lg font-semibold">{getTranslation(currentLang, 'ActivityLogTitle')}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {getTranslation(currentLang, 'ActivityLogRetention', { count: String(retentionDays) })}
          </p>
        </div>
        <div className="flex items-center gap-1 self-start xl:self-auto">
          <Button variant="outline" size="icon" onClick={() => moveDay(-1)} aria-label={getTranslation(currentLang, 'ActivityPreviousDay')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="date" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} className="w-40" aria-label={getTranslation(currentLang, 'ActivityDate')} />
          <Button variant="outline" size="icon" onClick={() => moveDay(1)} aria-label={getTranslation(currentLang, 'ActivityNextDay')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 border-b py-4 sm:grid-cols-3">
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
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin" /><span className="ml-2">{getTranslation(currentLang, 'Loading')}</span></div>
      ) : error ? (
        <div className="py-12 text-center"><p className="text-sm text-destructive">{getTranslation(currentLang, 'ActivityLoadFailed')}</p><Button variant="outline" className="mt-3" onClick={() => loadEvents()}>{getTranslation(currentLang, 'Retry')}</Button></div>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{getTranslation(currentLang, 'ActivityEmpty')}</p>
      ) : (
        <div className="divide-y" aria-live="polite">
          {events.map((event) => {
            const parts = formatActivityParts(event, language);
            return (
              <article key={event.id} className="py-4">
                <p className="min-w-0 text-sm leading-7 text-foreground">
                  {language === 'ro' ? 'La ' : 'On '}
                  <span className="font-semibold text-sky-700 dark:text-sky-300">{parts.date}</span>
                  {language === 'ro' ? ', ora ' : ' at '}
                  <span className="font-semibold text-violet-700 dark:text-violet-300">{parts.time}</span>
                  {', '}
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${roleClassName[event.actorRole]}`}>{parts.role}</span>{' '}
                  <span className="font-semibold">{parts.user}</span>{' '}
                  <span className={`font-medium ${actionClassName(event.eventType)}`}>{parts.action}</span>
                  {parts.target && <span className="font-semibold">{parts.target}</span>}
                  {parts.extra}<span aria-hidden="true">.</span>
                </p>
              </article>
            );
          })}
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
