import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { publishAssignmentEvent } from '@/lib/publish-assignment-event';
import { requirePermission } from '@/lib/server-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { USER_ROLES } from '@/lib/roles';
import { Prisma } from '@prisma/client';
import { recordActivity } from '@/lib/activity-log';
import { CORE_PERMISSIONS, PERMISSION_KEYS, PROTECTED_PERMISSION } from '@/lib/permissions';

const date = z.string().datetime();
const nullableDate = date.nullable();
const role = z.enum(USER_ROLES);
const status = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
const priority = z.enum(['LOW', 'NORMAL', 'URGENT']);
const backupPermission = z.union([z.enum(PERMISSION_KEYS), z.literal('ASSIGNMENT_REVERSE_STATUS')]);

const BackupSchema = z.object({
  metadata: z.object({
    schemaVersion: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    exportedAt: date,
    exportedBy: z.object({ id: z.string(), email: z.string().email() }),
  }),
  data: z.object({
    users: z.array(z.object({
      id: z.string(), name: z.string().nullable(), email: z.string().email(), role,
      createdAt: date, updatedAt: date,
    })).max(10_000),
    assignments: z.array(z.object({
      id: z.string(), name: z.string(), description: z.string().nullable(), author: z.string().nullable(),
      dueDate: date, status, priority, sourceLocation: z.string().nullable(), comment: z.string().nullable(),
      createdAt: date, updatedAt: date, completedAt: nullableDate, completedById: z.string().nullable(),
      assignedToId: z.string().nullable(), claimedByOperator: z.boolean().optional().default(false),
      createdById: z.string(), lastUpdatedById: z.string(),
    })).max(100_000),
    assignmentComments: z.array(z.object({
      id: z.string(), content: z.string().max(10_000), createdAt: date, updatedAt: date,
      assignmentId: z.string(), authorId: z.string().nullable(), authorName: z.string(), parentId: z.string().nullable(),
    })).max(500_000).optional().default([]),
    teamSchedules: z.array(z.object({
      id: z.string(), date, userId: z.string(), createdAt: date, updatedAt: date,
      shiftColor: z.string().nullable(), shiftHours: z.string().nullable(),
    })).max(500_000),
    shiftColorLegends: z.array(z.object({
      id: z.string(), colorCode: z.string(), colorName: z.string(), shiftName: z.string(),
      startTime: z.string(), endTime: z.string(), isVacation: z.boolean().default(false),
      description: z.string().nullable(), role,
      createdAt: date, updatedAt: date,
    })).max(10_000),
    configurations: z.array(z.object({
      id: z.string(), name: z.string(), role: z.string(), description: z.string().nullable(), active: z.boolean(),
      dateRow: z.number().int(), dayLabelRow: z.number().int().nullable(), nameColumn: z.number().int(),
      firstNameRow: z.number().int(), lastNameRow: z.number().int(), firstDateColumn: z.number().int(),
      lastDateColumn: z.number().int(), dynamicColumns: z.boolean(),
      skipValues: z.array(z.string()).max(1_000), validPatterns: z.array(z.string()).max(1_000),
      colorDetection: z.boolean(), defaultShift: z.string().nullable(), createdById: z.string(),
      createdAt: date, updatedAt: date,
    })).max(10_000),
    configurationLogs: z.array(z.object({
      id: z.string(), configurationId: z.string(), filename: z.string(), uploadedBy: z.string(),
      entriesCount: z.number().int(), successCount: z.number().int(), errorCount: z.number().int(), createdAt: date,
    })).max(100_000),
    rolePermissions: z.array(z.object({
      role, permission: backupPermission, createdAt: date,
    })).max(1_000).optional(),
    permissionPolicy: z.object({ revision: z.number().int().positive(), updatedAt: date }).optional(),
    permissionAudits: z.array(z.object({
      id: z.string(), occurredAt: date, actorId: z.string().nullable(), actorName: z.string(),
      actorEmail: z.string().email(), targetRole: role,
      permission: z.string().min(1).max(100), enabled: z.boolean(),
    })).max(100_000).optional(),
  }),
});

const MAX_BACKUP_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission('BACKUP_MANAGE');
    if (auth.response) return auth.response;
    const limit = checkRateLimit(`restore:${auth.user.id}`, { limit: 3, windowMs: 60 * 60_000 });
    if (!limit.allowed) return NextResponse.json({ error: 'Too many restore attempts' }, { status: 429 });

    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_BACKUP_SIZE) return NextResponse.json({ error: 'Backup exceeds 25 MB' }, { status: 400 });
    if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json')) {
      return NextResponse.json({ error: 'Only JSON backup files are accepted' }, { status: 400 });
    }

    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return NextResponse.json({ error: 'Invalid JSON backup' }, { status: 400 });
    }
    const backup = BackupSchema.parse(json);
    const isPermissionBackup = backup.metadata.schemaVersion >= 5;
    if (isPermissionBackup && (!backup.data.rolePermissions || !backup.data.permissionPolicy || !backup.data.permissionAudits)) {
      return NextResponse.json({ error: 'Permission-aware backup is missing permission data' }, { status: 400 });
    }
    const sourcePermissionKeys = new Set(
      (backup.data.rolePermissions ?? []).map((item) => `${item.role}:${item.permission}`),
    );
    if (sourcePermissionKeys.size !== (backup.data.rolePermissions ?? []).length) {
      return NextResponse.json({ error: 'Backup contains duplicate role permissions' }, { status: 400 });
    }
    const normalizedRolePermissions = new Map<string, {
      role: (typeof USER_ROLES)[number]; permission: (typeof PERMISSION_KEYS)[number]; createdAt: string;
    }>();
    for (const item of backup.data.rolePermissions ?? []) {
      const permissions = item.permission === 'ASSIGNMENT_REVERSE_STATUS'
        ? item.role === 'OPERATOR'
          ? ['ASSIGNMENT_RETURN_TO_PENDING'] as const
          : ['ASSIGNMENT_RETURN_TO_PENDING', 'ASSIGNMENT_REOPEN_COMPLETED'] as const
        : [item.permission];
      for (const permission of permissions) {
        normalizedRolePermissions.set(`${item.role}:${permission}`, { ...item, permission });
      }
    }
    if (backup.metadata.schemaVersion === 5 && !normalizedRolePermissions.has('OPERATOR:ASSIGNMENT_RETURN_TO_PENDING')) {
      normalizedRolePermissions.set('OPERATOR:ASSIGNMENT_RETURN_TO_PENDING', {
        role: 'OPERATOR', permission: 'ASSIGNMENT_RETURN_TO_PENDING', createdAt: backup.metadata.exportedAt,
      });
    }
    const restoredRolePermissions = Array.from(normalizedRolePermissions.values());
    if (isPermissionBackup) {
      const permissionSet = new Set(restoredRolePermissions.map((item) => `${item.role}:${item.permission}`));
      for (const userRole of USER_ROLES) {
        if (CORE_PERMISSIONS.some((permission) => !permissionSet.has(`${userRole}:${permission}`))) {
          return NextResponse.json({ error: `Backup removes a protected core permission from ${userRole}` }, { status: 400 });
        }
        const hasProtected = permissionSet.has(`${userRole}:${PROTECTED_PERMISSION}`);
        if ((userRole === 'ADMIN') !== hasProtected) {
          return NextResponse.json({ error: 'Backup delegates or removes the protected permission' }, { status: 400 });
        }
      }
    }

    const currentBackupUser = backup.data.users.find((user) => user.email.toLowerCase() === auth.user.email.toLowerCase());
    const remapUserId = (id: string | null) => {
      if (!id) return null;
      return currentBackupUser?.id === id ? auth.user.id : id;
    };

    const usersToRestore = backup.data.users.filter(
      (user) => user.id !== currentBackupUser?.id && user.id !== auth.user.id && user.email.toLowerCase() !== auth.user.email.toLowerCase(),
    );
    if (auth.user.role !== 'ADMIN' && !usersToRestore.some((user) => user.role === 'ADMIN')) {
      return NextResponse.json({ error: 'Restore must retain at least one administrator' }, { status: 400 });
    }
    const usersWithPasswords = await Promise.all(usersToRestore.map(async (user) => ({
      ...user,
      email: user.email.toLowerCase(),
      password: await bcrypt.hash(randomBytes(32).toString('base64url'), 12),
      passwordResetRequired: true,
      sessionVersion: 0,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    })));

    await prisma.$transaction(async (tx) => {
      if (isPermissionBackup) await tx.$executeRaw`DELETE FROM "permission_audits"`;
      await tx.uploadConfigurationLog.deleteMany();
      await tx.assignment.deleteMany();
      await tx.teamSchedule.deleteMany();
      await tx.shiftColorLegend.deleteMany();
      await tx.excelUploadConfiguration.deleteMany();
      await tx.user.deleteMany({ where: { id: { not: auth.user.id } } });

      if (usersWithPasswords.length) await tx.user.createMany({ data: usersWithPasswords });
      if (backup.data.shiftColorLegends.length) {
        await tx.shiftColorLegend.createMany({ data: backup.data.shiftColorLegends.map((item) => ({
          ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
        })) });
      }
      if (backup.data.configurations.length) {
        await tx.excelUploadConfiguration.createMany({ data: backup.data.configurations.map((item) => ({
          ...item,
          skipValues: item.skipValues,
          validPatterns: item.validPatterns,
          createdById: remapUserId(item.createdById)!,
          createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
        })) });
      }
      if (backup.data.assignments.length) {
        await tx.assignment.createMany({ data: backup.data.assignments.map((item) => ({
          ...item,
          dueDate: new Date(item.dueDate), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
          completedAt: item.completedAt ? new Date(item.completedAt) : null,
          assignedToId: remapUserId(item.assignedToId), completedById: remapUserId(item.completedById),
          createdById: remapUserId(item.createdById)!, lastUpdatedById: remapUserId(item.lastUpdatedById)!,
        })) });
      }
      const commentsToRestore = backup.data.assignmentComments.length > 0
        ? backup.data.assignmentComments.map((item) => ({
            ...item,
            authorId: remapUserId(item.authorId),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          }))
        : backup.data.assignments
            .filter((item) => item.comment && item.comment.trim() !== '')
            .map((item) => ({
              id: `legacy_${item.id}`,
              content: item.comment!,
              assignmentId: item.id,
              authorId: remapUserId(item.lastUpdatedById),
              authorName: backup.data.users.find((user) => user.id === item.lastUpdatedById)?.name
                || backup.data.users.find((user) => user.id === item.lastUpdatedById)?.email
                || 'Unknown',
              parentId: null,
              createdAt: new Date(item.updatedAt),
              updatedAt: new Date(item.updatedAt),
            }));
      if (commentsToRestore.length) {
        const commentsById = new Map(commentsToRestore.map((item) => [item.id, item]));
        const orderedComments: typeof commentsToRestore = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const appendComment = (item: (typeof commentsToRestore)[number]) => {
          if (visited.has(item.id)) return;
          if (visiting.has(item.id)) throw new Error('Backup contains a circular comment reply');
          visiting.add(item.id);
          if (item.parentId) {
            const parent = commentsById.get(item.parentId);
            if (parent) appendComment(parent);
          }
          visiting.delete(item.id);
          visited.add(item.id);
          orderedComments.push(item);
        };
        commentsToRestore.forEach(appendComment);

        for (let index = 0; index < orderedComments.length; index += 1_000) {
          const batch = orderedComments.slice(index, index + 1_000);
          await tx.$executeRaw`
            INSERT INTO "assignment_comments" (
              "id", "content", "createdAt", "updatedAt", "assignmentId", "authorId", "authorName", "parentId"
            ) VALUES ${Prisma.join(batch.map((item) => Prisma.sql`(
              ${item.id}, ${item.content}, ${item.createdAt}, ${item.updatedAt}, ${item.assignmentId},
              ${item.authorId}, ${item.authorName}, ${item.parentId}
            )`))}
          `;
        }
      }
      if (backup.data.teamSchedules.length) {
        await tx.teamSchedule.createMany({ data: backup.data.teamSchedules.map((item) => ({
          ...item, userId: remapUserId(item.userId)!, date: new Date(item.date),
          createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
        })) });
      }
      if (backup.data.configurationLogs.length) {
        await tx.uploadConfigurationLog.createMany({ data: backup.data.configurationLogs.map((item) => ({
          ...item, uploadedBy: remapUserId(item.uploadedBy)!, createdAt: new Date(item.createdAt),
        })) });
      }
      if (isPermissionBackup) {
        await tx.$executeRaw`DELETE FROM "role_permissions"`;
        const grants = restoredRolePermissions;
        if (grants.length) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "role_permissions" ("role", "permission", "createdAt") VALUES ${Prisma.join(grants.map((item) => Prisma.sql`(
              ${item.role}::"UserRole", ${item.permission}, ${new Date(item.createdAt)}
            )`))}
          `);
        }
        await tx.$executeRaw`
          UPDATE "permission_policy" SET "revision" = ${backup.data.permissionPolicy!.revision},
            "updatedAt" = ${new Date(backup.data.permissionPolicy!.updatedAt)} WHERE "id" = 'global'
        `;
        const restoredUserIds = new Set([auth.user.id, ...usersWithPasswords.map((user) => user.id)]);
        const audits = backup.data.permissionAudits!;
        for (let index = 0; index < audits.length; index += 1_000) {
          const batch = audits.slice(index, index + 1_000);
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "permission_audits" (
              "id", "occurredAt", "actorId", "actorName", "actorEmail", "targetRole", "permission", "enabled"
            ) VALUES ${Prisma.join(batch.map((item) => {
              const mappedActorId = remapUserId(item.actorId);
              return Prisma.sql`(
                ${item.id}, ${new Date(item.occurredAt)}, ${mappedActorId && restoredUserIds.has(mappedActorId) ? mappedActorId : null},
                ${item.actorName}, ${item.actorEmail}, ${item.targetRole}::"UserRole", ${item.permission}, ${item.enabled}
              )`;
            }))}
          `);
        }
      }
      await recordActivity({
        eventType: 'BACKUP_RESTORED', actor: auth.user, targetType: 'backup',
        targetName: file.name,
        metadata: {
          users: backup.data.users.length,
          assignments: backup.data.assignments.length,
          schedules: backup.data.teamSchedules.length,
        },
      }, tx);
      await publishAssignmentEvent(tx, { type: 'reset' });
    }, { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 120_000 });

    return NextResponse.json({
      message: 'Backup restored successfully',
      restored: Object.fromEntries(Object.entries(backup.data).map(([key, records]) => [key, Array.isArray(records) ? records.length : 1])),
      passwordResetRequiredForRestoredUsers: usersWithPasswords.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid backup structure', details: error.errors }, { status: 400 });
    }
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Restore failed; no changes were committed' }, { status: 500 });
  }
}
