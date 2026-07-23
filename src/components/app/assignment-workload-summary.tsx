'use client';

import type { UserRole } from '@prisma/client';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, UserRoundX, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AssignmentSummary, AssignmentSummaryFilter } from '@/lib/assignment-summary';
import { getTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface AssignmentWorkloadSummaryProps {
  activeFilter: AssignmentSummaryFilter | null;
  error: boolean;
  loading: boolean;
  metrics: AssignmentSummary;
  onRetry: () => void;
  onSelect: (filter: AssignmentSummaryFilter) => void;
  role: UserRole;
  userName: string;
}

interface MetricItem {
  filter: AssignmentSummaryFilter;
  icon: typeof CalendarClock;
  labelKey: string;
  value: number;
}

export function AssignmentWorkloadSummary({
  activeFilter,
  error,
  loading,
  metrics,
  onRetry,
  onSelect,
  role,
  userName,
}: AssignmentWorkloadSummaryProps) {
  const { currentLang } = useLanguage();
  const isOperator = role === 'OPERATOR';
  const items: MetricItem[] = isOperator
    ? [
        { filter: 'mine-today', icon: CheckCircle2, labelKey: 'AssignmentSummaryMyToday', value: metrics.myToday },
        { filter: 'mine-upcoming', icon: CalendarClock, labelKey: 'AssignmentSummaryMyNextSeven', value: metrics.myUpcoming },
        { filter: 'mine-overdue', icon: Clock3, labelKey: 'AssignmentSummaryMyOverdue', value: metrics.myOverdue },
        { filter: 'others-today', icon: Users, labelKey: 'AssignmentSummaryOthersToday', value: metrics.othersToday },
      ]
    : [
        { filter: 'team-today', icon: CheckCircle2, labelKey: 'AssignmentSummaryTeamToday', value: metrics.teamToday },
        { filter: 'team-upcoming', icon: CalendarClock, labelKey: 'AssignmentSummaryTeamNextSeven', value: metrics.teamUpcoming },
        { filter: 'team-overdue', icon: Clock3, labelKey: 'AssignmentSummaryTeamOverdue', value: metrics.teamOverdue },
        { filter: 'unassigned', icon: UserRoundX, labelKey: 'AssignmentSummaryUnassigned', value: metrics.unassigned },
      ];
  const completedCount = isOperator ? metrics.completedByMeToday : metrics.completedByTeamToday;

  return (
    <section className="overflow-hidden rounded-lg border bg-muted/20" aria-label={getTranslation(currentLang, 'AssignmentSummaryAriaLabel')}>
      <div className="flex flex-col justify-between gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-base font-semibold">
            {getTranslation(currentLang, 'AssignmentSummaryGreeting', { name: userName })}
          </h2>
          <p className="text-xs text-muted-foreground">
            {getTranslation(
              currentLang,
              isOperator ? 'AssignmentSummaryCompletedByYouToday' : 'AssignmentSummaryTeamCompletedToday',
              { count: completedCount.toString() },
            )}
          </p>
        </div>
        {!loading && !error && (
          <p className="text-xs text-muted-foreground">{getTranslation(currentLang, 'AssignmentSummaryActiveOnly')}</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4" role="status">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={cn(
                'space-y-2 px-4 py-3 sm:px-5',
                index % 2 === 1 && 'border-l',
                index >= 2 && 'border-t sm:border-t-0',
                index > 0 && 'sm:border-l',
              )}
            >
              <div className="h-6 w-10 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 max-w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
          <span className="sr-only">{getTranslation(currentLang, 'Loading')}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            {getTranslation(currentLang, 'AssignmentSummaryUnavailable')}
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {getTranslation(currentLang, 'Retry')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = activeFilter === item.filter;
            return (
              <button
                key={item.filter}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(item.filter)}
                className={cn(
                  'group min-h-20 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5',
                  index % 2 === 1 && 'border-l',
                  index >= 2 && 'border-t sm:border-t-0',
                  index > 0 && 'sm:border-l',
                  active && 'bg-primary/10',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-semibold tabular-nums">{item.value}</span>
                  <Icon className={cn('h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground', active && 'text-primary')} />
                </div>
                <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                  {getTranslation(currentLang, item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
