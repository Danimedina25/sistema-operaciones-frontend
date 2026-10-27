import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { EditWithdrawalModal } from './EditWithdrawalModal';
import type { BankCashWithdrawal } from '@/modules/cash-withdrawals/types';

const mocks = vi.hoisted(() => ({ edit: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 4 } }) }));
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({ useBankAccounts: () => ({ accounts: [{ id: 9, banco: 'BANORTE', titular: 'Oficina', numeroCuenta: '12348998', activo: true }], isLoading: false }) }));
vi.mock('@/modules/cash-withdrawals/api', () => ({ cashWithdrawalsApi: { edit: (...args: unknown[]) => mocks.edit(...args) } }));
const withdrawal = { id: 7, bankAccountId: 9, forma: 'RETIRO_CON_TARJETA', monto: 1200, version: 2, referencia: 'ABC', comprobanteUrl: 'https://example.test/proof.pdf' } as BankCashWithdrawal;
beforeEach(() => { mocks.edit.mockReset().mockResolvedValue({}); });

it('guarda la edición con el comprobante actual y acciones fijas', async () => {
  const saved = vi.fn().mockResolvedValue(undefined), close = vi.fn();
  render(<EditWithdrawalModal withdrawal={withdrawal} onClose={close} onSaved={saved} />);
  const dialog = screen.getByRole('dialog', { name: 'Editar retiro #7' });
  const submit = within(dialog).getByRole('button', { name: 'Guardar cambios' });
  expect(dialog.querySelector('footer')).toContainElement(submit);
  fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1100.50' } });
  fireEvent.click(submit);
  await waitFor(() => expect(mocks.edit).toHaveBeenCalledWith(7, { version: 2, bankAccountId: 9, forma: 'RETIRO_CON_TARJETA', monto: 1100.5, referencia: 'ABC', comprobanteUrl: withdrawal.comprobanteUrl }));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});

it('mantiene el error en el resumen y no envía efectivo con centavos no contables', () => {
  render(<EditWithdrawalModal withdrawal={withdrawal} onClose={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1100.25' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(within(screen.getByRole('region', { name: 'Resumen del retiro' })).getByRole('alert')).toHaveTextContent('centavos');
  expect(mocks.edit).not.toHaveBeenCalled();
});
