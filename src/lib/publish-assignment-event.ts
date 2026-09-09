import type { Prisma } from '@prisma/client';
import { ASSIGNMENT_CHANNEL, type AssignmentEvent } from './assignment-events';

// PostgreSQL delivers NOTIFY only when the surrounding transaction commits.
export async function publishAssignmentEvent(tx: Prisma.TransactionClient, event: AssignmentEvent) {
  await tx.$executeRaw`SELECT pg_notify(${ASSIGNMENT_CHANNEL}, ${JSON.stringify(event)})`;
}
