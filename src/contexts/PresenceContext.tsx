'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';

import {
  PRESENCE_CLIENT_STALE_MS,
  isPresenceEvent,
  type OnlineUser,
} from '@/lib/presence';

interface PresenceContextValue {
  onlineUsers: OnlineUser[];
  available: boolean;
  connecting: boolean;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = React.createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [onlineUsers, setOnlineUsers] = React.useState<OnlineUser[]>([]);
  const [available, setAvailable] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const lastEventAt = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!session?.user?.id) {
      lastEventAt.current = null;
      setOnlineUsers([]);
      setAvailable(false);
      setConnecting(false);
      return;
    }

    setConnecting(true);
    lastEventAt.current = Date.now();
    const source = new EventSource('/api/presence/stream');
    const handlePresence = (message: MessageEvent<string>) => {
      try {
        const payload: unknown = JSON.parse(message.data);
        if (!isPresenceEvent(payload)) throw new Error('Invalid presence event');
        lastEventAt.current = Date.now();
        setOnlineUsers(payload.users);
        setAvailable(true);
        setConnecting(false);
      } catch (error) {
        console.error('Invalid realtime presence payload:', error);
      }
    };

    source.addEventListener('presence', handlePresence as EventListener);
    const staleTimer = window.setInterval(() => {
      if (
        lastEventAt.current !== null &&
        Date.now() - lastEventAt.current > PRESENCE_CLIENT_STALE_MS
      ) {
        setOnlineUsers([]);
        setAvailable(false);
        setConnecting(false);
      }
    }, 5_000);

    return () => {
      window.clearInterval(staleTimer);
      source.removeEventListener('presence', handlePresence as EventListener);
      source.close();
      lastEventAt.current = null;
      setOnlineUsers([]);
      setAvailable(false);
      setConnecting(false);
    };
  }, [session?.user?.id]);

  const onlineUserIds = React.useMemo(
    () => new Set(onlineUsers.map((user) => user.id)),
    [onlineUsers],
  );
  const isUserOnline = React.useCallback(
    (userId: string) => available && onlineUserIds.has(userId),
    [available, onlineUserIds],
  );

  const value = React.useMemo<PresenceContextValue>(
    () => ({ onlineUsers, available, connecting, isUserOnline }),
    [available, connecting, isUserOnline, onlineUsers],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence(): PresenceContextValue {
  const context = React.useContext(PresenceContext);
  if (!context) throw new Error('usePresence must be used inside PresenceProvider');
  return context;
}
