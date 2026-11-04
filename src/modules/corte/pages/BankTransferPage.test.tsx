import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import BankTransferPage from './BankTransferPage';

vi.mock('../api/corte.api', () => ({
  createBankTransfer: vi.fn(),
  listBankTransfers: () => Promise.resolve([{
    id: 1, fecha: '2026-11-04T13:03:00', monto: 15000, referencia: 'SPEI-1',
    cuentaOrigenId: 1, cuentaOrigen: 'Oficina Demo SA de CV — BANCO DEMO — 0000001234',
    cuentaDestinoId: 2, cuentaDestino: 'Oficina Demo SA de CV — BANCO EJEMPLO — 0000005678',
  }]),
}));
vi.mock('../components/BankTransferModal', () => ({ BankTransferForm: () => null }));

describe('transferencias recientes', () => {
  it('distingue las cuentas por banco y terminación aunque compartan titular', async () => {
    render(<QueryClientProvider client={new QueryClient()}><BankTransferPage /></QueryClientProvider>);
    const row = (await screen.findByText('BANCO DEMO ••1234')).closest('tr') as HTMLElement;
    expect(within(row).getByText('BANCO EJEMPLO ••5678')).toBeInTheDocument();
    expect(within(row).getAllByText('Oficina Demo SA de CV')).toHaveLength(2);
  });
});
