import { useEffect, useRef } from 'react';
import { NOTIFICATION_RECEIVED_EVENT } from '@/modules/notifications/services/notification-events';
import type { NotificationResponse, NotificationType } from '@/modules/notifications/types/notifications.types';

/**
 * Ejecuta `handler` cada vez que llega en tiempo real una notificación de alguno de los tipos
 * indicados. El handler puede cambiar en cada render: siempre se llama la versión más reciente.
 */
export function useNotificationReceived(
  types: readonly NotificationType[],
  handler: (notification: NotificationResponse) => void,
) {
  const handlerRef = useRef(handler);
  const typesKey = types.join(',');

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const accepted = new Set(typesKey.split(','));
    const listener = (event: Event) => {
      const notification = (event as CustomEvent<NotificationResponse>).detail;
      if (notification && accepted.has(notification.tipo)) handlerRef.current(notification);
    };
    window.addEventListener(NOTIFICATION_RECEIVED_EVENT, listener);
    return () => window.removeEventListener(NOTIFICATION_RECEIVED_EVENT, listener);
  }, [typesKey]);
}
