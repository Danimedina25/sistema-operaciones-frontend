import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { EditReturnPaymentForm } from './EditReturnPaymentForm';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';
vi.mock('../../hooks/returns/use-operation-returns.js', () => ({ useReturnDestinationAccountSuggestions: () => ({ data: [] }) }));
it('edita el retorno conservando el monto y autorizado, sin mostrar identificadores internos en campos', async () => {
  const submit = vi.fn().mockResolvedValue(undefined), close = vi.fn();
  render(<ActionDrawer open title="Editar retorno" onClose={close}><EditReturnPaymentForm payment={{ id: 12, operationId: 47, monto: 60, tipoPago: 'EFECTIVO', autorizadoParaRecibirEfectivo1: 'Ana' } as ReturnPaymentResponse}
    clientId={163} isSubmitting={false} onSubmit={submit} onCancel={close} /></ActionDrawer>);
  expect(screen.queryByText('Monto a retornar 163')).not.toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'Actualizar solicitud' });
  expect(screen.getByRole('dialog').querySelector('footer')).toContainElement(button);
  fireEvent.click(button);
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0][0]).toMatchObject({ id: 12, operationId: 47, monto: 60, tipoPago: 'EFECTIVO', autorizadoParaRecibirEfectivo1: 'Ana' });
});
