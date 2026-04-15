export interface BankAccountResponse {
  id: number;
  banco: string;
  titular: string;
  numeroCuenta: string;
  clabe: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountRequest {
  banco: string;
  titular: string;
  numeroCuenta: string;
  clabe: string;
  activo?: boolean;
}

export interface BankAccountApiResponse {
  success: boolean;
  message: string;
  data: BankAccountResponse;
  errors: string[] | null;
}

export interface BankAccountsListApiResponse {
  success: boolean;
  message: string;
  data: BankAccountResponse[];
  errors: string[] | null;
}

export interface VoidApiResponse {
  success: boolean;
  message: string;
  data: null;
  errors: string[] | null;
}