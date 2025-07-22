
'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';

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
      selected={date}
      onSelect={(newDate) => {
        setDate(newDate);
        if (onDateSelect) {
          onDateSelect(newDate);
        }
      }}
      className="p-3 rounded-md"
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      month={month} 
      onMonthChange={setMonth} 
      classNames={{
        day_selected: cn(
          // Disable default selected styling - we handle it with custom modifiers
          "bg-transparent text-inherit"
        ),
        // day_today styling is primarily handled by isTodayNotSelected and alwaysToday via modifiersStyles
      }}
    />
  );
}
