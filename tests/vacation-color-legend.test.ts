import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isVacationLegend } from '../src/lib/shift-color-legend';

test('only explicitly classified legends are treated as vacation', () => {
  assert.equal(isVacationLegend({ isVacation: true }), true);
  assert.equal(isVacationLegend({ isVacation: false }), false);
  assert.equal(isVacationLegend({}), false);
  assert.equal(isVacationLegend(null), false);
});

test('vacation legends are configurable and excluded from imported and returned schedules', () => {
  const manager = readFileSync('src/components/app/shift-color-legend-manager.tsx', 'utf8');
  const importer = readFileSync('src/app/api/team-schedule/upload-excel/route.ts', 'utf8');
  const scheduleApi = readFileSync('src/app/api/team-schedule/route.ts', 'utf8');
  const migration = readFileSync(
    'prisma/migrations/20260727000000_add_vacation_color_legends/migration.sql',
    'utf8',
  );

  assert.match(manager, /Vacation \(concediu de odihnă\)/);
  assert.match(importer, /if \(isVacationLegend\(legend\)\)[\s\S]*?continue;/);
  assert.match(scheduleApi, /if \(isVacationLegend\(matchingLegend\)\) return \[\];/);
  assert.match(migration, /ADD COLUMN "isVacation" BOOLEAN NOT NULL DEFAULT false/);
});
