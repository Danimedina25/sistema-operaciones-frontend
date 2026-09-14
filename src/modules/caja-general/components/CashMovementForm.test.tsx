import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { CashMovementForm } from './CashMovementForm';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 7 } }) }));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({ uploadOperationProof: vi.fn() }));
vi.mock('../api/caja-general.api', () => ({ cajaGeneralApi: { deliveries: vi.fn().mockResolvedValue([{ id: 9, operacionId: 42, monto: 100, fechaRealizacion: '2026-09-14T10:00:00', personaQueRecibioEfectivo: 'Receptor' }]) } }));
const day: CashDay = { id: 1, fecha: '2026-09-14', version: 0, saldoInicial: 100, saldoActual: 100,
  saldoContado: null, diferencia: null, apertura: emptyCounts(), cierre: {}, closedAt: null,
  observacionesCierre: null, abiertoPor: 1, cerradoPor: null };
function mount(submit: (data: unknown) => Promise<unknown>) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CashMovementForm day={day} busy={false} onSubmit={submit} /></QueryClientProvider>);
}
describe('Movimientos de caja', () => {
  it('bloquea una salida superior al saldo', () => {
    const submit = vi.fn(); mount(submit);
    fireEvent.change(screen.getByLabelText('Movimiento'), { target: { value: 'SALIDA' } });
    fireEvent.change(screen.getByLabelText('Importe'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'Gasto' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saldo insuficiente'); expect(submit).not.toHaveBeenCalled();
  });
  it('vincula entrega por referencia sin enviar otro monto', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); mount(submit);
    fireEvent.change(screen.getByLabelText('Movimiento'), { target: { value: 'SALIDA' } });
    fireEvent.change(screen.getByLabelText('Origen de la salida'), { target: { value: 'linked' } });
    await screen.findByRole('option', { name: /Operación #42/ });
    fireEvent.change(screen.getByLabelText('Entrega de efectivo completada'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ parcialidadId: 9, monto: null, direccion: 'SALIDA', tipo: 'EFECTIVO' })));
  });
  it('conserva la clave de idempotencia cuando se reintenta sin cambiar datos', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('network')); mount(submit);
    fireEvent.change(screen.getByLabelText('Importe'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'Ingreso' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[0][0].requestId).toEqual(submit.mock.calls[1][0].requestId);
  });
});
