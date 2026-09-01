import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calendarDateToAssignmentTimestamp,
  getAssignmentTiming,
  getCalendarDateKey,
  summarizeCompletionTiming,
  validateDueDateForCreate,
  validateDueDateForUpdate,
  zonedDateRange,
} from '../src/lib/assignment-timing';

test('uses Europe/Bucharest calendar dates around midnight', () => {
  assert.equal(getCalendarDateKey('2026-07-22T20:59:59.000Z'), '2026-07-22');
  assert.equal(getCalendarDateKey('2026-07-22T21:00:00.000Z'), '2026-07-23');
  assert.equal(getCalendarDateKey('2026-01-22T22:00:00.000Z'), '2026-01-23');
});

test('creates Bucharest query ranges with DST-aware day boundaries', () => {
  const summer = zonedDateRange('2026-07-22', '2026-07-22');
  assert.equal(summer.start.toISOString(), '2026-07-21T21:00:00.000Z');
  assert.equal(summer.end.toISOString(), '2026-07-22T21:00:00.000Z');

  const springForward = zonedDateRange('2026-03-29', '2026-03-29');
  assert.equal(springForward.end.getTime() - springForward.start.getTime(), 23 * 60 * 60 * 1000);

  const fallBack = zonedDateRange('2026-10-25', '2026-10-25');
  assert.equal(fallBack.end.getTime() - fallBack.start.getTime(), 25 * 60 * 60 * 1000);
});

test('classifies same-day and later calendar-day completions', () => {
  const onTime = getAssignmentTiming({
    dueDate: '2026-07-22T09:00:00.000Z',
    completedAt: '2026-07-22T20:59:59.000Z',
    status: 'COMPLETED',
  });
  assert.equal(onTime.isCompletedLate, false);
  assert.equal(onTime.daysLate, 0);

  const late = getAssignmentTiming({
    dueDate: '2026-07-22T09:00:00.000Z',
    completedAt: '2026-07-24T09:00:00.000Z',
    status: 'COMPLETED',
  });
  assert.equal(late.isCompletedLate, true);
  assert.equal(late.daysLate, 2);
});

test('summarizes on-time, late, unknown, and outstanding assignments without overlap', () => {
  const summary = summarizeCompletionTiming([
    { dueDate: '2026-07-22T09:00:00.000Z', completedAt: '2026-07-22T18:00:00.000Z', status: 'COMPLETED' },
    { dueDate: '2026-07-22T09:00:00.000Z', completedAt: '2026-07-23T09:00:00.000Z', status: 'COMPLETED' },
    { dueDate: '2026-07-22T09:00:00.000Z', completedAt: null, status: 'COMPLETED' },
    { dueDate: '2026-07-22T09:00:00.000Z', completedAt: null, status: 'PENDING' },
  ]);

  assert.deepEqual(summary, {
    completed: 3,
    completedOnTime: 1,
    completedLate: 1,
    completionTimeUnknown: 1,
  });
});

test('rejects past creation dates but permits today and future dates', () => {
  const now = new Date('2026-07-22T10:00:00.000Z');
  assert.equal(validateDueDateForCreate('2026-07-21T12:00:00.000Z', now), 'PAST_DUE_DATE');
  assert.equal(validateDueDateForCreate('2026-07-22T12:00:00.000Z', now), null);
  assert.equal(validateDueDateForCreate('2026-07-23T12:00:00.000Z', now), null);
});

test('allows an unchanged overdue date, only reschedules forward, and locks completed dates', () => {
  const now = new Date('2026-07-22T10:00:00.000Z');
  assert.equal(validateDueDateForUpdate({
    existingDueDate: '2026-07-20T12:00:00.000Z',
    requestedDueDate: '2026-07-20T18:00:00.000Z',
    existingStatus: 'PENDING',
    referenceDate: now,
  }), null);
  assert.equal(validateDueDateForUpdate({
    existingDueDate: '2026-07-20T12:00:00.000Z',
    requestedDueDate: '2026-07-21T12:00:00.000Z',
    existingStatus: 'PENDING',
    referenceDate: now,
  }), 'PAST_DUE_DATE');
  assert.equal(validateDueDateForUpdate({
    existingDueDate: '2026-07-20T12:00:00.000Z',
    requestedDueDate: '2026-07-22T12:00:00.000Z',
    existingStatus: 'PENDING',
    referenceDate: now,
  }), null);
  assert.equal(validateDueDateForUpdate({
    existingDueDate: '2026-07-20T12:00:00.000Z',
    requestedDueDate: '2026-07-22T12:00:00.000Z',
    existingStatus: 'COMPLETED',
    referenceDate: now,
  }), 'COMPLETED_DUE_DATE_LOCKED');
});

test('serializes a picked calendar day to a timezone-stable assignment timestamp', () => {
  const selected = new Date(2026, 6, 22);
  assert.equal(calendarDateToAssignmentTimestamp(selected), '2026-07-22T12:00:00.000Z');
});
