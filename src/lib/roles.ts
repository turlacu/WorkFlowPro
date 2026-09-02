import type { UserRole } from '@prisma/client';

export const USER_ROLES = ['ADMIN', 'PRODUCER', 'CONTRIBUTOR', 'OPERATOR'] as const satisfies readonly UserRole[];

export function canUpdateUser(
  actor: { id: string; role: UserRole },
  targetId: string,
  requestedRole: UserRole,
): boolean {
  return actor.role === 'ADMIN' || (actor.id === targetId && requestedRole === actor.role);
}

export function canManageAssignmentDetails(
  actor: { id: string; role: UserRole },
  assignment: { createdById: string },
): boolean {
  return actor.role === 'ADMIN' ||
    actor.role === 'PRODUCER' ||
    (actor.role === 'CONTRIBUTOR' && assignment.createdById === actor.id);
}

export function canTransitionAssignment(
  actor: { id: string; role: UserRole },
  assignment: { assignedToId: string | null; createdById: string },
): boolean {
  return actor.role === 'ADMIN' ||
    actor.role === 'PRODUCER' ||
    (actor.role === 'OPERATOR' && assignment.assignedToId === actor.id) ||
    (actor.role === 'CONTRIBUTOR' && assignment.createdById === actor.id);
}

export function canDeleteAssignment(actor: { role: UserRole }): boolean {
  return actor.role === 'ADMIN' || actor.role === 'PRODUCER';
}
