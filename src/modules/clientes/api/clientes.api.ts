import { api } from '@/shared/lib/axios';
import type {
  ClienteApiResponse,
  ClienteResponse,
  ClientesListApiResponse,
  CreateClienteRequest,
  UpdateClienteRequest,
} from '@/modules/clientes/types/clientes.types';

const CLIENTES_BASE_PATH = '/api/clientes';

export async function getClientes(): Promise<ClienteResponse[]> {
  const response = await api.get<ClientesListApiResponse>(CLIENTES_BASE_PATH);
  return response.data.data;
}

export async function getClientesActivos(): Promise<ClienteResponse[]> {
  const response = await api.get<ClientesListApiResponse>(
    `${CLIENTES_BASE_PATH}/active`,
  );
  return response.data.data;
}

export async function getClienteById(id: number): Promise<ClienteResponse> {
  const response = await api.get<ClienteApiResponse>(
    `${CLIENTES_BASE_PATH}/${id}`,
  );
  return response.data.data;
}

export async function createCliente(
  payload: CreateClienteRequest,
): Promise<ClienteResponse> {
  const response = await api.post<ClienteApiResponse>(
    CLIENTES_BASE_PATH,
    payload,
  );
  return response.data.data;
}

export async function updateCliente(
  id: number,
  payload: UpdateClienteRequest,
): Promise<ClienteResponse> {
  const response = await api.put<ClienteApiResponse>(
    `${CLIENTES_BASE_PATH}/${id}`,
    payload,
  );
  return response.data.data;
}

export async function activateCliente(id: number): Promise<ClienteResponse> {
  const response = await api.patch<ClienteApiResponse>(
    `${CLIENTES_BASE_PATH}/${id}/activate`,
  );
  return response.data.data;
}

export async function deactivateCliente(id: number): Promise<ClienteResponse> {
  const response = await api.patch<ClienteApiResponse>(
    `${CLIENTES_BASE_PATH}/${id}/deactivate`,
  );
  return response.data.data;
}