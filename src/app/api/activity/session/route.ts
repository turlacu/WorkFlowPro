import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordAppSessionActivity } from '@/lib/app-session-activity';
import { requireUser } from '@/lib/server-auth';

const SessionActivitySchema = z.object({
  action: z.enum(['OPEN', 'CLOSE']),
  sessionId: z.string().uuid(),
}).strict();

export async function POST(request: Request) {
  try {
    const auth = await requireUser(undefined, true);
    if (auth.response) return auth.response;
    const input = SessionActivitySchema.parse(await request.json());
    const recorded = await recordAppSessionActivity(auth.user, input.action, input.sessionId);

    return NextResponse.json({ recorded });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid session activity' }, { status: 400 });
    }
    console.error('Failed to record app session activity:', error);
    return NextResponse.json({ error: 'Failed to record app session activity' }, { status: 500 });
  }
}
