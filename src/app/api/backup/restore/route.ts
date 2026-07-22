import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';
import { checkRateLimit } from '@/lib/rate-limit';

const date = z.string().datetime();
const nullableDate = date.nullable();
const role = z.enum(['ADMIN', 'PRODUCER', 'OPERATOR']);
const status = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
const priority = z.enum(['LOW', 'NORMAL', 'URGENT']);

const BackupSchema = z.object({
  metadata: z.object({
    schemaVersion: z.literal(2),
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
      assignedToId: z.string().nullable(), createdById: z.string(), lastUpdatedById: z.string(),
    })).max(100_000),
    teamSchedules: z.array(z.object({
      id: z.string(), date, userId: z.string(), createdAt: date, updatedAt: date,
      shiftColor: z.string().nullable(), shiftHours: z.string().nullable(),
    })).max(500_000),
    shiftColorLegends: z.array(z.object({
      id: z.string(), colorCode: z.string(), colorName: z.string(), shiftName: z.string(),
      startTime: z.string(), endTime: z.string(), description: z.string().nullable(), role,
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
    dailySchedules: z.array(z.object({
      id: z.string(), date, title: z.string(), content: z.string().nullable(), fileName: z.string().nullable(),
      fileSize: z.number().int().nullable(), mimeType: z.string().nullable(), filePath: z.string().nullable(),
      uploadedBy: z.string(), createdAt: date, updatedAt: date,
    })).max(10_000),
  }),
});

const MAX_BACKUP_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
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

    const currentBackupUser = backup.data.users.find((user) => user.email.toLowerCase() === auth.user.email.toLowerCase());
    const remapUserId = (id: string | null) => {
      if (!id) return null;
      return currentBackupUser?.id === id ? auth.user.id : id;
    };

    const usersToRestore = backup.data.users.filter(
      (user) => user.id !== currentBackupUser?.id && user.id !== auth.user.id && user.email.toLowerCase() !== auth.user.email.toLowerCase(),
    );
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
      await tx.uploadConfigurationLog.deleteMany();
      await tx.dailySchedule.deleteMany();
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
      if (backup.data.teamSchedules.length) {
        await tx.teamSchedule.createMany({ data: backup.data.teamSchedules.map((item) => ({
          ...item, userId: remapUserId(item.userId)!, date: new Date(item.date),
          createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
        })) });
      }
      if (backup.data.dailySchedules.length) {
        await tx.dailySchedule.createMany({ data: backup.data.dailySchedules.map((item) => ({
          ...item, uploadedBy: remapUserId(item.uploadedBy)!, date: new Date(item.date),
          createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
        })) });
      }
      if (backup.data.configurationLogs.length) {
        await tx.uploadConfigurationLog.createMany({ data: backup.data.configurationLogs.map((item) => ({
          ...item, uploadedBy: remapUserId(item.uploadedBy)!, createdAt: new Date(item.createdAt),
        })) });
      }
    }, { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 120_000 });

    return NextResponse.json({
      message: 'Backup restored successfully',
      restored: Object.fromEntries(Object.entries(backup.data).map(([key, records]) => [key, records.length])),
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
