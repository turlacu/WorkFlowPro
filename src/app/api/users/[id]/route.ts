import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission('USER_DELETE');
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
      if (user.role === 'ADMIN') {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin-role-membership'))`;
        const administrators = await tx.user.count({ where: { role: 'ADMIN' } });
        if (administrators <= 1) throw new Error('LAST_ADMIN');
      }
      await tx.user.delete({ where: { id } });
      await recordActivity({
        eventType: 'USER_DELETED', actor: auth.user, targetType: 'user',
        targetId: user.id, targetName: user.name || user.email,
        metadata: { role: user.role },
      }, tx);
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return NextResponse.json({ error: 'The last administrator cannot be deleted' }, { status: 400 });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
