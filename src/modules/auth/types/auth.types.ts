export type RoleName =
  | 'ADMIN'
  | 'GERENTE'
  | 'SOCIO_COMERCIAL'
  | 'VALIDADOR'
  | 'JEFA_CAJAS'
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
}

export interface AuthResponse {
  token: string;
  userId: number;
  correo: string;
  nombre: string;
  roles: RoleName[];
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