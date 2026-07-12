import { ApiResponse } from '@/shared/types/api.types';

export interface ClienteResponse {
  id: number;
  nombre: string;
  activo: boolean;
  nivelesRedComercial: number;
  porcentajeComisionSocio: number;
  porcentajeComisionOficina: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClienteRequest {
  userId: number
  nombre: string;
  nivelesRedComercial: number;
  porcentajeComisionSocio: number;
  porcentajeComisionOficina: number;
}

export interface UpdateClienteRequest {
  nombre: string;
  activo: boolean;
  nivelesRedComercial: number;
  porcentajeComisionSocio: number;
  porcentajeComisionOficina: number;
}

export type ClientesListApiResponse = ApiResponse<ClienteResponse[]>;
export type ClienteApiResponse = ApiResponse<ClienteResponse>;
export type VoidApiResponse = ApiResponse<null>;
