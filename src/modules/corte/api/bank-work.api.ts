import { api } from '@/shared/lib/axios';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';

export interface BankWorkTotal { count: number; amount: number; oldest: string | null }
export interface BankWorkSummary { income: BankWorkTotal; outflow: BankWorkTotal; withdrawalsInTransit: BankWorkTotal }
export interface BankIncomeRow {
  id: number; operationId: number; clienteNombre: string; socioComercialNombre: string;
  monto: number; tipoPago: 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
  estatus: 'PENDIENTE_VALIDACION' | 'EN_PROCESO'; chequeEstado: string | null;
  cuentaDestino: string | null; fechaPago: string;
}
export interface BankWorkPage<T> { content: T[]; totalElements: number; totalPages: number; totalAmount: number }
type Envelope<T> = { data: T };
const root = '/api/bank-work';

export const bankWorkApi = {
  summary: async () => (await api.get<Envelope<BankWorkSummary>>(`${root}/summary`)).data.data,
  income: async (page: number, search: string, method: string) =>
    (await api.get<Envelope<BankWorkPage<BankIncomeRow>>>(`${root}/income`, { params: { page, search, method } })).data.data,
  outflow: async (page: number, search: string) =>
    (await api.get<Envelope<BankWorkPage<ReturnPaymentResponse>>>(`${root}/outflow`, { params: { page, search } })).data.data,
};
