import type { UserRole } from '@prisma/client';

export const USER_ROLES = ['ADMIN', 'PRODUCER', 'OPERATOR'] as const satisfies readonly UserRole[];

export function canUpdateUser(
  actor: { id: string; role: UserRole },
  targetId: string,
  requestedRole: UserRole,
): boolean {
  return actor.role === 'ADMIN' || (actor.id === targetId && requestedRole === actor.role);
}

export function canManageAssignmentDetails(
  actor: { id: string; role: UserRole },
): boolean {
  return actor.role === 'ADMIN' || actor.role === 'PRODUCER';
}

export function canTransitionAssignment(
  actor: { id: string; role: UserRole },
  assignment: { assignedToId: string | null },
): boolean {
  return actor.role === 'ADMIN' || actor.role === 'PRODUCER' || assignment.assignedToId === actor.id;
}
