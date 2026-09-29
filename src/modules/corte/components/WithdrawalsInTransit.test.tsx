import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WithdrawalsInTransit } from './WithdrawalsInTransit';
import type { BankCashWithdrawal } from '@/modules/cash-withdrawals/types';

const pending = vi.fn();
const cancel = vi.fn();

vi.mock('@/modules/cash-withdrawals/api', () => ({
  cashWithdrawalsApi: { pending: () => pending(), cancel: (...args: unknown[]) => cancel(...args) },
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1 }, hasRole: () => true }),
}));

function withdrawal(id: number, monto: number): BankCashWithdrawal {
  return {
    id, registradoEn: '2026-09-29T10:15:00', bankAccountId: 4, cuenta: '', cuentaTitular: 'Operaciones SA',
    cuentaNumero: '00001111', banco: 'BANORTE', forma: 'RETIRO_CON_TARJETA', formaEtiqueta: 'Retiro con tarjeta',
    monto, referencia: null, comprobanteUrl: null, estatus: 'PENDIENTE', motivo: null, registradoPorId: 2,
    registradoPorNombre: 'Jefa de Cuentas', resueltoPorNombre: null, resueltoEn: null, cashMovementId: null,
  };
}

function mount(canCancel = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><WithdrawalsInTransit canCancel={canCancel} /></QueryClientProvider>);
}

beforeEach(() => {
  pending.mockReset().mockResolvedValue([withdrawal(1, 150.25), withdrawal(2, 100)]);
  cancel.mockReset().mockResolvedValue({});
});

describe('Efectivo en tránsito a Caja General', () => {
  it('resume cuántos retiros y cuánto dinero va en camino', async () => {
    mount();
    const summary = await screen.findByRole('button', { name: /Efectivo en tránsito/ });
    expect(summary).toHaveTextContent('2 retiros pendientes');
    expect(summary).toHaveTextContent('$250.25');
  });

  it('Cuentas puede cancelar un retiro pendiente con motivo', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Efectivo en tránsito/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Motivo'), { target: { value: 'Capturado dos veces' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar retiro' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith(1, 'Capturado dos veces'));
  });

  it('quien sólo consulta no ve la acción de cancelar', async () => {
    mount(false);
    fireEvent.click(await screen.findByRole('button', { name: /Efectivo en tránsito/ }));
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });
});
