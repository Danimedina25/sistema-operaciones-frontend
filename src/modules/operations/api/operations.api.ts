import { api } from '@/shared/lib/axios';
import { ApiResponse } from '@/shared/types/api.types.js';
import {
  PaymentOperationResponse,
  CreateOperationRequest,
  OperationApiResponse,
  AddPaymentRequest,
  OperationPaymentResponse,
  PaymentApiResponse,
  UpdatePaymentStatusRequest,
  OperationsPageApiResponse,
  PageResponse,
  OperationsFilters,
  ReturnPaymentResponse,
  ReturnPaymentsListApiResponse,
  ReturnPaymentsPageApiResponse,
  CreateReturnPaymentRequest,
  RealizeReturnPaymentRequest,
  UpdateOperationRequest,
  UpdateOperationPaymentRequest,
  ReturnRequestPaymentApiResponse,
  ReturnRealizePaymentApiResponse,
  UpdateReturnPaymentRequest,
  ReturnUpdateRequestPaymentApiResponse,
  ReturnDestinationAccountSuggestion,
  ReturnDestinationAccountSuggestionsApiResponse,
  ScheduleCashReturnPickupRequest,
  ScheduleCashReturnPickupApiResponse,
  ConfirmCashReturnPickupApiResponse,
  MarkCashReturnDeliveredApiResponse,
  MarkCashReturnDeliveredRequest,
  ReturnInstallment,
  ReturnInstallmentApiResponse,
  ReturnInstallmentsListApiResponse,
  ReturnInstallmentsPageApiResponse,
  ReturnRequestSummary,
  ReturnRequestSummaryApiResponse,
  CreateReturnInstallmentRequest,
  DeliverReturnInstallmentRequest,
  CancelReturnInstallmentRequest,
} from '../types/operations.types.ts';

const OPERATIONS_BASE_PATH = '/api/operations';
const RETURNS_BASE_PATH = `${OPERATIONS_BASE_PATH}/returns`;

function buildOperationsQuery(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
  sort: string = 'createdAt,desc',
) {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));
  params.append('sort', sort);

  if (filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  if (filters.search && !isNaN(Number(filters.search.trim()))) {
    params.append('operationId', filters.search.trim());
  }

  if (filters.status !== 'ALL') {
    params.append('status', filters.status);
  }

  if (filters.dateFilter) {
    params.append('dateFilter', filters.dateFilter);
  }

  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }

  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }

  params.append('activo', filters.activo);

  if (filters.paymentTypes) {
    params.append('paymentTypes', filters.paymentTypes);
  }

  if (filters.paymentStatus) {
    params.append('paymentStatus', filters.paymentStatus);
  }

  if (filters.returnStatuses) {
    params.append('returnStatuses', filters.returnStatuses);
  }

  if (filters.cuentaDestinoId) {
    params.append('cuentaDestinoId', String(filters.cuentaDestinoId));
  }

  if (filters.banco) {
    params.append('banco', filters.banco);
  }

  if (filters.socioComercialId) {
    params.append('socioComercialId', String(filters.socioComercialId));
  }

  return params.toString();
}

export async function createOperation(
  payload: CreateOperationRequest,
): Promise<PaymentOperationResponse> {
  const response = await api.post<OperationApiResponse>(
    OPERATIONS_BASE_PATH,
    payload,
  );
  return response.data.data;
}

export async function updateOperation(
  operationId: number,
  payload: UpdateOperationRequest,
): Promise<PaymentOperationResponse> {
  const response = await api.put<OperationApiResponse>(
    `${OPERATIONS_BASE_PATH}/${operationId}`,
    payload,
  );

  return response.data.data;
}

export async function getOperations(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
  sort?: string,
): Promise<PageResponse<PaymentOperationResponse>> {
  const query = buildOperationsQuery(page, pageSize, filters, sort);

  const response = await api.get<OperationsPageApiResponse>(
    `${OPERATIONS_BASE_PATH}?${query}`,
  );
  return response.data.data;
}

export async function getMyOperations(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
): Promise<PageResponse<PaymentOperationResponse>> {
  const query = buildOperationsQuery(page, pageSize, filters);

  const response = await api.get<OperationsPageApiResponse>(
    `${OPERATIONS_BASE_PATH}/my-operations?${query}`,
  );
  return response.data.data;
}

export async function addOperationPayment(
  payload: AddPaymentRequest,
): Promise<OperationPaymentResponse> {
  const response = await api.post<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments`,
    payload,
  );
  return response.data.data;
}

export async function updateOperationPayment(
  paymentId: number,
  payload: UpdateOperationPaymentRequest,
): Promise<OperationPaymentResponse> {
  const response = await api.put<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments/${paymentId}`,
    payload,
  );

  return response.data.data;
}

export async function validatePayment(
  paymentId: number,
  payload: UpdatePaymentStatusRequest,
): Promise<OperationPaymentResponse> {
  const response = await api.patch<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments/${paymentId}/validate`,
    payload,
  );
  return response.data.data;
}

export async function rejectPayment(
  paymentId: number,
  payload: UpdatePaymentStatusRequest,
): Promise<OperationPaymentResponse> {
  const response = await api.patch<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments/${paymentId}/reject`,
    payload,
  );
  return response.data.data;
}

export async function markPaymentInProgress(
  paymentId: number,
  payload?: { observaciones?: string },
): Promise<OperationPaymentResponse> {
  const response = await api.patch<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments/${paymentId}/in-progress`,
    payload ?? {},
  );
  return response.data.data;
}

export async function releasePaymentInProgress(
  paymentId: number,
): Promise<OperationPaymentResponse> {
  const response = await api.patch<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments/${paymentId}/release`,
  );
  return response.data.data;
}

export async function updateValidationReceipt(
  paymentId: number,
  payload: UpdatePaymentStatusRequest,
): Promise<OperationPaymentResponse> {
  const response = await api.patch<PaymentApiResponse>(
    `${OPERATIONS_BASE_PATH}/payments/${paymentId}/validation-receipt`,
    payload,
  );
  return response.data.data;
}

export async function markOperationAsInvoiced(
  operationId: number,
): Promise<PaymentOperationResponse> {
  const response = await api.patch<OperationApiResponse>(
    `${OPERATIONS_BASE_PATH}/${operationId}/invoice`,
  );

  return response.data.data;
}

export async function getStalledOperations(
  page: number,
  pageSize: number,
  thresholdHours: number,
): Promise<PageResponse<PaymentOperationResponse>> {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));
  params.append('thresholdHours', String(thresholdHours));

  const response = await api.get<OperationsPageApiResponse>(
    `${OPERATIONS_BASE_PATH}/stalled?${params.toString()}`,
  );

  return response.data.data;
}

export async function getOperationById(
  id: number,
): Promise<PaymentOperationResponse> {
  const response = await api.get<OperationApiResponse>(
    `${OPERATIONS_BASE_PATH}/${id}`,
  );
  return response.data.data;
}

export async function activateOperation(
  id: number,
): Promise<PaymentOperationResponse> {
  const response = await api.patch<OperationApiResponse>(
    `${OPERATIONS_BASE_PATH}/${id}/activate`,
  );
  return response.data.data;
}

export async function deactivateOperation(
  id: number,
): Promise<PaymentOperationResponse> {
  const response = await api.patch<OperationApiResponse>(
    `${OPERATIONS_BASE_PATH}/${id}/deactivate`,
  );
  return response.data.data;
}

type FrequentClientsApiResponse = ApiResponse<string[]>;

export async function getFrequentClientNames(): Promise<string[]> {
  const response = await api.get<FrequentClientsApiResponse>(
    `${OPERATIONS_BASE_PATH}/frequent-clients`,
  );
  return response.data.data;
}

export async function getOperationsAvailableToRequestReturn(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
): Promise<PageResponse<PaymentOperationResponse>> {
  const query = buildOperationsQuery(page, pageSize, filters);

  const response = await api.get<OperationsPageApiResponse>(
    `${RETURNS_BASE_PATH}/available-to-request?${query}`,
  );

  return response.data.data;
}

export async function getOperationsWithRequestedReturns(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
): Promise<PageResponse<PaymentOperationResponse>> {
  const query = buildOperationsQuery(page, pageSize, filters);

  const response = await api.get<OperationsPageApiResponse>(
    `${RETURNS_BASE_PATH}/requested?${query}`,
  );

  return response.data.data;
}

export async function requestReturnPayment(
  operationId: number,
  payload: CreateReturnPaymentRequest,
): Promise<ReturnPaymentResponse[]> {
  const response = await api.post<ReturnRequestPaymentApiResponse>(
    `${RETURNS_BASE_PATH}/${operationId}/request`,
    payload,
  );

  return response.data.data;
}

export async function updateRequestReturnPayment(
  returnPaymentId: number,
  payload: UpdateReturnPaymentRequest,
): Promise<ReturnPaymentResponse> {
  const response = await api.put<ReturnUpdateRequestPaymentApiResponse>(
    `${RETURNS_BASE_PATH}/${returnPaymentId}/update`,
    payload,
  );

  return response.data.data;
}

export async function realizeReturnPayment(
  returnPaymentId: number,
  payload: RealizeReturnPaymentRequest,
): Promise<ReturnPaymentResponse> {
  const response = await api.patch<ReturnRealizePaymentApiResponse>(
    `${RETURNS_BASE_PATH}/payments/${returnPaymentId}/realize`,
    payload,
  );

  return response.data.data;
}

export async function scheduleCashReturnPickup(
  returnPaymentId: number,
  payload: ScheduleCashReturnPickupRequest,
): Promise<ReturnPaymentResponse> {
  const response = await api.patch<ScheduleCashReturnPickupApiResponse>(
    `${RETURNS_BASE_PATH}/payments/${returnPaymentId}/cash-pickup-time`,
    payload,
  );

  return response.data.data;
}

export async function confirmCashReturnPickup(
  returnPaymentId: number,
): Promise<ReturnPaymentResponse> {
  const response = await api.patch<ConfirmCashReturnPickupApiResponse>(
    `${RETURNS_BASE_PATH}/payments/${returnPaymentId}/confirm-cash-pickup`,
  );

  return response.data.data;
}

export async function markCashReturnAsDelivered(
  returnPaymentId: number,
  payload: MarkCashReturnDeliveredRequest,
): Promise<ReturnPaymentResponse> {
  const response = await api.patch<MarkCashReturnDeliveredApiResponse>(
    `${RETURNS_BASE_PATH}/payments/${returnPaymentId}/mark-cash-delivered`,
    payload,
  );

  return response.data.data;
}

export async function getReturnOperationById(
  operationId: number,
): Promise<PaymentOperationResponse> {
  const response = await api.get<OperationApiResponse>(
    `${RETURNS_BASE_PATH}/${operationId}`,
  );

  return response.data.data;
}

export async function getReturnsByOperationId(
  operationId: number,
): Promise<ReturnPaymentResponse[]> {
  const response = await api.get<ReturnPaymentsListApiResponse>(
    `${RETURNS_BASE_PATH}/${operationId}/payments`,
  );

  return response.data.data;
}

export interface TodayCashDeliveriesFilters {
  fecha?: string;
  tipoPago?: string;
}

export async function getTodayCashDeliveries(
  page: number,
  pageSize: number,
  filters: TodayCashDeliveriesFilters = {},
): Promise<PageResponse<ReturnPaymentResponse>> {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));

  if (filters.fecha) {
    params.append('fecha', filters.fecha);
  }

  if (filters.tipoPago) {
    params.append('tipoPago', filters.tipoPago);
  }

  const response = await api.get<ReturnPaymentsPageApiResponse>(
    `${RETURNS_BASE_PATH}/today-deliveries?${params.toString()}`,
  );

  return response.data.data;
}

export async function getLateReturns(
  page: number,
  pageSize: number,
): Promise<PageResponse<ReturnPaymentResponse>> {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));

  const response = await api.get<ReturnPaymentsPageApiResponse>(
    `${RETURNS_BASE_PATH}/late?${params.toString()}`,
  );

  return response.data.data;
}

export async function getReturnDestinationAccountSuggestions(
  clientId: number,
): Promise<ReturnDestinationAccountSuggestion[]> {
  const response =
    await api.get<ReturnDestinationAccountSuggestionsApiResponse>(
      `${RETURNS_BASE_PATH}/clients/${clientId}/destination-accounts`,
    );

  return response.data.data;
}

// --------------------------------------------------------------------------
// Parcialidades de retorno
// --------------------------------------------------------------------------

export async function createReturnInstallment(
  returnRequestId: number,
  payload: CreateReturnInstallmentRequest,
): Promise<ReturnInstallment> {
  const response = await api.post<ReturnInstallmentApiResponse>(
    `${RETURNS_BASE_PATH}/requests/${returnRequestId}/installments`,
    payload,
  );

  return response.data.data;
}

export async function getReturnRequestSummary(
  returnRequestId: number,
): Promise<ReturnRequestSummary> {
  const response = await api.get<ReturnRequestSummaryApiResponse>(
    `${RETURNS_BASE_PATH}/requests/${returnRequestId}`,
  );

  return response.data.data;
}

export async function getReturnInstallments(
  returnRequestId: number,
): Promise<ReturnInstallment[]> {
  const response = await api.get<ReturnInstallmentsListApiResponse>(
    `${RETURNS_BASE_PATH}/requests/${returnRequestId}/installments`,
  );

  return response.data.data;
}

export async function confirmReturnInstallment(
  installmentId: number,
): Promise<ReturnInstallment> {
  const response = await api.patch<ReturnInstallmentApiResponse>(
    `${RETURNS_BASE_PATH}/installments/${installmentId}/confirm`,
  );

  return response.data.data;
}

export async function deliverReturnInstallment(
  installmentId: number,
  payload: DeliverReturnInstallmentRequest,
): Promise<ReturnInstallment> {
  const response = await api.patch<ReturnInstallmentApiResponse>(
    `${RETURNS_BASE_PATH}/installments/${installmentId}/deliver`,
    payload,
  );

  return response.data.data;
}

export async function cancelReturnInstallment(
  installmentId: number,
  payload: CancelReturnInstallmentRequest,
): Promise<ReturnInstallment> {
  const response = await api.patch<ReturnInstallmentApiResponse>(
    `${RETURNS_BASE_PATH}/installments/${installmentId}/cancel`,
    payload,
  );

  return response.data.data;
}

export async function getTodayInstallmentPickups(
  page: number,
  pageSize: number,
  filters: TodayCashDeliveriesFilters = {},
): Promise<PageResponse<ReturnInstallment>> {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));

  if (filters.fecha) {
    params.append('fecha', filters.fecha);
  }

  if (filters.tipoPago) {
    params.append('tipoPago', filters.tipoPago);
  }

  const response = await api.get<ReturnInstallmentsPageApiResponse>(
    `${RETURNS_BASE_PATH}/installments/today-deliveries?${params.toString()}`,
  );

  return response.data.data;
}

export async function getLateInstallmentPickups(
  page: number,
  pageSize: number,
): Promise<PageResponse<ReturnInstallment>> {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));

  const response = await api.get<ReturnInstallmentsPageApiResponse>(
    `${RETURNS_BASE_PATH}/installments/late?${params.toString()}`,
  );

  return response.data.data;
}
