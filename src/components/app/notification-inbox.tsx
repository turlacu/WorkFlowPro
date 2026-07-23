'use client';

import * as React from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { enUS, ro } from 'date-fns/locale';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';

export function NotificationInbox() {
  const { data: session } = useSession();
  const { currentLang } = useLanguage();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    markAllRead,
    openNotification,
  } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const locale = currentLang === 'ro' ? ro : enUS;

  if (session?.user?.role !== 'OPERATOR') return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={getTranslation(currentLang, 'NotificationsWithUnread', {
            count: unreadCount.toString(),
          })}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-bold leading-none text-destructive-foreground"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-1rem)] max-w-md p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">{getTranslation(currentLang, 'Notifications')}</h2>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {getTranslation(currentLang, 'UnreadNotifications', { count: unreadCount.toString() })}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-10 gap-2"
              onClick={() => void markAllRead()}
            >
              <CheckCheck className="h-4 w-4" />
              {getTranslation(currentLang, 'MarkAllRead')}
            </Button>
          )}
        </div>

        <div className="max-h-[min(65vh,28rem)] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
              {getTranslation(currentLang, 'Loading')}
            </div>
          ) : error && notifications.length === 0 ? (
            <div className="space-y-3 px-4 py-8 text-center" role="alert">
              <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'LoadFailed')}</p>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                {getTranslation(currentLang, 'Retry')}
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Bell className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">{getTranslation(currentLang, 'NoNotifications')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{getTranslation(currentLang, 'NoNotificationsDescription')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={cn(
                    'relative block w-full px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    !notification.readAt && 'bg-primary/[0.06]',
                    !notification.assignmentId && 'cursor-default',
                  )}
                  onClick={() => {
                    setOpen(false);
                    void openNotification(notification);
                  }}
                >
                  {!notification.readAt && (
                    <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  )}
                  <span className="block truncate text-sm font-medium">{notification.assignmentName}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {getTranslation(currentLang, 'AssignedBy', { actorName: notification.actor.name })}
                    {' · '}
                    {getTranslation(currentLang, 'DueDateShort', {
                      date: format(new Date(notification.dueDate), 'PP', { locale }),
                    })}
                  </span>
                  <span className="mt-1 block text-[0.6875rem] text-muted-foreground">
                    {notification.assignmentId
                      ? format(new Date(notification.createdAt), 'PPp', { locale })
                      : getTranslation(currentLang, 'AssignmentUnavailable')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {hasMore && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={loading}
              onClick={() => void loadMore()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getTranslation(currentLang, 'LoadMore')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
