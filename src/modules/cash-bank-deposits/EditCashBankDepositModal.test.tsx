import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { EditCashBankDepositModal } from './EditCashBankDepositModal';
import { emptyCounts } from '@/modules/caja-general/utils/cash-amounts';
import type { CashBankDeposit } from './api';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
const mocks = vi.hoisted(() => ({ edit: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 4 } }) }));
vi.mock('./api', () => ({ depositMethodLabel: { VENTANILLA: 'Ventanilla' }, cashBankDepositsApi: { edit: (...args: unknown[]) => mocks.edit(...args) } }));
const counts = { ...emptyCounts(), D100: 3 };
const deposit = { id: 12, bankAccountId: 9, forma: 'VENTANILLA', monto: 300, version: 2, referencia: 'ABC', comprobanteSalidaUrl: 'https://example.test/proof.pdf', denominaciones: counts } as CashBankDeposit;
const accounts = [{ id: 9, banco: 'BANORTE', titular: 'Oficina', numeroCuenta: '12348998', activo: true }] as BankAccountResponse[];
beforeEach(() => { mocks.edit.mockReset().mockResolvedValue({}); });

it('conserva versión, desglose y comprobante al guardar con acciones fijas', async () => {
  const close = vi.fn();
  render(<EditCashBankDepositModal deposit={deposit} accounts={accounts} onClose={close} onSaved={vi.fn().mockResolvedValue(undefined)} />);
  const dialog = screen.getByRole('dialog', { name: 'Editar envío #12' });
  const submit = within(dialog).getByRole('button', { name: 'Guardar cambios' });
  expect(dialog.querySelector('footer')).toContainElement(submit);
  fireEvent.click(submit);
  await waitFor(() => expect(mocks.edit).toHaveBeenCalledWith(12, { version: 2, bankAccountId: 9, monto: 300, forma: 'VENTANILLA', referencia: 'ABC', comprobanteSalidaUrl: deposit.comprobanteSalidaUrl, denominaciones: counts }));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});

it('muestra el rechazo del servidor junto al total y conserva el formulario', async () => {
  mocks.edit.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'Saldo insuficiente' } } });
  const close = vi.fn();
  render(<EditCashBankDepositModal deposit={deposit} accounts={accounts} onClose={close} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  const card = screen.getByRole('region', { name: 'Resumen del envío' });
  expect(await within(card).findByRole('alert')).toHaveTextContent('Saldo insuficiente');
  expect(card).toHaveClass('sticky');
  expect(within(card).getByText('Total contado')).toBeInTheDocument();
  expect(screen.getByLabelText('Cantidad de $100.00')).toHaveValue(3);
  expect(close).not.toHaveBeenCalled();
});

it('muestra el aviso de datos incompletos dentro del resumen y bloquea el guardado', () => {
  render(<EditCashBankDepositModal deposit={{ ...deposit, denominaciones: null } as unknown as CashBankDeposit} accounts={accounts} onClose={vi.fn()} onSaved={vi.fn()} />);
  const card = screen.getByRole('region', { name: 'Resumen del envío' });
  expect(within(card).getByRole('alert')).toHaveTextContent('No pudimos cargar los datos completos del envío');
  expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
});
