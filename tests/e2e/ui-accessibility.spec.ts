import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('login is responsive and has no serious accessibility violations', async ({ page }, testInfo) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password|parolă/i)).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
});

test('authenticated workspaces pass smoke and accessibility checks', async ({ page }, testInfo) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to exercise authenticated screens.');

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password|parolă/i).fill(password!);
  await page.getByRole('button', { name: /sign in|autentificare/i }).click();
  await expect(page).toHaveURL(/assignments|settings/);

  for (const path of ['/assignments', '/todays-schedule', '/settings']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`${path.slice(1)}.png`), fullPage: true });
  }
});
