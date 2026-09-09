import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useWorkOperations } from './use-work-operations';
import { emptyOperationFilters } from '../utils/staff-work';
const mocks = vi.hoisted(() => ({ userId: 1, get: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: mocks.userId }, hasRole: () => false }) }));
vi.mock('../api/operations.api', () => ({ getOperations: mocks.get, getMyOperations: mocks.get, getOperationsWithRequestedReturns: mocks.get }));
beforeEach(() => { mocks.userId = 1; vi.clearAllMocks(); });
function setup() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
it('ignora respuestas de períodos anteriores y separa caché por usuario', async () => {
  let finishOld!: (value: unknown) => void;
  mocks.get.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; })).mockResolvedValue({ content: [], totalElements: 7 });
  const { result, rerender } = renderHook(({ dateFilter }: { dateFilter: 'LAST_MONTH' | 'THIS_MONTH' }) => useWorkOperations({ ...emptyOperationFilters, dateFilter, workQueue: 'CASH_INCOME' }), { initialProps: { dateFilter: 'LAST_MONTH' }, wrapper: setup() });
  rerender({ dateFilter: 'THIS_MONTH' });
  await waitFor(() => expect(result.current.data?.totalElements).toBe(7));
  await act(async () => finishOld({ content: [], totalElements: 0 }));
  expect(result.current.data?.totalElements).toBe(7);
  mocks.userId = 2; mocks.get.mockResolvedValue({ content: [], totalElements: 9 }); rerender({ dateFilter: 'THIS_MONTH' });
  await waitFor(() => expect(result.current.data?.totalElements).toBe(9));
});
it('contador y listado reutilizan la misma consulta paginada', async () => {
  mocks.get.mockResolvedValue({ content: [], totalElements: 27, totalPages: 3 });
  const filters = { ...emptyOperationFilters, workQueue: 'BANK_RETURNS' };
  const { result } = renderHook(() => ({ card: useWorkOperations(filters, 0, true), list: useWorkOperations({ ...filters }, 0, true) }), { wrapper: setup() });
  await waitFor(() => expect(result.current.card.data?.totalElements).toBe(27));
  expect(result.current.list.data?.totalElements).toBe(27); expect(mocks.get).toHaveBeenCalledTimes(1);
});
