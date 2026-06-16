import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const { token, isAuthenticated, user } = useAuth();

  const limitRef = useRef(limit);

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [processingNotificationId, setProcessingNotificationId] =
    useState<number | null>(null);
  const [lastIncomingNotification, setLastIncomingNotification] =
    useState<NotificationResponse | null>(null);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  const loadNotifications = useCallback(async () => {
    if (!enabled || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [latest, unread] = await Promise.all([
        getLatestNotifications(limitRef.current),
        getUnreadNotificationsCount(),
      ]);

      setNotifications(latest);
      setUnreadCount(unread.unreadCount);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isAuthenticated]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !token || !user?.userId) {
      void notificationsSocketService.disconnect();
      return;
    }

    notificationsSocketService.connect({
      token,
      userId: user?.userId,
      onNotification: (incomingNotification) => {
        console.log('[WS RECEIVED NOTIFICATION]', incomingNotification);

        setLastIncomingNotification(incomingNotification);

        setNotifications((current) => {
          const alreadyExists = current.some(
            (notification) => notification.id === incomingNotification.id,
          );

          if (alreadyExists) {
            return current.map((notification) =>
              notification.id === incomingNotification.id
                ? incomingNotification
                : notification,
            );
          }

          return [incomingNotification, ...current].slice(0, limitRef.current);
        });
      },
      onUnreadCount: (payload) => {
        console.log('[WS RECEIVED UNREAD COUNT]', payload);
        setUnreadCount(payload.unreadCount);
      },
      onConnect: () => {
        console.log('[WS CONNECTED]');
      },
      onError: (error) => {
        console.error('[WS ERROR]', error);
      },
    });

    return () => {
      void notificationsSocketService.disconnect();
    };
  }, [enabled, isAuthenticated, token, user?.userId]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((notification) => !notification.leida);
  }, [notifications]);

  const submitMarkAsRead = useCallback(async (userNotificationId: number) => {
    try {
      setProcessingNotificationId(userNotificationId);

      const updated = await markNotificationAsRead(userNotificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === userNotificationId ? updated : notification,
        ),
      );

      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setProcessingNotificationId(null);
    }
  }, []);

  const submitMarkAllAsRead = useCallback(async () => {
    try {
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
    lastIncomingNotification,
    setLastIncomingNotification,
    loadNotifications,
    submitMarkAsRead,
    submitMarkAllAsRead,
  };
}