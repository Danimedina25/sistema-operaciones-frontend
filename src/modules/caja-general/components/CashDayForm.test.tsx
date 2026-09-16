import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CashDayForm } from './CashDayForm';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';
const day: CashDay = { id: 1, fecha: '2026-09-14', version: 0, saldoInicial: 100, saldoActual: 100,
  saldoContado: null, diferencia: null, apertura: { ...emptyCounts(), D100: 1 }, cierre: {},
  createdAt: '2026-09-14T08:00:00', closedAt: null, observacionesCierre: null,
  abiertoPor: 1, abiertoPorNombre: 'Jefa de Cajas', cerradoPor: null };
describe('Formulario de apertura y cierre', () => {
  it('confirma el corte en cero con la fecha del día y permite volver sin guardar', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CashDayForm mode="close" day={{ ...day, saldoActual: 0 }} busy={false} onSubmit={submit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja con este conteo' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('2026-09-14');
    expect(screen.getByRole('dialog')).toHaveTextContent('$0.00');
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a capturar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja con este conteo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, registrar $0.00' }));
    await waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ saldoContado: 0, denominaciones: emptyCounts() })));
  });
  it('también requiere confirmar una apertura en cero', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CashDayForm mode="open" previous={null} busy={false} onSubmit={submit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('saldo inicial de apertura');
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, registrar $0.00' }));
    await waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ saldoInicial: 0 })));
  });
  it('hereda saldo y denominaciones del último corte y abre sin recapturarlos', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const previous = {
      ...day,
      closedAt: '2026-09-14T19:00:00',
      saldoContado: 100,
      cierre: { ...emptyCounts(), D50: 2 },
    };
    render(<CashDayForm mode="open" previous={previous} busy={false} onSubmit={submit} />);

    expect(screen.getByLabelText('Saldo inicial')).toHaveValue('100');
    expect(screen.getByLabelText('Saldo inicial')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Cantidad de $50.00')).toHaveValue(2);
    expect(screen.getByLabelText('Cantidad de $50.00')).toBeDisabled();
    expect(screen.getByText(/Saldo y denominaciones heredados/)).toHaveTextContent('2026-09-14');

    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      saldoInicial: 100,
      denominaciones: expect.objectContaining({ D50: 2, D100: 0 }),
    })));
  });
  it('no permite confirmar cero si la caja cambió mientras el diálogo estaba abierto', () => {
    const submit = vi.fn();
    const current = { ...day, saldoActual: 0 };
    const { rerender } = render(<CashDayForm mode="close" day={current} busy={false} onSubmit={submit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja con este conteo' }));
    rerender(<CashDayForm mode="close" day={{ ...current, version: 1 }} busy={false} onSubmit={submit} />);
    expect(screen.getByRole('button', { name: 'Sí, registrar $0.00' })).toBeDisabled();
    expect(submit).not.toHaveBeenCalled();
  });
  it('oculta el cero al enfocar y lo restaura al salir sin alterar el conteo', () => {
    render(<CashDayForm mode="open" previous={null} busy={false} onSubmit={vi.fn()} />);
    const quantity = screen.getByLabelText('Cantidad de $100.00');
    expect(quantity).toHaveValue(0);
    fireEvent.focus(quantity);
    expect(quantity).toHaveValue(null);
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    fireEvent.blur(quantity);
    expect(quantity).toHaveValue(0);
    fireEvent.focus(quantity);
    fireEvent.change(quantity, { target: { value: '3' } });
    fireEvent.blur(quantity);
    fireEvent.focus(quantity);
    expect(quantity).toHaveValue(3);
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    fireEvent.change(quantity, { target: { value: '' } });
    expect(screen.getByText('$0.00')).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Cantidad de $0.50'), { target: { value: '199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja con este conteo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Explica la diferencia');
    fireEvent.change(screen.getByLabelText(/Observaciones del cierre/), { target: { value: 'Faltante de moneda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja con este conteo' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ saldoContado: 99.5, version: 0, observaciones: 'Faltante de moneda' })));
  });
  it('no acepta silenciosamente una versión actualizada mientras se cuenta', () => {
    const submit = vi.fn();
    const { rerender } = render(<CashDayForm mode="close" day={day} busy={false} onSubmit={submit} />);
    rerender(<CashDayForm mode="close" day={{ ...day, version: 1, saldoActual: 200 }} busy={false} onSubmit={submit} />);
    expect(screen.getByRole('button', { name: 'Cerrar caja con este conteo' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('cambió durante el conteo');
  });
});
