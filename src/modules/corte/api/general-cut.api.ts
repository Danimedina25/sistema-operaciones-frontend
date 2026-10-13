import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';

export interface GeneralCutMovement {
  id: string; date: string; concept: string; source: string; direction: 'ENTRADA' | 'SALIDA';
  type: 'ENTRADA' | 'SALIDA' | 'INTERNO'; amount: number;
}
export interface GeneralCutTransit { id: number; date: string; bank: string; accountLastFour: string; amount: number }
export interface GeneralCutBankBalance { bank: string; accounts: number; amount: number }
export interface GeneralCut {
  startDate: string; endDate: string;
  cashInitial: number; cashIncome: number; cashOutflow: number; cashInternal: number; cashFinal: number;
  bankInitial: number; bankIncome: number; bankOutflow: number; bankInternal: number; bankFinal: number; totalInternal: number;
  totalInitial: number; totalIncome: number; totalOutflow: number; totalFinal: number; difference: number;
  banks: GeneralCutBankBalance[]; transit: GeneralCutTransit[];
  movements: GeneralCutMovement[]; totalMovements: number; totalPages: number;
}
export async function getGeneralCut(startDate: string, endDate: string, page: number): Promise<GeneralCut> {
  const response = await api.get<ApiResponse<GeneralCut>>('/api/general-cut',
    { params: { startDate, endDate, page, size: 30 } });
  return response.data.data;
}

