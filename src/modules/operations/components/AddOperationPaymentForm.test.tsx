import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AddOperationPaymentForm } from './AddOperationPaymentForm';

it('Registrar todo usa el saldo pendiente del backend sin enviar el pago', async () => {
  const onSubmit = vi.fn();
  render(<AddOperationPaymentForm isSubmitting={false} bankAccounts={[]} montoTotal={100000} montoRegistrado={50000} saldoPendiente={50000} onSubmit={onSubmit} />);

  await userEvent.click(screen.getByRole('button', { name: 'Registrar todo' }));

  expect(screen.getByPlaceholderText('1,000.00')).toHaveValue('50,000.00');
  expect(onSubmit).not.toHaveBeenCalled();
});
