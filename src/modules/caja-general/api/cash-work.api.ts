import { api } from '@/shared/lib/axios';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';

export interface WorkTotal { count: number; amount: number; oldest: string | null }
export interface CashWorkSummary { income: WorkTotal; withdrawals: WorkTotal; outflow: WorkTotal }
export interface CashIncomeRow {
  id: number; operationId: number; clienteNombre: string; socioComercialNombre: string;
  monto: number; tipoPago: 'EFECTIVO' | 'CHEQUE'; estatus: string;
  chequeEstado: string | null; numeroCheque: string | null; fechaPago: string;
}
export interface CashWorkPage<T> { content: T[]; totalElements: number; totalPages: number; totalAmount: number }
export interface CashCutSummary { income: number; outflow: number; movements: number }
const root = '/api/cash-work';
type Envelope<T> = { data: T };

export const cashWorkApi = {
  summary: async () => (await api.get<Envelope<CashWorkSummary>>(`${root}/summary`)).data.data,
  income: async (page: number, search: string, method: string) =>
    (await api.get<Envelope<CashWorkPage<CashIncomeRow>>>(`${root}/income`, { params: { page, search, method } })).data.data,
  outflow: async (page: number, search: string, method: string) =>
    (await api.get<Envelope<CashWorkPage<ReturnPaymentResponse>>>(`${root}/outflow`, { params: { page, search, method } })).data.data,
  cutSummary: async (startDate: string, endDate: string) =>
    (await api.get<Envelope<CashCutSummary>>(`${root}/cut-summary`, { params: { startDate, endDate } })).data.data,
};
