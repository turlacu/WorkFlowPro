import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAssignmentEvent } from '../src/lib/assignment-events';
import { publishAssignmentEvent } from '../src/lib/publish-assignment-event';
import type { Prisma } from '@prisma/client';

test('assignment events accept invalidation messages and strip unrelated data', () => {
  assert.deepEqual(parseAssignmentEvent({ type: 'updated', assignmentId: 'a', secret: 'hidden' }),
    { type: 'updated', assignmentId: 'a' });
  assert.deepEqual(parseAssignmentEvent({ type: 'reset' }), { type: 'reset' });
  for (const invalid of [null, {}, { type: 'unknown' }, { type: 'updated' }, { type: 'deleted', assignmentId: 1 }]) {
    assert.equal(parseAssignmentEvent(invalid), null);
  }
});

test('publication uses the caller transaction and propagates database failures', async () => {
  let parameters: unknown[] = [];
  const tx = { $executeRaw: async (_sql: TemplateStringsArray, ...args: unknown[]) => { parameters = args; } };
  await publishAssignmentEvent(tx as unknown as Prisma.TransactionClient, { type: 'created', assignmentId: 'a' });
  assert.deepEqual(parameters, ['workflowpro_assignments', '{"type":"created","assignmentId":"a"}']);
  const failing = { $executeRaw: async () => { throw new Error('transaction failed'); } };
  await assert.rejects(publishAssignmentEvent(failing as unknown as Prisma.TransactionClient, { type: 'reset' }), /transaction failed/);
});
