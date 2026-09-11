import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/server-auth';
import { recordActivity } from '@/lib/activity-log';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission('SHIFT_LEGEND_MANAGE');
    if (auth.response) return auth.response;

    const resolvedParams = await params;
    const existing = await prisma.shiftColorLegend.findUnique({ where: { id: resolvedParams.id } });
    if (!existing) return NextResponse.json({ error: 'Color legend not found' }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.shiftColorLegend.delete({ where: { id: resolvedParams.id } });
      await recordActivity({
        eventType: 'SHIFT_LEGEND_DELETED', actor: auth.user, targetType: 'shift-legend',
        targetId: existing.id, targetName: existing.shiftName, metadata: { role: existing.role },
      }, tx);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting color legend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
