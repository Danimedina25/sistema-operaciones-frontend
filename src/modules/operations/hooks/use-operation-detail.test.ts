import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useOperationDetail } from './use-operation-detail';

const api = vi.hoisted(() => ({ getOperationById: vi.fn() }));
vi.mock('@/modules/operations/api/operations.api', () => api);

beforeEach(() => {
  vi.clearAllMocks();
  api.getOperationById.mockImplementation((id: number) => Promise.resolve({ id }));
});

it('refrescar la operación no vuelve al estado de carga, para no desmontar la vista', async () => {
  const { result } = renderHook(() => useOperationDetail(48));
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  const states: boolean[] = [];
  let release: (value: unknown) => void = () => {};
  api.getOperationById.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  let pending: Promise<void> = Promise.resolve();
  act(() => { pending = result.current.fetchOperation(); });
  states.push(result.current.isLoading);
  await act(async () => { release({ id: 48 }); await pending; });

  expect(states).toEqual([false]);
  expect(result.current.isLoading).toBe(false);
  expect(api.getOperationById).toHaveBeenCalledTimes(2);
});

it('la primera carga de otra operación sí muestra el estado de carga', async () => {
  const { result, rerender } = renderHook(({ id }) => useOperationDetail(id), { initialProps: { id: 48 } });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  api.getOperationById.mockImplementationOnce(() => new Promise(() => {}));
  rerender({ id: 49 });
  await waitFor(() => expect(result.current.isLoading).toBe(true));
});
