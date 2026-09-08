import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canDeleteAssignment,
  canManageAssignmentDetails,
  canStartAssignment,
  canTransitionAssignment,
  canUpdateUser,
} from '../../src/lib/roles';

test('operators cannot promote themselves or update another user', () => {
  const operator = { id: 'operator-1', role: 'OPERATOR' as const };

  assert.equal(canUpdateUser(operator, operator.id, 'ADMIN'), false);
  assert.equal(canUpdateUser(operator, 'operator-2', 'OPERATOR'), false);
  assert.equal(canUpdateUser(operator, operator.id, 'OPERATOR'), true);
});

test('admins may update users while producers cannot change user accounts', () => {
  assert.equal(
    canUpdateUser({ id: 'admin-1', role: 'ADMIN' }, 'operator-1', 'PRODUCER'),
    true,
  );
  assert.equal(
    canUpdateUser({ id: 'producer-1', role: 'PRODUCER' }, 'operator-1', 'OPERATOR'),
    false,
  );
});

test('managers can modify all details while operators only transition assigned work', () => {
  const assignment = { assignedToId: 'operator-1', createdById: 'producer-1' };

  assert.equal(canManageAssignmentDetails({ id: 'operator-1', role: 'OPERATOR' }, assignment), false);
  assert.equal(canTransitionAssignment({ id: 'operator-1', role: 'OPERATOR' }, assignment), true);
  assert.equal(canTransitionAssignment({ id: 'operator-2', role: 'OPERATOR' }, assignment), false);
  assert.equal(canTransitionAssignment({ id: 'producer-2', role: 'PRODUCER' }, assignment), true);
  assert.equal(canManageAssignmentDetails({ id: 'admin-1', role: 'ADMIN' }, assignment), true);
});

test('operators can claim unassigned work by starting it but cannot complete it before assignment', () => {
  const operator = { id: 'operator-1', role: 'OPERATOR' as const };
  const unassigned = { assignedToId: null, createdById: 'producer-1' };

  assert.equal(canStartAssignment(operator, unassigned), true);
  assert.equal(canTransitionAssignment(operator, unassigned), false);
  assert.equal(
    canStartAssignment(operator, { ...unassigned, assignedToId: 'operator-2' }),
    false,
  );
});

test('contributors manage and transition only assignments they created and never delete', () => {
  const ownAssignment = { assignedToId: 'operator-1', createdById: 'contributor-1' };
  const otherAssignment = { assignedToId: 'operator-1', createdById: 'producer-1' };
  const contributor = { id: 'contributor-1', role: 'CONTRIBUTOR' as const };

  assert.equal(canManageAssignmentDetails(contributor, ownAssignment), true);
  assert.equal(canManageAssignmentDetails(contributor, otherAssignment), false);
  assert.equal(canTransitionAssignment(contributor, ownAssignment), true);
  assert.equal(canTransitionAssignment(contributor, otherAssignment), false);
  assert.equal(
    canTransitionAssignment(contributor, { assignedToId: contributor.id, createdById: 'producer-1' }),
    false,
  );
  assert.equal(canDeleteAssignment(contributor), false);
  assert.equal(canDeleteAssignment({ role: 'PRODUCER' }), true);
  assert.equal(canDeleteAssignment({ role: 'ADMIN' }), true);
});
