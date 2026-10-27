import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import CashIncomePage from './CashIncomePage';

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: () => true }) }));
vi.mock('../api/cash-work.api', () => ({ cashWorkApi: {
  income: async () => ({ content: [
    { id: 101, operationId: 41, monto: 50000, tipoPago: 'EFECTIVO', fechaPago: '2026-10-02' },
    { id: 102, operationId: 40, monto: 100000, tipoPago: 'CHEQUE', numeroCheque: '9999', fechaPago: '2026-09-20' },
  ], totalPages: 1, totalElements: 2 }),
  summary: async () => ({ income: { count: 2, amount: 150000 }, withdrawals: { count: 0, amount: 0 } }),
} }));
vi.mock('../components/PendingWithdrawalsInbox', () => ({ PendingWithdrawalsInbox: () => null }));

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

it.each(['table', 'cards'])('Confirmar navega al detalle con el pago exacto desde %s', async view => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/caja/entradas']}>
    <CashIncomePage /><Location />
  </MemoryRouter></QueryClientProvider>);
  await screen.findByRole('table');
  const area = view === 'table' ? screen.getByRole('table') : screen.getByTestId('data-table-mobile');
  const buttons = within(area).getAllByRole('button', { name: 'Confirmar' });
  await userEvent.click(buttons[0]);
  expect(screen.getByTestId('location')).toHaveTextContent('/operaciones/41?action=review-payment&paymentId=101&scrollToPayments=true');
  await userEvent.click(buttons[1]);
  expect(screen.getByTestId('location')).toHaveTextContent('/operaciones/40?action=review-payment&paymentId=102&scrollToPayments=true');
});
