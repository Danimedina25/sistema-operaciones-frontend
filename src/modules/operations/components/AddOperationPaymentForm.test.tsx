import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { AddOperationPaymentForm } from './AddOperationPaymentForm';

it('Registrar todo usa el saldo pendiente del backend sin enviar el pago', async () => {
  const onSubmit = vi.fn();
  render(<AddOperationPaymentForm isSubmitting={false} bankAccounts={[]} montoTotal={100000} montoRegistrado={50000} saldoPendiente={50000} onSubmit={onSubmit} />);

  await userEvent.click(screen.getByRole('button', { name: 'Registrar todo' }));

  expect(screen.getByPlaceholderText('1,000.00')).toHaveValue('50,000.00');
  expect(onSubmit).not.toHaveBeenCalled();
});

afterEach(() => vi.unstubAllGlobals());
it('reúne los errores en el resumen y mantiene cancelar y registrar fuera del scroll', async () => {
  const submit = vi.fn(), close = vi.fn();
  render(<ActionDrawer open title="Registrar ingreso" onClose={close}><AddOperationPaymentForm isSubmitting={false} bankAccounts={[]} montoTotal={100} montoRegistrado={0} saldoPendiente={100} onSubmit={submit} onCancel={close} /></ActionDrawer>);
  const dialog = screen.getByRole('dialog');
  const button = within(dialog).getByRole('button', { name: 'Registrar pago' });
  expect(dialog.querySelector('footer')).toContainElement(button);
  fireEvent.click(button);
  const summary = screen.getByRole('region', { name: 'Resumen del ingreso' });
  await waitFor(() => expect(within(summary).getAllByRole('alert').length).toBeGreaterThan(0));
  expect(within(summary).getByText(/El monto es obligatorio/)).toBeInTheDocument();
  expect(screen.getAllByText(/El monto es obligatorio/)).toHaveLength(1);
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  expect(close).toHaveBeenCalledTimes(1);
});

it('conserva los datos y muestra el error del servidor junto al resumen sin duplicar el envío', async () => {
  vi.stubGlobal('DataTransfer', class { files: File[] = []; items = { add: (file: File) => this.files.push(file) }; });
  const submit = vi.fn().mockRejectedValue({ isAxiosError: true, response: { data: { message: 'La operación cambió. Revisa el monto.' } } });
  render(<AddOperationPaymentForm isSubmitting={false} bankAccounts={[]} montoTotal={100} montoRegistrado={0} saldoPendiente={100} onSubmit={submit} />);
  fireEvent.change(screen.getByPlaceholderText('1,000.00'), { target: { value: '50' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'EFECTIVO' } });
  fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-10-21' } });
  fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'pago.pdf', { type: 'application/pdf' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(await within(screen.getByRole('region', { name: 'Resumen del ingreso' })).findByRole('alert')).toHaveTextContent('La operación cambió');
  expect(screen.getByPlaceholderText('1,000.00')).toHaveValue('50');
  expect(submit).toHaveBeenCalledTimes(1);
});
