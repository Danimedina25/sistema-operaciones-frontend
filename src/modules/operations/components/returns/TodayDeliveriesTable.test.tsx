import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ReturnInstallment } from '../../types/operations.types.ts';
import { TodayDeliveriesTable } from './TodayDeliveriesTable';

const scheduled: ReturnInstallment = {
  id: 7, returnRequestId: 3, operationId: 42, monto: 1500,
  tipoPago: 'RETIRO_SIN_TARJETA', estatus: 'PROGRAMADA',
  clienteNombre: 'Cliente Norte', autorizadoParaRecibir1: 'María López',
  fechaHoraRecoleccion: '2026-10-12T13:30:00', cerradoPorJefa: false,
};

it('muestra la entrega sin scroll horizontal y conserva la acción de cierre', () => {
  const onMarkAsDelivered = vi.fn();
  render(<TodayDeliveriesTable deliveries={[scheduled]} onMarkAsDelivered={onMarkAsDelivered} />);
  const table = screen.getByRole('table');
  expect(within(table).getAllByRole('columnheader')).toHaveLength(6);
  expect(within(table).getByText('María López')).toBeInTheDocument();
  expect(within(table).getByText('$1,500.00')).toBeInTheDocument();
  fireEvent.click(within(table).getByRole('button', { name: 'Marcar entregado' }));
  expect(onMarkAsDelivered).toHaveBeenCalledWith(scheduled);
  expect(screen.getByTestId('data-table-mobile')).toHaveTextContent('Cliente Norte');
});

it('oculta acciones de cierre para entregas terminadas', () => {
  render(<TodayDeliveriesTable deliveries={[{ ...scheduled, estatus: 'COMPLETADA', cerradoPorJefa: true }]} onMarkAsDelivered={vi.fn()} />);
  expect(within(screen.getByRole('table')).queryByRole('button', { name: 'Marcar entregado' })).not.toBeInTheDocument();
});
