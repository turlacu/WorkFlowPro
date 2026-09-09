import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { randomUUID } from 'node:crypto';

test('committed changes reach separate producer and operator sessions over real SSE', async ({ browser, baseURL }) => {
  const databaseUrl = process.env.REALTIME_TEST_DATABASE_URL;
  test.skip(!databaseUrl, 'Requires an isolated database and an app started with the same DATABASE_URL.');
  if (!['localhost', '127.0.0.1'].includes(new URL(databaseUrl!).hostname)) throw new Error('Use a local isolated test database');
  test.setTimeout(90_000);
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
  const suffix = randomUUID();
  const producer = await db.user.create({ data: { name: 'Live Producer', email: `producer-${suffix}@example.test`, role: 'PRODUCER' } });
  const operator = await db.user.create({ data: { name: 'Live Operator', email: `operator-${suffix}@example.test`, role: 'OPERATOR' } });
  const producerContext = await browser.newContext();
  const operatorContext = await browser.newContext();
  const operatorBaseURL = process.env.REALTIME_SECOND_APP_URL || baseURL;
  try {
    for (const [context, user] of [[producerContext, producer], [operatorContext, operator]] as const) {
      const token = await encode({ secret: process.env.NEXTAUTH_SECRET!, token: { sub: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: 0, passwordResetRequired: false } });
      await context.addCookies([{ name: 'next-auth.session-token', value: token, url: context === operatorContext ? operatorBaseURL! : baseURL! }]);
    }
    const producerPage = await producerContext.newPage();
    const operatorPage = await operatorContext.newPage();
    const streams = [producerPage, operatorPage].map(page => page.waitForResponse(response => response.url().endsWith('/api/assignments/stream') && response.status() === 200));
    await Promise.all([producerPage.goto(`${baseURL}/assignments`), operatorPage.goto(`${operatorBaseURL}/assignments`)]);
    await Promise.all(streams);
    const name = `Live ${suffix}`;
    const created = await producerContext.request.post(`${baseURL}/api/assignments`, { data: {
      name, assignedToId: operator.id, dueDate: new Date().toISOString(), priority: 'URGENT',
    } });
    expect(created.status(), await created.text()).toBe(201);
    const assignment = await created.json();
    const duplicate = await producerContext.request.post(`${baseURL}/api/assignments`, { data: {
      name, assignedToId: operator.id, dueDate: new Date().toISOString(), priority: 'URGENT',
    } });
    expect(duplicate.status()).toBe(409);
    const operatorRow = operatorPage.getByRole('row').filter({ hasText: name });
    const producerRow = producerPage.getByRole('row').filter({ hasText: name });
    await expect(operatorRow).toBeVisible({ timeout: 2000 });
    await expect(producerRow).toBeVisible({ timeout: 2000 });
    await operatorRow.getByRole('checkbox').nth(0).click();
    await expect(operatorRow.getByRole('checkbox').first()).toBeChecked();
    await expect(producerRow.getByRole('checkbox').first()).toBeChecked({ timeout: 2000 });
    await operatorRow.getByRole('checkbox').nth(1).click();
    await expect.poll(async () => (await db.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).status).toBe('COMPLETED');
    await expect(producerRow).toContainText(/Completed|Finalizat|Completată/, { timeout: 2000 });

    // A NOTIFY rolled back with its write must not reach listeners.
    let events = 0;
    await operatorPage.exposeFunction('recordAssignmentEvent', () => { events++; });
    await operatorPage.evaluate(async () => {
      const source = new EventSource('/api/assignments/stream');
      await new Promise<void>(resolve => source.addEventListener('connected', () => resolve(), { once: true }));
      source.addEventListener('assignment', () => (window as unknown as { recordAssignmentEvent: () => void }).recordAssignmentEvent());
    });
    const before = events;
    await expect(db.$transaction(async tx => {
      await tx.assignment.update({ where: { id: assignment.id }, data: { name: 'Rolled back' } });
      await tx.$executeRaw`SELECT pg_notify('workflowpro_assignments', '{"type":"reset"}')`;
      throw new Error('rollback test');
    })).rejects.toThrow('rollback test');
    await operatorPage.waitForTimeout(400);
    expect(events).toBe(before);
    expect((await db.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).name).toBe(name);

    // Reconnect must resynchronize even if the write happened while LISTEN was disconnected.
    await db.$queryRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE application_name = 'workflowpro-assignments' AND datname = current_database()`;
    await db.assignment.update({ where: { id: assignment.id }, data: { name: `${name} recovered` } });
    await expect(operatorRow).toContainText('recovered', { timeout: 10_000 });
    await expect(producerRow).toContainText('recovered', { timeout: 10_000 });
    const removed = await producerContext.request.delete(`${baseURL}/api/assignments/${assignment.id}`);
    expect(removed.ok()).toBe(true);
    await expect(operatorRow).toHaveCount(0, { timeout: 2000 });
    await db.user.update({ where: { id: operator.id }, data: { sessionVersion: 1 } });
    const expired = await operatorContext.request.get(`${operatorBaseURL}/api/assignments/stream`);
    expect(expired.status()).toBe(401);
  } finally {
    await Promise.allSettled([producerContext.close(), operatorContext.close()]);
    await db.assignment.deleteMany({ where: { createdById: producer.id } });
    await db.user.deleteMany({ where: { id: { in: [producer.id, operator.id] } } });
    await db.$disconnect();
  }
});
