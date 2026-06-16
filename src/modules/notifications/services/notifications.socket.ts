import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import type {
  NotificationResponse,
  UnreadCountResponse,
} from '@/modules/notifications/types/notifications.types';
import { env } from '@/shared/lib/env';

interface ConnectNotificationsSocketParams {
  token: string;
  userId: number;
  onNotification: (notification: NotificationResponse) => void;
  onUnreadCount: (payload: UnreadCountResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
}

class NotificationsSocketService {
  private client: Client | null = null;
  private isConnecting = false;
  private notificationSubscription: StompSubscription | null = null;
  private unreadCountSubscription: StompSubscription | null = null;

  connect({
    token,
    userId,
    onNotification,
    onUnreadCount,
    onConnect,
    onDisconnect,
    onError,
  }: ConnectNotificationsSocketParams) {
    if (this.client?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const brokerURL = `${this.getWsBaseUrl()}/ws`;

    this.client = new Client({
      brokerURL,
      reconnectDelay: 1000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => { },

      onConnect: () => {
        this.isConnecting = false;
        this.clearSubscriptions();

        console.log('[WS CONNECTED]');
        console.log('[WS] client connected?', this.client?.connected);

        this.notificationSubscription =
          this.client?.subscribe(`/topic/users/${userId}/notifications`, (message: IMessage) => {
            console.log('[WS RAW NOTIFICATION]', message.body);

            try {
              const notification = JSON.parse(message.body) as NotificationResponse;
              onNotification(notification);
            } catch (error) {
              console.error('[WS] Error parseando notification', error);
              onError?.(error);
            }
          }) ?? null;

        console.log(
          '[WS] notification subscription created?',
          Boolean(this.notificationSubscription),
        );

        this.unreadCountSubscription =
          this.client?.subscribe(
            `/topic/users/${userId}/notifications/unread-count`,
            (message: IMessage) => {
              console.log('[WS RAW UNREAD COUNT]', message.body);

              try {
                const unreadCount = JSON.parse(message.body) as UnreadCountResponse;
                onUnreadCount(unreadCount);
              } catch (error) {
                console.error('[WS] Error parseando unread-count', error);
                onError?.(error);
              }
            },
          ) ?? null;

        console.log(
          '[WS] unread subscription created?',
          Boolean(this.unreadCountSubscription),
        );

        onConnect?.();
      },

      onDisconnect: () => {
        this.isConnecting = false;
        this.clearSubscriptions();
        onDisconnect?.();
      },

      onStompError: (frame) => {
        this.isConnecting = false;
        onError?.(frame);
      },

      onWebSocketError: (event) => {
        this.isConnecting = false;
        onError?.(event);
      },

      onWebSocketClose: () => {
        this.isConnecting = false;
        this.clearSubscriptions();
      },
    });

    this.client.activate();
  }

  async disconnect() {
    this.isConnecting = false;
    this.clearSubscriptions();

    if (!this.client) {
      return;
    }

    const currentClient = this.client;
    this.client = null;

    await currentClient.deactivate();
  }

  private clearSubscriptions() {
    this.notificationSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();

    this.notificationSubscription = null;
    this.unreadCountSubscription = null;
  }

  private getWsBaseUrl() {
    const apiUrl = env.apiUrl;

    if (!apiUrl) {
      return 'ws://localhost:8080';
    }

    const normalizedApiUrl = apiUrl.replace(/\/api\/?$/, '');

    if (normalizedApiUrl.startsWith('https://')) {
      return normalizedApiUrl.replace('https://', 'wss://');
    }

    if (normalizedApiUrl.startsWith('http://')) {
      return normalizedApiUrl.replace('http://', 'ws://');
    }

    return normalizedApiUrl;
  }
}

export const notificationsSocketService = new NotificationsSocketService();