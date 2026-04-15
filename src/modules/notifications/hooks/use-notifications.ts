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

interface UseNotificationsOptions {
  limit?: number;
  enabled?: boolean;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const limit = options?.limit ?? 10;
  const enabled = options?.enabled ?? true;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setIsLoading(true);

      const [latest, unread] = await Promise.all([
        getLatestNotifications(limit),
        getUnreadNotificationsCount(),
      ]);

      setNotifications(latest);
      setUnreadCount(unread.unreadCount);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, loadNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.leida),
    [notifications],
  );

  const submitMarkAsRead = useCallback(
    async (userNotificationId: number) => {
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
    },
    [],
  );

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
    loadNotifications,
    submitMarkAsRead,
    submitMarkAllAsRead,
  };
}