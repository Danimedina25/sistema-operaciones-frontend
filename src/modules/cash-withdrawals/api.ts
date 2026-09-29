import { api } from '@/shared/lib/axios';
import type { BankCashWithdrawal, ConfirmWithdrawal, RegisterWithdrawal } from './types';

const root = '/api/bank-cash-withdrawals';
type Envelope<T> = { data: T };

/**
 * Retiros de efectivo de las cuentas hacia Caja General. Cuentas registra y cancela; Cajas
 * confirma y rechaza.
 */
export const cashWithdrawalsApi = {
  pending: async () => (await api.get<Envelope<BankCashWithdrawal[]>>(`${root}/pending`)).data.data,
  list: async (desde: string, hasta: string) =>
    (await api.get<Envelope<BankCashWithdrawal[]>>(root, { params: { desde, hasta } })).data.data,
  register: async (request: RegisterWithdrawal) =>
    (await api.post<Envelope<BankCashWithdrawal>>(root, request)).data.data,
  cancel: async (id: number, motivo: string) =>
    (await api.post<Envelope<BankCashWithdrawal>>(`${root}/${id}/cancel`, { motivo })).data.data,
  confirm: async (id: number, request: ConfirmWithdrawal) =>
    (await api.post<Envelope<BankCashWithdrawal>>(`${root}/${id}/confirm`, request)).data.data,
  reject: async (id: number, motivo: string) =>
    (await api.post<Envelope<BankCashWithdrawal>>(`${root}/${id}/reject`, { motivo })).data.data,
};
