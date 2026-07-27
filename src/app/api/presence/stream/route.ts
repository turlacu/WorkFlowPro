import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import {
  PRESENCE_ONLINE_WINDOW_MS,
  PRESENCE_REFRESH_INTERVAL_MS,
  type OnlineUser,
  type PresenceEvent,
  type PresenceRole,
} from '@/lib/presence';
import { requireUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();
const roleOrder: Record<PresenceRole, number> = {
  ADMIN: 0,
  PRODUCER: 1,
  OPERATOR: 2,
};

function event(name: string, data: unknown) {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function readOnlineUsers(now: Date): Promise<OnlineUser[]> {
  const cutoff = new Date(now.getTime() - PRESENCE_ONLINE_WINDOW_MS);
  const users = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string | null;
      email: string;
      role: PresenceRole;
    }>
  >`
    SELECT users.id, users.name, users.email, users.role
    FROM "user_presence" AS presence
    INNER JOIN "users" AS users ON users.id = presence."userId"
    WHERE presence."lastSeenAt" >= ${cutoff}
  `;

  return users
    .map((user) => ({
      id: user.id,
      name: user.name?.trim() || user.email.split('@')[0],
      role: user.role,
    }))
    .sort(
      (left, right) =>
        roleOrder[left.role] - roleOrder[right.role] ||
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(undefined, true);
  if (auth.response) return auth.response;

  let cleanup: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let active = true;
      let refreshing = false;

      const publishPresence = async () => {
        if (!active || refreshing) return;
        refreshing = true;

        try {
          const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { sessionVersion: true },
          });
          if (!user || user.sessionVersion !== auth.user.sessionVersion) {
            cleanup?.();
            controller.close();
            return;
          }

          const now = new Date();
          await prisma.$executeRaw`
            INSERT INTO "user_presence" ("userId", "lastSeenAt")
            VALUES (${auth.user.id}, ${now})
            ON CONFLICT ("userId")
            DO UPDATE SET "lastSeenAt" = EXCLUDED."lastSeenAt"
          `;

          const payload: PresenceEvent = {
            generatedAt: now.toISOString(),
            users: await readOnlineUsers(now),
          };
          if (active) controller.enqueue(event('presence', payload));
        } catch (error) {
          if (active) console.error('Failed to refresh user presence:', error);
        } finally {
          refreshing = false;
        }
      };

      const interval = setInterval(() => void publishPresence(), PRESENCE_REFRESH_INTERVAL_MS);
      const handleAbort = () => cleanup?.();
      request.signal.addEventListener('abort', handleAbort, { once: true });
      cleanup = () => {
        if (!active) return;
        active = false;
        clearInterval(interval);
        request.signal.removeEventListener('abort', handleAbort);
      };

      void publishPresence();
    },
    cancel() {
      cleanup?.();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
