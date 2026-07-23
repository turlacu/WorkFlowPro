'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import type { AssignmentNotification, NotificationPage } from '@/lib/notification-types';

interface NotificationContextValue {
  notifications: AssignmentNotification[];
  unreadCount: number;
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  openNotification: (notification: AssignmentNotification) => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

async function fetchNotificationPage(cursor?: string): Promise<NotificationPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(`/api/notifications${query}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load notifications');
  return response.json();
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<AssignmentNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const knownIds = React.useRef(new Set<string>());
  const liveNotifications = React.useRef(new Map<string, AssignmentNotification>());
  const notificationsRef = React.useRef<AssignmentNotification[]>([]);
  const isOperator =
    session?.user?.role === 'OPERATOR' && !session.user.passwordResetRequired;

  React.useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refresh = React.useCallback(async () => {
    if (!isOperator) return;
    setLoading(true);
    setError(false);
    try {
      const page = await fetchNotificationPage();
      const pageIds = new Set(page.items.map((item) => item.id));
      pageIds.forEach((id) => liveNotifications.current.delete(id));
      const liveItems = [...liveNotifications.current.values()]
        .filter((item) => !pageIds.has(item.id))
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      const mergedItems = [...liveItems, ...page.items];
      knownIds.current = new Set(mergedItems.map((item) => item.id));
      setNotifications(mergedItems);
      setUnreadCount(
        page.unreadCount + liveItems.filter((item) => !item.readAt).length,
      );
      setNextCursor(page.nextCursor);
    } catch (refreshError) {
      console.error('Failed to refresh notifications:', refreshError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isOperator]);

  const markRead = React.useCallback(async (notificationId: string) => {
    const current = notificationsRef.current.find((item) => item.id === notificationId);
    if (!current || current.readAt) return;

    const response = await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    const updated: AssignmentNotification = await response.json();
    if (liveNotifications.current.has(updated.id)) {
      liveNotifications.current.set(updated.id, updated);
    }
    setNotifications((items) => items.map((item) => item.id === updated.id ? updated : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const openNotification = React.useCallback(async (notification: AssignmentNotification) => {
    try {
      await markRead(notification.id);
    } catch (markError) {
      console.error('Failed to mark notification as read:', markError);
    }

    if (!notification.assignmentId) return;
    const date = format(new Date(notification.dueDate), 'yyyy-MM-dd');
    const path = `/assignments?date=${date}&assignment=${notification.assignmentId}`;
    if (window.location.pathname === '/assignments') {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new CustomEvent('workflowpro:open-assignment', {
        detail: { assignmentId: notification.assignmentId, date },
      }));
    } else {
      router.push(path);
    }
  }, [markRead, router]);

  const loadMore = React.useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(false);
    try {
      const page = await fetchNotificationPage(nextCursor);
      page.items.forEach((item) => knownIds.current.add(item.id));
      setNotifications((items) => [
        ...items,
        ...page.items.filter((item) => !items.some((current) => current.id === item.id)),
      ]);
      setUnreadCount(page.unreadCount);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      console.error('Failed to load more notifications:', loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor]);

  const markAllRead = React.useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to mark notifications as read');
      const readAt = new Date().toISOString();
      liveNotifications.current.forEach((item, id) => {
        if (!item.readAt) liveNotifications.current.set(id, { ...item, readAt });
      });
      setNotifications((items) => items.map((item) => item.readAt ? item : { ...item, readAt }));
      setUnreadCount(0);
    } catch (markError) {
      console.error('Failed to mark all notifications as read:', markError);
      setError(true);
    }
  }, []);

  React.useEffect(() => {
    if (!isOperator) {
      knownIds.current.clear();
      liveNotifications.current.clear();
      setNotifications([]);
      setUnreadCount(0);
      setNextCursor(null);
      return;
    }

    void refresh();
    const source = new EventSource('/api/notifications/stream');
    const handleConnected = () => void refresh();
    const handleNotification = (message: MessageEvent<string>) => {
      try {
        const notification = JSON.parse(message.data) as AssignmentNotification;
        if (knownIds.current.has(notification.id)) return;
        knownIds.current.add(notification.id);
        liveNotifications.current.set(notification.id, notification);
        setNotifications((items) => [notification, ...items]);
        setUnreadCount((count) => count + 1);

        const dueDate = new Intl.DateTimeFormat(currentLang === 'ro' ? 'ro-RO' : 'en-US', {
          dateStyle: 'medium',
        }).format(new Date(notification.dueDate));
        toast({
          title: getTranslation(currentLang, 'NewAssignmentNotification'),
          description: getTranslation(currentLang, 'AssignmentNotificationDescription', {
            assignmentName: notification.assignmentName,
            actorName: notification.actor.name,
            dueDate,
          }),
          action: (
            <ToastAction
              altText={getTranslation(currentLang, 'ViewAssignment')}
              onClick={() => void openNotification(notification)}
            >
              {getTranslation(currentLang, 'View')}
            </ToastAction>
          ),
        });
      } catch (parseError) {
        console.error('Invalid realtime notification:', parseError);
      }
    };

    source.addEventListener('connected', handleConnected);
    source.addEventListener('notification', handleNotification as EventListener);
    return () => {
      source.removeEventListener('connected', handleConnected);
      source.removeEventListener('notification', handleNotification as EventListener);
      source.close();
    };
  }, [currentLang, isOperator, openNotification, refresh, toast]);

  const value = React.useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    hasMore: Boolean(nextCursor),
    refresh,
    loadMore,
    markRead,
    markAllRead,
    openNotification,
  }), [
    notifications,
    unreadCount,
    loading,
    error,
    nextCursor,
    refresh,
    loadMore,
    markRead,
    markAllRead,
    openNotification,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
