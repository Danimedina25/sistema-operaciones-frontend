import { ApiResponse } from '@/shared/types/api.types';

export type NotificationType =
  | 'OPERATION_CREATED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VALIDATED'
  | 'PAYMENT_REJECTED'
  | 'OPERATION_STATUS_CHANGED'
  | 'COMMISSION_PAID'
  | 'CASH_RETURN_REQUESTED'
  // Parcialidades de retorno
  | 'RETURN_INSTALLMENT_SCHEDULED'
  | 'RETURN_INSTALLMENT_CODE_AVAILABLE'
  | 'RETURN_INSTALLMENT_DELIVERED'
  | 'RETURN_INSTALLMENT_COMPLETED'
  | 'RETURN_INSTALLMENT_CANCELLED'
  | 'RETURN_REQUEST_COMPLETED'
  | 'SYSTEM_ALERT';

export type NotificationModule =
  | 'OPERACIONES'
  | 'PAGOS'
  | 'COMISIONES'
  | 'SISTEMA';

export type NotificationReferenceType =
  | 'PAYMENT_OPERATION'
  | 'OPERATION_PAYMENT'
  | 'COMMISSION'
  | 'RETURN_PAYMENT'
  | 'RETURN_INSTALLMENT'
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