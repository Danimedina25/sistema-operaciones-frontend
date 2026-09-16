import { api } from '@/shared/lib/axios';
import type { CashDay, CashLedger, CashMovement, CloseCashDay, CreateCashMovement, OpenCashDay } from '../types/caja-general.types';
const root = '/api/caja-general';
type Envelope<T> = { data: T };
export const cajaGeneralApi = {
  latest: async () => (await api.get<Envelope<CashDay | null>>(`${root}/latest`)).data.data,
  ledger: async (startDate: string, endDate: string) => (await api.get<Envelope<CashLedger>>(`${root}/ledger`, { params: { startDate, endDate } })).data.data,
  open: async (request: OpenCashDay) => (await api.post<Envelope<CashDay>>(`${root}/days`, request)).data.data,
  movement: async (id: number, request: CreateCashMovement) => (await api.post<Envelope<CashMovement>>(`${root}/days/${id}/movements`, request)).data.data,
  close: async (id: number, request: CloseCashDay) => (await api.post<Envelope<CashDay>>(`${root}/days/${id}/close`, request)).data.data,
  deleteDay: async (id: number, version: number, motivo: string) => {
    await api.delete(`${root}/days/${id}`, { data: { confirmacion: 'ELIMINAR', motivo, version } });
  },
};
