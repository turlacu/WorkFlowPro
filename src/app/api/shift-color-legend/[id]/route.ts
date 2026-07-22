import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const resolvedParams = await params;
    await prisma.shiftColorLegend.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting color legend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
