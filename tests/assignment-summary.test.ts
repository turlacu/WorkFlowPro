import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterAssignmentsBySummary,
  summarizeAssignments,
  type SummaryAssignment,
} from '../src/lib/assignment-summary';

interface TestAssignment extends SummaryAssignment {
  id: string;
}

const referenceDate = new Date(2026, 6, 23, 12);

function assignment(
  id: string,
  assignedToId: string | null,
  dueDate: Date,
  status: TestAssignment['status'] = 'PENDING',
  completedAt: Date | null = null,
): TestAssignment {
  return { id, assignedToId, completedAt, dueDate, status };
}

const assignments: TestAssignment[] = [
  assignment('mine-today', 'operator-1', new Date(2026, 6, 23, 9)),
  assignment('mine-tomorrow', 'operator-1', new Date(2026, 6, 24, 9), 'IN_PROGRESS'),
  assignment('mine-day-seven', 'operator-1', new Date(2026, 6, 30, 18)),
  assignment('mine-day-eight', 'operator-1', new Date(2026, 6, 31, 9)),
  assignment('mine-overdue', 'operator-1', new Date(2026, 6, 22, 23, 59)),
  assignment('other-today', 'operator-2', new Date(2026, 6, 23, 14)),
  assignment('unassigned-today', null, new Date(2026, 6, 23, 15)),
  assignment('unassigned-future', null, new Date(2026, 8, 1, 12)),
  assignment('mine-completed-today', 'operator-1', new Date(2026, 6, 24, 10), 'COMPLETED', new Date(2026, 6, 23, 10)),
  assignment('other-completed-today', 'operator-2', new Date(2026, 6, 25, 11), 'COMPLETED', new Date(2026, 6, 23, 11)),
  assignment('completed-overdue', 'operator-1', new Date(2026, 6, 20, 11), 'COMPLETED', new Date(2026, 6, 22, 11)),
];

test('summary counts active workload by local calendar boundaries', () => {
  const summary = summarizeAssignments(assignments, 'operator-1', referenceDate);

  assert.deepEqual(summary, {
    myToday: 1,
    myUpcoming: 2,
    myOverdue: 1,
    othersToday: 1,
    teamToday: 3,
    teamUpcoming: 2,
    teamOverdue: 1,
    unassigned: 2,
    completedByMeToday: 1,
    completedByTeamToday: 2,
  });
});

test('next seven days includes tomorrow through day seven and excludes day eight', () => {
  const ids = filterAssignmentsBySummary(
    assignments,
    'mine-upcoming',
    'operator-1',
    referenceDate,
  ).map((item) => item.id);

  assert.deepEqual(ids, ['mine-tomorrow', 'mine-day-seven']);
});

test('operator and manager filters return their exact active subsets', () => {
  assert.deepEqual(
    filterAssignmentsBySummary(assignments, 'others-today', 'operator-1', referenceDate)
      .map((item) => item.id),
    ['other-today'],
  );
  assert.deepEqual(
    filterAssignmentsBySummary(assignments, 'team-today', 'operator-1', referenceDate)
      .map((item) => item.id),
    ['mine-today', 'other-today', 'unassigned-today'],
  );
  assert.deepEqual(
    filterAssignmentsBySummary(assignments, 'unassigned', 'operator-1', referenceDate)
      .map((item) => item.id),
    ['unassigned-today', 'unassigned-future'],
  );
});

test('completed assignments are excluded from workload filters', () => {
  const filteredIds = filterAssignmentsBySummary(
    assignments,
    'mine-overdue',
    'operator-1',
    referenceDate,
  ).map((item) => item.id);

  assert.deepEqual(filteredIds, ['mine-overdue']);
});
