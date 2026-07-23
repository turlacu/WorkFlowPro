import type { AssignmentStatus } from '@prisma/client';

export type AssignmentSummaryFilter =
  | 'mine-today'
  | 'mine-upcoming'
  | 'mine-overdue'
  | 'others-today'
  | 'team-today'
  | 'team-upcoming'
  | 'team-overdue'
  | 'unassigned';

export interface SummaryAssignment {
  assignedToId: string | null;
  completedAt?: Date | string | null;
  dueDate: Date | string;
  status: AssignmentStatus;
}

export interface AssignmentSummary {
  myToday: number;
  myUpcoming: number;
  myOverdue: number;
  othersToday: number;
  teamToday: number;
  teamUpcoming: number;
  teamOverdue: number;
  unassigned: number;
  completedByMeToday: number;
  completedByTeamToday: number;
}

interface DateBoundaries {
  today: Date;
  tomorrow: Date;
  afterUpcomingWindow: Date;
}

function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDateBoundaries(referenceDate: Date): DateBoundaries {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  return {
    today,
    tomorrow: addLocalDays(today, 1),
    afterUpcomingWindow: addLocalDays(today, 8),
  };
}

function isWithin(date: Date, start: Date, end: Date): boolean {
  return date >= start && date < end;
}

function isActive(assignment: SummaryAssignment): boolean {
  return assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS';
}

export function filterAssignmentsBySummary<T extends SummaryAssignment>(
  assignments: T[],
  filter: AssignmentSummaryFilter,
  userId: string,
  referenceDate = new Date(),
): T[] {
  const { today, tomorrow, afterUpcomingWindow } = getDateBoundaries(referenceDate);

  return assignments.filter((assignment) => {
    if (!isActive(assignment)) return false;
    const dueDate = new Date(assignment.dueDate);
    const dueToday = isWithin(dueDate, today, tomorrow);
    const dueUpcoming = isWithin(dueDate, tomorrow, afterUpcomingWindow);
    const overdue = dueDate < today;

    switch (filter) {
      case 'mine-today':
        return assignment.assignedToId === userId && dueToday;
      case 'mine-upcoming':
        return assignment.assignedToId === userId && dueUpcoming;
      case 'mine-overdue':
        return assignment.assignedToId === userId && overdue;
      case 'others-today':
        return assignment.assignedToId !== null && assignment.assignedToId !== userId && dueToday;
      case 'team-today':
        return dueToday;
      case 'team-upcoming':
        return dueUpcoming;
      case 'team-overdue':
        return overdue;
      case 'unassigned':
        return assignment.assignedToId === null;
    }
  });
}

export function summarizeAssignments(
  assignments: SummaryAssignment[],
  userId: string,
  referenceDate = new Date(),
): AssignmentSummary {
  const count = (filter: AssignmentSummaryFilter) =>
    filterAssignmentsBySummary(assignments, filter, userId, referenceDate).length;
  const { today, tomorrow } = getDateBoundaries(referenceDate);

  const completedToday = assignments.filter((assignment) => {
    if (assignment.status !== 'COMPLETED' || !assignment.completedAt) return false;
    return isWithin(new Date(assignment.completedAt), today, tomorrow);
  });

  return {
    myToday: count('mine-today'),
    myUpcoming: count('mine-upcoming'),
    myOverdue: count('mine-overdue'),
    othersToday: count('others-today'),
    teamToday: count('team-today'),
    teamUpcoming: count('team-upcoming'),
    teamOverdue: count('team-overdue'),
    unassigned: count('unassigned'),
    completedByMeToday: completedToday.filter((assignment) => assignment.assignedToId === userId).length,
    completedByTeamToday: completedToday.length,
  };
}
