import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CashDayForm } from './CashDayForm';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';
const day: CashDay = { id: 1, fecha: '2026-09-14', version: 0, saldoInicial: 100, saldoActual: 100,
  saldoContado: null, diferencia: null, apertura: { ...emptyCounts(), D100: 1 }, cierre: {},
  closedAt: null, observacionesCierre: null, abiertoPor: 1, cerradoPor: null };
describe('Formulario de apertura y cierre', () => {
  it('oculta el cero al enfocar y lo restaura al salir sin alterar el conteo', () => {
    render(<CashDayForm mode="open" previous={null} busy={false} onSubmit={vi.fn()} />);
    const quantity = screen.getByLabelText('Cantidad de $100.00');
    expect(quantity).toHaveValue(0);
    fireEvent.focus(quantity);
    expect(quantity).toHaveValue(null);
    expect(screen.getByText('Total contado: $0.00')).toBeInTheDocument();
    fireEvent.blur(quantity);
    expect(quantity).toHaveValue(0);
    fireEvent.focus(quantity);
    fireEvent.change(quantity, { target: { value: '3' } });
    fireEvent.blur(quantity);
    fireEvent.focus(quantity);
    expect(quantity).toHaveValue(3);
    expect(screen.getByText('Total contado: $300.00')).toBeInTheDocument();
    fireEvent.change(quantity, { target: { value: '' } });
    expect(screen.getByText('Total contado: $0.00')).toBeInTheDocument();
    fireEvent.blur(quantity);
    expect(quantity).toHaveValue(0);
  });
  it('impide apertura cuyo desglose no coincide y envía apertura corregida', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CashDayForm mode="open" previous={null} busy={false} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText('Saldo inicial'), { target: { value: '100.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));
    expect(screen.getByRole('alert')).toHaveTextContent('exactamente'); expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $0.50'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ saldoInicial: 100.5 })));
  });
  it('exige motivo por diferencia y envía versión del conteo', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CashDayForm mode="close" day={day} busy={false} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText('Saldo contado'), { target: { value: '99.50' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $0.50'), { target: { value: '199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cierre de caja' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Explica la diferencia');
    fireEvent.change(screen.getByLabelText(/Observaciones del cierre/), { target: { value: 'Faltante de moneda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cierre de caja' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ saldoContado: 99.5, version: 0, observaciones: 'Faltante de moneda' })));
  });
  it('no acepta silenciosamente una versión actualizada mientras se cuenta', () => {
    const submit = vi.fn();
    const { rerender } = render(<CashDayForm mode="close" day={day} busy={false} onSubmit={submit} />);
    rerender(<CashDayForm mode="close" day={{ ...day, version: 1, saldoActual: 200 }} busy={false} onSubmit={submit} />);
    expect(screen.getByRole('button', { name: 'Confirmar cierre de caja' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('cambió durante el conteo');
  });
});
