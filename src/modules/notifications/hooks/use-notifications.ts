import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getLatestNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/modules/notifications/api/notifications.api';
import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { useAuth } from '@/modules/auth/store/auth.context';
import { notificationsSocketService } from '@/modules/notifications/services/notifications.socket';

interface UseNotificationsOptions {
  limit?: number;
  enabled?: boolean;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const limit = options?.limit ?? 10;
  const enabled = options?.enabled ?? true;

  const { token, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!enabled || !isAuthenticated) {
      console.log('[HOOK]', new Date().toISOString(), 'loadNotifications cancelado', {
        enabled,
        isAuthenticated,
      });
      return;
    }

    try {
      console.log('[HOOK]', new Date().toISOString(), 'Cargando notificaciones por REST...');
      setIsLoading(true);

      const [latest, unread] = await Promise.all([
        getLatestNotifications(limit),
        getUnreadNotificationsCount(),
      ]);

      console.log('[HOOK]', new Date().toISOString(), 'REST latest notifications:', latest);
      console.log('[HOOK]', new Date().toISOString(), 'REST unread count:', unread);

      setNotifications(latest);
      setUnreadCount(unread.unreadCount);
    } catch (error) {
      console.error('[HOOK]', new Date().toISOString(), 'Error cargando notificaciones por REST:', error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isAuthenticated, limit]);

  useEffect(() => {
    console.log('[HOOK]', new Date().toISOString(), 'Primer useEffect -> loadNotifications');
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    console.log('[HOOK]', new Date().toISOString(), 'Evaluando conexión socket...', {
      enabled,
      isAuthenticated,
      hasToken: Boolean(token),
      limit,
    });

    if (!enabled || !isAuthenticated || !token) {
      console.log('[HOOK]', new Date().toISOString(), 'No se conectará socket, desconectando...');
      notificationsSocketService.disconnect();
      return;
    }

    notificationsSocketService.connect({
      token,
      onNotification: (incomingNotification) => {
        console.log('[HOOK]', new Date().toISOString(), '🔔 Llegó por WebSocket:', incomingNotification);

        setNotifications((current) => {
          const alreadyExists = current.some(
            (notification) => notification.id === incomingNotification.id,
          );

          console.log('[HOOK]', new Date().toISOString(), 'Procesando notificación WS', {
            incomingId: incomingNotification.id,
            alreadyExists,
            currentLength: current.length,
          });

          if (alreadyExists) {
            return current.map((notification) =>
              notification.id === incomingNotification.id
                ? incomingNotification
                : notification,
            );
          }

          return [incomingNotification, ...current].slice(0, limit);
        });
      },
      onUnreadCount: (payload) => {
        console.log('[HOOK]', new Date().toISOString(), '🔢 Unread count recibido por WebSocket:', payload);
        setUnreadCount(payload.unreadCount);
      },
      onConnect: () => {
        console.log('[HOOK]', new Date().toISOString(), '✅ Socket conectado, recargando notificaciones...');
        void loadNotifications();
      },
      onError: (error) => {
        console.error('[HOOK]', new Date().toISOString(), '❌ Error en socket de notificaciones:', error);
      },
    });

    return () => {
      console.log('[HOOK]', new Date().toISOString(), 'Cleanup del effect: desconectando socket');
      notificationsSocketService.disconnect();
    };
  }, [enabled, isAuthenticated, token, limit, loadNotifications]);

  const unreadNotifications = useMemo(() => {
    const result = notifications.filter((notification) => !notification.leida);
    console.log('[HOOK]', new Date().toISOString(), 'Calculando unreadNotifications', {
      total: notifications.length,
      unread: result.length,
    });
    return result;
  }, [notifications]);

  const submitMarkAsRead = useCallback(
    async (userNotificationId: number) => {
      try {
        console.log('[HOOK]', new Date().toISOString(), 'Marcando como leída:', userNotificationId);
        setProcessingNotificationId(userNotificationId);

        const updated = await markNotificationAsRead(userNotificationId);
        console.log('[HOOK]', new Date().toISOString(), 'Respuesta markAsRead:', updated);

        setNotifications((current) =>
          current.map((notification) =>
            notification.id === userNotificationId ? updated : notification,
          ),
        );

        setUnreadCount((current) => Math.max(current - 1, 0));
      } catch (error) {
        console.error('[HOOK]', new Date().toISOString(), 'Error en markAsRead:', error);
        toast.error(getApiErrorMessage(error));
        throw error;
      } finally {
        setProcessingNotificationId(null);
      }
    },
    [],
  );

  const submitMarkAllAsRead = useCallback(async () => {
    try {
      console.log('[HOOK]', new Date().toISOString(), 'Marcando todas como leídas...');
      setIsMarkingAllAsRead(true);

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          leida: true,
          readAt: notification.readAt ?? new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('[HOOK]', new Date().toISOString(), 'Error en markAllAsRead:', error);
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsMarkingAllAsRead(false);
    }
  }, []);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    isMarkingAllAsRead,
    processingNotificationId,
    loadNotifications,
    submitMarkAsRead,
    submitMarkAllAsRead,
  };
}