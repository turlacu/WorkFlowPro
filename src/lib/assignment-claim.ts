export interface AssignmentClaimUpdate {
  assignedToId?: string | null;
  claimedByOperator?: boolean;
}

export function getAssignmentClaimUpdate(input: {
  currentClaimedByOperator: boolean;
  operatorClaimingUserId?: string;
  requestedAssignedToId?: string | null;
  returningToPending: boolean;
}): AssignmentClaimUpdate {
  if (input.operatorClaimingUserId) {
    return { assignedToId: input.operatorClaimingUserId, claimedByOperator: true };
  }

  if (input.requestedAssignedToId !== undefined) {
    return { assignedToId: input.requestedAssignedToId, claimedByOperator: false };
  }

  if (input.returningToPending && input.currentClaimedByOperator) {
    return { assignedToId: null, claimedByOperator: false };
  }

  return {};
}
