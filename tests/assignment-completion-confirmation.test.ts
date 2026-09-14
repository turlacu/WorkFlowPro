import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('operators must confirm the delivery checklist before completing an assignment', () => {
  const table = readFileSync('src/components/app/assignment-table.tsx', 'utf8');
  const translations = readFileSync('src/lib/translations.ts', 'utf8');

  assert.match(table, /session\?\.user\?\.role === 'OPERATOR'/);
  assert.match(table, /setAssignmentToComplete/);
  assert.match(table, /handleConfirmComplete/);
  assert.match(table, /onToggleComplete\(assignmentToComplete\.id, true, true\)/);
  assert.equal((table.match(/handleToggleCompleteRequest\(assignment, checked === true\)/g) || []).length, 2);
  assert.match(translations, /I confirm uploading in author's folder, in REPORTAJE FINIT and in QSOUND/);
  assert.match(translations, /Confirm încărcarea în folderul autorului, în folderul Reportaje Finit și în Qsound/);

  const route = readFileSync('src/app/api/assignments/route.ts', 'utf8');
  assert.match(route, /completionConfirmed: z\.boolean\(\)\.optional\(\)/);
  assert.match(route, /Completion confirmation is required/);
});
