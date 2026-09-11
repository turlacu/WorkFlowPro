import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/server-auth';
import { serializeNotification } from '@/lib/notification-types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requirePermission('ASSIGNMENT_NOTIFICATIONS');
    if (auth.response) return auth.response;
    const { id } = await params;

    const existing = await prisma.notification.findFirst({
      where: { id, recipientId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notification = existing.readAt
      ? existing
      : await prisma.notification.update({
          where: { id },
          data: { readAt: new Date() },
        });

    return NextResponse.json(serializeNotification(notification));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
