import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const authenticatedRoutes = [
  '/assignments',
  '/todays-schedule',
  '/settings',
  '/dashboard/scheduling/manual',
  '/dashboard/scheduling/import',
  '/dashboard/scheduling/delete',
  '/dashboard/scheduling/excel-configurations',
  '/dashboard/scheduling/color-legend',
  '/dashboard/users',
  '/dashboard/statistics',
  '/dashboard/backups',
];

async function expectPageQuality(page: import('@playwright/test').Page, path: string) {
  const seriousViolations = (await new AxeBuilder({ page }).analyze()).violations
    .filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))
    .map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target.join(' ')),
    }));

  expect.soft(
    seriousViolations,
    `${path} contains serious or critical accessibility violations`,
  ).toEqual([]);

  const width = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect.soft(
    width.documentWidth,
    `${path} must not create document-level horizontal scrolling`,
  ).toBeLessThanOrEqual(width.viewportWidth);
}

test('login is responsive and has no serious accessibility violations', async ({ page }, testInfo) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password|parolă/i)).toBeVisible();

  await expectPageQuality(page, '/login');
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

  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration|Minified React error #418/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  for (const path of authenticatedRoutes) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expectPageQuality(page, path);
    await page.screenshot({
      path: testInfo.outputPath(`${path.slice(1).replaceAll('/', '-')}.png`),
      fullPage: true,
    });
  }

  expect(hydrationErrors, 'authenticated pages must hydrate without React errors').toEqual([]);
});

test('health endpoints and unauthenticated access controls are explicit', async ({ request }) => {
  const liveness = await request.get('/api/healthz');
  expect(liveness.status()).toBe(200);
  expect(await liveness.json()).toMatchObject({ status: 'healthy' });

  const readiness = await request.get('/api/health');
  expect([200, 503]).toContain(readiness.status());
  expect(await readiness.json()).toHaveProperty('checks');

  const users = await request.get('/api/users');
  expect(users.status()).toBe(401);

  const adminPage = await request.get('/dashboard/users', { maxRedirects: 0 });
  expect(adminPage.status()).toBe(307);
  expect(adminPage.headers().location).toContain('/login');
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
