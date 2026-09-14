import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { getAssignmentClaimUpdate } from '../src/lib/assignment-claim';
import {
  canReopenCompletedAssignment,
  canReturnAssignmentToPending,
} from '../src/lib/roles';

test('operators can return started work but cannot reopen completed work by default', () => {
  const operator = { role: 'OPERATOR' as const };

  assert.equal(canReturnAssignmentToPending(operator), true);
  assert.equal(canReopenCompletedAssignment(operator), false);
});

test('completed work can be reopened only when the separate permission is granted', () => {
  const operator = {
    role: 'OPERATOR' as const,
    permissions: ['ASSIGNMENT_REOPEN_COMPLETED'] as const,
  };

  assert.equal(canReturnAssignmentToPending(operator), false);
  assert.equal(canReopenCompletedAssignment(operator), true);
});

test('operator claims are tracked and become unassigned when returned to pending', () => {
  assert.deepEqual(getAssignmentClaimUpdate({
    currentClaimedByOperator: false,
    operatorClaimingUserId: 'operator-1',
    returningToPending: false,
  }), { assignedToId: 'operator-1', claimedByOperator: true });

  assert.deepEqual(getAssignmentClaimUpdate({
    currentClaimedByOperator: true,
    returningToPending: true,
  }), { assignedToId: null, claimedByOperator: false });
});

test('administratively assigned work keeps its assignee when returned to pending', () => {
  assert.deepEqual(getAssignmentClaimUpdate({
    currentClaimedByOperator: false,
    returningToPending: true,
  }), {});

  assert.deepEqual(getAssignmentClaimUpdate({
    currentClaimedByOperator: true,
    requestedAssignedToId: 'operator-1',
    returningToPending: true,
  }), { assignedToId: 'operator-1', claimedByOperator: false });
});

test('API and UI enforce the two reversal permissions independently', () => {
  const route = readFileSync('src/app/api/assignments/route.ts', 'utf8');
  const table = readFileSync('src/components/app/assignment-table.tsx', 'utf8');
  const migration = readFileSync(
    'prisma/migrations/20260914090000_split_assignment_reverse_permissions/migration.sql',
    'utf8',
  );

  assert.match(route, /canReturnAssignmentToPending/);
  assert.match(route, /canReopenCompletedAssignment/);
  assert.match(route, /getAssignmentClaimUpdate/);
  assert.match(table, /ASSIGNMENT_RETURN_TO_PENDING/);
  assert.match(table, /ASSIGNMENT_REOPEN_COMPLETED/);
  assert.match(migration, /"claimedByOperator" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /'OPERATOR', 'ASSIGNMENT_RETURN_TO_PENDING'/);
  assert.doesNotMatch(migration, /'OPERATOR', 'ASSIGNMENT_REOPEN_COMPLETED'/);
});
