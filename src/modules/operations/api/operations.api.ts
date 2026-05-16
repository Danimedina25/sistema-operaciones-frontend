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
  CreateReturnPaymentRequest,
  ReturnPaymentApiResponse,
  UpdateOperationRequest,
  UpdateOperationPaymentRequest,
  RealizeReturnPaymentRequest,
} from '../types/operations.types.ts';

const OPERATIONS_BASE_PATH = '/api/operations';
const RETURNS_BASE_PATH = `${OPERATIONS_BASE_PATH}/returns`;

function buildOperationsQuery(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
) {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('size', String(pageSize));
  params.append('sort', 'createdAt,desc');

  if (filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  if(filters.search && !isNaN(Number(filters.search.trim()))){
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
): Promise<PageResponse<PaymentOperationResponse>> {
  const query = buildOperationsQuery(page, pageSize, filters);

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

export async function markOperationAsInvoiced(
  operationId: number,
): Promise<PaymentOperationResponse> {
  const response = await api.patch<OperationApiResponse>(
    `${OPERATIONS_BASE_PATH}/${operationId}/invoice`,
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
): Promise<ReturnPaymentResponse> {
  const response = await api.post<ReturnPaymentApiResponse>(
    `${RETURNS_BASE_PATH}/${operationId}/request`,
    payload,
  );

  return response.data.data;
}

export async function realizeReturnPayment(
  returnPaymentId: number,
  payload: RealizeReturnPaymentRequest,
): Promise<ReturnPaymentResponse> {
  const response = await api.patch<ReturnPaymentApiResponse>(
    `${RETURNS_BASE_PATH}/payments/${returnPaymentId}/realize`,
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