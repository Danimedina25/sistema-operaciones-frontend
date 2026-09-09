import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOperationsAvailableToRequestReturn } from './returns/use-operation-returns';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useSocioPendingSummary } from './use-socio-pending-summary';
const api = vi.hoisted(() => ({ getMyOperations: vi.fn(), getOperationsAvailableToRequestReturn: vi.fn(), getOperationsWithRequestedReturns: vi.fn(), getMyWeeklyCommissions: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: () => true }) }));
vi.mock('@/modules/operations/api/operations.api', () => api);
vi.mock('@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api', () => api);
beforeEach(() => vi.clearAllMocks());
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
}
it('cuenta ingreso parcial y retornos disponibles con las fechas seleccionadas sin consultar comisiones', async () => {
  api.getMyOperations.mockImplementation((_page, _size, filters) => Promise.resolve({ totalElements: filters.status === 'INGRESO_PARCIAL' ? 7 : 2 }));
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 5 });
  api.getOperationsWithRequestedReturns.mockResolvedValue({ totalElements: 3 });
  const period = { dateFilter: '' as const, startDate: '2026-08-01', endDate: '2026-08-31' };
  const { result } = renderHook(() => useSocioPendingSummary(period), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.summary.pendingToRegister).toBe(7));
  expect(result.current.summary.readyToRequestReturn).toBe(5);
  expect(api.getMyOperations).toHaveBeenCalledTimes(2);
  expect(api.getMyOperations).toHaveBeenCalledWith(0, 1, expect.objectContaining({ ...period, status: 'RECHAZADA', paymentStatus: '' }));
  expect(api.getMyOperations).toHaveBeenCalledWith(0, 1, expect.objectContaining({ ...period, status: 'INGRESO_PARCIAL' }));
  expect(api.getOperationsAvailableToRequestReturn).toHaveBeenCalledWith(0, 10, expect.objectContaining({ ...period, status: 'ALL' }));
  expect(api.getOperationsWithRequestedReturns).toHaveBeenCalledWith(0, 1, expect.objectContaining({ ...period, returnStatuses: 'EN_RECOLECCION' }));
  expect(api.getMyWeeklyCommissions).not.toHaveBeenCalled();
});

it('comparte el total con el listado aunque el endpoint devuelva cero con tamaño 1 y actualiza ambos al refrescar', async () => {
  api.getMyOperations.mockResolvedValue({ totalElements: 0 });
  api.getOperationsWithRequestedReturns.mockResolvedValue({ totalElements: 0 });
  api.getOperationsAvailableToRequestReturn.mockImplementation((_page, size) => Promise.resolve({ totalElements: size === 1 ? 0 : 1, content: [{ id: 42, estatus: 'VALIDADA' }] }));
  const period = { dateFilter: 'THIS_MONTH' as const, startDate: '', endDate: '' };
  const filters = {
    operationId: 0, search: '', status: 'ALL' as const, ...period, activo: 'ACTIVE' as const,
    paymentTypes: '', paymentStatus: '' as const, returnStatuses: '', cuentaDestinoId: 0, banco: '', socioComercialId: 0,
  };
  const { result } = renderHook(() => ({
    card: useSocioPendingSummary(period),
    list: useOperationsAvailableToRequestReturn(0, 10, filters),
  }), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.card.summary.readyToRequestReturn).toBe(1));
  expect(result.current.list.data?.totalElements).toBe(1);
  expect(api.getOperationsAvailableToRequestReturn).toHaveBeenCalledTimes(1);
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 2, content: [{ id: 42 }, { id: 43 }] });
  await act(async () => { await result.current.list.refetch(); });
  await waitFor(() => expect(result.current.card.summary.readyToRequestReturn).toBe(2));
  expect(result.current.list.data?.totalElements).toBe(2);
});
