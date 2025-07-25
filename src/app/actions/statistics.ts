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
    // Import prisma here to avoid issues with server actions
    const { prisma } = await import('@/lib/prisma');
    
    // Input validation
    const validated = GenerateStatisticsInputSchema.parse(input);
    
    if (new Date(validated.startDate) > new Date(validated.endDate)) {
      return { error: 'Start date cannot be after end date.' };
    }

    // Create date objects that capture full local date ranges
    const startDate = new Date(validated.startDate);
    startDate.setHours(0, 0, 0, 0); // Start of day
    
    const endDate = new Date(validated.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day

    console.log('📊 Statistics Action Debug:');
    console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // First check total assignments in database
    const totalAssignmentsInDb = await prisma.assignment.count();
    console.log('Total assignments in database:', totalAssignmentsInDb);

    // Get all assignments in the date range
    const assignments = await prisma.assignment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
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

    console.log('Assignments found in date range:', assignments.length);
    
    // Get all assignments regardless of date to debug
    const allAssignments = await prisma.assignment.findMany({
      select: {
        name: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    console.log('Recent assignments in DB (any date):');
    allAssignments.forEach(a => {
      console.log(`  - ${a.name}: ${a.createdAt.toISOString()} (${a.status})`);
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

    // Calculate operator statistics (assignments completed)
    const operatorStatsMap = new Map<string, { name: string; completed: number; commented: number }>();
    
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED' && a.assignedTo);
    const commentedAssignments = assignments.filter(a => a.comment && a.comment.trim() !== '' && a.assignedTo);

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
      producerStats: producerStats.length,
      operatorStats: operatorStats.length,
      totalAssignmentsCreated,
      totalAssignmentsCompleted,
      mostActiveProducer,
      mostActiveOperator
    });

    return statistics;
  } catch (error) {
    console.error("Error generating statistics:", error);
    return { error: "Failed to generate statistics. Please try again later." };
  }
}
