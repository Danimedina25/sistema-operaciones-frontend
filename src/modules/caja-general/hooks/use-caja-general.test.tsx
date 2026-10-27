import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CashDay } from '../types/caja-general.types';

const mocks = vi.hoisted(() => ({
  success: vi.fn(), error: vi.fn(), neutral: vi.fn(),
  open: vi.fn(), close: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(mocks.neutral, { success: mocks.success, error: mocks.error }),
}));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
vi.mock('../api/caja-general.api', () => ({
  cajaGeneralApi: { latest: vi.fn(), ledger: vi.fn(), open: mocks.open, close: mocks.close, movement: vi.fn(), deleteDay: vi.fn() },
}));

import { useCajaGeneral } from './use-caja-general';

function day(overrides: Partial<CashDay> = {}): CashDay {
  return { id: 9, fecha: '2026-10-27', saldoInicial: 54461, saldoActual: 54461, saldoContado: null, diferencia: null, ...overrides } as CashDay;
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useCajaGeneral('', ''), { wrapper }).result;
}

beforeEach(() => vi.clearAllMocks());

describe('avisos al abrir y cerrar la caja', () => {
  it('al abrir avisa la fecha y el saldo inicial', async () => {
    mocks.open.mockResolvedValue(day());
    const result = setup();
    await act(() => result.current.open.mutateAsync({} as never));
    expect(mocks.success).toHaveBeenCalledWith('Caja abierta · 27 oct 2026\nSaldo inicial $54,461.00', expect.anything());
  });

  it.each([
    [40, 'Sobrante de $40.00'],
    [-40, 'Faltante de $40.00'],
    [0, 'Sin diferencia'],
  ])('al cerrar con diferencia %s avisa "%s"', async (diferencia, detail) => {
    mocks.close.mockResolvedValue(day({ saldoContado: 54461 + diferencia, diferencia }));
    const result = setup();
    await act(() => result.current.close.mutateAsync({ id: 9, data: {} as never }));
    expect(mocks.neutral).toHaveBeenCalledWith(
      `Caja cerrada · 27 oct 2026\nSaldo contado ${diferencia < 0 ? '$54,421.00' : diferencia > 0 ? '$54,501.00' : '$54,461.00'} · ${detail}`,
      expect.objectContaining({ icon: expect.anything() }),
    );
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('si el servidor rechaza el cierre muestra su mensaje', async () => {
    mocks.close.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'La caja ya está cerrada' } } });
    const result = setup();
    await act(async () => { await result.current.close.mutateAsync({ id: 9, data: {} as never }).catch(() => undefined); });
    expect(mocks.error).toHaveBeenCalledTimes(1);
    expect(mocks.neutral).not.toHaveBeenCalled();
  });
});
