import assert from 'node:assert/strict';
import test from 'node:test';

import { parseScheduleCell } from '../src/lib/excel-schedule-cell';

test('color-only schedule cells produce importable entries', () => {
  assert.deepEqual(
    parseScheduleCell(undefined, '#FF0000', { skipValues: [], defaultShift: '' }),
    { shiftHours: undefined, shiftColor: '#FF0000' },
  );
  assert.deepEqual(
    parseScheduleCell(undefined, '#FFFF00', { skipValues: [], defaultShift: 'Morning' }),
    { shiftHours: 'Morning', shiftColor: '#FFFF00' },
  );
});

test('value-based schedules remain supported and configured values are skipped', () => {
  assert.deepEqual(
    parseScheduleCell('8h', '#008000', { skipValues: ['co'] }),
    { shiftHours: '8h', shiftColor: '#008000' },
  );
  assert.equal(parseScheduleCell('co', undefined, { skipValues: ['co'] }), null);
  assert.equal(parseScheduleCell('L', undefined, { skipValues: [] }), null);
  assert.equal(parseScheduleCell(undefined, undefined, { skipValues: [] }), null);
});
