import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { canManageAssignmentDetails, canTransitionAssignment } from '@/lib/roles';
import { utcDayRange } from '@/lib/date-only';

const CreateAssignmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).optional(),
  author: z.string().max(200).optional(),
  dueDate: z.string().datetime('Invalid date format'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  assignedToId: z.string().cuid().optional(),
  sourceLocation: z.string().max(2_000).optional(),
});

const UpdateAssignmentSchema = CreateAssignmentSchema.extend({
  id: z.string().cuid(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  comment: z.string().max(10_000).optional(),
});

const assignmentInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  lastUpdatedBy: { select: { id: true, name: true, email: true } },
  completedBy: { select: { id: true, name: true, email: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const search = searchParams.get('search')?.trim();
    const range = date ? utcDayRange(date) : null;
    if (date && !range) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(range ? { dueDate: { gte: range.start, lt: range.end } } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: assignmentInclude,
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN', 'PRODUCER']);
    if (auth.response) return auth.response;
    const data = CreateAssignmentSchema.parse(await request.json());

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { id: true } });
      if (!assignedUser) return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate),
        createdById: auth.user.id,
        lastUpdatedById: auth.user.id,
      },
      include: assignmentInclude,
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const data = UpdateAssignmentSchema.parse(await request.json());

    const existing = await prisma.assignment.findUnique({ where: { id: data.id } });
    if (!existing) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    const dueDate = new Date(data.dueDate);
    const detailsChanged =
      data.name !== existing.name ||
      (data.description ?? null) !== existing.description ||
      (data.author ?? null) !== existing.author ||
      dueDate.getTime() !== existing.dueDate.getTime() ||
      data.priority !== existing.priority ||
      (data.assignedToId ?? null) !== existing.assignedToId ||
      (data.sourceLocation ?? null) !== existing.sourceLocation;

    if (detailsChanged && !canManageAssignmentDetails(auth.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (data.status && data.status !== existing.status && !canTransitionAssignment(auth.user, existing)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const assignedUser = await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { id: true } });
      if (!assignedUser) return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
    }

    const nextStatus = data.status ?? existing.status;
    const enteringCompleted = nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED';
    const leavingCompleted = nextStatus !== 'COMPLETED' && existing.status === 'COMPLETED';

    const assignment = await prisma.assignment.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        author: data.author,
        dueDate,
        priority: data.priority,
        assignedToId: data.assignedToId,
        sourceLocation: data.sourceLocation,
        comment: data.comment,
        status: nextStatus,
        lastUpdatedById: auth.user.id,
        ...(enteringCompleted ? { completedAt: new Date(), completedById: auth.user.id } : {}),
        ...(leavingCompleted ? { completedAt: null, completedById: null } : {}),
      },
      include: assignmentInclude,
    });
    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
