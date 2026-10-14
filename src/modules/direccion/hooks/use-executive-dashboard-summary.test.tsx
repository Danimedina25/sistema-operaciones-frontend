import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExecutiveDashboardSummary } from './use-executive-dashboard-summary';

const api = vi.hoisted(() => ({
  getOperations: vi.fn(),
  getOperationsWithRequestedReturns: vi.fn(),
  getSummary: vi.fn(),
  getPaidCommissions: vi.fn(),
  getOperatedMetrics: vi.fn(),
}));

vi.mock('@/modules/operations/api/operations.api', () => ({
  getOperations: api.getOperations,
  getOperationsWithRequestedReturns: api.getOperationsWithRequestedReturns,
}));
vi.mock('@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api', () => ({
  getSummary: api.getSummary,
  getPaidCommissions: api.getPaidCommissions,
}));
vi.mock('@/modules/gerente/api/management-metrics.api', () => ({ getOperatedMetrics: api.getOperatedMetrics }));

describe('useExecutiveDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getOperations.mockResolvedValue({ totalElements: 4 });
    api.getOperationsWithRequestedReturns.mockResolvedValue({ totalElements: 3 });
    api.getSummary.mockResolvedValue({ totalComisiones: 100, totalPendientes: 10 });
    api.getPaidCommissions.mockResolvedValue({ totalPagadas: 90 });
    api.getOperatedMetrics.mockResolvedValue({ operatedAmount: 2000 });
  });

  it('keeps valid indicators when one request fails', async () => {
    api.getOperationsWithRequestedReturns.mockRejectedValue(new Error('Sin retornos'));
    const period = { startDate: '2026-10-01', endDate: '2026-10-14' };
    const { result } = renderHook(() => useExecutiveDashboardSummary(period));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.getOperatedMetrics).toHaveBeenCalledWith(period.startDate, period.endDate);
    expect(result.current.summary).toEqual({
      volumenOperado: 2000,
      saldoBancario: null,
      retornosPendientes: null,
      comisionesPagadas: 90,
      operacionesCompletadas: 4,
      comisionesGeneradas: 100,
      comisionesPendientes: 10,
    });
    expect(result.current.error).toBeNull();
  });
});
