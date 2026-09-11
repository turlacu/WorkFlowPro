import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Prisma, type UserRole } from '@prisma/client';
import { z } from 'zod';

import { recordActivity } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';
import {
  CORE_PERMISSIONS,
  PERMISSION_CATALOG,
  PERMISSION_KEYS,
  PROTECTED_PERMISSION,
  effectivePermissions,
  hasPermission,
  type PermissionKey,
} from '@/lib/permissions';
import { USER_ROLES } from '@/lib/roles';
import { requireUser } from '@/lib/server-auth';

const RoleGrantsSchema = z.object({
  ADMIN: z.array(z.enum(PERMISSION_KEYS)),
  PRODUCER: z.array(z.enum(PERMISSION_KEYS)),
  CONTRIBUTOR: z.array(z.enum(PERMISSION_KEYS)),
  OPERATOR: z.array(z.enum(PERMISSION_KEYS)),
}).strict();

const UpdateSchema = z.object({
  revision: z.number().int().positive(),
  grants: RoleGrantsSchema,
}).strict();

type PermissionRow = { role: UserRole; permission: string };

async function authorize() {
  const auth = await requireUser(['ADMIN']);
  if (auth.response) return auth;
  if (!hasPermission(auth.user, PROTECTED_PERMISSION)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }
  return auth;
}

async function readPolicy() {
  const [policyRows, permissionRows, auditRows] = await Promise.all([
    prisma.$queryRaw<Array<{ revision: number; updatedAt: Date }>>`
      SELECT "revision", "updatedAt" FROM "permission_policy" WHERE "id" = 'global' LIMIT 1
    `,
    prisma.$queryRaw<PermissionRow[]>`
      SELECT "role", "permission" FROM "role_permissions" ORDER BY "role", "permission"
    `,
    prisma.$queryRaw<Array<{
      id: string; occurredAt: Date; actorName: string; actorEmail: string;
      targetRole: UserRole; permission: string; enabled: boolean;
    }>>`
      SELECT "id", "occurredAt", "actorName", "actorEmail", "targetRole", "permission", "enabled"
      FROM "permission_audits" ORDER BY "occurredAt" DESC, "id" DESC LIMIT 100
    `,
  ]);
  const byRole = Object.fromEntries(USER_ROLES.map((role) => [role, [] as PermissionKey[]])) as Record<UserRole, PermissionKey[]>;
  for (const row of permissionRows) {
    if ((PERMISSION_KEYS as readonly string[]).includes(row.permission)) byRole[row.role].push(row.permission as PermissionKey);
  }
  for (const role of USER_ROLES) byRole[role] = effectivePermissions(role, byRole[role]);
  return {
    revision: policyRows[0]?.revision ?? 1,
    updatedAt: policyRows[0]?.updatedAt?.toISOString() ?? null,
    catalog: PERMISSION_CATALOG,
    grants: byRole,
    corePermissions: CORE_PERMISSIONS,
    protectedPermission: PROTECTED_PERMISSION,
    audits: auditRows.map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString() })),
  };
}

export async function GET() {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    return NextResponse.json(await readPolicy(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    const input = UpdateSchema.parse(await request.json());

    for (const role of USER_ROLES) {
      const grants = new Set(input.grants[role]);
      if (grants.size !== input.grants[role].length) {
        return NextResponse.json({ error: `Duplicate permissions are not allowed for ${role}` }, { status: 400 });
      }
      if (CORE_PERMISSIONS.some((permission) => !grants.has(permission))) {
        return NextResponse.json({ error: `Core permissions cannot be removed from ${role}` }, { status: 400 });
      }
      if ((role === 'ADMIN') !== grants.has(PROTECTED_PERMISSION)) {
        return NextResponse.json({ error: 'The protected permission belongs exclusively to ADMIN' }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.$queryRaw<Array<{ revision: number }>>`
        UPDATE "permission_policy" SET "revision" = "revision" + 1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = 'global' AND "revision" = ${input.revision}
        RETURNING "revision"
      `;
      if (!updated[0]) throw new Error('REVISION_CONFLICT');

      const existing = await tx.$queryRaw<PermissionRow[]>`
        SELECT "role", "permission" FROM "role_permissions"
      `;
      const previous = new Set(existing.map((row) => `${row.role}:${row.permission}`));
      const next = new Set<string>();
      for (const role of USER_ROLES) for (const permission of input.grants[role]) next.add(`${role}:${permission}`);

      await tx.$executeRaw`DELETE FROM "role_permissions"`;
      const values = USER_ROLES.flatMap((role) => input.grants[role].map((permission) => Prisma.sql`(${role}::"UserRole", ${permission})`));
      if (values.length) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "role_permissions" ("role", "permission") VALUES ${Prisma.join(values)}
        `);
      }

      const changes: Array<{ role: UserRole; permission: PermissionKey; enabled: boolean }> = [];
      for (const role of USER_ROLES) {
        for (const permission of PERMISSION_KEYS) {
          const key = `${role}:${permission}`;
          if (previous.has(key) !== next.has(key)) changes.push({ role, permission, enabled: next.has(key) });
        }
      }
      for (const change of changes) {
        await tx.$executeRaw`
          INSERT INTO "permission_audits"
            ("id", "actorId", "actorName", "actorEmail", "targetRole", "permission", "enabled")
          VALUES (${randomUUID()}, ${auth.user.id}, ${auth.user.name}, ${auth.user.email},
            ${change.role}::"UserRole", ${change.permission}, ${change.enabled})
        `;
      }
      await recordActivity({
        eventType: 'ROLE_PERMISSIONS_UPDATED',
        actor: auth.user,
        targetType: 'role-permissions',
        targetName: `${changes.length} permission change${changes.length === 1 ? '' : 's'}`,
        metadata: { revision: updated[0].revision, changeCount: changes.length },
      }, tx);
    });

    return NextResponse.json(await readPolicy(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid permission configuration', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'REVISION_CONFLICT') {
      return NextResponse.json({ error: 'Permission configuration changed. Reload and review your changes.' }, { status: 409 });
    }
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Failed to update role permissions' }, { status: 500 });
  }
}
