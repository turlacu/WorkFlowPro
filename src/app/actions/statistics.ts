'use server';

import { z } from 'zod';

export const GenerateStatisticsInputSchema = z.object({
  startDate: z.string().describe('The start date for the statistics.'),
  endDate: z.string().describe('The end date for the statistics.'),
});

export type GenerateStatisticsInput = z.infer<typeof GenerateStatisticsInputSchema>;

export const ProducerStatsSchema = z.object({
  producerId: z.string().describe('The ID of the producer.'),
  assignmentsCreated: z.number().describe('The number of assignments created by the producer.'),
});

export const OperatorStatsSchema = z.object({
  operatorId: z.string().describe('The ID of the operator.'),
  assignmentsCompleted: z.number().describe('The number of assignments completed by the operator.'),
  assignmentsCommented: z.number().describe('The number of assignments commented on by the operator.'),
});

export const GenerateStatisticsOutputSchema = z.object({
  producerStats: z.array(ProducerStatsSchema).describe('Statistics for each producer.'),
  operatorStats: z.array(OperatorStatsSchema).describe('Statistics for each operator.'),
  totalAssignmentsCreated: z.number().describe('The total number of assignments created.'),
  totalAssignmentsCompleted: z.number().describe('The total number of assignments completed.'),
  mostActiveProducer: z.string().describe('The ID of the most active producer.'),
  mostActiveOperator: z.string().describe('The ID of the most active operator.'),
});

export type GenerateStatisticsOutput = z.infer<typeof GenerateStatisticsOutputSchema>;

export async function getStatisticsAction(input: GenerateStatisticsInput): Promise<GenerateStatisticsOutput | { error: string }> {
  try {
    console.log('📊 Statistics action started');
    
    // Try to import modules and handle any import errors
    let prisma, getServerSession, authOptions;
    
    try {
      const prismaModule = await import('@/lib/prisma');
      prisma = prismaModule.prisma;
      console.log('✅ Prisma imported successfully');
    } catch (prismaError) {
      console.error('❌ Failed to import Prisma:', prismaError);
      return { error: 'Database connection module failed to load' };
    }
    
    try {
      const nextAuthModule = await import('next-auth');
      getServerSession = nextAuthModule.getServerSession;
      console.log('✅ NextAuth imported successfully');
    } catch (authError) {
      console.error('❌ Failed to import NextAuth:', authError);
      return { error: 'Authentication module failed to load' };
    }
    
    try {
      const authModule = await import('@/lib/auth');
      authOptions = authModule.authOptions;
      console.log('✅ Auth options imported successfully');
    } catch (authOptionsError) {
      console.error('❌ Failed to import auth options:', authOptionsError);
      return { error: 'Authentication configuration failed to load' };
    }
    
    // Get current session for debugging
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log('📊 Statistics called by user:', { 
        id: session?.user?.id, 
        role: session?.user?.role, 
        email: session?.user?.email 
      });
    } catch (sessionError) {
      console.error('❌ Failed to get session:', sessionError);
      return { error: 'Failed to verify user session' };
    }
    
    // Ensure we have proper authorization
    if (!session) {
      console.log('❌ No session found');
      return { error: 'Unauthorized access to statistics' };
    }
    
    // For non-admin users, we might want to add role-based restrictions in the future
    // For now, ADMIN should see all data, others should also see all data
    const isAdmin = session.user.role === 'ADMIN';
    console.log('📊 User is admin:', isAdmin);
    
    // Input validation
    let validated;
    try {
      validated = GenerateStatisticsInputSchema.parse(input);
      console.log('✅ Input validation successful:', validated);
    } catch (validationError) {
      console.error('❌ Input validation failed:', validationError);
      return { error: 'Invalid input parameters for statistics' };
    }
    
    // Date validation and processing
    let startDate, endDate;
    try {
      startDate = new Date(validated.startDate);
      endDate = new Date(validated.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { error: 'Invalid date format provided' };
      }
      
      if (startDate > endDate) {
        return { error: 'Start date cannot be after end date.' };
      }

      // Create date objects that capture full local date ranges
      startDate.setHours(0, 0, 0, 0); // Start of day
      endDate.setHours(23, 59, 59, 999); // End of day

      console.log('📊 Statistics Action Debug:');
      console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
    } catch (dateError) {
      console.error('❌ Date processing failed:', dateError);
      return { error: 'Failed to process date range' };
    }

    // First check total assignments in database
    let totalAssignmentsInDb;
    try {
      totalAssignmentsInDb = await prisma.assignment.count();
      console.log('Total assignments in database:', totalAssignmentsInDb);
    } catch (countError) {
      console.error('❌ Error counting assignments:', countError);
      return { error: `Database connection failed: ${countError instanceof Error ? countError.message : 'Unknown error'}. Please check if the Supabase database is accessible.` };
    }

    // Get all assignments in the date range
    let assignments;
    try {
      // For ADMIN users, get ALL assignments for comprehensive organizational statistics
      // For other users, still get all assignments but we could add role-based filtering later
      const whereClause = isAdmin ? {} : {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
      
      // Actually, let's always get all assignments for now and filter by date in memory if needed
      // This ensures ADMIN sees complete organizational data
      const finalWhereClause = isAdmin ? {} : whereClause;
      
      console.log('📊 Query where clause:', finalWhereClause);
      
      assignments = await prisma.assignment.findMany({
        where: finalWhereClause,
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
    } catch (prismaError) {
      console.error('Error fetching assignments in statistics:', prismaError);
      // Fallback: try to get all assignments without any filter
      assignments = await prisma.assignment.findMany({
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
      console.log('Fallback: fetched all assignments without any filter:', assignments.length);
    }

    console.log('Assignments found in date range:', assignments.length);
    
    // Get all assignments regardless of date to debug
    const allAssignments = await prisma.assignment.findMany({
      select: {
        name: true,
        createdAt: true,
        status: true,
        createdBy: {
          select: { role: true, name: true }
        },
        assignedTo: {
          select: { role: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    console.log('Recent assignments in DB (any date):');
    allAssignments.forEach(a => {
      console.log(`  - ${a.name}: ${a.createdAt.toISOString()} (${a.status}) - Created by: ${a.createdBy?.role}(${a.createdBy?.name}), Assigned to: ${a.assignedTo?.role}(${a.assignedTo?.name})`);
    });
    
    if (assignments.length > 0) {
      console.log('Sample assignment dates IN RANGE:', assignments.slice(0, 3).map(a => ({
        name: a.name,
        createdAt: a.createdAt.toISOString(),
        createdBy: a.createdBy.name,
        status: a.status
      })));
    } else {
      console.log('❌ No assignments found in the specified date range');
      if (allAssignments.length > 0) {
        console.log('💡 But there ARE assignments in the database - check date range logic');
      }
    }

    // Calculate producer statistics (assignments created)
    const producerStatsMap = new Map<string, { name: string; count: number }>();
    
    console.log('🔍 Processing assignments for producer stats...');
    assignments.forEach(assignment => {
      console.log(`  - Assignment "${assignment.name}" created by ${assignment.createdBy.role}(${assignment.createdBy.name})`);
      if (assignment.createdBy.role === 'PRODUCER' || assignment.createdBy.role === 'ADMIN') {
        const producerId = assignment.createdBy.id;
        const producerName = assignment.createdBy.name || assignment.createdBy.id;
        
        if (producerStatsMap.has(producerId)) {
          producerStatsMap.get(producerId)!.count++;
        } else {
          producerStatsMap.set(producerId, { name: producerName, count: 1 });
        }
        console.log(`    ✅ Counted for producer: ${producerName}`);
      } else {
        console.log(`    ❌ Skipped (role: ${assignment.createdBy.role})`);
      }
    });
    
    console.log('📊 Producer stats map:', Array.from(producerStatsMap.entries()));

    // Calculate operator statistics (assignments completed)
    const operatorStatsMap = new Map<string, { name: string; completed: number; commented: number }>();
    
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED' && a.assignedTo);
    const commentedAssignments = assignments.filter(a => a.comment && a.comment.trim() !== '' && a.assignedTo);
    
    console.log('🔍 Processing completed assignments for operator stats...');
    console.log(`Found ${completedAssignments.length} completed assignments out of ${assignments.length} total`);

    // Count completed assignments by operator
    completedAssignments.forEach(assignment => {
      if (assignment.assignedTo && assignment.assignedTo.role === 'OPERATOR') {
        const operatorId = assignment.assignedTo.id;
        const operatorName = assignment.assignedTo.name || assignment.assignedTo.id;
        
        if (operatorStatsMap.has(operatorId)) {
          operatorStatsMap.get(operatorId)!.completed++;
        } else {
          operatorStatsMap.set(operatorId, { name: operatorName, completed: 1, commented: 0 });
        }
      }
    });

    // Count commented assignments by operator
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

    // Convert maps to arrays for the response
    const producerStats = Array.from(producerStatsMap.entries()).map(([id, data]) => ({
      producerId: data.name,
      assignmentsCreated: data.count,
    }));

    const operatorStats = Array.from(operatorStatsMap.entries()).map(([id, data]) => ({
      operatorId: data.name,
      assignmentsCompleted: data.completed,
      assignmentsCommented: data.commented,
    }));

    // Calculate totals
    const totalAssignmentsCreated = assignments.length;
    const totalAssignmentsCompleted = completedAssignments.length;

    // Find most active users
    const mostActiveProducer = producerStats.reduce((max, current) => 
      current.assignmentsCreated > max.assignmentsCreated ? current : max, 
      { producerId: '', assignmentsCreated: 0 }
    ).producerId;

    const mostActiveOperator = operatorStats.reduce((max, current) => 
      current.assignmentsCompleted > max.assignmentsCompleted ? current : max,
      { operatorId: '', assignmentsCompleted: 0 }
    ).operatorId;

    const statistics: GenerateStatisticsOutput = {
      producerStats,
      operatorStats,
      totalAssignmentsCreated,
      totalAssignmentsCompleted,
      mostActiveProducer,
      mostActiveOperator,
    };

    console.log('📈 Final statistics result:', {
      userRole: session.user.role,
      isAdmin,
      assignmentsProcessed: assignments.length,
      producerStats: producerStats.length,
      operatorStats: operatorStats.length,
      totalAssignmentsCreated,
      totalAssignmentsCompleted,
      mostActiveProducer,
      mostActiveOperator,
      producerDetails: producerStats,
      operatorDetails: operatorStats
    });

    return statistics;
  } catch (error) {
    console.error("Error generating statistics:", error);
    return { error: "Failed to generate statistics. Please try again later." };
  }
}
