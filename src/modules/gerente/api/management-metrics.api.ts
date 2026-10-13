import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';

export interface OperatedMetrics { operatedAmount: number; operatedOperations: number }

export async function getOperatedMetrics(startDate: string, endDate: string): Promise<OperatedMetrics> {
  const response = await api.get<ApiResponse<OperatedMetrics>>('/api/management-metrics/operated',
    { params: { startDate, endDate } });
  return response.data.data;
}
