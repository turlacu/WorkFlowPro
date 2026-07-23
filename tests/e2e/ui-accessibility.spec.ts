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

test('assigned operators receive a realtime notification', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Realtime delivery is exercised once on desktop.');
  const managerEmail = process.env.E2E_MANAGER_EMAIL;
  const managerPassword = process.env.E2E_MANAGER_PASSWORD;
  const operatorEmail = process.env.E2E_OPERATOR_EMAIL;
  const operatorPassword = process.env.E2E_OPERATOR_PASSWORD;
  test.skip(
    !managerEmail || !managerPassword || !operatorEmail || !operatorPassword,
    'Set manager and operator E2E credentials to exercise realtime delivery.',
  );

  const managerContext = await browser.newContext();
  const operatorContext = await browser.newContext();
  const managerPage = await managerContext.newPage();
  const operatorPage = await operatorContext.newPage();
  let assignmentId: string | undefined;

  const login = async (page: typeof managerPage, email: string, password: string) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password|parolă/i).fill(password);
    await page.getByRole('button', { name: /sign in|autentificare/i }).click();
    await expect(page).toHaveURL(/assignments/);
  };

  try {
    await login(managerPage, managerEmail!, managerPassword!);
    await login(operatorPage, operatorEmail!, operatorPassword!);

    const usersResponse = await managerPage.request.get('/api/users?role=OPERATOR');
    expect(usersResponse.ok()).toBeTruthy();
    const users: Array<{ id: string; email: string }> = await usersResponse.json();
    const operator = users.find((user) => user.email.toLowerCase() === operatorEmail!.toLowerCase());
    expect(operator).toBeTruthy();

    const assignmentName = `Realtime notification ${Date.now()}`;
    const createResponse = await managerPage.request.post('/api/assignments', {
      data: {
        name: assignmentName,
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
        priority: 'NORMAL',
        assignedToId: operator!.id,
      },
    });
    expect(createResponse.status()).toBe(201);
    assignmentId = (await createResponse.json()).id;

    await expect(operatorPage.getByText(assignmentName).first()).toBeVisible();
    await operatorPage.getByRole('button', { name: /notifications/i }).click();
    await expect(operatorPage.getByText(assignmentName).first()).toBeVisible();
  } finally {
    if (assignmentId) {
      await managerPage.request.delete(`/api/assignments/${assignmentId}`);
    }
    await managerContext.close();
    await operatorContext.close();
  }
});
