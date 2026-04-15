import { api } from '@/shared/lib/axios';
import { ApiResponse } from '@/shared/types/api.types';
import {
  PaymentOperationResponse,
  CreateOperationRequest,
  OperationApiResponse,
  AddPaymentRequest,
  OperationPaymentResponse,
  PaymentApiResponse,
  UpdatePaymentStatusRequest,
} from '../types/operations.types.ts';

type OperationsListApiResponse = ApiResponse<PaymentOperationResponse[]>;

const OPERATIONS_BASE_PATH = '/api/operations';

export async function createOperation(
  payload: CreateOperationRequest,
): Promise<PaymentOperationResponse> {
  const response = await api.post<OperationApiResponse>(
    OPERATIONS_BASE_PATH,
    payload,
  );
  return response.data.data;
}

export async function getOperations(): Promise<PaymentOperationResponse[]> {
  const response = await api.get<OperationsListApiResponse>(OPERATIONS_BASE_PATH);
  return response.data.data;
}

export async function getMyOperations(): Promise<PaymentOperationResponse[]> {
  const response = await api.get<OperationsListApiResponse>(
    `${OPERATIONS_BASE_PATH}/my-operations`,
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