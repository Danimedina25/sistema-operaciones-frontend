import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useState, type PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { previousWeekInOffice, useNavigationState } from './use-navigation-state';

const mocks = vi.hoisted(() => ({
  getOperations: vi.fn(),
  getSummaryByBeneficiary: vi.fn(),
  latest: vi.fn(),
}));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 17 } }) }));
vi.mock('@/modules/operations/api/operations.api', () => ({ getOperations: mocks.getOperations }));
vi.mock('@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api', () => ({ getSummaryByBeneficiary: mocks.getSummaryByBeneficiary }));
vi.mock('@/modules/caja-general/api/caja-general.api', () => ({ cajaGeneralApi: { latest: mocks.latest } }));

function Wrapper({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOperations.mockResolvedValue({ totalElements: 3 });
  mocks.latest.mockResolvedValue({ closedAt: null });
  mocks.getSummaryByBeneficiary.mockResolvedValue({ socios: [] });
});

describe('contadores del menú', () => {
  it('consulta ingresos de Caja sin filtro de fecha ni salidas duplicadas', async () => {
    const { result } = renderHook(() => useNavigationState('JEFA_CAJAS'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.counts.cashIncome).toBe(3));
    expect(mocks.getOperations).toHaveBeenCalledTimes(1);
    expect(mocks.getOperations.mock.calls[0][2]).toMatchObject({ workQueue: 'CASH_INCOME', dateFilter: '' });
    expect(result.current.counts.bankIncome).toBeNull();
    expect(result.current.cashOpen).toBe(true);
    expect(mocks.getSummaryByBeneficiary).not.toHaveBeenCalled();
  });

  it('cuenta una vez a cada beneficiario con comisión pendiente positiva', async () => {
    mocks.getSummaryByBeneficiary.mockResolvedValue({ socios: [
      { beneficiaryId: 1, totalPendientes: 100, totalComisionesPendientes: 2 },
      { beneficiaryId: 2, totalPendientes: 0, totalComisionesPendientes: 0 },
      { beneficiaryId: 3, totalPendientes: 50, totalComisionesPendientes: 1 },
    ] });
    const { result } = renderHook(() => useNavigationState('GERENTE'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.counts.commissions).toBe(2));
    expect(mocks.getSummaryByBeneficiary).toHaveBeenCalledTimes(1);
    expect(mocks.getOperations).not.toHaveBeenCalled();
  });

  it('calcula la semana anterior en hora de la oficina', () => {
    expect(previousWeekInOffice(new Date('2026-10-10T18:00:00Z'))).toEqual({ startDate: '2026-09-27', endDate: '2026-10-03' });
  });
});
