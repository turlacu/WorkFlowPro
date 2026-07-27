import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('production debug and destructive reset endpoints stay removed', () => {
  for (const path of [
    'src/app/api/admin/clear-database/route.ts',
    'src/app/api/admin/reset-database/route.ts',
    'src/app/api/debug/route.ts',
    'src/app/api/debug/database/route.ts',
    'src/app/api/upload/route.ts',
  ]) {
    assert.equal(existsSync(path), false, `${path} must not be deployed`);
  }
});

test('session invalidation counters are issued only at login', () => {
  const authSource = read('src/lib/auth.ts');
  assert.doesNotMatch(authSource, /else if \(token\.sub\)/);
  assert.match(authSource, /token\.sessionVersion = user\.sessionVersion/);
  assert.match(read('src/lib/server-auth.ts'), /session\.user\.sessionVersion !== user\.sessionVersion/);
});

test('login errors do not advertise credentials', () => {
  const translations = read('src/lib/translations.ts');
  assert.doesNotMatch(translations, /admin@example\.com/);
  assert.doesNotMatch(translations, /LoginFailedDescription:.*(?:Hint|Sugestie)/);
});

test('user credentials are generated once, copyable, and never cached', () => {
  const usersRoute = read('src/app/api/users/route.ts');
  const resetRoute = read('src/app/api/admin/reset-password/route.ts');
  const userManagement = read('src/components/app/user-management-dashboard.tsx');

  assert.match(usersRoute, /generateTemporaryPassword\(\)/);
  assert.match(usersRoute, /passwordResetRequired: true/);
  assert.match(resetRoute, /generateTemporaryPassword\(\)/);
  assert.match(usersRoute, /Cache-Control', 'no-store/);
  assert.match(resetRoute, /Cache-Control', 'no-store/);
  assert.doesNotMatch(userManagement, /name="password"/);
  assert.match(userManagement, /navigator\.clipboard/);
  assert.match(userManagement, /readOnly/);
});

test('UI accessibility foundations remain enabled', () => {
  const globals = read('src/app/globals.css');
  const mobileMenu = read('src/components/app/mobile-menu.tsx');
  const assignments = read('src/components/app/assignment-table.tsx');
  const themeToggle = read('src/components/app/theme-toggle.tsx');

  assert.match(globals, /prefers-reduced-motion/);
  assert.match(mobileMenu, /SheetContent/);
  assert.match(mobileMenu, /aria-current/);
  assert.doesNotMatch(assignments, /calc\(100vh-3(?:00|50)px\)/);
  assert.match(assignments, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(themeToggle, /resolvedTheme/);
});

test('container startup migrates without destructive seeding', () => {
  const dockerfile = read('Dockerfile');
  const compose = read('docker-compose.coolify.yml');

  assert.doesNotMatch(dockerfile, /startup\.sh|prisma db push|prisma migrate reset/);
  assert.doesNotMatch(compose, /:latest|prisma db push|prisma migrate reset|db:seed/);
  assert.match(compose, /target: migrator/);
  assert.match(compose, /service_completed_successfully/);
  assert.match(dockerfile, /apk add --no-cache libc6-compat openssl/);
  assert.match(dockerfile, /FROM dependencies AS migrator/);
  assert.match(
    dockerfile,
    /FROM dependencies AS bootstrap[\s\S]*COPY prisma \.\/prisma[\s\S]*RUN npx prisma generate/,
  );
  for (const runtimeSecret of [
    'POSTGRES_PASSWORD',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'MINIO_ROOT_USER',
    'MINIO_ROOT_PASSWORD',
  ]) {
    assert.doesNotMatch(
      compose,
      new RegExp(`\\$\\{${runtimeSecret}:\\?`),
      `${runtimeSecret} must remain runtime-only during Coolify Compose builds`,
    );
  }
  assert.doesNotMatch(compose, /cloudflared|CLOUDFLARE_TUNNEL_TOKEN/);
});

test('migration history includes the missing daily schedules table and security fields', () => {
  const migration = read(
    'prisma/migrations/20260722000000_harden_schema_and_add_daily_schedules/migration.sql',
  );
  assert.match(migration, /CREATE TABLE "daily_schedules"/);
  assert.match(migration, /"sessionVersion"/);
  assert.match(migration, /"passwordResetRequired"/);
});

test('assignment notifications are persistent, recipient-scoped, and commit-aware', () => {
  const assignmentsRoute = read('src/app/api/assignments/route.ts');
  const notificationRoute = read('src/app/api/notifications/route.ts');
  const streamRoute = read('src/app/api/notifications/stream/route.ts');
  const migration = read(
    'prisma/migrations/20260723000000_add_assignment_notifications/migration.sql',
  );

  assert.match(assignmentsRoute, /prisma\.\$transaction/);
  assert.match(assignmentsRoute, /assignedUser\.role !== 'OPERATOR'/);
  assert.match(assignmentsRoute, /pg_notify/);
  assert.match(notificationRoute, /recipientId: auth\.user\.id/);
  assert.match(notificationRoute, /requireUser\(\['OPERATOR'\]\)/);
  assert.match(streamRoute, /text\/event-stream/);
  assert.match(streamRoute, /notificationBroker\.subscribe\(recipientId/);
  assert.match(streamRoute, /Cache-Control.*no-cache, no-transform/);
  assert.match(migration, /CREATE TABLE "notifications"/);
  assert.match(migration, /notifications_recipientId_readAt_createdAt_idx/);
});

test('presence is authenticated, persistent, role-inclusive, and non-buffered', () => {
  const schema = read('prisma/schema.prisma');
  const migration = read(
    'prisma/migrations/20260727020000_add_user_presence/migration.sql',
  );
  const streamRoute = read('src/app/api/presence/stream/route.ts');
  const provider = read('src/contexts/PresenceContext.tsx');
  const assignments = read('src/app/(app)/assignments/page.tsx');

  assert.match(schema, /model UserPresence/);
  assert.match(migration, /CREATE TABLE "user_presence"/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(streamRoute, /requireUser\(undefined, true\)/);
  assert.match(streamRoute, /INSERT INTO "user_presence"/);
  assert.match(streamRoute, /ON CONFLICT \("userId"\)/);
  assert.match(streamRoute, /sessionVersion !== auth\.user\.sessionVersion/);
  assert.match(streamRoute, /text\/event-stream/);
  assert.match(streamRoute, /X-Accel-Buffering.*no/);
  assert.doesNotMatch(streamRoute, /requireUser\(\['OPERATOR'\]\)/);
  assert.match(provider, /new EventSource\('\/api\/presence\/stream'\)/);
  assert.match(provider, /PRESENCE_CLIENT_STALE_MS/);
  assert.match(assignments, /OnlineNow/);
  assert.match(assignments, /onlineUsers\.map/);
  assert.match(assignments, /isUserOnline\(p\.id\)/);
  assert.match(assignments, /isUserOnline\(o\.id\)/);
  assert.doesNotMatch(assignments, /animate-pulse/);
});
