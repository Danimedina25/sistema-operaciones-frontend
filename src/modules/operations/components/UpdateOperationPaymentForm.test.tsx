import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { UpdateOperationPaymentForm } from './UpdateOperationPaymentForm';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import type { OperationPaymentResponse, PaymentOperationResponse } from '../types/operations.types.ts';

it('mantiene la edición y su importe original con acciones fijas en el panel', async () => {
  const submit = vi.fn().mockResolvedValue(undefined), close = vi.fn();
  render(<ActionDrawer open title="Editar ingreso" onClose={close}><UpdateOperationPaymentForm
    operation={{ montoTotal: 100, montoRegistrado: 60, saldoPendientePorRegistrar: 40 } as PaymentOperationResponse}
    payment={{ id: 11, monto: 60, tipoPago: 'EFECTIVO', fechaComprobante: '2026-10-21T10:00:00', comprobanteUrl: 'https://example.test/pago.jpg' } as OperationPaymentResponse}
    isSubmitting={false} bankAccounts={[]} onSubmit={submit} onCancel={close} /></ActionDrawer>);
  const button = screen.getByRole('button', { name: 'Guardar cambios' });
  expect(screen.getByRole('dialog').querySelector('footer')).toContainElement(button);
  fireEvent.change(screen.getByPlaceholderText('1,000.00'), { target: { value: '40.50' } });
  fireEvent.click(button);
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0][0]).toMatchObject({ monto: 40.5, tipoPago: 'EFECTIVO', cuentaDestinoId: 0 });
});
