import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';
import { serializeNotification } from '@/lib/notification-types';

const NotificationQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(['OPERATOR']);
    if (auth.response) return auth.response;

    const query = NotificationQuerySchema.safeParse({
      cursor: request.nextUrl.searchParams.get('cursor') || undefined,
      limit: request.nextUrl.searchParams.get('limit') || undefined,
    });
    if (!query.success) {
      return NextResponse.json(
        { error: 'Invalid notification query', details: query.error.errors },
        { status: 400 },
      );
    }

    const { cursor, limit } = query.data;
    const [records, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { recipientId: auth.user.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.notification.count({
        where: { recipientId: auth.user.id, readAt: null },
      }),
    ]);

    const hasNextPage = records.length > limit;
    const pageRecords = records.slice(0, limit);
    return NextResponse.json({
      items: pageRecords.map(serializeNotification),
      unreadCount,
      nextCursor: hasNextPage ? pageRecords.at(-1)?.id ?? null : null,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
