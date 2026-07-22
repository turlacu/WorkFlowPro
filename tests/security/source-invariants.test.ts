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

test('container startup migrates without destructive seeding', () => {
  const dockerfile = read('Dockerfile');
  const compose = read('docker-compose.coolify.yml');

  assert.doesNotMatch(dockerfile, /startup\.sh|prisma db push|prisma migrate reset/);
  assert.doesNotMatch(compose, /:latest|prisma db push|prisma migrate reset|db:seed/);
  assert.match(compose, /target: migrator/);
  assert.match(compose, /service_completed_successfully/);
});

test('migration history includes the missing daily schedules table and security fields', () => {
  const migration = read(
    'prisma/migrations/20260722000000_harden_schema_and_add_daily_schedules/migration.sql',
  );
  assert.match(migration, /CREATE TABLE "daily_schedules"/);
  assert.match(migration, /"sessionVersion"/);
  assert.match(migration, /"passwordResetRequired"/);
});
