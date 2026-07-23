import assert from 'node:assert/strict';
import test from 'node:test';

import {
  notificationRecipient,
  serializeNotification,
} from '../src/lib/notification-types';

test('new assignments and reassignment notify only the new operator', () => {
  assert.equal(notificationRecipient(null, 'operator-1'), 'operator-1');
  assert.equal(notificationRecipient('operator-1', 'operator-2'), 'operator-2');
});

test('unchanged and unassigned assignments do not create notifications', () => {
  assert.equal(notificationRecipient('operator-1', 'operator-1'), null);
  assert.equal(notificationRecipient('operator-1', undefined), null);
  assert.equal(notificationRecipient('operator-1', null), null);
  assert.equal(notificationRecipient(null, undefined), null);
});

test('notification records serialize to the public wire format', () => {
  const notification = serializeNotification({
    id: 'notification-1',
    type: 'ASSIGNMENT_ASSIGNED',
    assignmentId: 'assignment-1',
    assignmentName: 'Morning rundown',
    dueDate: new Date('2026-07-23T09:00:00.000Z'),
    actorId: 'producer-1',
    actorName: 'Producer One',
    readAt: null,
    createdAt: new Date('2026-07-23T08:00:00.000Z'),
  });

  assert.deepEqual(notification, {
    id: 'notification-1',
    type: 'ASSIGNMENT_ASSIGNED',
    assignmentId: 'assignment-1',
    assignmentName: 'Morning rundown',
    dueDate: '2026-07-23T09:00:00.000Z',
    actor: { id: 'producer-1', name: 'Producer One' },
    readAt: null,
    createdAt: '2026-07-23T08:00:00.000Z',
  });
});
