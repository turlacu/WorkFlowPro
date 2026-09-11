import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { activityRetentionDays } from '../src/lib/activity-log';
import { formatActivitySentence } from '../src/lib/activity-log-format';
import type { ActivityLogRecord } from '../src/lib/activity-log-types';

const startedEvent: ActivityLogRecord = {
  id: 'event-1',
  occurredAt: '2026-09-10T13:00:00.000Z',
  eventType: 'ASSIGNMENT_STARTED',
  actorId: 'operator-1',
  actorName: 'Maria Popescu',
  actorRole: 'OPERATOR',
  targetType: 'assignment',
  targetId: 'assignment-1',
  targetName: 'Prepare weekly report',
  metadata: {},
};

test('activity sentences use Bucharest time and the selected language', () => {
  assert.equal(
    formatActivitySentence(startedEvent, 'en'),
    'On 10.09.2026 at 16:00, Operator Maria Popescu started assignment “Prepare weekly report”.',
  );
  assert.equal(
    formatActivitySentence(startedEvent, 'ro'),
    'La 10.09.2026, ora 16:00, Operatorul Maria Popescu a început sarcina “Prepare weekly report”.',
  );
});

test('activity retention defaults safely and accepts bounded configuration', () => {
  const previous = process.env.ACTIVITY_LOG_RETENTION_DAYS;
  process.env.ACTIVITY_LOG_RETENTION_DAYS = '45';
  assert.equal(activityRetentionDays(), 45);
  process.env.ACTIVITY_LOG_RETENTION_DAYS = '0';
  assert.equal(activityRetentionDays(), 30);
  process.env.ACTIVITY_LOG_RETENTION_DAYS = 'not-a-number';
  assert.equal(activityRetentionDays(), 30);
  if (previous === undefined) delete process.env.ACTIVITY_LOG_RETENTION_DAYS;
  else process.env.ACTIVITY_LOG_RETENTION_DAYS = previous;
});

test('activity storage is append-oriented, indexed, and permission-protected', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  const migration = readFileSync('prisma/migrations/20260911000000_add_activity_logs/migration.sql', 'utf8');
  const route = readFileSync('src/app/api/admin/activity-logs/route.ts', 'utf8');

  assert.match(schema, /model ActivityLog/);
  assert.match(migration, /activity_logs_occurredAt_idx/);
  assert.match(migration, /ON DELETE SET NULL/);
  assert.match(route, /requirePermission\('ACTIVITY_LOG_VIEW'\)/);
  assert.doesNotMatch(route, /export async function DELETE/);
});

test('core business actions are instrumented without storing comment bodies', () => {
  const assignments = readFileSync('src/app/api/assignments/route.ts', 'utf8');
  const comments = readFileSync('src/app/api/assignments/[id]/comments/route.ts', 'utf8');
  const users = readFileSync('src/app/api/users/route.ts', 'utf8');
  const schedules = readFileSync('src/app/api/team-schedule/route.ts', 'utf8');

  assert.match(assignments, /ASSIGNMENT_CREATED/);
  assert.match(assignments, /ASSIGNMENT_STARTED/);
  assert.match(assignments, /ASSIGNMENT_COMPLETED/);
  assert.match(comments, /ASSIGNMENT_COMMENTED/);
  assert.doesNotMatch(comments, /metadata:\s*\{\s*content:/);
  assert.match(users, /USER_CREATED/);
  assert.match(schedules, /SCHEDULE_UPDATED/);
});

test('sensitive content is not part of the activity log schema', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  const activityModel = schema.match(/model ActivityLog \{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(activityModel, /password|token|requestBody|commentContent|description/);
});
