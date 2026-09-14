import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CORE_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_KEYS,
  PROTECTED_PERMISSION,
  effectivePermissions,
  hasPermission,
} from '../src/lib/permissions';

test('permission catalog is unique and fixed safety grants are enforced', () => {
  assert.equal(new Set(PERMISSION_KEYS).size, PERMISSION_KEYS.length);
  for (const role of ['ADMIN', 'PRODUCER', 'CONTRIBUTOR', 'OPERATOR'] as const) {
    const permissions = effectivePermissions(role, []);
    for (const permission of CORE_PERMISSIONS) assert.ok(permissions.includes(permission));
    assert.equal(permissions.includes(PROTECTED_PERMISSION), role === 'ADMIN');
  }
});

test('default grants retain established role behavior', () => {
  assert.ok(hasPermission({ role: 'ADMIN' }, 'ROLE_PERMISSION_MANAGE'));
  assert.ok(hasPermission({ role: 'PRODUCER' }, 'ASSIGNMENT_DELETE'));
  assert.ok(hasPermission({ role: 'CONTRIBUTOR' }, 'ASSIGNMENT_EDIT_OWN'));
  assert.ok(hasPermission({ role: 'OPERATOR' }, 'ASSIGNMENT_CLAIM_UNASSIGNED'));
  assert.ok(hasPermission({ role: 'OPERATOR' }, 'ASSIGNMENT_RETURN_TO_PENDING'));
  assert.equal(hasPermission({ role: 'OPERATOR' }, 'ASSIGNMENT_REOPEN_COMPLETED'), false);
  assert.equal(hasPermission({ role: 'OPERATOR' }, 'ASSIGNMENT_CREATE'), false);
  assert.equal(DEFAULT_ROLE_PERMISSIONS.PRODUCER.includes('ROLE_PERMISSION_MANAGE'), false);
});

test('permission policy is persisted, revisioned, audited, and snapshot into sessions', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  const initialMigration = readFileSync(
    'prisma/migrations/20260911010000_add_role_permissions/migration.sql',
    'utf8',
  );
  const splitMigration = readFileSync(
    'prisma/migrations/20260914090000_split_assignment_reverse_permissions/migration.sql',
    'utf8',
  );
  const route = readFileSync('src/app/api/admin/role-permissions/route.ts', 'utf8');
  const auth = readFileSync('src/lib/auth.ts', 'utf8');
  const dashboard = readFileSync('src/components/app/role-permissions-dashboard.tsx', 'utf8');

  assert.match(schema, /model RolePermission/);
  assert.match(schema, /model PermissionAudit/);
  assert.match(initialMigration, /INSERT INTO "role_permissions"/);
  for (const [role, grants] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const permission of grants) {
      if (permission === 'ASSIGNMENT_RETURN_TO_PENDING' || permission === 'ASSIGNMENT_REOPEN_COMPLETED') continue;
      assert.match(initialMigration, new RegExp(`\\('${role}', '${permission}'\\)`));
    }
  }
  assert.match(splitMigration, /SELECT "role", 'ASSIGNMENT_RETURN_TO_PENDING'/);
  assert.match(splitMigration, /SELECT "role", 'ASSIGNMENT_REOPEN_COMPLETED'/);
  assert.match(splitMigration, /VALUES \('OPERATOR', 'ASSIGNMENT_RETURN_TO_PENDING'\)/);
  assert.match(route, /"revision" = "revision" \+ 1/);
  assert.match(route, /REVISION_CONFLICT/);
  assert.match(route, /permission_audits/);
  assert.match(route, /requireUser\(\['ADMIN'\]\)/);
  assert.match(auth, /token\.permissions = user\.permissions/);
  assert.match(auth, /effectivePermissions\(token\.role\)/);
  assert.match(dashboard, /Review changes/);
  assert.match(dashboard, /next sign-in/);
});

test('backup version 6 includes permissions and claim provenance while legacy restores remain supported', () => {
  const backup = readFileSync('src/app/api/backup/route.ts', 'utf8');
  const restore = readFileSync('src/app/api/backup/restore/route.ts', 'utf8');
  assert.match(backup, /schemaVersion: 6/);
  assert.match(backup, /rolePermissions/);
  assert.match(backup, /permissionAudits/);
  assert.match(restore, /schemaVersion >= 5/);
  assert.match(restore, /claimedByOperator: z\.boolean\(\)\.optional\(\)\.default\(false\)/);
  assert.match(restore, /ASSIGNMENT_REVERSE_STATUS/);
  assert.match(restore, /backup\.metadata\.schemaVersion === 5/);
  assert.match(restore, /if \(isPermissionBackup\) await tx\.\$executeRaw`DELETE FROM "permission_audits"`/);
});
