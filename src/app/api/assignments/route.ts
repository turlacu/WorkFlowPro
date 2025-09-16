import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserFromSession } from '@/lib/user-utils';
import { z } from 'zod';

const CreateAssignmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  author: z.string().optional(),
  dueDate: z.string().datetime('Invalid date format'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  assignedToId: z.string().optional(),
  sourceLocation: z.string().optional(),
});

const UpdateAssignmentSchema = CreateAssignmentSchema.extend({
  id: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  comment: z.string().optional(),
  completedById: z.string().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
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
        mode: 'insensitive',
      };
    }

    try {
      // Try the normal Prisma query first
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
          completedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      return NextResponse.json(assignments);
    } catch (prismaError: any) {
      // If the error is about missing column, fall back to raw SQL
      if (prismaError.message && prismaError.message.includes('column') && prismaError.message.includes('author')) {
        console.log('Author column not found, falling back to raw SQL query without author field');
        
        // Build the raw SQL query conditions
        let sqlConditions = '';
        let params: any[] = [];
        let paramIndex = 1;

        if (date) {
          const [year, month, day] = date.split('-').map(Number);
          const targetDate = new Date(year, month - 1, day);
          const nextDay = new Date(year, month - 1, day + 1);
          
          sqlConditions += ` AND a."dueDate" >= $${paramIndex} AND a."dueDate" < $${paramIndex + 1}`;
          params.push(targetDate, nextDay);
          paramIndex += 2;
        }

        if (search) {
          sqlConditions += ` AND a.name ILIKE $${paramIndex}`;
          params.push(`%${search}%`);
          paramIndex++;
        }

        const rawAssignments = await prisma.$queryRawUnsafe(`
          SELECT 
            a.id, a.name, a.description, a.author, a."dueDate", a.status, a.priority, 
            a."sourceLocation", a.comment, a."createdAt", a."updatedAt", 
            a."completedAt", a."assignedToId", a."createdById", a."lastUpdatedById",
            
            au.id as "assignedTo_id", au.name as "assignedTo_name", au.email as "assignedTo_email",
            cu.id as "createdBy_id", cu.name as "createdBy_name", cu.email as "createdBy_email",
            lu.id as "lastUpdatedBy_id", lu.name as "lastUpdatedBy_name", lu.email as "lastUpdatedBy_email"
          FROM assignments a
          LEFT JOIN users au ON a."assignedToId" = au.id
          JOIN users cu ON a."createdById" = cu.id
          JOIN users lu ON a."lastUpdatedById" = lu.id
          WHERE 1=1 ${sqlConditions}
          ORDER BY a."dueDate" ASC
        `, ...params);

        // Transform raw results to match expected format
        const transformedAssignments = (rawAssignments as any[]).map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          author: row.author,
          dueDate: row.dueDate,
          status: row.status,
          priority: row.priority,
          sourceLocation: row.sourceLocation,
          comment: row.comment,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          completedAt: row.completedAt,
          assignedToId: row.assignedToId,
          createdById: row.createdById,
          lastUpdatedById: row.lastUpdatedById,
          assignedTo: row.assignedTo_id ? {
            id: row.assignedTo_id,
            name: row.assignedTo_name,
            email: row.assignedTo_email,
          } : null,
          createdBy: {
            id: row.createdBy_id,
            name: row.createdBy_name,
            email: row.createdBy_email,
          },
          lastUpdatedBy: {
            id: row.lastUpdatedBy_id,
            name: row.lastUpdatedBy_name,
            email: row.lastUpdatedBy_email,
          },
        }));

        return NextResponse.json(transformedAssignments);
      }
      
      // Re-throw other Prisma errors
      throw prismaError;
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: any = null;
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

    body = await request.json();
    console.log('Assignment creation - Request body:', body);
    console.log('Assignment creation - Schema expects:', CreateAssignmentSchema.shape);
    
    const validatedData = CreateAssignmentSchema.parse(body);
    console.log('Assignment creation - Validation passed');

    console.log('Assignment creation - Validated data:', validatedData);
    console.log('Assignment creation - Creating assignment for user:', session.user.id);

    // Check if user exists in database, handling potential ID mismatches
    console.log('Assignment creation - Checking user existence...');
    let userExists;
    try {
      userExists = await getUserFromSession(session);
      console.log('Assignment creation - User lookup successful:', !!userExists);
    } catch (userError) {
      console.error('Assignment creation - User lookup error:', userError);
      return NextResponse.json({ error: 'Database error during user lookup' }, { status: 500 });
    }
    
    if (!userExists) {
      console.error('Assignment creation failed: User not found in database', { 
        sessionId: session.user.id, 
        email: session.user.email 
      });
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // If assignedToId is provided, check if that user exists
    if (validatedData.assignedToId) {
      console.log('Assignment creation - Checking assigned user existence...');
      try {
        const assignedUserExists = await prisma.user.findUnique({
          where: { id: validatedData.assignedToId }
        });
        
        if (!assignedUserExists) {
          console.error('Assignment creation failed: Assigned user not found', validatedData.assignedToId);
          return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
        }
        console.log('Assignment creation - Assigned user found');
      } catch (assignedUserError) {
        console.error('Assignment creation - Assigned user lookup error:', assignedUserError);
        return NextResponse.json({ error: 'Database error during assigned user lookup' }, { status: 500 });
      }
    }

    // Prepare data for creation (use the database user ID, not the session ID)
    const createData = {
      name: validatedData.name,
      description: validatedData.description,
      author: validatedData.author,
      dueDate: new Date(validatedData.dueDate),
      priority: validatedData.priority,
      assignedToId: validatedData.assignedToId || null,
      sourceLocation: validatedData.sourceLocation,
      createdById: userExists.id, // Use database user ID
      lastUpdatedById: userExists.id, // Use database user ID
    };

    console.log('Creating assignment with data:', createData);

    const assignment = await prisma.assignment.create({
      data: createData,
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
      console.error('Assignment creation - Zod validation error:', error.errors);
      console.error('Assignment creation - Invalid data received:', body);
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Assignment creation - Unexpected error:', error);
    console.error('Assignment creation - Error type:', typeof error);
    console.error('Assignment creation - Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Assignment creation - Request data was:', body);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('PUT /api/assignments - Session:', { userId: session?.user?.id, role: session?.user?.role });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('PUT /api/assignments - Request body:', body);
    
    const validatedData = UpdateAssignmentSchema.parse(body);
    console.log('PUT /api/assignments - Validated data:', validatedData);

    // Check if user has permission to update this assignment
    let existingAssignment;
    try {
      existingAssignment = await prisma.assignment.findUnique({
        where: { id: validatedData.id },
        include: { createdBy: true, assignedTo: true },
      });
    } catch (findError: any) {
      console.error('Error finding existing assignment:', findError);
      if (findError.message && findError.message.includes('column') && findError.message.includes('author')) {
        console.log('Author column not found in findUnique, using raw SQL');
        const rawResult = await prisma.$queryRawUnsafe(`
          SELECT 
            a.id, a.name, a.description, a.author, a."dueDate", a.status, a.priority, 
            a."sourceLocation", a.comment, a."createdAt", a."updatedAt", 
            a."completedAt", a."assignedToId", a."createdById", a."lastUpdatedById",
            cu.id as "createdBy_id", cu.name as "createdBy_name", cu.email as "createdBy_email",
            au.id as "assignedTo_id", au.name as "assignedTo_name", au.email as "assignedTo_email"
          FROM assignments a
          JOIN users cu ON a."createdById" = cu.id
          LEFT JOIN users au ON a."assignedToId" = au.id
          WHERE a.id = $1
        `, validatedData.id);

        if (!rawResult || (rawResult as any[]).length === 0) {
          return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        const row = (rawResult as any[])[0];
        existingAssignment = {
          id: row.id,
          name: row.name,
          description: row.description,
          author: row.author,
          dueDate: row.dueDate,
          status: row.status,
          priority: row.priority,
          sourceLocation: row.sourceLocation,
          comment: row.comment,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          completedAt: row.completedAt,
          assignedToId: row.assignedToId,
          createdById: row.createdById,
          lastUpdatedById: row.lastUpdatedById,
          createdBy: {
            id: row.createdBy_id,
            name: row.createdBy_name,
            email: row.createdBy_email,
          },
          assignedTo: row.assignedTo_id ? {
            id: row.assignedTo_id,
            name: row.assignedTo_name,
            email: row.assignedTo_email,
          } : null,
        };
      } else {
        throw findError;
      }
    }

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user can edit assignment details (full edit)
    const canEditDetails = session.user.role === 'ADMIN' || 
                          session.user.role === 'PRODUCER' || 
                          existingAssignment.assignedToId === session.user.id;

    // Check if user can update status/completion (operators can help with any assignment)
    const canUpdateStatus = session.user.role === 'ADMIN' || 
                           session.user.role === 'OPERATOR' ||
                           session.user.role === 'PRODUCER';

    // Determine if this is a status-only update (workflow changes)
    const isStatusOnlyUpdate = !validatedData.name || 
      (validatedData.name === existingAssignment.name &&
       validatedData.description === existingAssignment.description &&
       validatedData.author === existingAssignment.author &&
       validatedData.assignedToId === existingAssignment.assignedToId &&
       validatedData.sourceLocation === existingAssignment.sourceLocation &&
       validatedData.priority === existingAssignment.priority);

    // Check permissions based on update type
    const hasPermission = isStatusOnlyUpdate ? canUpdateStatus : canEditDetails;

    if (!hasPermission) {
      console.log('PUT /api/assignments - Forbidden:', { 
        userRole: session.user.role, 
        userId: session.user.id, 
        assignedToId: existingAssignment.assignedToId,
        isStatusOnlyUpdate,
        canEditDetails,
        canUpdateStatus
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
      author: validatedData.author,
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

    // Handle completedBy and completedAt from request
    if (validatedData.completedById !== undefined) {
      updateData.completedById = validatedData.completedById;
    }

    if (validatedData.completedAt !== undefined) {
      updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : null;
    }

    console.log('PUT /api/assignments - Update data:', updateData);

    try {
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
          completedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      console.log('PUT /api/assignments - Update successful');
      return NextResponse.json(assignment);
    } catch (prismaError: any) {
      console.error('PUT /api/assignments - Prisma update error:', prismaError);
      
      // Log the specific error for debugging
      console.error('PUT /api/assignments - Prisma update error details:', {
        message: prismaError.message,
        code: prismaError.code,
        meta: prismaError.meta
      });
      
      // For other database errors, try using raw SQL
      if (prismaError.code && (prismaError.code === 'P2002' || prismaError.code === 'P2025' || prismaError.message.includes('column'))) {
        console.log('Falling back to raw SQL update');
        
        // Build raw SQL update
        const setClause = [];
        const params = [];
        let paramIndex = 1;
        
        if (updateData.name) {
          setClause.push(`name = $${paramIndex}`);
          params.push(updateData.name);
          paramIndex++;
        }
        
        if (updateData.description !== undefined) {
          setClause.push(`description = $${paramIndex}`);
          params.push(updateData.description);
          paramIndex++;
        }
        
        if (updateData.dueDate) {
          setClause.push(`"dueDate" = $${paramIndex}`);
          params.push(updateData.dueDate);
          paramIndex++;
        }
        
        if (updateData.status) {
          setClause.push(`status = $${paramIndex}`);
          params.push(updateData.status);
          paramIndex++;
        }
        
        if (updateData.priority) {
          setClause.push(`priority = $${paramIndex}`);
          params.push(updateData.priority);
          paramIndex++;
        }
        
        if (updateData.assignedToId !== undefined) {
          setClause.push(`"assignedToId" = $${paramIndex}`);
          params.push(updateData.assignedToId);
          paramIndex++;
        }
        
        if (updateData.sourceLocation !== undefined) {
          setClause.push(`"sourceLocation" = $${paramIndex}`);
          params.push(updateData.sourceLocation);
          paramIndex++;
        }
        
        if (updateData.comment !== undefined) {
          setClause.push(`comment = $${paramIndex}`);
          params.push(updateData.comment);
          paramIndex++;
        }
        
        if (updateData.completedAt !== undefined) {
          setClause.push(`"completedAt" = $${paramIndex}`);
          params.push(updateData.completedAt);
          paramIndex++;
        }

        if (updateData.completedById !== undefined) {
          setClause.push(`"completedById" = $${paramIndex}`);
          params.push(updateData.completedById);
          paramIndex++;
        }
        
        setClause.push(`"lastUpdatedById" = $${paramIndex}`);
        params.push(session.user.id);
        paramIndex++;
        
        setClause.push(`"updatedAt" = $${paramIndex}`);
        params.push(new Date());
        paramIndex++;
        
        params.push(validatedData.id);
        
        await prisma.$queryRawUnsafe(`
          UPDATE assignments 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
        `, ...params);
        
        // Fetch the updated assignment using raw SQL
        const rawResult = await prisma.$queryRawUnsafe(`
          SELECT 
            a.id, a.name, a.description, a.author, a."dueDate", a.status, a.priority, 
            a."sourceLocation", a.comment, a."createdAt", a."updatedAt", 
            a."completedAt", a."assignedToId", a."createdById", a."lastUpdatedById",
            cu.id as "createdBy_id", cu.name as "createdBy_name", cu.email as "createdBy_email",
            au.id as "assignedTo_id", au.name as "assignedTo_name", au.email as "assignedTo_email",
            lu.id as "lastUpdatedBy_id", lu.name as "lastUpdatedBy_name", lu.email as "lastUpdatedBy_email"
          FROM assignments a
          JOIN users cu ON a."createdById" = cu.id
          LEFT JOIN users au ON a."assignedToId" = au.id
          JOIN users lu ON a."lastUpdatedById" = lu.id
          WHERE a.id = $1
        `, validatedData.id);
        
        if (!rawResult || (rawResult as any[]).length === 0) {
          throw new Error('Failed to fetch updated assignment');
        }
        
        const row = (rawResult as any[])[0];
        const assignment = {
          id: row.id,
          name: row.name,
          description: row.description,
          author: row.author,
          dueDate: row.dueDate,
          status: row.status,
          priority: row.priority,
          sourceLocation: row.sourceLocation,
          comment: row.comment,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          completedAt: row.completedAt,
          assignedToId: row.assignedToId,
          createdById: row.createdById,
          lastUpdatedById: row.lastUpdatedById,
          assignedTo: row.assignedTo_id ? {
            id: row.assignedTo_id,
            name: row.assignedTo_name,
            email: row.assignedTo_email,
          } : null,
          createdBy: {
            id: row.createdBy_id,
            name: row.createdBy_name,
            email: row.createdBy_email,
          },
          lastUpdatedBy: {
            id: row.lastUpdatedBy_id,
            name: row.lastUpdatedBy_name,
            email: row.lastUpdatedBy_email,
          },
        };
        
        console.log('PUT /api/assignments - Raw SQL update successful');
        return NextResponse.json(assignment);
      }
      
      // Re-throw other errors
      throw prismaError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}