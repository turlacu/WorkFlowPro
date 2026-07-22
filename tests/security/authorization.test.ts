import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canManageAssignmentDetails,
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

test('only managers can modify details while the assigned operator can transition an assignment', () => {
  const assignment = { assignedToId: 'operator-1', createdById: 'producer-1' };

  assert.equal(canManageAssignmentDetails({ id: 'operator-1', role: 'OPERATOR' }), false);
  assert.equal(canTransitionAssignment({ id: 'operator-1', role: 'OPERATOR' }, assignment), true);
  assert.equal(canTransitionAssignment({ id: 'operator-2', role: 'OPERATOR' }, assignment), false);
  assert.equal(canTransitionAssignment({ id: 'producer-2', role: 'PRODUCER' }, assignment), true);
  assert.equal(canManageAssignmentDetails({ id: 'admin-1', role: 'ADMIN' }), true);
});
