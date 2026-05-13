import { ApiResponse } from '@/shared/types/api.types';

export type OperationStatus =
  | 'PENDIENTE_VALIDACION'
  | 'INGRESO_PARCIAL'
  | 'VALIDADA'
  | 'RECHAZADA'
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
  operationId: number;
  search: string;
  status: OperationStatus | 'ALL';
  dateFilter: OperationDateFilter | '';
  startDate: string;
  endDate: string;
}

export interface CreateOperationRequest {
  clienteId: number;
  montoTotal: number;
  socioComercialId: number;
  observaciones?: string;
}

export interface UpdateOperationRequest {
  clienteId: number;
  montoTotal: number;
  socioComercialId: number;
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
export interface UpdateOperationPaymentRequest {
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
  cuentaDestinoId: number;
  cuentaDestinoBanco: string;
  cuentaDestinoTitular: string;
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
  clienteId: number;
  clienteNombre: string;
  montoTotal: number;
  montoValidado: number;
  montoRegistrado: number;
  saldoPendiente: number;
  saldoPendientePorRegistrar:number;
  estatus: OperationStatus;
  socioComercialId: number;
  socioComercialNombre: string;
  nivelesRedComercial: number;
  porcentajeComisionAplicado: number;
  porcentajeComisionOficina: number;

  porcentajeComisionRedTotal: number;
  montoComisionRedTotal: number;
  porcentajeComisionOficinaTotal: number;
  montoComisionOficinaTotal: number;
  montoTotalDevolverCliente: number;

  observaciones?: string | null;
  pagos: OperationPaymentResponse[];
  createdAt: string;
  updatedAt: string;
}


export interface CreateReturnPaymentRequest {
  monto: number;
  tipoPago: PaymentType;
  cuentaOrigenId?: number | null;
  cuentaDestinoCliente?: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
}

export interface ReturnPaymentResponse {
  id: number;
  operationId: number;
  monto: number;
  tipoPago: PaymentType;
  cuentaOrigenId?: number | null;
  cuentaOrigenNombre?: string | null;
  cuentaDestinoCliente?: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
  registradoPorId: number;
  registradoPorNombre: string;
  fechaRetorno: string;
  createdAt: string;
}

export type OperationApiResponse = ApiResponse<PaymentOperationResponse>;
export type OperationsPageApiResponse = ApiResponse<PageResponse<PaymentOperationResponse>>;
export type PaymentApiResponse = ApiResponse<OperationPaymentResponse>;
export type ReturnPaymentApiResponse = ApiResponse<ReturnPaymentResponse>;
export type ReturnPaymentsListApiResponse = ApiResponse<ReturnPaymentResponse[]>;