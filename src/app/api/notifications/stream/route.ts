import { NextRequest, NextResponse } from 'next/server';

import { notificationBroker } from '@/lib/notification-broker';
import { serializeNotification } from '@/lib/notification-types';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

function event(name: string, data: unknown) {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(['OPERATOR']);
  if (auth.response) return auth.response;
  const recipientId = auth.user.id;

  let cleanup: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let active = true;
      controller.enqueue(event('connected', { connectedAt: new Date().toISOString() }));

      const unsubscribe = notificationBroker.subscribe(recipientId, async (notificationId) => {
        try {
          const notification = await prisma.notification.findFirst({
            where: { id: notificationId, recipientId },
          });
          if (active && notification) {
            controller.enqueue(event('notification', serializeNotification(notification)));
          }
        } catch (error) {
          console.error('Failed to stream notification:', error);
        }
      });

      const heartbeat = setInterval(async () => {
        if (!active) return;
        try {
          const user = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { role: true, sessionVersion: true, passwordResetRequired: true },
          });
          if (
            !user ||
            user.role !== 'OPERATOR' ||
            user.passwordResetRequired ||
            user.sessionVersion !== auth.user.sessionVersion
          ) {
            cleanup?.();
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch (error) {
          console.error('Failed to validate notification stream:', error);
        }
      }, 25_000);

      const handleAbort = () => cleanup?.();
      request.signal.addEventListener('abort', handleAbort, { once: true });
      cleanup = () => {
        if (!active) return;
        active = false;
        clearInterval(heartbeat);
        unsubscribe();
        request.signal.removeEventListener('abort', handleAbort);
      };
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
