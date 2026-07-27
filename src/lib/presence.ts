export const PRESENCE_REFRESH_INTERVAL_MS = 15_000;
export const PRESENCE_ONLINE_WINDOW_MS = 45_000;
export const PRESENCE_CLIENT_STALE_MS = 40_000;

export type PresenceRole = 'ADMIN' | 'PRODUCER' | 'OPERATOR';

export interface OnlineUser {
  id: string;
  name: string;
  role: PresenceRole;
}

export interface PresenceEvent {
  generatedAt: string;
  users: OnlineUser[];
}

export function isPresenceFresh(
  lastSeenAt: Date | string | number,
  now = Date.now(),
): boolean {
  const timestamp =
    lastSeenAt instanceof Date ? lastSeenAt.getTime() : new Date(lastSeenAt).getTime();
  return Number.isFinite(timestamp) && now - timestamp <= PRESENCE_ONLINE_WINDOW_MS;
}

export function isPresenceEvent(value: unknown): value is PresenceEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PresenceEvent>;
  return (
    typeof candidate.generatedAt === 'string' &&
    Array.isArray(candidate.users) &&
    candidate.users.every(
      (user) =>
        Boolean(user) &&
        typeof user.id === 'string' &&
        typeof user.name === 'string' &&
        (user.role === 'ADMIN' || user.role === 'PRODUCER' || user.role === 'OPERATOR'),
    )
  );
}
