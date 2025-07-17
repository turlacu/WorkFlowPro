import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateAssignmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime('Invalid date format'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  assignedToId: z.string().optional(),
  sourceLocation: z.string().optional(),
});

const UpdateAssignmentSchema = CreateAssignmentSchema.extend({
  id: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  comment: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    let whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.dueDate = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PRODUCER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateAssignmentSchema.parse(body);

    const assignment = await prisma.assignment.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        dueDate: new Date(validatedData.dueDate),
        priority: validatedData.priority,
        assignedToId: validatedData.assignedToId,
        sourceLocation: validatedData.sourceLocation,
        createdById: session.user.id,
        lastUpdatedById: session.user.id,
      },
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

    return NextResponse.json(assignment);
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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateAssignmentSchema.parse(body);

    // Check if user has permission to update this assignment
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: validatedData.id },
      include: { createdBy: true, assignedTo: true },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const canEdit = session.user.role === 'ADMIN' || 
                   session.user.role === 'PRODUCER' || 
                   existingAssignment.assignedToId === session.user.id;

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
      dueDate: new Date(validatedData.dueDate),
      priority: validatedData.priority,
      assignedToId: validatedData.assignedToId,
      sourceLocation: validatedData.sourceLocation,
      lastUpdatedById: session.user.id,
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
      if (validatedData.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (validatedData.comment) {
      updateData.comment = validatedData.comment;
    }

    const assignment = await prisma.assignment.update({
      where: { id: validatedData.id },
      data: updateData,
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

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}