import { Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { effectivePermissions, isPermissionKey, type PermissionKey } from '@/lib/permissions';

type PermissionClient = Prisma.TransactionClient | typeof prisma;

export async function loadRolePermissions(role: UserRole, client: PermissionClient = prisma): Promise<PermissionKey[]> {
  const rows = await client.$queryRaw<Array<{ permission: string }>>`
    SELECT "permission" FROM "role_permissions" WHERE "role" = ${role}::"UserRole" ORDER BY "permission"
  `;
  return effectivePermissions(role, rows.map((row) => row.permission).filter(isPermissionKey));
}
