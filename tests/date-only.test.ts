import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDateOnly, parseDateOnly, utcDayRange } from '../src/lib/date-only';

test('date-only parsing is strict and calendar-valid', () => {
  assert.equal(parseDateOnly('2026-02-29'), null);
  assert.equal(parseDateOnly('2024-02-29')?.toISOString(), '2024-02-29T00:00:00.000Z');
  assert.equal(parseDateOnly('2026-2-01'), null);
  assert.equal(parseDateOnly('not-a-date'), null);
});

test('UTC date ranges have exact day boundaries', () => {
  const range = utcDayRange('2026-07-22');
  assert.equal(range?.start.toISOString(), '2026-07-22T00:00:00.000Z');
  assert.equal(range?.end.toISOString(), '2026-07-23T00:00:00.000Z');
});

test('local calendar dates serialize without UTC conversion', () => {
  assert.equal(formatDateOnly(new Date(2026, 6, 22, 23, 30)), '2026-07-22');
});
