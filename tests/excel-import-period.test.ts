import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Excel import uses an explicit target month and year instead of the dashboard calendar implicitly', () => {
  const source = readFileSync('src/components/app/excel-schedule-uploader.tsx', 'utf8');

  assert.match(source, /setTargetMonth/);
  assert.match(source, /setTargetYear/);
  assert.match(source, /formData\.append\('month', targetMonth\.toString\(\)\)/);
  assert.match(source, /formData\.append\('year', targetYear\.toString\(\)\)/);
  assert.match(source, /Existing schedules are replaced only for this month and selected role/);
  assert.doesNotMatch(source, /const currentMonth = selectedDate/);
});
