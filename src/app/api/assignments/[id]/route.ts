import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishAssignmentEvent } from '@/lib/publish-assignment-event';
import { requirePermission } from '@/lib/server-auth';
import { canDeleteAssignment } from '@/lib/roles';
import { recordActivity } from '@/lib/activity-log';

const assignmentInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  lastUpdatedBy: { select: { id: true, name: true, email: true } },
  completedBy: { select: { id: true, name: true, email: true } },
} as const;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission('ASSIGNMENT_DELETE');
    if (auth.response) return auth.response;

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!canDeleteAssignment(auth.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assignment.delete({ where: { id } });
      await recordActivity({
        eventType: 'ASSIGNMENT_DELETED',
        actor: auth.user,
        targetType: 'assignment',
        targetId: assignment.id,
        targetName: assignment.name,
      }, tx);
      await publishAssignmentEvent(tx, { type: 'deleted', assignmentId: id });
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
    const auth = await requirePermission('ASSIGNMENT_VIEW');
    if (auth.response) return auth.response;

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: assignmentInclude,
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
