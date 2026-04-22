import { Client, IMessage } from '@stomp/stompjs';
import type {
  NotificationResponse,
  UnreadCountResponse,
} from '@/modules/notifications/types/notifications.types';
import { env } from '@/shared/lib/env';

interface ConnectNotificationsSocketParams {
  token: string;
  onNotification: (notification: NotificationResponse) => void;
  onUnreadCount: (payload: UnreadCountResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
}

class NotificationsSocketService {
  private client: Client | null = null;
  private isConnecting = false;

  connect({
    token,
    onNotification,
    onUnreadCount,
    onConnect,
    onDisconnect,
    onError,
  }: ConnectNotificationsSocketParams) {
    if (this.client?.active || this.isConnecting) {
      console.log('[WS] Ya existe una conexión activa o en proceso', {
        hasClient: Boolean(this.client),
        isActive: this.client?.active,
        isConnecting: this.isConnecting,
        });
      return;
    }

    this.isConnecting = true;

    const brokerURL = `${this.getWsBaseUrl()}/ws`;
    console.log('[WS]', new Date().toISOString(), 'Intentando conectar a:', brokerURL);
    console.log('[WS] Heartbeat config:', {
        incoming: 10000,
        outgoing: 10000,
    });

    this.client = new Client({
        brokerURL,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
      debug: (message) => {
        console.log('[STOMP]', message);
      },
      onConnect: () => {
        console.log('[WS]', new Date().toISOString(), '✅ STOMP conectado');
        this.isConnecting = false;

        console.log('[WS] Suscribiendo a /user/queue/notifications');
        this.client?.subscribe('/user/queue/notifications', (message: IMessage) => {
        console.log('[WS]', new Date().toISOString(), '📩 Mensaje notifications:', message.body);

        try {
            const notification = JSON.parse(message.body) as NotificationResponse;
            onNotification(notification);
        } catch (error) {
            console.error('[WS] Error parseando notification', error);
            onError?.(error);
        }
        });

        console.log('[WS] Suscribiendo a /user/queue/notifications/unread-count');
        this.client?.subscribe('/user/queue/notifications/unread-count', (message: IMessage) => {
        console.log('[WS]', new Date().toISOString(), '📩 Mensaje unread-count:', message.body);

        try {
            const unreadCount = JSON.parse(message.body) as UnreadCountResponse;
            onUnreadCount(unreadCount);
        } catch (error) {
            console.error('[WS] Error parseando unread-count', error);
            onError?.(error);
        }
        });
        onConnect?.();
      },
      onDisconnect: () => {
        console.log('[WS]', new Date().toISOString(), '🔌 STOMP desconectado');
        this.isConnecting = false;
        onDisconnect?.();
      },
      onStompError: (frame) => {
        console.error('[WS]', new Date().toISOString(), '❌ STOMP error:', frame.headers['message']);
        console.error('[WS] ❌ STOMP details:', frame.body);
        this.isConnecting = false;
        onError?.(frame);
      },
      onWebSocketError: (event) => {
        console.error('[WS] ❌ WebSocket error:', event);
        this.isConnecting = false;
        onError?.(event);
      },
      onWebSocketClose: (event) => {
        console.log('[WS]', new Date().toISOString(), 'WebSocket cerrado:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
        });
        this.isConnecting = false;
      },
    });
    console.log('[WS] Activando cliente STOMP...');
    this.client.activate();
  }

  disconnect() {
    this.isConnecting = false;

    if (this.client) {
      console.log('[WS]', new Date().toISOString(), 'Cerrando conexión manualmente');
      void this.client.deactivate();
      this.client = null;
    }
  }

  private getWsBaseUrl() {
    const apiUrl = env.apiUrl;
    console.log('[WS] env.apiUrl =', apiUrl);

    if (!apiUrl) {
      return 'ws://localhost:8080';
    }

    // quita /api al final si existe
    const normalizedApiUrl = apiUrl.replace(/\/api\/?$/, '');
    console.log('[WS] normalizedApiUrl =', normalizedApiUrl);

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