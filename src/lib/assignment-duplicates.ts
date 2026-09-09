import { getCalendarDateKey } from '@/lib/assignment-timing';

export function getAssignmentDuplicateKey(name: string, dueDate: Date | string): string {
  return JSON.stringify([name.trim().toLocaleLowerCase('en-US'), getCalendarDateKey(dueDate)]);
}
