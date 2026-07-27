import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from '../src/lib/password';

test('generated one-time passwords survive the complete hash and verification flow', async () => {
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);

  assert.equal(password.length, 20);
  assert.match(password, /^[A-HJ-NP-Za-km-z2-9]+$/);
  assert.notEqual(passwordHash, password);
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword(`${password}x`, passwordHash), false);
});

test('one-time password generation does not reuse a fixed credential', () => {
  const passwords = new Set(Array.from({ length: 20 }, generateTemporaryPassword));
  assert.equal(passwords.size, 20);
});
