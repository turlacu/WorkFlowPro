import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/server-auth';

export async function POST() {
  try {
    const auth = await requirePermission('ASSIGNMENT_NOTIFICATIONS');
    if (auth.response) return auth.response;

    const result = await prisma.notification.updateMany({
      where: { recipientId: auth.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ updatedCount: result.count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
