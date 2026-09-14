import type { UserRole } from '@prisma/client';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

export const USER_ROLES = ['ADMIN', 'PRODUCER', 'CONTRIBUTOR', 'OPERATOR'] as const satisfies readonly UserRole[];

export function canUpdateUser(
  actor: { id: string; role: UserRole; permissions?: readonly PermissionKey[] | null },
  targetId: string,
  requestedRole: UserRole,
): boolean {
  return hasPermission(actor, 'USER_EDIT') || (actor.id === targetId && requestedRole === actor.role);
}

export function canManageAssignmentDetails(
  actor: { id: string; role: UserRole; permissions?: readonly PermissionKey[] | null },
  assignment: { createdById: string },
): boolean {
  return hasPermission(actor, 'ASSIGNMENT_EDIT_ANY') ||
    (hasPermission(actor, 'ASSIGNMENT_EDIT_OWN') && assignment.createdById === actor.id);
}

export function canTransitionAssignment(
  actor: { id: string; role: UserRole; permissions?: readonly PermissionKey[] | null },
  assignment: { assignedToId: string | null; createdById: string },
): boolean {
  return hasPermission(actor, 'ASSIGNMENT_TRANSITION_ANY') ||
    (hasPermission(actor, 'ASSIGNMENT_TRANSITION_ASSIGNED') && assignment.assignedToId === actor.id) ||
    (hasPermission(actor, 'ASSIGNMENT_TRANSITION_OWN') && assignment.createdById === actor.id);
}

export function canStartAssignment(
  actor: { id: string; role: UserRole; permissions?: readonly PermissionKey[] | null },
  assignment: { assignedToId: string | null; createdById: string },
): boolean {
  return canTransitionAssignment(actor, assignment) ||
    (hasPermission(actor, 'ASSIGNMENT_CLAIM_UNASSIGNED') && assignment.assignedToId === null);
}

export function canDeleteAssignment(actor: { role: UserRole; permissions?: readonly PermissionKey[] | null }): boolean {
  return hasPermission(actor, 'ASSIGNMENT_DELETE');
}

export function canReturnAssignmentToPending(actor: { role: UserRole; permissions?: readonly PermissionKey[] | null }): boolean {
  return hasPermission(actor, 'ASSIGNMENT_RETURN_TO_PENDING');
}

export function canReopenCompletedAssignment(actor: { role: UserRole; permissions?: readonly PermissionKey[] | null }): boolean {
  return hasPermission(actor, 'ASSIGNMENT_REOPEN_COMPLETED');
}
