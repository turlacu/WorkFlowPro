import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('default producer configuration matches coordinator workbook coordinates', () => {
  const route = readFileSync('src/app/api/team-schedule/upload-excel/route.ts', 'utf8');
  const migration = readFileSync(
    'prisma/migrations/20260727010000_fix_default_producer_excel_coordinates/migration.sql',
    'utf8',
  );

  assert.match(route, /PRODUCER:[\s\S]*?nameColumn: 3,[\s\S]*?firstDateColumn: 4,[\s\S]*?lastDateColumn: 34/);
  assert.match(migration, /"nameColumn" = 3/);
  assert.match(migration, /"firstDateColumn" = 4/);
  assert.match(migration, /"lastDateColumn" = 34/);
});
