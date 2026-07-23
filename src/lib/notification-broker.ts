import 'server-only';

import { Client } from 'pg';
import { NOTIFICATION_CHANNEL } from '@/lib/notification-types';

interface PublishedNotification {
  notificationId: string;
  recipientId: string;
}

type Subscriber = (notificationId: string) => void;

class NotificationBroker {
  private client: Client | null = null;
  private connecting: Promise<void> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers = new Map<string, Set<Subscriber>>();

  subscribe(recipientId: string, subscriber: Subscriber) {
    const subscribers = this.subscribers.get(recipientId) ?? new Set<Subscriber>();
    subscribers.add(subscriber);
    this.subscribers.set(recipientId, subscribers);
    void this.ensureConnected();

    return () => {
      const current = this.subscribers.get(recipientId);
      current?.delete(subscriber);
      if (current?.size === 0) this.subscribers.delete(recipientId);
    };
  }

  private async ensureConnected() {
    if (this.client || this.connecting || this.subscribers.size === 0) return;
    this.connecting = this.connect();
    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  private async connect() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('Notification listener cannot start without DATABASE_URL');
      return;
    }

    const client = new Client({
      connectionString,
      application_name: 'workflowpro-notifications',
    });

    client.on('notification', (message) => {
      if (message.channel !== NOTIFICATION_CHANNEL || !message.payload) return;
      try {
        const payload = JSON.parse(message.payload) as PublishedNotification;
        if (!payload.notificationId || !payload.recipientId) return;
        this.subscribers
          .get(payload.recipientId)
          ?.forEach((subscriber) => subscriber(payload.notificationId));
      } catch (error) {
        console.error('Invalid notification event payload:', error);
      }
    });
    client.on('error', (error) => {
      console.error('PostgreSQL notification listener error:', error);
      this.resetClient(client);
    });
    client.on('end', () => this.resetClient(client));

    try {
      await client.connect();
      await client.query(`LISTEN ${NOTIFICATION_CHANNEL}`);
      this.client = client;
    } catch (error) {
      console.error('Failed to connect PostgreSQL notification listener:', error);
      await client.end().catch(() => undefined);
      this.scheduleReconnect();
    }
  }

  private resetClient(client: Client) {
    if (this.client !== client) return;
    this.client = null;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.retryTimer || this.subscribers.size === 0) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.ensureConnected();
    }, 5_000);
    this.retryTimer.unref?.();
  }
}

const globalForNotificationBroker = globalThis as typeof globalThis & {
  workflowproNotificationBroker?: NotificationBroker;
};

export const notificationBroker =
  globalForNotificationBroker.workflowproNotificationBroker ?? new NotificationBroker();

if (process.env.NODE_ENV !== 'production') {
  globalForNotificationBroker.workflowproNotificationBroker = notificationBroker;
}
