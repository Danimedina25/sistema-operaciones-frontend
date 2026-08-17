import type { RoleName } from '@/modules/auth/types/auth.types';
import { ApiResponse } from '@/shared/types/api.types';

export interface CommercialSettingsResponse {
  id: number;
  userId: number;

  appliesToNetwork: boolean;

  cuentaBancaria: string;
  banco: string;
  titularCuenta: string;
  porcentajeComision: number;

  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
  roleId: number;
  roleName: RoleName;
  debeCambiarPassword: boolean;
  correoVerificado: boolean;
  commercialSettings: CommercialSettingsResponse | null;
}

export interface CreateUserRequest {
  nombre: string;
  correo: string;
  roleId: number;
  telefono?: string;

  appliesToNetwork?: boolean;

  cuentaBancaria?: string;
  banco?: string;
  titularCuenta?: string;
  porcentajeComision?: number;
}

export interface UpdateUserRequest {
  nombre: string;
  activo?: boolean;
  roleId: number;
  telefono?: string;
  appliesToNetwork?: boolean;
  cuentaBancaria?: string;
  banco?: string;
  titularCuenta?: string;
  porcentajeComision?: number;
}

export interface UpdateUserEmailRequest {
  correo: string;
}

export interface UserCreatedResponse {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  roleName: string;
  debeCambiarPassword: boolean;
  correoVerificado: boolean;
  activationUrl: string;
  cuentaBancaria?: string;
  banco?: string;
  titularCuenta?: string;
}

export type UsersListApiResponse = ApiResponse<UserResponse[]>;
export type UserApiResponse = ApiResponse<UserResponse>;
export type UserCreatedApiResponse = ApiResponse<UserCreatedResponse>;
export type VoidApiResponse = ApiResponse<null>;