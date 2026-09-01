import type { AssignmentStatus } from '@prisma/client';

export const APP_TIME_ZONE = 'Europe/Bucharest';

type DateValue = Date | string;

export interface AssignmentTimingInput {
  dueDate: DateValue;
  completedAt?: DateValue | null;
  status: AssignmentStatus;
}

export interface AssignmentTiming {
  isCompletedLate: boolean;
  daysLate: number;
  isOverdue: boolean;
}

export interface CompletionTimingSummary {
  completed: number;
  completedOnTime: number;
  completedLate: number;
  completionTimeUnknown: number;
}

export type DueDateValidationError =
  | 'PAST_DUE_DATE'
  | 'COMPLETED_DUE_DATE_LOCKED';

function getDateParts(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function getCalendarDateKey(value: DateValue, timeZone = APP_TIME_ZONE): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  const { year, month, day } = getDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function calendarDateToAssignmentTimestamp(date: Date): string {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${dateKey}T12:00:00.000Z`;
}

function dateKeyDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getDateParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function zonedStartOfDay(dateKey: string, timeZone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day);
  let candidate = new Date(utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone));
  candidate = new Date(utcGuess - timeZoneOffsetMs(candidate, timeZone));
  return candidate;
}

export function zonedDateRange(
  startDateKey: string,
  inclusiveEndDateKey: string,
  timeZone = APP_TIME_ZONE,
): { start: Date; end: Date } {
  return {
    start: zonedStartOfDay(startDateKey, timeZone),
    end: zonedStartOfDay(addDaysToDateKey(inclusiveEndDateKey, 1), timeZone),
  };
}

export function getAssignmentTiming(
  assignment: AssignmentTimingInput,
  referenceDate: Date = new Date(),
): AssignmentTiming {
  const dueDateKey = getCalendarDateKey(assignment.dueDate);
  const todayKey = getCalendarDateKey(referenceDate);
  const completedDateKey = assignment.completedAt
    ? getCalendarDateKey(assignment.completedAt)
    : null;
  const daysLate = completedDateKey
    ? Math.max(0, dateKeyDayNumber(completedDateKey) - dateKeyDayNumber(dueDateKey))
    : 0;

  return {
    isCompletedLate: assignment.status === 'COMPLETED' && daysLate > 0,
    daysLate: assignment.status === 'COMPLETED' ? daysLate : 0,
    isOverdue: assignment.status !== 'COMPLETED' && dueDateKey < todayKey,
  };
}

export function summarizeCompletionTiming(
  assignments: AssignmentTimingInput[],
): CompletionTimingSummary {
  const completedAssignments = assignments.filter(({ status }) => status === 'COMPLETED');
  const completedLate = completedAssignments.filter(
    (assignment) => getAssignmentTiming(assignment).isCompletedLate,
  ).length;
  const completionTimeUnknown = completedAssignments.filter(
    (assignment) => !assignment.completedAt,
  ).length;

  return {
    completed: completedAssignments.length,
    completedOnTime: completedAssignments.length - completedLate - completionTimeUnknown,
    completedLate,
    completionTimeUnknown,
  };
}

export function validateDueDateForCreate(
  dueDate: DateValue,
  referenceDate: Date = new Date(),
): DueDateValidationError | null {
  return getCalendarDateKey(dueDate) < getCalendarDateKey(referenceDate)
    ? 'PAST_DUE_DATE'
    : null;
}

export function validateDueDateForUpdate(input: {
  existingDueDate: DateValue;
  requestedDueDate: DateValue;
  existingStatus: AssignmentStatus;
  referenceDate?: Date;
}): DueDateValidationError | null {
  const existingKey = getCalendarDateKey(input.existingDueDate);
  const requestedKey = getCalendarDateKey(input.requestedDueDate);
  if (existingKey === requestedKey) return null;
  if (input.existingStatus === 'COMPLETED') return 'COMPLETED_DUE_DATE_LOCKED';
  return validateDueDateForCreate(input.requestedDueDate, input.referenceDate);
}
