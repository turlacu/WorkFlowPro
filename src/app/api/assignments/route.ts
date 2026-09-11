import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { publishAssignmentEvent } from '@/lib/publish-assignment-event';
import { requireUser } from '@/lib/server-auth';
import { canManageAssignmentDetails, canStartAssignment, canTransitionAssignment } from '@/lib/roles';
import { NOTIFICATION_CHANNEL, notificationRecipient } from '@/lib/notification-types';
import { parseDateOnly } from '@/lib/date-only';
import { getAssignmentDuplicateKey } from '@/lib/assignment-duplicates';
import { recordActivity } from '@/lib/activity-log';
import {
  getCalendarDateKey,
  validateDueDateForCreate,
  validateDueDateForUpdate,
  zonedDateRange,
} from '@/lib/assignment-timing';

const CreateAssignmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).optional(),
  author: z.string().max(200).optional(),
  dueDate: z.string().datetime('Invalid date format'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  assignedToId: z.string().cuid().optional(),
  sourceLocation: z.string().max(2_000).optional(),
});

const UpdateAssignmentSchema = CreateAssignmentSchema.partial().extend({
  id: z.string().cuid(),
  assignedToId: z.string().cuid().nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

const assignmentInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  lastUpdatedBy: { select: { id: true, name: true, email: true } },
  completedBy: { select: { id: true, name: true, email: true } },
} as const;

class DuplicateAssignmentError extends Error {}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const search = searchParams.get('search')?.trim();
    const validDate = date && parseDateOnly(date);
    const range = validDate ? zonedDateRange(date, date) : null;
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
    const commentCounts = assignments.length > 0
      ? await prisma.$queryRaw<Array<{ assignmentId: string; commentCount: bigint }>>`
          SELECT "assignmentId", COUNT(*) AS "commentCount"
          FROM "assignment_comments"
          WHERE "assignmentId" IN (${Prisma.join(assignments.map((assignment) => assignment.id))})
          GROUP BY "assignmentId"
        `
      : [];
    const commentCountByAssignment = new Map(
      commentCounts.map((item) => [item.assignmentId, Number(item.commentCount)]),
    );
    return NextResponse.json(assignments.map((assignment) => ({
      ...assignment,
      commentCount: commentCountByAssignment.get(assignment.id) || 0,
    })));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN', 'PRODUCER', 'CONTRIBUTOR']);
    if (auth.response) return auth.response;
    const data = CreateAssignmentSchema.parse(await request.json());
    const dueDate = new Date(data.dueDate);

    if (validateDueDateForCreate(dueDate)) {
      return NextResponse.json({ error: 'Assignment due date cannot be before today' }, { status: 400 });
    }

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true, role: true },
      });
      if (!assignedUser || assignedUser.role !== 'OPERATOR') {
        return NextResponse.json({ error: 'Assigned user must be an operator' }, { status: 400 });
      }
    }

    const assignment = await prisma.$transaction(async (transaction) => {
      const dueDateKey = getCalendarDateKey(dueDate);
      const duplicateRange = zonedDateRange(dueDateKey, dueDateKey);
      const duplicateLockKey = getAssignmentDuplicateKey(data.name, dueDate);

      // Serialize identical creations so rapid double submissions cannot both pass the check.
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${duplicateLockKey}, 0))
      `;
      const duplicate = await transaction.assignment.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          dueDate: { gte: duplicateRange.start, lt: duplicateRange.end },
        },
        select: { id: true },
      });
      if (duplicate) throw new DuplicateAssignmentError();

      const createdAssignment = await transaction.assignment.create({
        data: {
          ...data,
          dueDate,
          createdById: auth.user.id,
          lastUpdatedById: auth.user.id,
        },
        include: assignmentInclude,
      });

      if (data.assignedToId) {
        const notification = await transaction.notification.create({
          data: {
            recipientId: data.assignedToId,
            actorId: auth.user.id,
            assignmentId: createdAssignment.id,
            assignmentName: createdAssignment.name,
            actorName: auth.user.name,
            dueDate: createdAssignment.dueDate,
          },
        });
        await transaction.$executeRaw`
          SELECT pg_notify(
            ${NOTIFICATION_CHANNEL},
            ${JSON.stringify({ notificationId: notification.id, recipientId: data.assignedToId })}
          )
        `;
      }

      await recordActivity({
        eventType: 'ASSIGNMENT_CREATED',
        actor: auth.user,
        targetType: 'assignment',
        targetId: createdAssignment.id,
        targetName: createdAssignment.name,
        metadata: { assigned: Boolean(createdAssignment.assignedToId) },
      }, transaction);
      await publishAssignmentEvent(transaction, { type: 'created', assignmentId: createdAssignment.id });
      return createdAssignment;
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateAssignmentError) {
      return NextResponse.json(
        { error: 'An assignment with this title already exists for the selected date.', code: 'DUPLICATE_ASSIGNMENT' },
        { status: 409 },
      );
    }
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

    const dueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate;
    const dueDateChanged = data.dueDate !== undefined &&
      getCalendarDateKey(dueDate) !== getCalendarDateKey(existing.dueDate);
    if (dueDateChanged) {
      const dueDateValidation = validateDueDateForUpdate({
        existingDueDate: existing.dueDate,
        requestedDueDate: dueDate,
        existingStatus: existing.status,
      });
      if (dueDateValidation === 'COMPLETED_DUE_DATE_LOCKED') {
        return NextResponse.json({ error: 'The due date is locked after an assignment is completed' }, { status: 400 });
      }
      if (dueDateValidation === 'PAST_DUE_DATE') {
        return NextResponse.json({ error: 'Assignment due date cannot be before today' }, { status: 400 });
      }
    }
    const detailsChanged =
      (data.name !== undefined && data.name !== existing.name) ||
      (data.description !== undefined && data.description !== existing.description) ||
      (data.author !== undefined && data.author !== existing.author) ||
      dueDateChanged ||
      (data.priority !== undefined && data.priority !== existing.priority) ||
      (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) ||
      (data.sourceLocation !== undefined && data.sourceLocation !== existing.sourceLocation);

    if (detailsChanged && !canManageAssignmentDetails(auth.user, existing)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const operatorClaimingUnassignedTask =
      auth.user.role === 'OPERATOR' &&
      existing.assignedToId === null &&
      existing.status === 'PENDING' &&
      data.status === 'IN_PROGRESS';
    if (data.status && data.status !== existing.status) {
      const allowed = operatorClaimingUnassignedTask
        ? canStartAssignment(auth.user, existing)
        : canTransitionAssignment(auth.user, existing);
      if (!allowed) {
        return NextResponse.json({ error: 'You cannot update the status of this assignment' }, { status: 403 });
      }
    }

    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true, role: true },
      });
      if (!assignedUser || assignedUser.role !== 'OPERATOR') {
        return NextResponse.json({ error: 'Assigned user must be an operator' }, { status: 400 });
      }
    }

    const nextStatus = data.status ?? existing.status;
    const enteringCompleted = nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED';
    const leavingCompleted = nextStatus !== 'COMPLETED' && existing.status === 'COMPLETED';

    const recipientId = notificationRecipient(existing.assignedToId, data.assignedToId);
    const changedFields = [
      data.name !== undefined && data.name !== existing.name ? 'name' : null,
      data.description !== undefined && data.description !== existing.description ? 'description' : null,
      data.author !== undefined && data.author !== existing.author ? 'author' : null,
      dueDateChanged ? 'dueDate' : null,
      data.priority !== undefined && data.priority !== existing.priority ? 'priority' : null,
      data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId ? 'assignedTo' : null,
      data.sourceLocation !== undefined && data.sourceLocation !== existing.sourceLocation ? 'sourceLocation' : null,
      data.status !== undefined && data.status !== existing.status ? 'status' : null,
    ].filter((field): field is string => Boolean(field));
    const assignment = await prisma.$transaction(async (transaction) => {
      const updatedAssignment = await transaction.assignment.update({
        where: { id: data.id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.author !== undefined ? { author: data.author } : {}),
          ...(dueDateChanged ? { dueDate } : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
          ...(operatorClaimingUnassignedTask ? { assignedToId: auth.user.id } : {}),
          ...(data.sourceLocation !== undefined ? { sourceLocation: data.sourceLocation } : {}),
          status: nextStatus,
          lastUpdatedById: auth.user.id,
          ...(enteringCompleted ? { completedAt: new Date(), completedById: auth.user.id } : {}),
          ...(leavingCompleted ? { completedAt: null, completedById: null } : {}),
        },
        include: assignmentInclude,
      });

      if (recipientId) {
        const notification = await transaction.notification.create({
          data: {
            recipientId,
            actorId: auth.user.id,
            assignmentId: updatedAssignment.id,
            assignmentName: updatedAssignment.name,
            actorName: auth.user.name,
            dueDate: updatedAssignment.dueDate,
          },
        });
        await transaction.$executeRaw`
          SELECT pg_notify(
            ${NOTIFICATION_CHANNEL},
            ${JSON.stringify({ notificationId: notification.id, recipientId })}
          )
        `;
      }

      const activityEvent = nextStatus !== existing.status
        ? nextStatus === 'IN_PROGRESS'
          ? 'ASSIGNMENT_STARTED'
          : nextStatus === 'COMPLETED'
            ? 'ASSIGNMENT_COMPLETED'
            : existing.status === 'COMPLETED'
              ? 'ASSIGNMENT_REOPENED'
              : 'ASSIGNMENT_RETURNED_PENDING'
        : data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId
          ? 'ASSIGNMENT_ASSIGNED'
          : 'ASSIGNMENT_UPDATED';
      await recordActivity({
        eventType: activityEvent,
        actor: auth.user,
        targetType: 'assignment',
        targetId: updatedAssignment.id,
        targetName: updatedAssignment.name,
        metadata: {
          changedFields,
          ...(updatedAssignment.assignedTo?.name ? { assigneeName: updatedAssignment.assignedTo.name } : {}),
        },
      }, transaction);
      await publishAssignmentEvent(transaction, { type: 'updated', assignmentId: updatedAssignment.id });
      return updatedAssignment;
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
