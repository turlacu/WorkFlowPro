import type { UserRole } from '@prisma/client';

import { recordActivity } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';

export type AppSessionAction = 'OPEN' | 'CLOSE';

export async function recordAppSessionActivity(
  actor: { id: string; name: string; role: UserRole },
  action: AppSessionAction,
  sessionId: string,
): Promise<boolean> {
  const eventType = action === 'OPEN' ? 'APP_OPENED' : 'APP_CLOSED';
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${sessionId}, 0))`;
    const latest = await tx.$queryRaw<Array<{ eventType: string }>>`
      SELECT "eventType" FROM "activity_logs"
      WHERE "actorId" = ${actor.id}
        AND "eventType" IN ('APP_OPENED', 'APP_CLOSED')
        AND "metadata"->>'sessionId' = ${sessionId}
      ORDER BY "occurredAt" DESC, "id" DESC
      LIMIT 1
    `;
    if (latest[0]?.eventType === eventType) return false;
    if (action === 'CLOSE' && latest[0]?.eventType !== 'APP_OPENED') return false;

    await recordActivity({
      eventType,
      actor,
      targetType: 'app-session',
      targetId: sessionId,
      metadata: { sessionId },
    }, tx);
    return true;
  });
}
