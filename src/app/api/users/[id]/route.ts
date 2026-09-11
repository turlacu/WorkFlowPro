import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const { id } = await params;
    
    // Don't allow user to delete themselves
    if (auth.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      await recordActivity({
        eventType: 'USER_DELETED', actor: auth.user, targetType: 'user',
        targetId: user.id, targetName: user.name || user.email,
        metadata: { role: user.role },
      }, tx);
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
