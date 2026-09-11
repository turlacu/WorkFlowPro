import { NextRequest, NextResponse } from 'next/server';
import { assignmentBroker } from '@/lib/assignment-broker';
import { requirePermission } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requirePermission('ASSIGNMENT_VIEW');
  if (auth.response) return auth.response;
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let active = true;
      let validating = false;
      const send = (name: string, data: unknown) => {
        if (active) controller.enqueue(encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const unsubscribe = assignmentBroker.subscribe((event) => send('assignment', event));
      const heartbeat = setInterval(async () => {
        if (!active || validating) return;
        validating = true;
        try {
          const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { sessionVersion: true, passwordResetRequired: true },
          });
          if (!active) return;
          if (!user || user.passwordResetRequired || user.sessionVersion !== auth.user.sessionVersion) {
            send('expired', {});
            cleanup();
            controller.close();
          } else send('heartbeat', {});
        } catch {
          if (active) { cleanup(); controller.close(); }
        } finally { validating = false; }
      }, 25_000);
      cleanup = () => {
        active = false;
        clearInterval(heartbeat);
        unsubscribe();
        request.signal.removeEventListener('abort', cleanup);
      };
      request.signal.addEventListener('abort', cleanup, { once: true });
      if (request.signal.aborted) cleanup();
      else send('connected', {});
    },
    cancel() { cleanup(); },
  });
  return new NextResponse(stream, { headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  } });
}
