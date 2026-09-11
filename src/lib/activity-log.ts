import { randomUUID } from 'node:crypto';
import { Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ActivityEventType } from '@/lib/activity-log-types';

type ActivityClient = Prisma.TransactionClient | typeof prisma;

type ActivityActor = {
  id: string;
  name: string;
  role: UserRole;
};

type ActivityInput = {
  eventType: ActivityEventType;
  actor: ActivityActor;
  targetType?: string;
  targetId?: string | null;
  targetName?: string | null;
  metadata?: Prisma.InputJsonObject;
};

export async function recordActivity(input: ActivityInput, client: ActivityClient = prisma) {
  const metadata = JSON.stringify(input.metadata ?? {});
  await client.$executeRaw`
    INSERT INTO "activity_logs" (
      "id", "eventType", "actorId", "actorName", "actorRole",
      "targetType", "targetId", "targetName", "metadata"
    ) VALUES (
      ${randomUUID()}, ${input.eventType}, ${input.actor.id}, ${input.actor.name},
      ${input.actor.role}::"UserRole", ${input.targetType ?? null}, ${input.targetId ?? null},
      ${input.targetName ?? null}, CAST(${metadata} AS JSONB)
    )
  `;
}

export function activityRetentionDays(): number {
  const parsed = Number.parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || '30', 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 3650 ? parsed : 30;
}

let lastRetentionCleanup = 0;

export async function purgeExpiredActivityLogs(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastRetentionCleanup < 24 * 60 * 60_000) return 0;

  const cutoff = new Date(now - activityRetentionDays() * 24 * 60 * 60_000);
  const count = await prisma.$executeRaw`DELETE FROM "activity_logs" WHERE "occurredAt" < ${cutoff}`;
  lastRetentionCleanup = now;
  return count;
}
