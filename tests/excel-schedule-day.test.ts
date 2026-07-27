import assert from 'node:assert/strict';
import test from 'node:test';
import { parseExcelScheduleDay } from '../src/lib/excel-schedule-day';

test('schedule days support numeric and text-based Excel headers', () => {
  assert.equal(parseExcelScheduleDay({ v: 1, t: 'n' }), 1);
  assert.equal(parseExcelScheduleDay({ v: '08', t: 's' }), 8);
  assert.equal(parseExcelScheduleDay({ v: '23.08.2026', t: 's' }), 23);
  assert.equal(parseExcelScheduleDay({ v: undefined, w: '31' }), 31);
});

test('formatted Excel date serials resolve to their calendar day', () => {
  assert.equal(parseExcelScheduleDay({ v: 46235, t: 'n', z: 'dd.mm.yyyy' }), 1);
  assert.equal(parseExcelScheduleDay({ v: 46235, t: 'n', z: 'General' }), null);
});

test('invalid schedule headers are rejected', () => {
  assert.equal(parseExcelScheduleDay({ v: 0 }), null);
  assert.equal(parseExcelScheduleDay({ v: 32 }), null);
  assert.equal(parseExcelScheduleDay({ v: 'August' }), null);
});
