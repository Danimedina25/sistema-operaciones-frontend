import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { ConfirmWithdrawalModal } from './ConfirmWithdrawalModal';

const withdrawal: BankCashWithdrawal = {
  id: 7, version: 0, registradoEn: '2026-10-16T08:00:00', bankAccountId: 9,
  cuenta: 'BANORTE ••8998', cuentaTitular: 'Oficina', cuentaNumero: '1234568998', banco: 'BANORTE',
  forma: 'RETIRO_SIN_TARJETA', formaEtiqueta: 'Retiro sin tarjeta (RST)', monto: 1200,
  referencia: null, comprobanteUrl: null, estatus: 'PENDIENTE', motivo: null,
  registradoPorId: 3, registradoPorNombre: 'Jefa de Cuentas', resueltoPorNombre: null,
  resueltoEn: null, cashMovementId: null,
};

describe('Confirmar retiro recibido', () => {
  it('usa las dos tablas de caja, muestra la diferencia y confirma solo el conteo exacto', async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmWithdrawalModal withdrawal={withdrawal} onClose={vi.fn()} onConfirm={confirm} />);
    expect(screen.getAllByRole('table')).toHaveLength(2);
    expect(screen.getByRole('group', { name: 'Conteo recibido' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    const button = screen.getByRole('button', { name: 'Confirmar entrada a caja' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Faltan $1,200.00 por capturar.');
    fireEvent.change(screen.getByLabelText('Cantidad de $1,000.00'), { target: { value: '1' } });
    expect(screen.getByRole('status')).toHaveTextContent('Faltan $200.00 por capturar.');
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '3' } });
    expect(screen.getByRole('status')).toHaveTextContent('Estás capturando $100.00 de más.');
    expect(screen.getByRole('status')).toHaveClass('border-red-200', 'bg-red-50', 'text-red-700');
    expect(screen.getByRole('status')).toHaveTextContent('El total contado debe ser igual al monto retirado de $1,200.00.');
    expect(button).toBeDisabled();
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    expect(screen.getByRole('status')).toHaveTextContent('Conteo completo');
    expect(screen.getByRole('status')).toHaveClass('bg-emerald-50');
    expect(screen.queryByText(/El total contado debe ser igual/)).not.toBeInTheDocument();
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(withdrawal, expect.objectContaining({ D1000: 1, D100: 2 })));
  });

  it('explica un retiro que no se puede contar con monedas de 50¢', () => {
    render(<ConfirmWithdrawalModal withdrawal={{ ...withdrawal, monto: 1200.25 }} onClose={vi.fn()} onConfirm={vi.fn()} />);
    const card = screen.getByRole('region', { name: 'Resumen del retiro' });
    expect(within(card).getByRole('alert')).toHaveTextContent('la moneda más chica es de $0.50');
    expect(screen.getByRole('button', { name: 'Confirmar entrada a caja' })).toBeDisabled();
  });
  it('conserva el conteo y el error visible si la confirmación falla, con acciones fijas', async () => {
    const confirm = vi.fn().mockRejectedValue({ isAxiosError: true, response: { data: { message: 'La caja está cerrada' } } });
    render(<ConfirmWithdrawalModal withdrawal={withdrawal} onClose={vi.fn()} onConfirm={confirm} />);
    const dialog = screen.getByRole('dialog', { name: 'Confirmar retiro recibido' });
    const button = within(dialog).getByRole('button', { name: 'Confirmar entrada a caja' });
    expect(dialog.querySelector('footer')).toContainElement(button);
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '12' } });
    fireEvent.click(button);
    const card = screen.getByRole('region', { name: 'Resumen del retiro' });
    expect(await within(card).findByRole('alert')).toHaveTextContent('La caja está cerrada');
    expect(card).toHaveClass('sticky', 'top-0');
    expect(within(card).getByText('Monto retirado')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad de $100.00')).toHaveValue(12);
    expect(button).toBeEnabled();
  });

});
