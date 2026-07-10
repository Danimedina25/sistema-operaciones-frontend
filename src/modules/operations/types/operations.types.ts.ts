import { ApiResponse } from '@/shared/types/api.types';

export type OperationStatus =
  | 'PENDIENTE_VALIDACION'
  | 'INGRESO_PARCIAL'
  | 'VALIDADA'
  | 'RECHAZADA'
  | 'RETORNO_PARCIAL_SOLICITADO'
  | 'RETORNO_TOTAL_SOLICITADO'
  | 'RETORNO_PARCIAL_ENTREGADO'
  | 'RETORNADA'
  | 'COMPLETADA';

export type PaymentStatus =
  | 'PENDIENTE_VALIDACION'
  | 'VALIDADA'
  | 'RECHAZADA';

export type ReturnPaymentStatus =
  | 'SOLICITADO'
  | 'RETORNADO';

export type PaymentType =
  | 'TRANSFERENCIA'
  | 'DEPOSITO'
  | 'EFECTIVO'
  | 'CHEQUE'
  | 'RETIRO_SIN_TARJETA';

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

export type OperationActivoFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface OperationsFilters {
  operationId: number;
  search: string;
  status: OperationStatus | 'ALL';
  dateFilter: OperationDateFilter | '';
  startDate: string;
  endDate: string;
  activo: OperationActivoFilter;
}

export interface CreateOperationRequest {
  clienteId: number;
  montoTotal: number;

  socioComercialId: number;

  socioComercialNivel2Id?: number | null;
  socioComercialNivel3Id?: number | null;
  nivelesRedComercial: number;

  observaciones?: string;
}

export interface UpdateOperationRequest {
  clienteId: number;
  montoTotal: number;

  socioComercialId: number;

  socioComercialNivel2Id?: number | null;
  socioComercialNivel3Id?: number | null;
  nivelesRedComercial: number;

  observaciones?: string;
}

export interface AddPaymentRequest {
  operacionId: number;
  monto: number;
  tipoPago: PaymentType;
  cuentaDestinoId: number | undefined | null;
  fechaComprobante: string;
  comprobanteUrl: string;
  observaciones?: string;
}
export interface UpdateOperationPaymentRequest {
  monto: number;
  tipoPago: PaymentType;
  cuentaDestinoId: number;
  fechaComprobante: string;
  comprobanteUrl: string;
  observaciones?: string;
}
export interface UpdatePaymentStatusRequest {
  observaciones?: string;
  comprobanteValidacionUrl?: string
}

export interface OperationPaymentResponse {
  id: number;
  monto: number;
  tipoPago: PaymentType;
  comprobanteUrl: string;
  comprobanteValidacionUrl: string;
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
  fechaComprobante?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOperationResponse {
  id: number;
  activo: boolean;
  clienteId: number;
  clienteNombre: string;

  montoTotal: number;
  montoValidado: number;
  montoRegistrado: number;

  saldoPendientePorValidar: number;
  saldoPendientePorRegistrar: number;

  estatus: OperationStatus;

  socioComercialId: number;
  socioComercialNombre: string;

  socioComercialNivel2Id?: number | null;
  socioComercialNivel2Nombre?: string | null;

  socioComercialNivel3Id?: number | null;
  socioComercialNivel3Nombre?: string | null;

  nivelesRedComercial: number;

  porcentajeComisionAplicado: number;
  porcentajeComisionOficina: number;

  porcentajeComisionRedTotal: number;
  montoComisionRedTotal: number;

  porcentajeComisionOficinaTotal: number;
  montoComisionOficinaTotal: number;

  montoTotalDevolverCliente: number;

  // NUEVOS CAMPOS
  montoSolicitadoRetorno: number;
  montoRetornado: number;
  saldoPendienteRetornar: number;

  numeroRetornosSolicitados: number;

  observaciones?: string | null;

  pagos: OperationPaymentResponse[];

  createdAt: string;
  updatedAt: string;

  contieneRetornosEnEfectivo: boolean;
  contieneRetornosRetiroSinTarjeta: boolean;
  contieneRetornosEnTransferencia: boolean;
}


export interface CreateReturnPaymentItemRequest {
  monto: number;
  tipoPago: PaymentType;
  banco?: string | null;
  titular?: string | null;
  cuenta?: string | null;
  clabe?: string | null;
  observaciones?: string | null;
  autorizadoParaRecibirEfectivo1?: string;
  autorizadoParaRecibirEfectivo2?: string;
  autorizadoParaRecibirEfectivo3?: string;
}

export interface CreateReturnPaymentRequest {
  pagos: CreateReturnPaymentItemRequest[];
}

export type UpdateReturnPaymentRequest =
  CreateReturnPaymentItemRequest;

export interface RealizeReturnPaymentRequest {
  cuentaOrigenId?: number | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
}

export interface ScheduleCashReturnPickupRequest {
  fechaHoraRecoleccionEfectivo: string;
  cuentaOrigenId?: number | null;
  observaciones?: string | null;
}

export interface ReturnPaymentResponse {
  id: number;
  operationId: number;
  clientId: number;
  monto: number;
  tipoPago: PaymentType;
  estatus: ReturnPaymentStatus;

  cuentaOrigenId?: number | null;
  cuentaOrigenNombre?: string | null;
  cuentaOrigenBanco?: string | null;

  cuentaDestinoCliente?: string | null;
  cuentaClabeCliente?: string | null;
  cuentaDestinoTitular?: string | null;
  cuentaDestinoBanco?: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;

  solicitadoPorId?: number | null;
  solicitadoPorNombre?: string | null;

  pagadoPorId?: number | null;
  pagadoPorNombre?: string | null;

  fechaSolicitud: string;
  fechaPago?: string | null;

  autorizadoParaRecibirEfectivo1?: string;
  autorizadoParaRecibirEfectivo2?: string;
  autorizadoParaRecibirEfectivo3?: string;
  fechaHoraRecoleccionEfectivo?: string | null;

  createdAt: string;
}

export interface ReturnDestinationAccountSuggestion {
  banco: string | null;
  titular: string | null;
  cuenta: string | null;
  clabe: string | null;
  usos: number;
}


export type OperationApiResponse = ApiResponse<PaymentOperationResponse>;
export type OperationsPageApiResponse = ApiResponse<PageResponse<PaymentOperationResponse>>;
export type PaymentApiResponse = ApiResponse<OperationPaymentResponse>;
export type ReturnRequestPaymentApiResponse = ApiResponse<ReturnPaymentResponse[]>;
export type ReturnUpdateRequestPaymentApiResponse = ApiResponse<ReturnPaymentResponse>;
export type ReturnRealizePaymentApiResponse = ApiResponse<ReturnPaymentResponse>;
export type ScheduleCashReturnPickupApiResponse =
  ApiResponse<ReturnPaymentResponse>;
export type ReturnPaymentsListApiResponse = ApiResponse<ReturnPaymentResponse[]>;
export type ReturnDestinationAccountSuggestionsApiResponse =
  ApiResponse<ReturnDestinationAccountSuggestion[]>;