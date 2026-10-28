import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDailyCashCut } from './use-daily-cash-cut';

const api = vi.hoisted(() => ({ calculateDailyCashCut: vi.fn(), calculateCashCutRange: vi.fn() }));
vi.mock('@/modules/corte/api/corte.api', () => ({
  calculateDailyCashCut: api.calculateDailyCashCut,
  calculateCashCutRange: api.calculateCashCutRange,
  registerDailyCashCut: vi.fn(),
  registerDailyCashCutByDate: vi.fn(),
  calculateBankBalancesGrouped: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe('useDailyCashCut', () => {
  it('no conserva el corte de otro día cuando la nueva consulta falla', async () => {
    api.calculateDailyCashCut.mockResolvedValueOnce({ fecha: '2026-10-27', saldoFinal: 10 })
      .mockRejectedValueOnce(new Error('No se puede consultar el corte de una fecha futura'));
    const { result } = renderHook(() => useDailyCashCut());

    await act(async () => { await result.current.fetchDailyCut('2026-10-27'); });
    expect(result.current.dailyCut?.fecha).toBe('2026-10-27');
    await act(async () => { await result.current.fetchDailyCut('2026-10-28').catch(() => undefined); });
    expect(result.current.dailyCut).toBeNull();
  });
});
