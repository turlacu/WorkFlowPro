let currentAppSessionId: string | null = null;

export function getAppSessionId(): string {
  currentAppSessionId ??= crypto.randomUUID();
  return currentAppSessionId;
}
