import 'dotenv/config';
import { test, expect, type Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';

// Exercise the real page and hook with controlled API/stream fixtures; no production data writes.
test('live creation, status, comments, reconnect and deletion preserve the open workspace', async ({ page, context, baseURL }) => {
  test.skip(!process.env.NEXTAUTH_SECRET, 'Set NEXTAUTH_SECRET to match the local test server.');
  const user = { id: 'operator-test', name: 'Test Operator', email: 'test@example.test', role: 'OPERATOR' as const, sessionVersion: 0, passwordResetRequired: false };
  const token = await encode({ secret: process.env.NEXTAUTH_SECRET!, token: { sub: user.id, ...user }, maxAge: 3600 });
  await context.addCookies([{ name: 'next-auth.session-token', value: token, url: baseURL! }]);
  await page.clock.install();
  await page.addInitScript(() => {
    const sources: Array<EventTarget & { url: string }> = [];
    class MockEventSource extends EventTarget {
      constructor(public url: string) { super(); sources.push(this); }
      close() { const index = sources.indexOf(this); if (index >= 0) sources.splice(index, 1); }
    }
    Object.assign(window, { EventSource: MockEventSource, assignmentTestSources: sources });
  });
  const today = new Date().toISOString();
  const assignment = {
    id: 'assignment-test', name: 'Realtime test assignment', dueDate: today,
    status: 'PENDING', priority: 'NORMAL', assignedToId: user.id, assignedTo: user,
    createdById: 'producer-test', createdBy: { id: 'producer-test', name: 'Producer' },
    lastUpdatedBy: user, lastUpdatedById: user.id, createdAt: today, updatedAt: today,
    completedAt: null, completedBy: null, commentCount: 0,
  };
  let records: typeof assignment[] = [];
  let comments: object[] = [];
  let reads = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === '/api/auth/session') data = { user, expires: new Date(Date.now() + 3600_000).toISOString() };
    else if (path === '/api/assignments') { reads++; data = records; }
    else if (path.endsWith('/comments')) data = comments;
    else if (path === '/api/users') data = [user];
    else if (path === '/api/notifications') data = { items: [], unreadCount: 0, nextCursor: null };
    await route.fulfill({ json: data });
  });
  const emit = async (target: Page, type = 'assignment') => target.evaluate((eventType) => {
    const sources = (window as unknown as { assignmentTestSources: Array<EventTarget & { url: string }> }).assignmentTestSources;
    sources.filter((source) => source.url === '/api/assignments/stream')
      .forEach((source) => source.dispatchEvent(new MessageEvent(eventType, { data: JSON.stringify({ type: 'reset' }) })));
  }, type);
  await page.goto('/assignments');
  await expect.poll(() => reads).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() =>
    (window as unknown as { assignmentTestSources: Array<{ url: string }> }).assignmentTestSources.some(s => s.url === '/api/assignments/stream'),
  )).toBe(true);
  records = [assignment];
  await emit(page);
  const task = page.getByRole('button', { name: /Realtime test assignment/ }).filter({ visible: true }).first();
  await expect(task).toBeVisible({ timeout: 2000 });
  assignment.status = 'IN_PROGRESS';
  await emit(page);
  await expect(page.getByRole('checkbox', { name: /started|începută/ }).filter({ visible: true }).first()).toBeChecked({ timeout: 2000 });
  await task.click();
  const draft = page.getByRole('dialog').getByRole('textbox').first();
  await draft.fill('Keep my unfinished comment');
  comments = [{ id: 'comment-test', content: 'New remote comment', authorName: 'Producer', author: assignment.createdBy, createdAt: today, parentId: null }];
  assignment.commentCount = 1;
  assignment.updatedAt = new Date(Date.now() + 1000).toISOString();
  await emit(page);
  await expect(page.getByText('New remote comment')).toBeVisible({ timeout: 2000 });
  await expect(draft).toHaveValue('Keep my unfinished comment');
  assignment.name = 'Changed during disconnect';
  await emit(page, 'connected');
  await expect(page.getByRole('dialog').getByText('Changed during disconnect', { exact: true })).toBeVisible();
  assignment.name = 'Recovered without an event';
  await page.clock.fastForward(30_000);
  await page.clock.runFor(200);
  await expect(page.getByRole('dialog').getByText('Recovered without an event', { exact: true })).toBeVisible();
  await expect(draft).toHaveValue('Keep my unfinished comment');
  records = [];
  await emit(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
