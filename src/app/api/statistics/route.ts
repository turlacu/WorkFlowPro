import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseDateOnly } from '@/lib/date-only';

const GetStatisticsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Statistics API route started');

    // Get the request body
    const body = await request.json();
    console.log('📊 Request body received:', body);

    // Validate input
    const { startDate, endDate } = GetStatisticsSchema.parse(body);
    console.log('✅ Input validation successful:', { startDate, endDate });

    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    // Validate dates
    const start = parseDateOnly(startDate);
    const endDay = parseDateOnly(endDate);
    const end = endDay ? new Date(endDay.getTime() + 24 * 60 * 60 * 1000) : null;
    
    if (!start || !end) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({ error: 'Start date cannot be after end date' }, { status: 400 });
    }

    console.log('📊 Processing date range:', {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    // Test database connection first
    try {
      const totalAssignments = await prisma.assignment.count();
      console.log('✅ Database connection successful. Total assignments:', totalAssignments);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        error: 'Database connection failed. Please try again later.'
      }, { status: 500 });
    }

    // Get assignments for the date range
    // Note: Always apply date filter when specific dates are requested (Day/Month view)
    // Only ignore date filter for the initial broad overview
    const whereClause = {
      createdAt: {
        gte: start,
        lt: end,
      },
    };

    console.log('📊 Query details:', {
      dateRange: `${start.toISOString()} to ${end.toISOString()}`,
      daysDifference: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
      whereClause
    });

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    console.log('📊 Found assignments:', assignments.length);

    // Calculate producer statistics
    const producerStatsMap = new Map<string, { name: string; count: number }>();
    
    assignments.forEach(assignment => {
      if (assignment.createdBy.role === 'PRODUCER' || assignment.createdBy.role === 'ADMIN') {
        const producerId = assignment.createdBy.id;
        const producerName = assignment.createdBy.name || assignment.createdBy.id;
        
        if (producerStatsMap.has(producerId)) {
          producerStatsMap.get(producerId)!.count++;
        } else {
          producerStatsMap.set(producerId, { name: producerName, count: 1 });
        }
      }
    });

    // Calculate operator statistics (based on who actually completed assignments)
    const operatorStatsMap = new Map<string, { name: string; completed: number; commented: number }>();
    
    // Get assignments completed by operators (use completedBy field)
    const assignmentsWithCompletedBy = await prisma.assignment.findMany({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        completedById: { not: null }
      },
      include: {
        completedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED' && a.assignedTo);
    const commentedAssignments = assignments.filter(a => a.comment && a.comment.trim() !== '' && a.assignedTo);

    // Count completions by actual completing user
    assignmentsWithCompletedBy.forEach(assignment => {
      if (assignment.completedBy && assignment.completedBy.role === 'OPERATOR') {
        const operatorId = assignment.completedBy.id;
        const operatorName = assignment.completedBy.name || assignment.completedBy.id;
        
        if (operatorStatsMap.has(operatorId)) {
          operatorStatsMap.get(operatorId)!.completed++;
        } else {
          operatorStatsMap.set(operatorId, { name: operatorName, completed: 1, commented: 0 });
        }
      }
    });

    commentedAssignments.forEach(assignment => {
      if (assignment.assignedTo && assignment.assignedTo.role === 'OPERATOR') {
        const operatorId = assignment.assignedTo.id;
        const operatorName = assignment.assignedTo.name || assignment.assignedTo.id;
        
        if (operatorStatsMap.has(operatorId)) {
          operatorStatsMap.get(operatorId)!.commented++;
        } else {
          operatorStatsMap.set(operatorId, { name: operatorName, completed: 0, commented: 1 });
        }
      }
    });

    // Build response
    const producerStats = Array.from(producerStatsMap.entries()).map(([id, data]) => ({
      producerId: data.name,
      assignmentsCreated: data.count,
    }));

    const operatorStats = Array.from(operatorStatsMap.entries()).map(([id, data]) => ({
      operatorId: data.name,
      assignmentsCompleted: data.completed,
      assignmentsCommented: data.commented,
    }));

    const totalAssignmentsCreated = assignments.length;
    const totalAssignmentsCompleted = assignmentsWithCompletedBy.length;

    const mostActiveProducer = producerStats.reduce((max, current) => 
      current.assignmentsCreated > max.assignmentsCreated ? current : max, 
      { producerId: '', assignmentsCreated: 0 }
    ).producerId;

    const mostActiveOperator = operatorStats.reduce((max, current) => 
      current.assignmentsCompleted > max.assignmentsCompleted ? current : max,
      { operatorId: '', assignmentsCompleted: 0 }
    ).operatorId;

    const statistics = {
      producerStats,
      operatorStats,
      totalAssignmentsCreated,
      totalAssignmentsCompleted,
      mostActiveProducer,
      mostActiveOperator,
    };

    console.log('📈 Statistics generated successfully:', {
      userRole: auth.user.role,
      assignmentsProcessed: assignments.length,
      producerStats: producerStats.length,
      operatorStats: operatorStats.length,
    });

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('❌ Statistics API error:', error);
    return NextResponse.json({
      error: 'Failed to generate statistics'
    }, { status: 500 });
  }
}
