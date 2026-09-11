import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { listObjects, putObject } from '@/lib/minio';
import { requirePermission } from '@/lib/server-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordActivity } from '@/lib/activity-log';

export async function POST() {
  try {
    const auth = await requirePermission('BACKUP_MANAGE');
    if (auth.response) return auth.response;
    const limit = checkRateLimit(`backup:${auth.user.id}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!limit.allowed) return NextResponse.json({ error: 'Too many backup requests' }, { status: 429 });

    const [users, assignments, assignmentComments, teamSchedules, shiftColorLegends, configurations, configurationLogs, rolePermissions, permissionPolicyRows, permissionAudits] =
      await prisma.$transaction(async (tx) => Promise.all([
        tx.user.findMany({
          select: {
            id: true, name: true, email: true, role: true,
            createdAt: true, updatedAt: true,
          },
        }),
        tx.assignment.findMany(),
        tx.$queryRaw<Array<{
          id: string; content: string; createdAt: Date; updatedAt: Date; assignmentId: string;
          authorId: string | null; authorName: string; parentId: string | null;
        }>>`SELECT * FROM "assignment_comments" ORDER BY "createdAt" ASC`,
        tx.teamSchedule.findMany(),
        tx.shiftColorLegend.findMany(),
        tx.excelUploadConfiguration.findMany(),
        tx.uploadConfigurationLog.findMany(),
        tx.$queryRaw<Array<{ role: string; permission: string; createdAt: Date }>>`
          SELECT "role", "permission", "createdAt" FROM "role_permissions" ORDER BY "role", "permission"
        `,
        tx.$queryRaw<Array<{ revision: number; updatedAt: Date }>>`
          SELECT "revision", "updatedAt" FROM "permission_policy" WHERE "id" = 'global' LIMIT 1
        `,
        tx.$queryRaw<Array<{
          id: string; occurredAt: Date; actorId: string | null; actorName: string; actorEmail: string;
          targetRole: string; permission: string; enabled: boolean;
        }>>`SELECT "id", "occurredAt", "actorId", "actorName", "actorEmail", "targetRole", "permission", "enabled" FROM "permission_audits" ORDER BY "occurredAt" ASC`,
      ]), { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 120_000 });

    const data = {
      metadata: {
        schemaVersion: 5,
        exportedAt: new Date().toISOString(),
        exportedBy: { id: auth.user.id, email: auth.user.email },
      },
      data: {
        users, assignments, assignmentComments, teamSchedules, shiftColorLegends, configurations, configurationLogs,
        rolePermissions,
        permissionPolicy: permissionPolicyRows[0] ?? { revision: 1, updatedAt: new Date() },
        permissionAudits,
      },
    };
    const id = `backup-${randomUUID()}`;
    const fileName = `${id}.json`;
    const objectName = `backups/${fileName}`;
    const buffer = Buffer.from(JSON.stringify(data));
    await putObject(objectName, buffer, 'application/json');
    await recordActivity({
      eventType: 'BACKUP_CREATED', actor: auth.user, targetType: 'backup',
      targetId: id, targetName: fileName,
      metadata: { recordCount: Object.values(data.data).reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 1), 0) },
    });

    return NextResponse.json({
      id,
      fileName,
      createdAt: data.metadata.exportedAt,
      size: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
      recordCount: Object.values(data.data).reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 1), 0),
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requirePermission('BACKUP_MANAGE');
    if (auth.response) return auth.response;
    const files = await listObjects('backups/');
    return NextResponse.json(
      files
        .filter((file) => /^backups\/backup-[0-9a-f-]{36}\.json$/.test(file.name))
        .map((file) => ({
          id: file.name.slice('backups/'.length, -'.json'.length),
          fileName: file.name.slice('backups/'.length),
          createdAt: file.lastModified,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    );
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}
