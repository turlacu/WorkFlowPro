import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('contributor role is migrated and accepted for assignment creation', () => {
  const schema = read('prisma/schema.prisma');
  const migration = read('prisma/migrations/20260902000000_add_contributor_role/migration.sql');
  const assignmentsRoute = read('src/app/api/assignments/route.ts');

  assert.match(schema, /enum UserRole[\s\S]*CONTRIBUTOR/);
  assert.match(migration, /ADD VALUE IF NOT EXISTS 'CONTRIBUTOR'/);
  assert.match(assignmentsRoute, /requireUser\(\['ADMIN', 'PRODUCER', 'CONTRIBUTOR'\]\)/);
  assert.match(assignmentsRoute, /canManageAssignmentDetails\(auth\.user, existing\)/);
});

test('contributor assignment controls are ownership-aware and schedule navigation is hidden', () => {
  const table = read('src/components/app/assignment-table.tsx');
  const assignmentsPage = read('src/app/(app)/assignments/page.tsx');
  const header = read('src/components/app/header.tsx');
  const mobileMenu = read('src/components/app/mobile-menu.tsx');

  assert.match(table, /assignment\.createdBy\.id === session\?\.user\?\.id/);
  assert.match(table, /disabled=\{!canTransition\}/);
  assert.match(assignmentsPage, /session\.user\.role === 'CONTRIBUTOR'/);
  assert.match(header, /role !== 'CONTRIBUTOR'/);
  assert.match(mobileMenu, /role !== 'CONTRIBUTOR'/);
});
