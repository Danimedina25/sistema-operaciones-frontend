import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useFormSubmission } from './use-form-submission';

it('envía los valores sin modificarlos y bloquea llamadas simultáneas', async () => {
  let finish!: () => void;
  const save = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const { result } = renderHook(() => useFormSubmission(save));
  let pending!: Promise<void>;
  act(() => { pending = result.current.submit({ roleId: 2, porcentajeComision: 1.25 }); });
  expect(result.current.busy).toBe(true);
  await act(async () => { await result.current.submit({ roleId: 3 }); });
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith({ roleId: 2, porcentajeComision: 1.25 });
  await act(async () => { finish(); await pending; });
  expect(result.current.busy).toBe(false);
});

it('captura el error del servidor y permite reintentar', async () => {
  const save = vi.fn().mockRejectedValueOnce({ isAxiosError: true, response: { data: { message: 'No autorizado' } } }).mockResolvedValueOnce(undefined);
  const { result } = renderHook(() => useFormSubmission(save));
  await act(async () => { await result.current.submit('datos'); });
  expect(result.current.submitError).toBe('No autorizado');
  await act(async () => { await result.current.submit('datos'); });
  expect(save).toHaveBeenCalledTimes(2);
  expect(result.current.submitError).toBe('');
});

it('respeta el bloqueo externo', async () => {
  const save = vi.fn();
  const { result } = renderHook(() => useFormSubmission(save, true));
  await act(async () => { await result.current.submit(undefined); });
  expect(save).not.toHaveBeenCalled();
});
