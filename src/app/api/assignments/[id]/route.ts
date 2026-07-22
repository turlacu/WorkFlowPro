import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Only the creator, producers, or admins can delete assignments
    const canDelete = auth.user.role === 'ADMIN' ||
                     auth.user.role === 'PRODUCER' ||
                     assignment.createdById === auth.user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        lastUpdatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
