export type RoleName =
  | 'ADMIN'
  | 'DIRECCION'
  | 'GERENTE'
  | 'SOCIO_COMERCIAL'
  | 'JEFA_CAJAS'
  | 'JEFA_CUENTAS'
  | 'AUXILIAR_CUENTAS';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface AuthUser {
  userId: number;
  correo: string;
  nombre: string;
  roles: RoleName[];
  porcentajeComision?: number;
  commercialSettings?: { porcentajeComision?: number } | null;
}

export interface AuthResponse {
  token: string;
  userId: number;
  correo: string;
  nombre: string;
  roles: RoleName[];
  porcentajeComision?: number;
  commercialSettings?: { porcentajeComision?: number } | null;
}


export interface CompleteActivationRequest {
  token: string;
  password: string;
}

export interface CompleteEmailVerificationRequest {
  token: string;
}

export interface RequestPasswordResetRequest {
  correo: string;
}

export interface CompletePasswordResetRequest {
  token: string;
  password: string;
}
