import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearRateLimitsForTests,
  checkRateLimit,
  resetRateLimit,
} from '../../src/lib/rate-limit';
import { resolveWithin, safeDownloadName } from '../../src/lib/safe-path';

test('path resolution rejects traversal and empty path segments', () => {
  assert.equal(resolveWithin('/srv/backups', ['..', 'secret']), null);
  assert.equal(resolveWithin('/srv/backups', ['nested', '..', '..', 'secret']), null);
  assert.equal(resolveWithin('/srv/backups', ['']), null);
  assert.equal(resolveWithin('/srv/backups', ['backup.json']), '/srv/backups/backup.json');
});

test('download names cannot inject headers or directories', () => {
  assert.equal(safeDownloadName('../../report\r\n\".json'), 'report___.json');
});

test('rate limiter blocks at the limit and resets after the window', () => {
  clearRateLimitsForTests();
  const options = { limit: 2, windowMs: 1_000 };

  assert.equal(checkRateLimit('login:test', options, 10_000).allowed, true);
  assert.equal(checkRateLimit('login:test', options, 10_100).allowed, true);
  assert.deepEqual(checkRateLimit('login:test', options, 10_200), {
    allowed: false,
    retryAfterSeconds: 1,
  });
  assert.equal(checkRateLimit('login:test', options, 11_000).allowed, true);
});

test('a successful login can clear only its account rate limit', () => {
  clearRateLimitsForTests();
  const options = { limit: 1, windowMs: 1_000 };

  assert.equal(checkRateLimit('login:account:user@example.com', options, 10_000).allowed, true);
  assert.equal(checkRateLimit('login:account:user@example.com', options, 10_100).allowed, false);

  resetRateLimit('login:account:user@example.com');

  assert.equal(checkRateLimit('login:account:user@example.com', options, 10_200).allowed, true);
});
