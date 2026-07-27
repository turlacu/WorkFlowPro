import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  hasUnconfiguredShiftTime,
  isVacationLegend,
  shouldHideFromMainSchedule,
} from '../src/lib/shift-color-legend';

test('only explicitly classified legends are treated as vacation', () => {
  assert.equal(isVacationLegend({ isVacation: true }), true);
  assert.equal(isVacationLegend({ isVacation: false }), false);
  assert.equal(isVacationLegend({}), false);
  assert.equal(isVacationLegend(null), false);
});

test('00:00–00:00 color shifts stay hidden until working times are configured', () => {
  const placeholderShift = {
    isVacation: false,
    startTime: '00:00',
    endTime: '00:00',
  };
  const configuredShift = {
    isVacation: false,
    startTime: '08:00',
    endTime: '16:00',
  };

  assert.equal(isVacationLegend(placeholderShift), false);
  assert.equal(hasUnconfiguredShiftTime(placeholderShift), true);
  assert.equal(shouldHideFromMainSchedule(placeholderShift), true);
  assert.equal(shouldHideFromMainSchedule(configuredShift), false);
  assert.equal(shouldHideFromMainSchedule({ ...configuredShift, isVacation: true }), true);
});

test('vacation legends are configurable and excluded from imported schedules', () => {
  const manager = readFileSync('src/components/app/shift-color-legend-manager.tsx', 'utf8');
  const importer = readFileSync('src/app/api/team-schedule/upload-excel/route.ts', 'utf8');
  const scheduleApi = readFileSync('src/app/api/team-schedule/route.ts', 'utf8');
  const migration = readFileSync(
    'prisma/migrations/20260727000000_add_vacation_color_legends/migration.sql',
    'utf8',
  );

  assert.match(manager, /Vacation \(concediu de odihnă\)/);
  assert.match(importer, /if \(isVacationLegend\(legend\)\)[\s\S]*?continue;/);
  assert.match(scheduleApi, /if \(shouldHideFromMainSchedule\(matchingLegend\)\) return \[\];/);
  assert.match(migration, /ADD COLUMN "isVacation" BOOLEAN NOT NULL DEFAULT false/);
});
