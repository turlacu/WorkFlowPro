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
    // Input validation
    const validated = GenerateStatisticsInputSchema.parse(input);
    
    if (new Date(validated.startDate) > new Date(validated.endDate)) {
      return { error: 'Start date cannot be after end date.' };
    }

    // TODO: Replace with actual database queries
    // For now, return mock statistics data
    const mockStatistics: GenerateStatisticsOutput = {
      producerStats: [
        { producerId: 'p1', assignmentsCreated: 15 },
        { producerId: 'p2', assignmentsCreated: 12 },
        { producerId: 'p3', assignmentsCreated: 8 },
      ],
      operatorStats: [
        { operatorId: 'o1', assignmentsCompleted: 20, assignmentsCommented: 5 },
        { operatorId: 'o2', assignmentsCompleted: 18, assignmentsCommented: 8 },
        { operatorId: 'o3', assignmentsCompleted: 15, assignmentsCommented: 3 },
      ],
      totalAssignmentsCreated: 35,
      totalAssignmentsCompleted: 53,
      mostActiveProducer: 'p1',
      mostActiveOperator: 'o1',
    };

    return mockStatistics;
  } catch (error) {
    console.error("Error generating statistics:", error);
    return { error: "Failed to generate statistics. Please try again later." };
  }
}
