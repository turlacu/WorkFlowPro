import assert from 'node:assert/strict';
import test from 'node:test';
import { getAssignmentDuplicateKey } from '../src/lib/assignment-duplicates';

test('duplicate assignment keys ignore title case and surrounding whitespace', () => {
  const dueDate = '2026-09-08T12:00:00.000Z';

  assert.equal(
    getAssignmentDuplicateKey('  Prepare Report  ', dueDate),
    getAssignmentDuplicateKey('prepare report', dueDate),
  );
});

test('duplicate assignment keys allow the same assignment title on another date', () => {
  assert.notEqual(
    getAssignmentDuplicateKey('Prepare Report', '2026-09-08T12:00:00.000Z'),
    getAssignmentDuplicateKey('Prepare Report', '2026-09-09T12:00:00.000Z'),
  );
});

test('duplicate lock keys contain no PostgreSQL-incompatible null bytes', () => {
  assert.equal(getAssignmentDuplicateKey('Title', '2026-09-08T12:00:00Z').includes('\u0000'), false);
});
