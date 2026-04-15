import { ApiResponse } from '@/shared/types/api.types';

export type NotificationType =
  | 'OPERATION_CREATED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VALIDATED'
  | 'PAYMENT_REJECTED'
  | 'OPERATION_STATUS_CHANGED'
  | 'SYSTEM_ALERT';

export type NotificationModule =
  | 'OPERACIONES'
  | 'PAGOS'
  | 'SISTEMA';

export type NotificationReferenceType =
  | 'PAYMENT_OPERATION'
  | 'OPERATION_PAYMENT'
  | 'NONE';

export type NotificationPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export interface NotificationResponse {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  modulo: NotificationModule;
  referenceType: NotificationReferenceType;
  referenceId?: number | null;
  actionUrl?: string | null;
  prioridad: NotificationPriority;
  leida: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export type NotificationsApiResponse = ApiResponse<NotificationResponse[]>;
export type NotificationApiResponse = ApiResponse<NotificationResponse>;
export type UnreadCountApiResponse = ApiResponse<UnreadCountResponse>;