import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegisterWithdrawalModal } from './RegisterWithdrawalModal';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import type { BankCashWithdrawal, RegisterWithdrawal } from '@/modules/cash-withdrawals/types';

const accounts: BankAccountResponse[] = [
  { id: 4, banco: 'BANORTE', titular: 'Operaciones SA', numeroCuenta: '00001111', clabe: '072345678901234567', activo: true, createdAt: '', updatedAt: '' },
];

vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts, isLoading: false, loadBankAccounts: vi.fn(), loadBankAccount: vi.fn(), setAccounts: vi.fn() }),
}));

vi.mock('../hooks/use-account-availability', async importOriginal => ({
  ...(await importOriginal<typeof import('../hooks/use-account-availability')>()),
  useAccountAvailability: (id: number | null) => (id === null
    ? { saldo: null, enTransito: 0, disponible: null, isLoading: false }
    : { saldo: 1000, enTransito: 200, disponible: 800, isLoading: false }),
}));

function chooseAccount() {
  const combobox = screen.getByLabelText('Cuenta');
  fireEvent.focus(combobox);
  fireEvent.change(combobox, { target: { value: 'BANORTE' } });
  fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  fireEvent.keyDown(combobox, { key: 'Enter' });
}

function mount() {
  const onSubmit = vi.fn<(r: RegisterWithdrawal) => Promise<BankCashWithdrawal>>().mockResolvedValue({} as BankCashWithdrawal);
  const onClose = vi.fn();
  render(<RegisterWithdrawalModal open onClose={onClose} onSubmit={onSubmit} />);
  return { onSubmit, onClose };
}

describe('Retiro de efectivo para Caja General', () => {
  it('registra cuenta, forma y monto con Caja General como beneficiario', async () => {
    const { onSubmit, onClose } = mount();
    expect(screen.getByText('Caja General')).toBeInTheDocument();
    chooseAccount();
    fireEvent.change(screen.getByLabelText('Forma de retiro'), { target: { value: 'RETIRO_SIN_TARJETA' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar retiro' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ bankAccountId: 4, forma: 'RETIRO_SIN_TARJETA', monto: 500 });
    expect(onSubmit.mock.calls[0][0].requestId).toEqual(expect.any(String));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('ofrece las tres formas de retiro', () => {
    mount();
    expect(screen.getByRole('option', { name: 'Retiro con tarjeta (TD)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Retiro sin tarjeta (RST)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cobro de cheque' })).toBeInTheDocument();
  });

  it('no retira más de lo disponible, descontando lo que ya va en tránsito', () => {
    const { onSubmit } = mount();
    chooseAccount();
    expect(screen.getByText(/Disponible \$800\.00/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '900' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar retiro' }));
    expect(screen.getAllByRole('alert').map(a => a.textContent).join(' ')).toMatch(/Saldo insuficiente/);
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it('sólo admite centavos que se puedan entregar en monedas: .00 o .50', async () => {
    const { onSubmit } = mount();
    chooseAccount();
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '100.25' } });
    expect(screen.getByText(/sólo se admiten centavos \.00 o \.50/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar retiro' }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '100.50' } });
    expect(screen.queryByText(/sólo se admiten centavos/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar retiro' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].monto).toBe(100.5);
  });
});
