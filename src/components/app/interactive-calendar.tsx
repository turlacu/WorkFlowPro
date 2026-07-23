
'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { enGB, ro } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface InteractiveCalendarProps {
  onDateSelect?: (date: Date | undefined) => void;
  initialDate?: Date;
  completedDays?: Date[];
  incompleteDays?: Date[];
}

export function InteractiveCalendar({
  onDateSelect,
  initialDate,
  completedDays = [],
  incompleteDays = []
}: InteractiveCalendarProps) {
  const { currentLang } = useLanguage();
  const calendarLocale = currentLang === 'ro' ? ro : enGB;
  const [date, setDate] = React.useState<Date | undefined>(initialDate);
  const [month, setMonth] = React.useState<Date>(initialDate || new Date());
  const todayDate = React.useMemo(() => new Date(), []);

  // Sync internal date state with initialDate prop when it changes
  React.useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);


  const modifiers = React.useMemo(() => ({
    alwaysToday: (day: Date) => isSameDay(day, todayDate),
    isTodayNotSelected: (day: Date) =>
      isSameDay(day, todayDate) &&
      (!initialDate || !isSameDay(day, initialDate)) &&
      !completedDays.some(d => isSameDay(d, day)) &&
      !incompleteDays.some(d => isSameDay(d, day)),
    tasksCompleted: (day: Date) =>
      completedDays.some(d => isSameDay(d, day)),
    tasksIncomplete: (day: Date) =>
      incompleteDays.some(d => isSameDay(d, day)),
    selectedCompleted: (day: Date) =>
      !!initialDate && isSameDay(day, initialDate) && completedDays.some(d => isSameDay(d, day)),
    selectedIncomplete: (day: Date) =>
      !!initialDate && isSameDay(day, initialDate) && incompleteDays.some(d => isSameDay(d, day)),
    selectedNoStatus: (day: Date) =>
      !!initialDate && isSameDay(day, initialDate) && 
      !completedDays.some(d => isSameDay(d, day)) && 
      !incompleteDays.some(d => isSameDay(d, day)),
  }), [completedDays, incompleteDays, initialDate, todayDate]);

  const modifiersStyles = React.useMemo(() => ({
    alwaysToday: {
      textDecoration: 'underline',
      textDecorationColor: 'hsl(var(--ring))', 
      textUnderlineOffset: '2px',
      textDecorationThickness: '1px',
    },
    isTodayNotSelected: {
      fontWeight: 'bold',
      color: 'hsl(var(--accent))',
      // textDecoration: 'underline', // Handled by alwaysToday
      // textDecorationColor: 'hsl(var(--accent))',
      // textUnderlineOffset: '2px',
      backgroundColor: 'transparent', 
    },
    tasksCompleted: {
      backgroundColor: 'hsl(var(--calendar-tasks-completed-bg))',
      color: 'hsl(var(--calendar-tasks-completed-text))',
      borderRadius: 'var(--radius)',
    },
    tasksIncomplete: {
      backgroundColor: 'hsl(var(--calendar-tasks-incomplete-bg))',
      color: 'hsl(var(--calendar-tasks-incomplete-text))',
      borderRadius: 'var(--radius)',
    },
    selectedCompleted: {
      backgroundColor: 'hsl(var(--calendar-tasks-completed-bg))',
      color: 'hsl(var(--calendar-tasks-completed-text))',
      borderRadius: 'var(--radius)',
      border: '2px solid hsl(var(--calendar-selected-day-bg))',
      fontWeight: 'bold',
    },
    selectedIncomplete: {
      backgroundColor: 'hsl(var(--calendar-tasks-incomplete-bg))',
      color: 'hsl(var(--calendar-tasks-incomplete-text))',
      borderRadius: 'var(--radius)',
      border: '2px solid hsl(var(--calendar-selected-day-bg))',
      fontWeight: 'bold',
    },
    selectedNoStatus: {
      backgroundColor: 'hsl(var(--calendar-selected-day-bg))',
      color: 'hsl(var(--calendar-selected-day-text))',
      borderRadius: 'var(--radius)',
      fontWeight: 'bold',
    },
  }), []);

  return (
    <Calendar
      mode="single"
      locale={calendarLocale}
      weekStartsOn={1}
      selected={date}
      onSelect={(newDate) => {
        setDate(newDate);
        if (onDateSelect) {
          onDateSelect(newDate);
        }
      }}
      className="rounded-md p-2 pt-0"
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      month={month} 
      onMonthChange={setMonth} 
      classNames={{
        month: "space-y-2",
        caption: "relative flex items-center justify-center py-1",
        head_row: "flex [&>*:nth-child(6)]:font-medium [&>*:nth-child(6)]:text-amber-600 [&>*:nth-child(7)]:font-medium [&>*:nth-child(7)]:text-rose-600 dark:[&>*:nth-child(6)]:text-amber-300 dark:[&>*:nth-child(7)]:text-rose-300",
        row: "mt-1 flex w-full",
        day_selected: cn(
          // Disable default selected styling - we handle it with custom modifiers
          "bg-transparent text-inherit"
        ),
        // day_today styling is primarily handled by isTodayNotSelected and alwaysToday via modifiersStyles
      }}
    />
  );
}
