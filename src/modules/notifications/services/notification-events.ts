import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';

/**
 * Cada notificación que llega por WebSocket se vuelve a publicar como evento de la ventana,
 * para que una pantalla abierta refresque sus datos sin depender de la campana. Mismo patrón
 * que `cheque-updated`.
 */
export const NOTIFICATION_RECEIVED_EVENT = 'notification-received';

export function emitNotificationReceived(notification: NotificationResponse) {
  window.dispatchEvent(new CustomEvent<NotificationResponse>(NOTIFICATION_RECEIVED_EVENT, { detail: notification }));
}
