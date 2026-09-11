import type { ActivityEventType, ActivityLogRecord } from '@/lib/activity-log-types';

export type ActivityLanguage = 'en' | 'ro';

const eventLabels: Record<ActivityLanguage, Record<ActivityEventType, string>> = {
  en: {
    AUTH_LOGIN: 'Signed in', AUTH_LOGOUT: 'Signed out', PASSWORD_CHANGED: 'Changed password',
    ASSIGNMENT_CREATED: 'Created assignment', ASSIGNMENT_UPDATED: 'Modified assignment',
    ASSIGNMENT_ASSIGNED: 'Assigned work', ASSIGNMENT_STARTED: 'Started assignment',
    ASSIGNMENT_RETURNED_PENDING: 'Returned assignment to pending', ASSIGNMENT_COMPLETED: 'Completed assignment',
    ASSIGNMENT_REOPENED: 'Reopened assignment', ASSIGNMENT_DELETED: 'Deleted assignment',
    ASSIGNMENT_COMMENTED: 'Commented on assignment', USER_CREATED: 'Created user',
    USER_UPDATED: 'Modified user', USER_DELETED: 'Deleted user', USER_PASSWORD_RESET: 'Reset user password',
    SCHEDULE_UPDATED: 'Updated schedule', SCHEDULE_IMPORTED: 'Imported schedule',
    SCHEDULE_MONTH_DELETED: 'Deleted monthly schedule', EXCEL_CONFIG_CREATED: 'Created Excel configuration',
    EXCEL_CONFIG_UPDATED: 'Modified Excel configuration', EXCEL_CONFIG_DELETED: 'Deleted Excel configuration',
    SHIFT_LEGEND_CREATED: 'Created shift legend', SHIFT_LEGEND_UPDATED: 'Modified shift legend',
    SHIFT_LEGEND_DELETED: 'Deleted shift legend', BACKUP_CREATED: 'Created backup',
    BACKUP_DELETED: 'Deleted backup', BACKUP_RESTORED: 'Restored backup',
    ROLE_PERMISSIONS_UPDATED: 'Updated role permissions',
  },
  ro: {
    AUTH_LOGIN: 'S-a autentificat', AUTH_LOGOUT: 'S-a deconectat', PASSWORD_CHANGED: 'Și-a schimbat parola',
    ASSIGNMENT_CREATED: 'A creat sarcina', ASSIGNMENT_UPDATED: 'A modificat sarcina',
    ASSIGNMENT_ASSIGNED: 'A alocat sarcina', ASSIGNMENT_STARTED: 'A început sarcina',
    ASSIGNMENT_RETURNED_PENDING: 'A readus sarcina în așteptare', ASSIGNMENT_COMPLETED: 'A finalizat sarcina',
    ASSIGNMENT_REOPENED: 'A redeschis sarcina', ASSIGNMENT_DELETED: 'A șters sarcina',
    ASSIGNMENT_COMMENTED: 'A comentat la sarcina', USER_CREATED: 'A creat utilizatorul',
    USER_UPDATED: 'A modificat utilizatorul', USER_DELETED: 'A șters utilizatorul', USER_PASSWORD_RESET: 'A resetat parola utilizatorului',
    SCHEDULE_UPDATED: 'A actualizat programul', SCHEDULE_IMPORTED: 'A importat programul',
    SCHEDULE_MONTH_DELETED: 'A șters programul lunar', EXCEL_CONFIG_CREATED: 'A creat configurația Excel',
    EXCEL_CONFIG_UPDATED: 'A modificat configurația Excel', EXCEL_CONFIG_DELETED: 'A șters configurația Excel',
    SHIFT_LEGEND_CREATED: 'A creat legenda de schimb', SHIFT_LEGEND_UPDATED: 'A modificat legenda de schimb',
    SHIFT_LEGEND_DELETED: 'A șters legenda de schimb', BACKUP_CREATED: 'A creat copia de siguranță',
    BACKUP_DELETED: 'A șters copia de siguranță', BACKUP_RESTORED: 'A restaurat copia de siguranță',
    ROLE_PERMISSIONS_UPDATED: 'A actualizat permisiunile rolurilor',
  },
};

export function activityEventLabel(eventType: ActivityEventType, language: ActivityLanguage): string {
  return eventLabels[language][eventType];
}

export function formatActivitySentence(event: ActivityLogRecord, language: ActivityLanguage): string {
  const action = activityEventLabel(event.eventType, language).toLocaleLowerCase(language);
  const locale = language === 'ro' ? 'ro-RO' : 'en-GB';
  const timestamp = new Date(event.occurredAt);
  const dateParts = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Bucharest', day: '2-digit', month: '2-digit', year: 'numeric',
  }).formatToParts(timestamp);
  const dateValues = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  const eventDate = `${dateValues.day}.${dateValues.month}.${dateValues.year}`;
  const eventTime = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit',
  }).format(timestamp);
  const roles = language === 'ro'
    ? { ADMIN: 'Administratorul', PRODUCER: 'Producătorul', CONTRIBUTOR: 'Colaboratorul', OPERATOR: 'Operatorul' }
    : { ADMIN: 'Administrator', PRODUCER: 'Producer', CONTRIBUTOR: 'Contributor', OPERATOR: 'Operator' };
  const target = event.targetName ? ` “${event.targetName}”` : '';
  const assignee = typeof event.metadata.assigneeName === 'string' ? event.metadata.assigneeName : null;
  const fields = Array.isArray(event.metadata.changedFields)
    ? event.metadata.changedFields.filter((value): value is string => typeof value === 'string')
    : [];
  const fieldLabels: Record<ActivityLanguage, Record<string, string>> = {
    en: { name: 'name', description: 'description', author: 'author', dueDate: 'due date', priority: 'priority', assignedTo: 'assignee', sourceLocation: 'source location', status: 'status', email: 'email', role: 'role' },
    ro: { name: 'nume', description: 'descriere', author: 'autor', dueDate: 'termen', priority: 'prioritate', assignedTo: 'operator alocat', sourceLocation: 'locație sursă', status: 'stare', email: 'email', role: 'rol' },
  };
  const localizedFields = fields.map((field) => fieldLabels[language][field] || field);
  const count = typeof event.metadata.count === 'number' ? event.metadata.count : null;
  const extra = assignee
    ? (language === 'ro' ? ` lui ${assignee}` : ` to ${assignee}`)
    : localizedFields.length > 0
      ? ` (${localizedFields.join(', ')})`
      : count !== null
        ? (language === 'ro' ? ` (${count} înregistrări)` : ` (${count} records)`)
        : '';

  return language === 'ro'
    ? `La ${eventDate}, ora ${eventTime}, ${roles[event.actorRole]} ${event.actorName} ${action}${target}${extra}.`
    : `On ${eventDate} at ${eventTime}, ${roles[event.actorRole]} ${event.actorName} ${action}${target}${extra}.`;
}
