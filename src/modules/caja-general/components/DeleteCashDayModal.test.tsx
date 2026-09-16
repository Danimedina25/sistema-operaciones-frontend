import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteCashDayModal } from './DeleteCashDayModal';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay } from '../types/caja-general.types';

const day: CashDay = {
  id: 8, fecha: '2026-09-15', version: 3, saldoInicial: 1000,
  saldoActual: 750, saldoContado: 750, diferencia: 0,
  apertura: emptyCounts(), cierre: emptyCounts(), observacionesCierre: null,
  createdAt: '2026-09-15T08:00:00', closedAt: '2026-09-15T19:00:00',
  abiertoPor: 1, abiertoPorNombre: 'Jefa de Cajas', cerradoPor: 1,
};

describe('DeleteCashDayModal', () => {
  it('muestra la información y exige confirmación exacta y motivo', () => {
    const onConfirm = vi.fn();
    render(<DeleteCashDayModal day={day} movementCount={4} isSubmitting={false} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('2026-09-15');
    expect(screen.getByRole('dialog')).toHaveTextContent('4');
    const button = screen.getByRole('button', { name: 'Eliminar corte definitivamente' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Motivo de eliminación'), { target: { value: 'Captura duplicada' } });
    fireEvent.change(screen.getByLabelText('Confirmación de eliminación'), { target: { value: 'eliminar' } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Confirmación de eliminación'), { target: { value: 'ELIMINAR' } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith('Captura duplicada');
  });

  it('no renderiza diálogo sin un corte seleccionado', () => {
    render(<DeleteCashDayModal day={null} movementCount={0} isSubmitting={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
