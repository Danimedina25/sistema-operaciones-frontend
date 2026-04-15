import { ApiResponse } from '@/shared/types/api.types';

export type OperationStatus =
  | 'PENDIENTE_VALIDACION'
  | 'PAGO_PARCIAL'
  | 'VALIDADA'
  | 'RECHAZADA'
  | 'FACTURADA'
  | 'RETORNO_PENDIENTE'
  | 'RETORNO_PARCIAL'
  | 'COMPLETADA';

export type PaymentStatus =
  | 'PENDIENTE_VALIDACION'
  | 'VALIDADA'
  | 'RECHAZADA';

export type PaymentType =
  | 'TRANSFERENCIA'
  | 'DEPOSITO'
  | 'EFECTIVO';

export interface CreateOperationRequest {
  clienteNombre: string;
  montoTotal: number;
  socioComercialId: number;
  nivelesRedComercial: number;
  observaciones?: string;
}

export interface AddPaymentRequest {
  operacionId: number;
  monto: number;
  tipoPago: PaymentType;
  cuentaDestinoId: number;
  comprobanteUrl: string;
  observaciones?: string;
}

export interface UpdatePaymentStatusRequest {
  observaciones?: string;
}

export interface OperationPaymentResponse {
  id: number;
  monto: number;
  tipoPago: PaymentType;
  comprobanteUrl: string;
  estatus: PaymentStatus;
  observaciones?: string | null;
  registradoPorId: number;
  registradoPorNombre: string;
  validadoPorId?: number | null;
  validadoPorNombre?: string | null;
  fechaPago: string;
  fechaValidacion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOperationResponse {
  id: number;
  clienteNombre: string;
  montoTotal: number;
  montoValidado: number;
  saldoPendiente: number;
  estatus: OperationStatus;
  cuentaDestinoId: number;
  cuentaDestinoBanco: string;
  socioComercialId: number;
  socioComercialNombre: string;
  nivelesRedComercial: number;
  porcentajeComisionAplicado: number;
  observaciones?: string | null;
  pagos: OperationPaymentResponse[];
  createdAt: string;
  updatedAt: string;
}

export type OperationApiResponse = ApiResponse<PaymentOperationResponse>;
export type OperationsListApiResponse = ApiResponse<PaymentOperationResponse[]>;
export type PaymentApiResponse = ApiResponse<OperationPaymentResponse>;