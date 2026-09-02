import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('posting an assignment comment persists it and updates the visible assignment', () => {
  const assignmentRoute = read('src/app/api/assignments/[id]/route.ts');
  const detailModal = read('src/components/app/assignment-detail-modal.tsx');
  const assignmentTable = read('src/components/app/assignment-table.tsx');

  assert.match(assignmentRoute, /export async function PATCH/);
  assert.match(assignmentRoute, /comment,\s*lastUpdatedById: auth\.user\.id/);
  assert.match(detailModal, /api\.updateAssignmentComment\(assignment\.id, comment\)/);
  assert.match(detailModal, /onCommentSaved\(updatedAssignment\)/);
  assert.match(assignmentTable, /setSelectedAssignmentForDetail\(updatedAssignment\)/);
});
