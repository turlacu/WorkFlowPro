'use client';

import { useEffect, useRef } from 'react';
import { parseAssignmentEvent } from '@/lib/assignment-events';

export function useAssignmentStream(userId: string | undefined, refresh: () => Promise<void>) {
  const latestRefresh = useRef(refresh);
  latestRefresh.current = refresh;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let running = false;
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      timer = undefined;
      if (!active) return;
      if (running) { pending = true; return; }
      running = true;
      try {
        await latestRefresh.current();
      } catch (error) {
        console.error('Assignment refresh failed:', error);
      } finally {
        running = false;
        if (active && pending) { pending = false; schedule(); }
      }
    };
    const schedule = () => {
      if (active && !timer) timer = setTimeout(() => void run(), 150);
    };
    const source = new EventSource('/api/assignments/stream');
    source.addEventListener('connected', schedule);
    source.addEventListener('assignment', (message) => {
      try {
        if (parseAssignmentEvent(JSON.parse((message as MessageEvent).data))) schedule();
      } catch { /* Ignore malformed messages. */ }
    });
    source.addEventListener('expired', () => { source.close(); schedule(); });
    const whenVisible = () => { if (document.visibilityState === 'visible') schedule(); };
    const fallback = setInterval(whenVisible, 30_000);
    document.addEventListener('visibilitychange', whenVisible);
    window.addEventListener('online', schedule);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(fallback);
      source.close();
      document.removeEventListener('visibilitychange', whenVisible);
      window.removeEventListener('online', schedule);
    };
  }, [userId]);
}
