import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CreateOperationForm } from './CreateOperationForm';

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: () => false }) }));

function setup() {
  const onSubmit = vi.fn();
  const view = render(<CreateOperationForm isSubmitting={false} bankAccounts={[]} clientes={[]} commercialPartners={[]}
    porcentajeComisionOficinaDefault={0} levelOneUsers={[]} currentLevelOneId={27} currentLevelOneCommission={0}
    canAssignLevelOne={false} onSubmit={onSubmit} />);
  const amount = (name: string, value: string) => fireEvent.change(view.container.querySelector(`input[name="${name}"]`)!, { target: { value } });
  return { ...view, amount, onSubmit };
}

it('muestra cobertura parcial, bloquea al cubrir y se recupera al quitar o reducir pagos', async () => {
  const { amount } = setup();
  expect(screen.queryByRole('complementary', { name: 'Resumen de pagos de ingreso' })).not.toBeInTheDocument();
  amount('montoTotal', '100');
  amount('pagos.0.monto', '60');
  const summary = screen.getByRole('complementary', { name: 'Resumen de pagos de ingreso' });
  expect(summary).toHaveTextContent('$100.00');
  expect(summary).toHaveTextContent('$60.00');
  expect(summary).toHaveTextContent('$40.00');
  fireEvent.click(screen.getByRole('button', { name: 'Agregar otro pago' }));
  amount('pagos.1.monto', '40');
  expect(screen.getByRole('button', { name: 'Agregar otro pago' })).toBeDisabled();
  expect(summary).toHaveTextContent('Monto total cubierto');
  fireEvent.click(screen.getAllByRole('button', { name: 'Quitar' })[1]);
  expect(screen.getByRole('button', { name: 'Agregar otro pago' })).toBeEnabled();
  amount('pagos.0.monto', '100');
  expect(screen.getByRole('button', { name: 'Agregar otro pago' })).toBeDisabled();
  amount('pagos.0.monto', '90');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Agregar otro pago' })).toBeEnabled());
  expect(summary).toHaveTextContent('$10.00');
});

it('muestra el exceso al capturar de más o reducir el total y bloquea el envío', async () => {
  const { amount, onSubmit } = setup();
  amount('montoTotal', '100');
  amount('pagos.0.monto', '101');
  const summary = screen.getByRole('complementary', { name: 'Resumen de pagos de ingreso' });
  expect(within(summary).getByRole('alert')).toHaveTextContent('$1.00');
  expect(screen.getByRole('button', { name: 'Registrar operación' })).toBeDisabled();
  expect(onSubmit).not.toHaveBeenCalled();
  amount('pagos.0.monto', '80');
  amount('montoTotal', '70');
  expect(within(summary).getByRole('alert')).toHaveTextContent('$10.00');
  amount('montoTotal', '100');
  await waitFor(() => expect(within(summary).queryByRole('alert')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Agregar otro pago' })).toBeEnabled();
});

it('considera cobertura exacta con pagos de diez y veinte centavos', async () => {
  const { amount } = setup();
  amount('montoTotal', '0.30');
  amount('pagos.0.monto', '0.10');
  fireEvent.click(screen.getByRole('button', { name: 'Agregar otro pago' }));
  amount('pagos.1.monto', '0.20');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Agregar otro pago' })).toBeDisabled());
  expect(screen.getByRole('complementary', { name: 'Resumen de pagos de ingreso' })).toHaveTextContent('Monto total cubierto');
});
