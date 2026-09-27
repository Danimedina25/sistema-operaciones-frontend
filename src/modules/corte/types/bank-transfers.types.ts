import type { ApiResponse } from '@/shared/types/api.types';

export interface CreateBankTransfer {
  requestId: string;
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  monto: number;
  referencia: string | null;
  comprobanteUrl: string | null;
}

export interface BankTransfer {
  id: number;
  fecha: string;
  cuentaOrigenId: number;
  cuentaOrigen: string;
  cuentaDestinoId: number;
  cuentaDestino: string;
  monto: number;
  referencia: string | null;
  comprobanteUrl: string | null;
  registradoPorId: number;
  registradoPorNombre: string;
  /** Sólo llega al registrar: permite avisar si la cuenta origen quedó en negativo. */
  saldoOrigenResultante: number | null;
}

export type BankTransferApiResponse = ApiResponse<BankTransfer>;
export type BankTransferListApiResponse = ApiResponse<BankTransfer[]>;
