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

export type OperationDateFilter =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface OperationsFilters {
  search: string;
  status: OperationStatus | 'ALL';
  dateFilter: OperationDateFilter | '';
  startDate: string;
  endDate: string;
}

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
export type OperationsPageApiResponse = ApiResponse<PageResponse<PaymentOperationResponse>>;
export type PaymentApiResponse = ApiResponse<OperationPaymentResponse>;