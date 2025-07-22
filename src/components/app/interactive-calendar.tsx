
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


  const modifiers = React.useMemo(() => ({
    alwaysToday: (day: Date) => isSameDay(day, todayDate),
    isTodayNotSelected: (day: Date) =>
      isSameDay(day, todayDate) &&
      (!date || !isSameDay(day, date)) &&
      !completedDays.some(d => isSameDay(d, day)) &&
      !incompleteDays.some(d => isSameDay(d, day)),
    tasksCompleted: (day: Date) =>
      completedDays.some(d => isSameDay(d, day)) && (!date || !isSameDay(day, date)),
    tasksIncomplete: (day: Date) =>
      incompleteDays.some(d => isSameDay(d, day)) && (!date || !isSameDay(day, date)),
  }), [completedDays, incompleteDays, date, todayDate]);

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
          "bg-[hsl(var(--calendar-selected-day-bg))] text-[hsl(var(--calendar-selected-day-text))] rounded-lg",
          "hover:bg-[hsl(var(--calendar-selected-day-bg))] hover:text-[hsl(var(--calendar-selected-day-text))] hover:opacity-90", // Example hover, adjust as needed
          "focus:bg-[hsl(var(--calendar-selected-day-bg))] focus:text-[hsl(var(--calendar-selected-day-text))] focus:ring-2 focus:ring-ring" // Example focus
        ),
        // day_today styling is primarily handled by isTodayNotSelected and alwaysToday via modifiersStyles
      }}
    />
  );
}
