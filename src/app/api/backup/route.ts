import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { listObjects, putObject } from '@/lib/minio';
import { requireUser } from '@/lib/server-auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST() {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;
    const limit = checkRateLimit(`backup:${auth.user.id}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!limit.allowed) return NextResponse.json({ error: 'Too many backup requests' }, { status: 429 });

    const [users, assignments, teamSchedules, shiftColorLegends, configurations, configurationLogs, dailySchedules] =
      await prisma.$transaction(async (tx) => Promise.all([
        tx.user.findMany({
          select: {
            id: true, name: true, email: true, role: true,
            createdAt: true, updatedAt: true,
          },
        }),
        tx.assignment.findMany(),
        tx.teamSchedule.findMany(),
        tx.shiftColorLegend.findMany(),
        tx.excelUploadConfiguration.findMany(),
        tx.uploadConfigurationLog.findMany(),
        tx.dailySchedule.findMany(),
      ]), { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 120_000 });

    const data = {
      metadata: {
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        exportedBy: { id: auth.user.id, email: auth.user.email },
      },
      data: { users, assignments, teamSchedules, shiftColorLegends, configurations, configurationLogs, dailySchedules },
    };
    const id = `backup-${randomUUID()}`;
    const fileName = `${id}.json`;
    const objectName = `backups/${fileName}`;
    const buffer = Buffer.from(JSON.stringify(data));
    await putObject(objectName, buffer, 'application/json');

    return NextResponse.json({
      id,
      fileName,
      createdAt: data.metadata.exportedAt,
      size: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
      recordCount: Object.values(data.data).reduce((sum, records) => sum + records.length, 0),
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requireUser(['ADMIN']);
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
