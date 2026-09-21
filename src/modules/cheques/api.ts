import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Cheque, ChequeCommand, ChequeFilters, ChequesPage } from './types';
const root = '/api/operations/cheques';
export const chequesApi = {
  list: async (params: ChequeFilters) => (await api.get<ApiResponse<ChequesPage>>(root, { params })).data.data,
  byPayment: async (id: number) => (await api.get<ApiResponse<Cheque>>(`${root}/by-payment/${id}`)).data.data,
  command: async (id: number, command: ChequeCommand) => (await api.post<ApiResponse<Cheque>>(`${root}/${id}/actions`, command)).data.data,
};
