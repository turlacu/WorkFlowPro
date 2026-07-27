import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRESENCE_ONLINE_WINDOW_MS,
  isPresenceEvent,
  isPresenceFresh,
} from '../src/lib/presence';

test('presence remains online through the freshness boundary and expires after it', () => {
  const now = Date.parse('2026-07-27T12:00:00.000Z');

  assert.equal(isPresenceFresh(now, now), true);
  assert.equal(isPresenceFresh(now - PRESENCE_ONLINE_WINDOW_MS, now), true);
  assert.equal(isPresenceFresh(now - PRESENCE_ONLINE_WINDOW_MS - 1, now), false);
  assert.equal(isPresenceFresh('not-a-date', now), false);
});

test('presence events accept all application roles and reject malformed users', () => {
  assert.equal(
    isPresenceEvent({
      generatedAt: '2026-07-27T12:00:00.000Z',
      users: [
        { id: 'admin-1', name: 'Admin', role: 'ADMIN' },
        { id: 'producer-1', name: 'Producer', role: 'PRODUCER' },
        { id: 'operator-1', name: 'Operator', role: 'OPERATOR' },
      ],
    }),
    true,
  );
  assert.equal(
    isPresenceEvent({
      generatedAt: '2026-07-27T12:00:00.000Z',
      users: [{ id: 'viewer-1', name: 'Viewer', role: 'VIEWER' }],
    }),
    false,
  );
  assert.equal(isPresenceEvent({ generatedAt: '2026-07-27T12:00:00.000Z' }), false);
});
