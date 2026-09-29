import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CashMovementForm } from './CashMovementForm';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';

const day: CashDay = {
  id: 1, fecha: '2026-09-14', version: 0, saldoInicial: 100, saldoActual: 100,
  saldoContado: null, diferencia: null, apertura: emptyCounts(), cierre: {}, closedAt: null,
  denominacionesEsperadas: null, observacionesCierre: null, createdAt: '2026-09-14T08:00:00', abiertoPor: 1,
  abiertoPorNombre: 'Jefa de Cajas', cerradoPor: null,
};

function mount(direction: 'ENTRADA' | 'SALIDA', submit: (data: unknown) => Promise<unknown>) {
  render(<CashMovementForm direction={direction} day={day} busy={false} onSubmit={submit} />);
}

describe('Movimientos de caja', () => {
  it('bloquea una salida superior al saldo', () => {
    const submit = vi.fn(); mount('SALIDA', submit);
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar salida' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saldo insuficiente');
    expect(submit).not.toHaveBeenCalled();
  });

  it('sólo captura efectivo, sin banco ni cuenta', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); mount('ENTRADA', submit);
    // Los cheques y retiros de una cuenta entran desde "Retiros por confirmar".
    expect(screen.queryByLabelText('Concepto')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Banco')).not.toBeInTheDocument();
    expect(screen.getByText(/Retiros por confirmar/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toMatchObject({
      direccion: 'ENTRADA', tipo: 'EFECTIVO', concepto: 'Efectivo', banco: null, bankAccountId: null, monto: 200,
    });
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

  it('cambiar el desglose renueva la clave de idempotencia: ya es otro movimiento', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('network')); mount('ENTRADA', submit);
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await screen.findByRole('alert');

    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));

    expect(submit.mock.calls[0][0].requestId).not.toEqual(submit.mock.calls[1][0].requestId);
  });
});
