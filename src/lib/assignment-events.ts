export const ASSIGNMENT_CHANNEL = 'workflowpro_assignments';
export type AssignmentEvent = {
  type: 'created' | 'updated' | 'deleted' | 'comments' | 'reset';
  assignmentId?: string;
};

export function parseAssignmentEvent(value: unknown): AssignmentEvent | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as AssignmentEvent;
  if (event.type === 'reset') return { type: 'reset' };
  if (!['created', 'updated', 'deleted', 'comments'].includes(event.type) ||
      typeof event.assignmentId !== 'string' || !event.assignmentId) return null;
  return { type: event.type, assignmentId: event.assignmentId };
}
