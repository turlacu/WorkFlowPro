import 'server-only';
import { Client } from 'pg';
import { ASSIGNMENT_CHANNEL, parseAssignmentEvent, type AssignmentEvent } from './assignment-events';

class AssignmentBroker {
  private subscribers = new Set<(event: AssignmentEvent) => void>();
  private client: Client | null = null;
  private connecting = false;
  private retry: ReturnType<typeof setTimeout> | undefined;

  subscribe(callback: (event: AssignmentEvent) => void) {
    this.subscribers.add(callback);
    if (this.client) callback({ type: 'reset' });
    else void this.connect();
    return () => {
      this.subscribers.delete(callback);
      if (!this.subscribers.size) {
        clearTimeout(this.retry);
        this.retry = undefined;
        const client = this.client;
        this.client = null;
        void client?.end().catch(() => undefined);
      }
    };
  }

  private broadcast(event: AssignmentEvent) {
    for (const callback of this.subscribers) callback(event);
  }

  private async connect() {
    if (this.client || this.connecting || !this.subscribers.size) return;
    this.connecting = true;
    const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000,
      application_name: 'workflowpro-assignments' });
    const reconnect = () => {
      if (this.client === client) this.client = null;
      void client.end().catch(() => undefined);
      if (!this.retry && this.subscribers.size) {
        this.retry = setTimeout(() => {
          this.retry = undefined;
          void this.connect();
        }, 5_000);
        this.retry.unref?.();
      }
    };
    client.on('error', reconnect);
    client.on('end', () => { if (this.client === client) reconnect(); });
    client.on('notification', (message) => {
      if (message.channel !== ASSIGNMENT_CHANNEL || !message.payload) return;
      try {
        const event = parseAssignmentEvent(JSON.parse(message.payload));
        if (event) this.broadcast(event);
      } catch { /* Ignore malformed messages. */ }
    });
    try {
      await client.connect();
      await client.query(`LISTEN ${ASSIGNMENT_CHANNEL}`);
      if (!this.subscribers.size) await client.end();
      else {
        this.client = client;
        // Covers changes missed during startup or a database connection outage.
        this.broadcast({ type: 'reset' });
      }
    } catch (error) {
      console.error('Assignment listener connection failed:', error);
      reconnect();
    } finally {
      this.connecting = false;
    }
  }
}

const shared = globalThis as typeof globalThis & { assignmentBroker?: AssignmentBroker };
export const assignmentBroker = shared.assignmentBroker ??= new AssignmentBroker();
