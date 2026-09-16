import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CashMovementForm } from './CashMovementForm';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';

const day: CashDay = {
  id: 1, fecha: '2026-09-14', version: 0, saldoInicial: 100, saldoActual: 100,
  saldoContado: null, diferencia: null, apertura: emptyCounts(), cierre: {}, closedAt: null,
  observacionesCierre: null, createdAt: '2026-09-14T08:00:00', abiertoPor: 1,
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

  it('ofrece solo conceptos físicos y exige banco cuando aplica', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); mount('ENTRADA', submit);
    const concept = screen.getByLabelText('Concepto');
    expect(screen.getByRole('option', { name: 'Efectivo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cheque cobrado' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Retiro con tarjeta' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Transferencia' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Depósito' })).not.toBeInTheDocument();

    fireEvent.change(concept, { target: { value: 'CHEQUE' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona el banco');
    fireEvent.change(screen.getByLabelText('Banco'), { target: { value: 'BBVA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      direccion: 'ENTRADA', tipo: 'CHEQUE', concepto: 'Cheque cobrado', banco: 'BBVA', monto: 100,
      parcialidadId: null,
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
});
