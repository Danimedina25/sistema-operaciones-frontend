import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { CashPendingSummary } from './CashPendingSummary';

const mocks = vi.hoisted(() => ({ summary: vi.fn() }));
vi.mock('../api/cash-work.api', () => ({ cashWorkApi: { summary: () => mocks.summary() } }));

it('muestra tres conteos del backend y enlaza cada tarea con su lista sin filtro de fecha', async () => {
  mocks.summary.mockResolvedValue({
    income: { count: 3, amount: 200000, oldest: '2026-08-26T11:55:42' },
    withdrawals: { count: 1, amount: 12000, oldest: '2026-10-02T19:55:30' },
    outflow: { count: 2, amount: 91900, oldest: '2026-09-21T08:14:50' },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><CashPendingSummary /></MemoryRouter></QueryClientProvider>);

  expect(await screen.findByText('$200,000.00')).toBeInTheDocument();
  expect(screen.getByText('$12,000.00')).toBeInTheDocument();
  expect(screen.getByText('$91,900.00')).toBeInTheDocument();
  expect(screen.getByText('6 pendientes en Caja General')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Ir a Entradas › Pagos de ingreso/ })).toHaveAttribute('href', '/caja/entradas');
  expect(screen.getByRole('link', { name: /Ir a Entradas › Retiros de cuentas/ })).toHaveAttribute('href', '/caja/entradas?tab=withdrawals');
  expect(screen.getByRole('link', { name: /Ir a Salidas › Retornos/ })).toHaveAttribute('href', '/caja/salidas');
  expect(mocks.summary).toHaveBeenCalledTimes(1);
});
