import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFromSession } from '@/lib/user-utils';
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
      // Parse date as local date to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day); // month is 0-indexed
      const nextDay = new Date(year, month - 1, day + 1);
      
      whereClause.dueDate = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    if (search) {
      whereClause.name = {
        contains: search,
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
      console.error('Assignment creation failed: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Assignment creation - Session user:', { id: session.user.id, role: session.user.role, email: session.user.email });

    if (session.user.role !== 'PRODUCER' && session.user.role !== 'ADMIN') {
      console.error('Assignment creation failed: Insufficient permissions', { role: session.user.role });
      return NextResponse.json({ error: 'Forbidden - Only producers and admins can create assignments' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Assignment creation - Request body:', body);
    
    const validatedData = CreateAssignmentSchema.parse(body);

    console.log('Assignment creation - Validated data:', validatedData);
    console.log('Assignment creation - Creating assignment for user:', session.user.id);

    // Check if user exists in database, handling potential ID mismatches
    const userExists = await getUserFromSession(session);
    
    if (!userExists) {
      console.error('Assignment creation failed: User not found in database', { 
        sessionId: session.user.id, 
        email: session.user.email 
      });
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // If assignedToId is provided, check if that user exists
    if (validatedData.assignedToId) {
      const assignedUserExists = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId }
      });
      
      if (!assignedUserExists) {
        console.error('Assignment creation failed: Assigned user not found', validatedData.assignedToId);
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
      }
    }

    console.log('Creating assignment with data:', {
      name: validatedData.name,
      description: validatedData.description,
      dueDate: new Date(validatedData.dueDate),
      priority: validatedData.priority,
      assignedToId: validatedData.assignedToId || null,
      sourceLocation: validatedData.sourceLocation,
      createdById: session.user.id,
      lastUpdatedById: session.user.id,
    });

    const assignment = await prisma.assignment.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        dueDate: new Date(validatedData.dueDate),
        priority: validatedData.priority,
        assignedToId: validatedData.assignedToId || null,
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
      console.error('Assignment validation error:', error.errors);
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating assignment:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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