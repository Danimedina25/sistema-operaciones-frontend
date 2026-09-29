import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingWithdrawalsInbox } from './PendingWithdrawalsInbox';
import type { BankCashWithdrawal } from '@/modules/cash-withdrawals/types';

const pending = vi.fn();
const confirm = vi.fn();
const reject = vi.fn();

vi.mock('@/modules/cash-withdrawals/api', () => ({
  cashWithdrawalsApi: {
    pending: () => pending(),
    confirm: (...args: unknown[]) => confirm(...args),
    reject: (...args: unknown[]) => reject(...args),
  },
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1 }, hasRole: () => true }),
}));

const withdrawal: BankCashWithdrawal = {
  id: 5, registradoEn: '2026-09-29T10:15:00', bankAccountId: 4, cuenta: 'Operaciones SA — BANORTE — 00001111',
  cuentaTitular: 'Operaciones SA', cuentaNumero: '00001111', banco: 'BANORTE', forma: 'RETIRO_SIN_TARJETA',
  formaEtiqueta: 'Retiro sin tarjeta', monto: 300, referencia: 'Operador Juan', comprobanteUrl: null,
  estatus: 'PENDIENTE', motivo: null, registradoPorId: 2, registradoPorNombre: 'Jefa de Cuentas',
  resueltoPorNombre: null, resueltoEn: null, cashMovementId: null,
};

function mount(canResolve = true, openDayId: number | null = 1) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><PendingWithdrawalsInbox canResolve={canResolve} openDayId={openDayId} /></QueryClientProvider>);
}

beforeEach(() => {
  pending.mockReset().mockResolvedValue([withdrawal]);
  confirm.mockReset().mockResolvedValue({ ...withdrawal, estatus: 'CONFIRMADO' });
  reject.mockReset().mockResolvedValue({ ...withdrawal, estatus: 'RECHAZADO' });
});

describe('Retiros por confirmar', () => {
  it('lista cada retiro con su cuenta, forma, beneficiario y monto', async () => {
    mount();
    const row = (await screen.findByText('Retiro sin tarjeta')).closest('tr') as HTMLElement;
    expect(row).toHaveTextContent('BANORTE');
    expect(row).toHaveTextContent('Operaciones SA');
    expect(row).toHaveTextContent('Caja General');
    expect(row).toHaveTextContent('$300.00');
    expect(row).toHaveTextContent('Jefa de Cuentas');
    expect(row).toHaveTextContent('Operador Juan');
  });

  it('confirma sólo cuando el desglose suma exactamente el monto', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
    const dialog = screen.getByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Confirmar entrada a caja' });
    expect(submit).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    expect(within(dialog).getByText(/Faltan \$100\.00 por contar/)).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('Cantidad de $100.00'), { target: { value: '3' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(confirm.mock.calls[0][0]).toBe(5);
    expect(confirm.mock.calls[0][1]).toMatchObject({ diaCajaId: 1, denominaciones: expect.objectContaining({ D100: 3 }) });
  });

  it('rechaza con motivo obligatorio', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rechazar retiro' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('motivo');
    expect(reject).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Motivo'), { target: { value: 'No llegó el efectivo' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rechazar retiro' }));
    await waitFor(() => expect(reject).toHaveBeenCalledWith(5, 'No llegó el efectivo'));
  });

  it('sin caja abierta de hoy no se puede confirmar', async () => {
    mount(true, null);
    expect(await screen.findByRole('button', { name: 'Confirmar' })).toBeDisabled();
    expect(screen.getByText(/Abre la caja de hoy/)).toBeInTheDocument();
  });

  it('quien sólo consulta ve la bandeja sin acciones', async () => {
    mount(false);
    await screen.findByText('Retiro sin tarjeta');
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
  });

  it('no aparece cuando no hay retiros pendientes', async () => {
    pending.mockResolvedValue([]);
    mount();
    await waitFor(() => expect(pending).toHaveBeenCalled());
    expect(screen.queryByText('Retiros por confirmar')).not.toBeInTheDocument();
  });
});
