import { getCalendarDateKey } from '@/lib/assignment-timing';

export function getAssignmentDuplicateKey(name: string, dueDate: Date | string): string {
  return `${name.trim().toLocaleLowerCase('en-US')}\u0000${getCalendarDateKey(dueDate)}`;
}
