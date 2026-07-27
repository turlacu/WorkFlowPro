type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_BUCKETS = 10_000;

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, entry] of buckets) {
        if (entry.resetAt <= now) buckets.delete(bucketKey);
      }
      if (buckets.size >= MAX_BUCKETS) {
        return { allowed: false, retryAfterSeconds: 60 };
      }
    }
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearRateLimitsForTests(): void {
  buckets.clear();
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
