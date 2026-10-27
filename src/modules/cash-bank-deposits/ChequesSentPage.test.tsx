import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChequesSentPage from './ChequesSentPage';

const mocks = vi.hoisted(() => ({ list: vi.fn(), pending: vi.fn() }));
vi.mock('./api', () => ({ cashBankDepositsApi: {
  list: (...args: unknown[]) => mocks.list(...args),
  pending: () => mocks.pending(),
} }));

const base = {
  bankAccountId: 9, cuenta: 'BANORTE ••8998', cuentaTitular: 'Oficina', monto: 75,
  referencia: null, comprobanteSalidaUrl: 'https://example.test/salida.pdf',
  comprobanteBancoUrl: null, motivo: null, registradoEn: '2026-10-15T10:00:00',
  registradoPorNombre: 'Jefa de Cajas', resueltoEn: null, resueltoPorNombre: null,
  cashMovementId: null,
};

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><ChequesSentPage /></MemoryRouter></QueryClientProvider>);
}

describe('Cheques enviados a banco', () => {
  beforeEach(() => {
    mocks.list.mockReset().mockResolvedValue([
      { ...base, id: 1, origen: 'EFECTIVO_CAJA', forma: 'VENTANILLA', estatus: 'PENDIENTE', operationId: null, numeroCheque: null },
      { ...base, id: 2, origen: 'CHEQUE', forma: 'CHEQUE', estatus: 'CONFIRMADO', operationId: 44, numeroCheque: 'CHEQUE-44' },
      { ...base, id: 3, origen: 'CHEQUE', forma: 'CHEQUE', estatus: 'CANCELADO', operationId: 45, numeroCheque: 'CHEQUE-45' },
    ]);
    mocks.pending.mockReset().mockResolvedValue([
      { ...base, id: 4, origen: 'CHEQUE', forma: 'CHEQUE', estatus: 'PENDIENTE', operationId: 46, numeroCheque: 'CHEQUE-46' },
    ]);
  });

  it('separa los cheques de los envíos de efectivo y conserva pendientes, acreditados y rechazados', async () => {
    mount();
    const table = await screen.findByRole('table');
    expect(within(table).queryByText('Ventanilla')).toBeNull();
    expect(within(table).getByText('CHEQUE-44')).toBeInTheDocument();
    expect(within(table).getByText('CHEQUE-45')).toBeInTheDocument();
    expect(within(table).getByText('CHEQUE-46')).toBeInTheDocument();
    expect(within(table).getByText('Acreditado')).toBeInTheDocument();
    expect(within(table).getByText('Rechazado')).toBeInTheDocument();
    expect(within(table).getByText('Por acreditar')).toBeInTheDocument();
    expect(within(table).getAllByRole('link', { name: 'Ver operación' })
      .some(link => link.getAttribute('href') === '/operaciones/46')).toBe(true);
  });
});
