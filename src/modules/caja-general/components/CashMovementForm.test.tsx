import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CashMovementForm } from './CashMovementForm';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

const accounts: BankAccountResponse[] = [
  { id: 3, banco: 'BBVA', titular: 'Operaciones SA', numeroCuenta: '00012345678', clabe: '012345678901234567', activo: true, createdAt: '', updatedAt: '' },
  { id: 7, banco: 'Banorte', titular: 'Tesorería MX', numeroCuenta: '99987654321', clabe: '072345678901234567', activo: true, createdAt: '', updatedAt: '' },
  { id: 9, banco: 'Bajío', titular: 'Cuenta Vieja', numeroCuenta: '55500011122', clabe: '030345678901234567', activo: false, createdAt: '', updatedAt: '' },
];

vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts, isLoading: false, loadBankAccounts: vi.fn(), loadBankAccount: vi.fn(), setAccounts: vi.fn() }),
}));

const day: CashDay = {
  id: 1, fecha: '2026-09-14', version: 0, saldoInicial: 100, saldoActual: 100,
  saldoContado: null, diferencia: null, apertura: emptyCounts(), cierre: {}, closedAt: null,
  denominacionesEsperadas: null, observacionesCierre: null, createdAt: '2026-09-14T08:00:00', abiertoPor: 1,
  abiertoPorNombre: 'Jefa de Cajas', cerradoPor: null,
};

function mount(direction: 'ENTRADA' | 'SALIDA', submit: (data: unknown) => Promise<unknown>) {
  render(<CashMovementForm direction={direction} day={day} busy={false} onSubmit={submit} />);
}

/** Escribe en el combobox y confirma la primera coincidencia con el teclado. */
function pickAccount(search: string) {
  const combobox = screen.getByLabelText('Banco');
  fireEvent.focus(combobox);
  fireEvent.change(combobox, { target: { value: search } });
  fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  fireEvent.keyDown(combobox, { key: 'Enter' });
}

describe('Movimientos de caja', () => {
  it('bloquea una salida superior al saldo', () => {
    const submit = vi.fn(); mount('SALIDA', submit);
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar salida' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saldo insuficiente');
    expect(submit).not.toHaveBeenCalled();
  });

  it('ofrece solo conceptos físicos', () => {
    mount('ENTRADA', vi.fn());
    expect(screen.getByRole('option', { name: 'Efectivo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cheque cobrado' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Retiro sin tarjeta' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Transferencia' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Depósito' })).not.toBeInTheDocument();
  });

  it('no ofrece como salida los conceptos que retiran del banco', () => {
    mount('SALIDA', vi.fn());
    expect(screen.getByRole('option', { name: 'Efectivo' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Cheque cobrado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Retiro sin tarjeta' })).not.toBeInTheDocument();
  });

  it('exige una cuenta bancaria real para el cheque cobrado y envía su id', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); mount('ENTRADA', submit);

    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'CHEQUE' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona la cuenta bancaria');
    expect(submit).not.toHaveBeenCalled();

    pickAccount('Operaciones');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      direccion: 'ENTRADA', tipo: 'CHEQUE', concepto: 'Cheque cobrado',
      banco: null, bankAccountId: 3, monto: 100, parcialidadId: null,
    })));
  });

  it('busca la cuenta por titular, banco y número, y omite las inactivas', () => {
    mount('ENTRADA', vi.fn());
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'CHEQUE' } });
    const combobox = screen.getByLabelText('Banco');
    fireEvent.focus(combobox);

    fireEvent.change(combobox, { target: { value: 'Tesorería' } });
    expect(screen.getByRole('option', { name: /Tesorería MX/ })).toBeInTheDocument();

    fireEvent.change(combobox, { target: { value: 'banorte' } });
    expect(screen.getByRole('option', { name: /Tesorería MX/ })).toBeInTheDocument();

    fireEvent.change(combobox, { target: { value: '99987' } });
    expect(screen.getByRole('option', { name: /Tesorería MX/ })).toBeInTheDocument();

    // La cuenta inactiva no está disponible para capturas nuevas.
    fireEvent.change(combobox, { target: { value: 'Cuenta Vieja' } });
    expect(screen.queryByRole('option', { name: /Cuenta Vieja/ })).not.toBeInTheDocument();
    expect(screen.getByText('No se encontraron cuentas')).toBeInTheDocument();
  });

  it('el retiro sin tarjeta también exige la cuenta real', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); mount('ENTRADA', submit);
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'RETIRO_SIN_TARJETA' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona la cuenta bancaria');

    pickAccount('Tesorería');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'RETIRO_SIN_TARJETA', banco: null, bankAccountId: 7,
    })));
  });

  it('cambiar a efectivo limpia la cuenta seleccionada', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); mount('ENTRADA', submit);
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'CHEQUE' } });
    pickAccount('Operaciones');
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'EFECTIVO' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'EFECTIVO', banco: null, bankAccountId: null,
    })));
  });

  it('conserva la clave de idempotencia cuando se reintenta sin cambiar datos', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('network')); mount('ENTRADA', submit);
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[0][0].requestId).toEqual(submit.mock.calls[1][0].requestId);
  });

  it('cambiar de cuenta renueva la clave de idempotencia: ya es otro movimiento', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('network')); mount('ENTRADA', submit);
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'CHEQUE' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });

    pickAccount('Operaciones');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await screen.findByRole('alert');

    pickAccount('Tesorería');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));

    expect(submit.mock.calls[0][0].bankAccountId).toBe(3);
    expect(submit.mock.calls[1][0].bankAccountId).toBe(7);
    expect(submit.mock.calls[0][0].requestId).not.toEqual(submit.mock.calls[1][0].requestId);
  });
});
