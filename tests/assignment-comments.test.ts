import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('assignment comments are append-only records with authors and replies', () => {
  const schema = read('prisma/schema.prisma');
  const migration = read('prisma/migrations/20260902010000_add_assignment_comment_threads/migration.sql');
  const commentsRoute = read('src/app/api/assignments/[id]/comments/route.ts');

  assert.match(schema, /model AssignmentComment/);
  assert.match(schema, /authorName\s+String/);
  assert.match(schema, /parentId\s+String\?/);
  assert.match(migration, /CREATE TABLE "assignment_comments"/);
  assert.match(migration, /INSERT INTO "assignment_comments"/);
  assert.match(commentsRoute, /export async function GET/);
  assert.match(commentsRoute, /export async function POST/);
  assert.match(commentsRoute, /INSERT INTO "assignment_comments"/);
  assert.match(commentsRoute, /data\.parentId/);
});

test('the assignment dialog renders comment authors and supports replies without overwriting', () => {
  const detailModal = read('src/components/app/assignment-detail-modal.tsx');
  const api = read('src/lib/api.ts');

  assert.match(api, /getAssignmentComments/);
  assert.match(api, /createAssignmentComment/);
  assert.match(detailModal, /item\.author\?\.name \|\| item\.authorName/);
  assert.match(detailModal, /setReplyingTo/);
  assert.match(detailModal, /persistedComments/);
  assert.doesNotMatch(detailModal, /updateAssignmentComment/);
});

test('backup and restore include threaded assignment comments', () => {
  const backup = read('src/app/api/backup/route.ts');
  const restore = read('src/app/api/backup/restore/route.ts');

  assert.match(backup, /schemaVersion: 3/);
  assert.match(backup, /assignmentComments/);
  assert.match(restore, /assignmentComments/);
  assert.match(restore, /INSERT INTO "assignment_comments"/);
});
