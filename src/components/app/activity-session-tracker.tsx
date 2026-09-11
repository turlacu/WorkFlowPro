'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { getAppSessionId } from '@/lib/client-app-session';

export function ActivitySessionTracker() {
  const { data: session } = useSession();
  React.useEffect(() => {
    if (!session?.user?.id) return;
    const id = getAppSessionId();

    void fetch('/api/activity/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'OPEN', sessionId: id }),
      keepalive: true,
    });

    const recordClose = () => {
      const body = new Blob(
        [JSON.stringify({ action: 'CLOSE', sessionId: id })],
        { type: 'application/json' },
      );
      navigator.sendBeacon('/api/activity/session', body);
    };
    window.addEventListener('pagehide', recordClose);
    return () => window.removeEventListener('pagehide', recordClose);
  }, [session?.user?.id]);

  return null;
}
