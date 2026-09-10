import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { useDeleteOperation } from './use-delete-operation';
import type { PaymentOperationResponse } from '../types/operations.types.ts';

const mocks = vi.hoisted(() => ({
  deleteOperation: vi.fn(),
  deleteProof: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/modules/operations/api/operations.api', () => ({
  deleteOperation: mocks.deleteOperation,
}));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({
  deleteOperationProofByUrl: mocks.deleteProof,
}));
vi.mock('react-hot-toast', () => ({
  default: { success: mocks.success, error: mocks.error },
}));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const operation = {
  id: 42,
  clienteNombre: 'Cliente Demo',
  montoTotal: 10000,
  pagos: [
    { comprobanteUrl: 'https://files/a.pdf', comprobanteValidacionUrl: null },
    { comprobanteUrl: 'https://files/b.pdf', comprobanteValidacionUrl: 'https://files/c.pdf' },
  ],
} as unknown as PaymentOperationResponse;

function backendError(status: number, message: string) {
  return new AxiosError('rejected', String(status), undefined, null, {
    status,
    statusText: 'Conflict',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: { success: false, message },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.deleteOperation.mockResolvedValue(undefined);
  mocks.deleteProof.mockResolvedValue(undefined);
});

it('no llama al backend hasta que se confirma la eliminación', () => {
  renderHook(() => useDeleteOperation(), { wrapper: wrapper() });

  expect(mocks.deleteOperation).not.toHaveBeenCalled();
});

it('marca isDeleting mientras la petición está en curso y evita envíos duplicados', async () => {
  let finish!: () => void;
  mocks.deleteOperation.mockImplementationOnce(
    () => new Promise<void>((resolve) => { finish = resolve; }),
  );

  const onSuccess = vi.fn();
  const { result } = renderHook(() => useDeleteOperation({ onSuccess }), { wrapper: wrapper() });

  let first!: Promise<boolean>;
  act(() => { first = result.current.submitDeleteOperation(operation); });
  await waitFor(() => expect(result.current.isDeleting).toBe(true));

  // Un segundo clic durante la petición no debe disparar otro DELETE.
  const duplicate = await act(async () => result.current.submitDeleteOperation(operation));
  expect(duplicate).toBe(false);
  expect(mocks.deleteOperation).toHaveBeenCalledTimes(1);

  await act(async () => { finish(); await first; });
  await waitFor(() => expect(result.current.isDeleting).toBe(false));
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it('limpia los archivos del comprobante solo después de que el backend confirma', async () => {
  const { result } = renderHook(() => useDeleteOperation(), { wrapper: wrapper() });

  await act(async () => { await result.current.submitDeleteOperation(operation); });

  expect(mocks.deleteOperation).toHaveBeenCalledWith(42);
  expect(mocks.deleteProof.mock.calls.map(([url]) => url)).toEqual([
    'https://files/a.pdf',
    'https://files/b.pdf',
    'https://files/c.pdf',
  ]);
  expect(mocks.success).toHaveBeenCalledWith('Operación eliminada permanentemente');
});

it('avisa sin revertir la eliminación cuando falla la limpieza del almacenamiento', async () => {
  mocks.deleteProof.mockRejectedValueOnce(new Error('storage caído'));
  const onSuccess = vi.fn();

  const { result } = renderHook(() => useDeleteOperation({ onSuccess }), { wrapper: wrapper() });

  let deleted!: boolean;
  await act(async () => { deleted = await result.current.submitDeleteOperation(operation); });

  expect(deleted).toBe(true);
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(mocks.error).toHaveBeenCalledWith(
    expect.stringContaining('no se pudieron borrar 1 archivo(s)'),
  );
});

it('conserva la operación y muestra el mensaje del backend cuando el estatus cambió', async () => {
  mocks.deleteOperation.mockRejectedValueOnce(
    backendError(409, 'Solo se pueden eliminar operaciones pendientes de validación'),
  );
  const onSuccess = vi.fn();
  const onRejected = vi.fn();

  const { result } = renderHook(
    () => useDeleteOperation({ onSuccess, onRejected }),
    { wrapper: wrapper() },
  );

  let deleted!: boolean;
  await act(async () => { deleted = await result.current.submitDeleteOperation(operation); });

  expect(deleted).toBe(false);
  expect(onSuccess).not.toHaveBeenCalled();
  // Se vuelven a consultar los datos para dejar de mostrar un estatus viejo.
  expect(onRejected).toHaveBeenCalledTimes(1);
  expect(mocks.error).toHaveBeenCalledWith(
    'Solo se pueden eliminar operaciones pendientes de validación',
  );
  expect(mocks.deleteProof).not.toHaveBeenCalled();
});
