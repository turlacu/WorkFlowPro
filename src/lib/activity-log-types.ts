export const ACTIVITY_EVENT_TYPES = [
  'AUTH_LOGIN',
  'AUTH_LOGOUT',
  'PASSWORD_CHANGED',
  'ASSIGNMENT_CREATED',
  'ASSIGNMENT_UPDATED',
  'ASSIGNMENT_ASSIGNED',
  'ASSIGNMENT_STARTED',
  'ASSIGNMENT_RETURNED_PENDING',
  'ASSIGNMENT_COMPLETED',
  'ASSIGNMENT_REOPENED',
  'ASSIGNMENT_DELETED',
  'ASSIGNMENT_COMMENTED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_PASSWORD_RESET',
  'SCHEDULE_UPDATED',
  'SCHEDULE_IMPORTED',
  'SCHEDULE_MONTH_DELETED',
  'EXCEL_CONFIG_CREATED',
  'EXCEL_CONFIG_UPDATED',
  'EXCEL_CONFIG_DELETED',
  'SHIFT_LEGEND_CREATED',
  'SHIFT_LEGEND_UPDATED',
  'SHIFT_LEGEND_DELETED',
  'BACKUP_CREATED',
  'BACKUP_DELETED',
  'BACKUP_RESTORED',
  'ROLE_PERMISSIONS_UPDATED',
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export type ActivityLogRecord = {
  id: string;
  occurredAt: string;
  eventType: ActivityEventType;
  actorId: string | null;
  actorName: string;
  actorRole: 'ADMIN' | 'PRODUCER' | 'CONTRIBUTOR' | 'OPERATOR';
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  metadata: Record<string, unknown>;
};
