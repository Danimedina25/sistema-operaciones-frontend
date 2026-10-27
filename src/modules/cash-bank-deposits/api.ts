import { api } from '@/shared/lib/axios';
import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';

export type DepositStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO_PENDIENTE_DEVOLUCION' | 'CANCELADO';
export type DepositMethod = 'VENTANILLA' | 'CAJERO' | 'OXXO';
export const depositMethodLabel: Record<DepositMethod, string> = {
  VENTANILLA: 'Ventanilla', CAJERO: 'Cajero', OXXO: 'OXXO',
};
export interface CashBankDeposit {
  id: number; origen: 'EFECTIVO_CAJA' | 'CHEQUE'; bankAccountId: number; cuenta: string;
  version: number; denominaciones: CashCounts;
  cuentaTitular: string; monto: number; forma: string; referencia: string | null;
  comprobanteSalidaUrl: string; comprobanteBancoUrl: string | null;
  estatus: DepositStatus; motivo: string | null; registradoEn: string;
  registradoPorNombre: string; resueltoEn: string | null; resueltoPorNombre: string | null;
  cashMovementId: number | null;
  chequePaymentId: number | null; operationId: number | null; numeroCheque: string | null;
}
export interface CashBankDepositPreview {
  saldoCaja: number; saldoCuenta: number | null; reservadoEnTransito: number; disponible: number; monto: number;
  saldoAlConfirmar: number; suficiente: boolean;
}
export interface PendingDepositSummary { count: number; amount: number; oldest: string | null }
export interface RegisterCashBankDeposit {
  requestId: string; bankAccountId: number; monto: number; forma: DepositMethod;
  referencia: string | null; comprobanteSalidaUrl: string; denominaciones: CashCounts;
}
export interface EditCashBankDeposit extends Omit<RegisterCashBankDeposit, 'requestId'> { version: number }
type Envelope<T> = { data: T };
const root = '/api/cash-bank-deposits';

export const cashBankDepositsApi = {
  pending: async () => (await api.get<Envelope<CashBankDeposit[]>>(`${root}/pending`)).data.data,
  summary: async () => (await api.get<Envelope<PendingDepositSummary>>(`${root}/pending-summary`)).data.data,
  returns: async () => (await api.get<Envelope<CashBankDeposit[]>>(`${root}/return-pending`)).data.data,
  list: async (desde: string, hasta: string) =>
    (await api.get<Envelope<CashBankDeposit[]>>(root, { params: { desde, hasta } })).data.data,
  preview: async (monto: number, bankAccountId?: number) =>
    (await api.get<Envelope<CashBankDepositPreview>>(`${root}/preview`, { params: { monto, ...(bankAccountId ? { bankAccountId } : {}) } })).data.data,
  register: async (request: RegisterCashBankDeposit) =>
    (await api.post<Envelope<CashBankDeposit>>(root, request)).data.data,
  edit: async (id: number, request: EditCashBankDeposit) =>
    (await api.put<Envelope<CashBankDeposit>>(`${root}/${id}`, request)).data.data,
  confirm: async (id: number, comprobanteBancoUrl: string) =>
    (await api.post<Envelope<CashBankDeposit>>(`${root}/${id}/confirm`, { comprobanteBancoUrl })).data.data,
  reject: async (id: number, motivo: string) =>
    (await api.post<Envelope<CashBankDeposit>>(`${root}/${id}/reject`, { motivo })).data.data,
  confirmReturn: async (id: number, denominaciones: CashCounts) =>
    (await api.post<Envelope<CashBankDeposit>>(`${root}/${id}/confirm-return`, { denominaciones })).data.data,
};
