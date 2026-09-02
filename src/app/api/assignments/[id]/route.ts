import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';
import { canDeleteAssignment } from '@/lib/roles';
import { z } from 'zod';

const UpdateCommentSchema = z.object({
  comment: z.string().max(10_000),
});

const assignmentInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  lastUpdatedBy: { select: { id: true, name: true, email: true } },
  completedBy: { select: { id: true, name: true, email: true } },
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    const { comment } = UpdateCommentSchema.parse(await request.json());
    const existing = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        comment,
        lastUpdatedById: auth.user.id,
      },
      include: assignmentInclude,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating assignment comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    if (!canDeleteAssignment(auth.user)) {
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
