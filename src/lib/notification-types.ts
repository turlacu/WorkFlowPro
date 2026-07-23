import type { Notification, NotificationType } from '@prisma/client';

export const NOTIFICATION_CHANNEL = 'workflowpro_notifications';

export interface AssignmentNotification {
  id: string;
  type: NotificationType;
  assignmentId: string | null;
  assignmentName: string;
  dueDate: string;
  actor: {
    id: string | null;
    name: string;
  };
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: AssignmentNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

export type NotificationRecord = Pick<
  Notification,
  | 'id'
  | 'type'
  | 'assignmentId'
  | 'assignmentName'
  | 'dueDate'
  | 'actorId'
  | 'actorName'
  | 'readAt'
  | 'createdAt'
>;

export function serializeNotification(notification: NotificationRecord): AssignmentNotification {
  return {
    id: notification.id,
    type: notification.type,
    assignmentId: notification.assignmentId,
    assignmentName: notification.assignmentName,
    dueDate: notification.dueDate.toISOString(),
    actor: {
      id: notification.actorId,
      name: notification.actorName,
    },
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function notificationRecipient(
  previousAssigneeId: string | null | undefined,
  nextAssigneeId: string | null | undefined,
): string | null {
  if (!nextAssigneeId || nextAssigneeId === previousAssigneeId) return null;
  return nextAssigneeId;
}
