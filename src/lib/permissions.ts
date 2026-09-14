import type { UserRole } from '@prisma/client';

export const PERMISSION_KEYS = [
  'ASSIGNMENT_VIEW', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_EDIT_ANY', 'ASSIGNMENT_EDIT_OWN',
  'ASSIGNMENT_TRANSITION_ANY', 'ASSIGNMENT_TRANSITION_OWN', 'ASSIGNMENT_TRANSITION_ASSIGNED',
  'ASSIGNMENT_CLAIM_UNASSIGNED', 'ASSIGNMENT_RETURN_TO_PENDING', 'ASSIGNMENT_REOPEN_COMPLETED',
  'ASSIGNMENT_DELETE', 'ASSIGNMENT_COMMENT',
  'TEAM_SCHEDULE_VIEW', 'TEAM_SCHEDULE_MANAGE', 'SCHEDULE_IMPORT', 'EXCEL_CONFIG_MANAGE', 'SHIFT_LEGEND_MANAGE',
  'USER_CREATE', 'USER_EDIT', 'USER_ASSIGN_ROLE', 'USER_DELETE', 'USER_PASSWORD_RESET',
  'ORGANIZATION_STATS_VIEW', 'PERSONAL_STATS_VIEW', 'BACKUP_MANAGE', 'ACTIVITY_LOG_VIEW',
  'ASSIGNMENT_NOTIFICATIONS', 'PROFILE_VIEW', 'OWN_PASSWORD_CHANGE', 'PRESENCE_USE', 'USER_DIRECTORY_VIEW',
  'ROLE_PERMISSION_MANAGE',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_CATALOG: ReadonlyArray<{
  key: PermissionKey;
  group: 'assignments' | 'scheduling' | 'users' | 'reporting' | 'account' | 'access';
  label: { en: string; ro: string };
  description: { en: string; ro: string };
}> = [
  { key: 'ASSIGNMENT_VIEW', group: 'assignments', label: { en: 'View assignments', ro: 'Vizualizare sarcini' }, description: { en: 'View assignment lists and details.', ro: 'Vizualizează listele și detaliile sarcinilor.' } },
  { key: 'ASSIGNMENT_CREATE', group: 'assignments', label: { en: 'Create assignments', ro: 'Creare sarcini' }, description: { en: 'Create and initially assign work.', ro: 'Creează și alocă inițial sarcini.' } },
  { key: 'ASSIGNMENT_EDIT_ANY', group: 'assignments', label: { en: 'Edit any assignment', ro: 'Editare orice sarcină' }, description: { en: 'Edit details and assignee for all assignments.', ro: 'Editează detaliile și operatorul oricărei sarcini.' } },
  { key: 'ASSIGNMENT_EDIT_OWN', group: 'assignments', label: { en: 'Edit own assignments', ro: 'Editare sarcini proprii' }, description: { en: 'Edit only assignments created by the user.', ro: 'Editează doar sarcinile create de utilizator.' } },
  { key: 'ASSIGNMENT_TRANSITION_ANY', group: 'assignments', label: { en: 'Progress any assignment', ro: 'Progres orice sarcină' }, description: { en: 'Start or complete any assignment.', ro: 'Începe sau finalizează orice sarcină.' } },
  { key: 'ASSIGNMENT_TRANSITION_OWN', group: 'assignments', label: { en: 'Progress own assignments', ro: 'Progres sarcini proprii' }, description: { en: 'Change status only for assignments created by the user.', ro: 'Schimbă starea doar pentru sarcinile create de utilizator.' } },
  { key: 'ASSIGNMENT_TRANSITION_ASSIGNED', group: 'assignments', label: { en: 'Progress assigned work', ro: 'Progres sarcini alocate' }, description: { en: 'Change status for work assigned to the user.', ro: 'Schimbă starea sarcinilor alocate utilizatorului.' } },
  { key: 'ASSIGNMENT_CLAIM_UNASSIGNED', group: 'assignments', label: { en: 'Claim unassigned work', ro: 'Preluare sarcini nealocate' }, description: { en: 'Start and claim a pending unassigned assignment.', ro: 'Începe și preia o sarcină nealocată în așteptare.' } },
  { key: 'ASSIGNMENT_RETURN_TO_PENDING', group: 'assignments', label: { en: 'Return started work', ro: 'Revenire lucru început' }, description: { en: 'Return in-progress work to pending. Operator-claimed work becomes unassigned.', ro: 'Readuce lucrul în desfășurare în așteptare. Sarcinile preluate de operator devin nealocate.' } },
  { key: 'ASSIGNMENT_REOPEN_COMPLETED', group: 'assignments', label: { en: 'Reopen completed work', ro: 'Redeschidere lucru finalizat' }, description: { en: 'Reopen a completed assignment as in progress.', ro: 'Redeschide o sarcină finalizată ca fiind în desfășurare.' } },
  { key: 'ASSIGNMENT_DELETE', group: 'assignments', label: { en: 'Delete assignments', ro: 'Ștergere sarcini' }, description: { en: 'Permanently delete assignments.', ro: 'Șterge definitiv sarcini.' } },
  { key: 'ASSIGNMENT_COMMENT', group: 'assignments', label: { en: 'Comment on assignments', ro: 'Comentarii la sarcini' }, description: { en: 'Read, add, and reply to comments.', ro: 'Citește, adaugă și răspunde la comentarii.' } },
  { key: 'TEAM_SCHEDULE_VIEW', group: 'scheduling', label: { en: 'View team schedule', ro: 'Vizualizare program echipă' }, description: { en: 'View scheduled team members and shifts.', ro: 'Vizualizează membrii și schimburile programate.' } },
  { key: 'TEAM_SCHEDULE_MANAGE', group: 'scheduling', label: { en: 'Manage team schedule', ro: 'Administrare program echipă' }, description: { en: 'Save manual schedules and delete schedule periods.', ro: 'Salvează programe manuale și șterge perioade.' } },
  { key: 'SCHEDULE_IMPORT', group: 'scheduling', label: { en: 'Import schedules', ro: 'Import programe' }, description: { en: 'Import schedules from Excel files.', ro: 'Importă programe din fișiere Excel.' } },
  { key: 'EXCEL_CONFIG_MANAGE', group: 'scheduling', label: { en: 'Manage Excel configurations', ro: 'Administrare configurații Excel' }, description: { en: 'Create, edit, test, and delete import configurations.', ro: 'Creează, editează, testează și șterge configurații de import.' } },
  { key: 'SHIFT_LEGEND_MANAGE', group: 'scheduling', label: { en: 'Manage shift legends', ro: 'Administrare legende schimburi' }, description: { en: 'Create, edit, and delete shift color meanings.', ro: 'Creează, editează și șterge semnificațiile culorilor.' } },
  { key: 'USER_CREATE', group: 'users', label: { en: 'Create users', ro: 'Creare utilizatori' }, description: { en: 'Create new user accounts.', ro: 'Creează conturi noi.' } },
  { key: 'USER_EDIT', group: 'users', label: { en: 'Edit users', ro: 'Editare utilizatori' }, description: { en: 'Edit another user’s name and email.', ro: 'Editează numele și emailul altui utilizator.' } },
  { key: 'USER_ASSIGN_ROLE', group: 'users', label: { en: 'Assign user roles', ro: 'Atribuire roluri' }, description: { en: 'Change the role assigned to an account.', ro: 'Schimbă rolul atribuit unui cont.' } },
  { key: 'USER_DELETE', group: 'users', label: { en: 'Delete users', ro: 'Ștergere utilizatori' }, description: { en: 'Permanently delete other user accounts.', ro: 'Șterge definitiv alte conturi.' } },
  { key: 'USER_PASSWORD_RESET', group: 'users', label: { en: 'Reset user passwords', ro: 'Resetare parole utilizatori' }, description: { en: 'Issue temporary passwords for other users.', ro: 'Emite parole temporare pentru alți utilizatori.' } },
  { key: 'ORGANIZATION_STATS_VIEW', group: 'reporting', label: { en: 'View organization statistics', ro: 'Vizualizare statistici organizație' }, description: { en: 'View the administrative statistics dashboard.', ro: 'Vizualizează panoul administrativ de statistici.' } },
  { key: 'PERSONAL_STATS_VIEW', group: 'reporting', label: { en: 'View personal statistics', ro: 'Vizualizare statistici personale' }, description: { en: 'View the user’s own activity statistics.', ro: 'Vizualizează statisticile proprii ale utilizatorului.' } },
  { key: 'BACKUP_MANAGE', group: 'reporting', label: { en: 'Manage backups', ro: 'Administrare copii de siguranță' }, description: { en: 'Create, download, delete, and restore backups.', ro: 'Creează, descarcă, șterge și restaurează copii.' } },
  { key: 'ACTIVITY_LOG_VIEW', group: 'reporting', label: { en: 'View activity log', ro: 'Vizualizare jurnal activitate' }, description: { en: 'View the administrative activity feed.', ro: 'Vizualizează jurnalul administrativ de activitate.' } },
  { key: 'ASSIGNMENT_NOTIFICATIONS', group: 'reporting', label: { en: 'Receive assignment notifications', ro: 'Primire notificări sarcini' }, description: { en: 'Receive and manage assignment notifications.', ro: 'Primește și gestionează notificări pentru sarcini.' } },
  { key: 'PROFILE_VIEW', group: 'account', label: { en: 'View own profile', ro: 'Vizualizare profil propriu' }, description: { en: 'Always available to every role.', ro: 'Disponibilă permanent pentru fiecare rol.' } },
  { key: 'OWN_PASSWORD_CHANGE', group: 'account', label: { en: 'Change own password', ro: 'Schimbare parolă proprie' }, description: { en: 'Always available to every role.', ro: 'Disponibilă permanent pentru fiecare rol.' } },
  { key: 'PRESENCE_USE', group: 'account', label: { en: 'Use authenticated presence', ro: 'Utilizare prezență autentificată' }, description: { en: 'Always available to every role.', ro: 'Disponibilă permanent pentru fiecare rol.' } },
  { key: 'USER_DIRECTORY_VIEW', group: 'account', label: { en: 'View user directory', ro: 'Vizualizare director utilizatori' }, description: { en: 'Always available to every role for collaboration.', ro: 'Disponibilă permanent pentru colaborare.' } },
  { key: 'ROLE_PERMISSION_MANAGE', group: 'access', label: { en: 'Manage role permissions', ro: 'Administrare permisiuni roluri' }, description: { en: 'Protected Administrator access; cannot be removed or delegated.', ro: 'Acces protejat al Administratorului; nu poate fi eliminat sau delegat.' } },
];

export const CORE_PERMISSIONS: readonly PermissionKey[] = ['PROFILE_VIEW', 'OWN_PASSWORD_CHANGE', 'PRESENCE_USE', 'USER_DIRECTORY_VIEW'];
export const PROTECTED_PERMISSION: PermissionKey = 'ROLE_PERMISSION_MANAGE';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, readonly PermissionKey[]> = {
  ADMIN: [
    'ASSIGNMENT_VIEW', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_EDIT_ANY', 'ASSIGNMENT_TRANSITION_ANY',
    'ASSIGNMENT_RETURN_TO_PENDING', 'ASSIGNMENT_REOPEN_COMPLETED', 'ASSIGNMENT_DELETE',
    'ASSIGNMENT_COMMENT', 'TEAM_SCHEDULE_VIEW',
    'TEAM_SCHEDULE_MANAGE', 'SCHEDULE_IMPORT', 'EXCEL_CONFIG_MANAGE', 'SHIFT_LEGEND_MANAGE',
    'USER_CREATE', 'USER_EDIT', 'USER_ASSIGN_ROLE', 'USER_DELETE', 'USER_PASSWORD_RESET',
    'ORGANIZATION_STATS_VIEW', 'BACKUP_MANAGE', 'ACTIVITY_LOG_VIEW', 'ROLE_PERMISSION_MANAGE',
    ...CORE_PERMISSIONS,
  ],
  PRODUCER: [
    'ASSIGNMENT_VIEW', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_EDIT_ANY', 'ASSIGNMENT_TRANSITION_ANY',
    'ASSIGNMENT_DELETE', 'ASSIGNMENT_COMMENT', 'TEAM_SCHEDULE_VIEW', 'TEAM_SCHEDULE_MANAGE',
    'PERSONAL_STATS_VIEW', ...CORE_PERMISSIONS,
  ],
  CONTRIBUTOR: [
    'ASSIGNMENT_VIEW', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_EDIT_OWN', 'ASSIGNMENT_TRANSITION_OWN',
    'ASSIGNMENT_COMMENT', 'TEAM_SCHEDULE_VIEW', 'PERSONAL_STATS_VIEW', ...CORE_PERMISSIONS,
  ],
  OPERATOR: [
    'ASSIGNMENT_VIEW', 'ASSIGNMENT_TRANSITION_ASSIGNED', 'ASSIGNMENT_CLAIM_UNASSIGNED',
    'ASSIGNMENT_RETURN_TO_PENDING', 'ASSIGNMENT_COMMENT', 'TEAM_SCHEDULE_VIEW',
    'PERSONAL_STATS_VIEW', 'ASSIGNMENT_NOTIFICATIONS',
    ...CORE_PERMISSIONS,
  ],
};

const permissionSet = new Set<string>(PERMISSION_KEYS);

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === 'string' && permissionSet.has(value);
}

export function effectivePermissions(role: UserRole, stored?: readonly PermissionKey[] | null): PermissionKey[] {
  const values = new Set(stored ?? DEFAULT_ROLE_PERMISSIONS[role]);
  CORE_PERMISSIONS.forEach((permission) => values.add(permission));
  if (role === 'ADMIN') values.add(PROTECTED_PERMISSION);
  else values.delete(PROTECTED_PERMISSION);
  return PERMISSION_KEYS.filter((permission) => values.has(permission));
}

export function hasPermission(
  user: { role: UserRole; permissions?: readonly PermissionKey[] | null },
  permission: PermissionKey,
): boolean {
  return effectivePermissions(user.role, user.permissions).includes(permission);
}
