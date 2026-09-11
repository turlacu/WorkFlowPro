import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/server-auth';
import { ACTIVITY_EVENT_TYPES } from '@/lib/activity-log-types';
import { activityRetentionDays, purgeExpiredActivityLogs } from '@/lib/activity-log';
import { USER_ROLES } from '@/lib/roles';
import { parseDateOnly } from '@/lib/date-only';
import { zonedDateRange } from '@/lib/assignment-timing';

const QuerySchema = z.object({
  date: z.string().optional(),
  actorId: z.string().max(100).optional(),
  role: z.enum(USER_ROLES).optional(),
  eventType: z.enum(ACTIVITY_EVENT_TYPES).optional(),
  cursor: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission('ACTIVITY_LOG_VIEW');
    if (auth.response) return auth.response;

    const parsed = QuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    if (parsed.date && !parseDateOnly(parsed.date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    await purgeExpiredActivityLogs();

    const range = parsed.date ? zonedDateRange(parsed.date, parsed.date) : null;
    const conditions: Prisma.Sql[] = [];
    if (range) conditions.push(Prisma.sql`"occurredAt" >= ${range.start} AND "occurredAt" < ${range.end}`);
    if (parsed.actorId) conditions.push(Prisma.sql`"actorId" = ${parsed.actorId}`);
    if (parsed.role) conditions.push(Prisma.sql`"actorRole" = ${parsed.role}::"UserRole"`);
    if (parsed.eventType) conditions.push(Prisma.sql`"eventType" = ${parsed.eventType}`);
    if (parsed.cursor) {
      const cursor = await prisma.$queryRaw<Array<{ id: string; occurredAt: Date }>>`
        SELECT "id", "occurredAt" FROM "activity_logs" WHERE "id" = ${parsed.cursor} LIMIT 1
      `;
      if (!cursor[0]) return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
      conditions.push(Prisma.sql`(
        "occurredAt" < ${cursor[0].occurredAt}
        OR ("occurredAt" = ${cursor[0].occurredAt} AND "id" < ${cursor[0].id})
      )`);
    }
    const where = conditions.length ? Prisma.join(conditions, ' AND ') : Prisma.sql`TRUE`;
    const rows = await prisma.$queryRaw<Array<{
      id: string; occurredAt: Date; eventType: string; actorId: string | null;
      actorName: string; actorRole: string; targetType: string | null;
      targetId: string | null; targetName: string | null; metadata: Record<string, unknown>;
    }>>(Prisma.sql`
      SELECT "id", "occurredAt", "eventType", "actorId", "actorName", "actorRole",
             "targetType", "targetId", "targetName", "metadata"
      FROM "activity_logs"
      WHERE ${where}
      ORDER BY "occurredAt" DESC, "id" DESC
      LIMIT ${parsed.limit + 1}
    `);
    const hasMore = rows.length > parsed.limit;
    const events = hasMore ? rows.slice(0, parsed.limit) : rows;

    return NextResponse.json({
      events: events.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString() })),
      nextCursor: hasMore ? events[events.length - 1]?.id ?? null : null,
      retentionDays: activityRetentionDays(),
    }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid filters', details: error.errors }, { status: 400 });
    }
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
