import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BankTransferModal } from './BankTransferModal';
import { validateTransferAmount } from '../utils/transfer-amount';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import type { BankTransfer, CreateBankTransfer } from '../types/bank-transfers.types';

const accounts: BankAccountResponse[] = [
  { id: 3, banco: 'BBVA', titular: 'Operaciones SA', numeroCuenta: '00012345678', clabe: '012345678901234567', activo: true, createdAt: '', updatedAt: '' },
  { id: 7, banco: 'Banorte', titular: 'Nómina SA', numeroCuenta: '99988877766', clabe: '072345678901234567', activo: true, createdAt: '', updatedAt: '' },
];

vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts, isLoading: false, loadBankAccounts: vi.fn(), loadBankAccount: vi.fn(), setAccounts: vi.fn() }),
}));

/** Disponible de la cuenta origen: lo controla cada prueba. */
const availability = { saldo: 5000, enTransito: 0, disponible: 5000 as number | null, isLoading: false };

vi.mock('../hooks/use-account-availability', async importOriginal => ({
  ...(await importOriginal<typeof import('../hooks/use-account-availability')>()),
  useAccountAvailability: (id: number | null) => (id === null
    ? { saldo: null, enTransito: 0, disponible: null, isLoading: false }
    : availability),
}));

const saved: BankTransfer = {
  id: 1, fecha: '2026-09-27T10:00:00', cuentaOrigenId: 3, cuentaOrigen: '', cuentaDestinoId: 7, cuentaDestino: '',
  monto: 1500.5, referencia: null, comprobanteUrl: null, registradoPorId: 1, registradoPorNombre: 'Jefa', saldoOrigenResultante: 100,
};

function choose(label: string, search: string) {
  const combobox = screen.getByLabelText(label);
  fireEvent.focus(combobox);
  fireEvent.change(combobox, { target: { value: search } });
  fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  fireEvent.keyDown(combobox, { key: 'Enter' });
}

function mount(onSubmit = vi.fn<(r: CreateBankTransfer) => Promise<BankTransfer>>().mockResolvedValue(saved)) {
  const onClose = vi.fn();
  render(<BankTransferModal open onClose={onClose} onSubmit={onSubmit} />);
  return { onSubmit, onClose };
}

describe('validateTransferAmount', () => {
  it('acepta montos positivos con hasta dos decimales', () => {
    expect(validateTransferAmount('1500')).toBeNull();
    expect(validateTransferAmount('1500.5')).toBeNull();
    expect(validateTransferAmount('0.01')).toBeNull();
  });

  it('rechaza vacío, cero, negativos y más de dos decimales', () => {
    expect(validateTransferAmount('')).not.toBeNull();
    expect(validateTransferAmount('0')).not.toBeNull();
    expect(validateTransferAmount('-5')).not.toBeNull();
    expect(validateTransferAmount('10.001')).not.toBeNull();
    expect(validateTransferAmount('abc')).not.toBeNull();
  });
});

describe('BankTransferModal', () => {
  it('registra la transferencia entre las dos cuentas elegidas', async () => {
    const { onSubmit, onClose } = mount();
    choose('Cuenta origen', 'BBVA');
    choose('Cuenta beneficiaria', 'Banorte');
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1500.50' } });
    fireEvent.change(screen.getByLabelText('Referencia'), { target: { value: ' SPEI 42 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar transferencia' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      cuentaOrigenId: 3, cuentaDestinoId: 7, monto: 1500.5, referencia: 'SPEI 42',
    });
    expect(onSubmit.mock.calls[0][0].requestId).toEqual(expect.any(String));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('la cuenta beneficiaria no ofrece la cuenta origen', () => {
    mount();
    choose('Cuenta origen', 'BBVA');
    const destino = screen.getByLabelText('Cuenta beneficiaria');
    fireEvent.focus(destino);
    fireEvent.change(destino, { target: { value: 'BBVA' } });
    expect(screen.queryByRole('option', { name: /BBVA/ })).not.toBeInTheDocument();
  });

  it('exige ambas cuentas y un monto válido antes de enviar', async () => {
    const { onSubmit } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar transferencia' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('cuenta de la que sale');

    choose('Cuenta origen', 'BBVA');
    choose('Cuenta beneficiaria', 'Banorte');
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar transferencia' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('mayor a cero');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('muestra el disponible y no envía un monto que deje la cuenta en negativo', async () => {
    availability.disponible = 1000;
    availability.enTransito = 4000;
    const { onSubmit } = mount();
    choose('Cuenta origen', 'BBVA');
    choose('Cuenta beneficiaria', 'Banorte');
    expect(screen.getByText(/Disponible \$1,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/En tránsito a Caja General \$4,000\.00/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1000.01' } });
    expect(screen.getByText(/no puede quedar en negativo/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar transferencia' }));
    expect(onSubmit).not.toHaveBeenCalled();

    availability.disponible = 5000;
    availability.enTransito = 0;
  });

  it('conserva el identificador al reintentar la misma captura tras un error', async () => {
    const onSubmit = vi.fn<(r: CreateBankTransfer) => Promise<BankTransfer>>()
      .mockRejectedValueOnce(new Error('Red caída'))
      .mockResolvedValueOnce(saved);
    mount(onSubmit);
    choose('Cuenta origen', 'BBVA');
    choose('Cuenta beneficiaria', 'Banorte');
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar transferencia' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar transferencia' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0].requestId).toBe(onSubmit.mock.calls[0][0].requestId);
  });
});
