import { api } from '@/shared/lib/axios';
import type {
  NotificationApiResponse,
  NotificationResponse,
  NotificationsApiResponse,
  UnreadCountApiResponse,
  UnreadCountResponse,
} from '@/modules/notifications/types/notifications.types';

const NOTIFICATIONS_BASE_PATH = '/api/notifications';

export async function getMyNotifications(): Promise<NotificationResponse[]> {
  const response = await api.get<NotificationsApiResponse>(NOTIFICATIONS_BASE_PATH);
  return response.data.data;
}

export async function getLatestNotifications(
  limit = 10,
): Promise<NotificationResponse[]> {
  const response = await api.get<NotificationsApiResponse>(
    `${NOTIFICATIONS_BASE_PATH}/latest`,
    {
      params: { limit },
    },
  );
  return response.data.data;
}

export async function getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
  const response = await api.get<UnreadCountApiResponse>(
    `${NOTIFICATIONS_BASE_PATH}/unread-count`,
  );
  return response.data.data;
}

export async function markNotificationAsRead(
  userNotificationId: number,
): Promise<NotificationResponse> {
  const response = await api.patch<NotificationApiResponse>(
    `${NOTIFICATIONS_BASE_PATH}/${userNotificationId}/read`,
  );
  return response.data.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch(`${NOTIFICATIONS_BASE_PATH}/read-all`);
}