import { ApiResponse } from '@/shared/types/api.types';

export interface ClienteResponse {
  id: number;
  nombre: string;
  activo: boolean;
  nivelesRedComercial: number;
  porcentajeComisionAplicado: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClienteRequest {
  nombre: string;
  nivelesRedComercial: number;
  porcentajeComisionAplicado: number;
}

export interface UpdateClienteRequest {
  nombre: string;
  activo: boolean;
  nivelesRedComercial: number;
  porcentajeComisionAplicado: number;
}

export type ClientesListApiResponse = ApiResponse<ClienteResponse[]>;
export type ClienteApiResponse = ApiResponse<ClienteResponse>;
export type VoidApiResponse = ApiResponse<null>;