import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BankPendingSummary } from './BankPendingSummary';

const summary = vi.fn();
vi.mock('../api/bank-work.api', () => ({ bankWorkApi: { summary: () => summary() } }));

describe('BankPendingSummary', () => {
  it('usa las cantidades e importes del servidor y enlaza a las colas sin fecha', async () => {
    summary.mockResolvedValue({ income: { count: 3, amount: 250000, oldest: '2026-10-01T10:00:00' },
      outflow: { count: 2, amount: 65000, oldest: '2026-09-30T10:00:00' } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><BankPendingSummary /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText('$250,000.00')).toBeInTheDocument();
    expect(screen.getByText('$65,000.00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a Entradas/ })).toHaveAttribute('href', '/cuentas/entradas');
    expect(screen.getByRole('link', { name: /Ir a Salidas/ })).toHaveAttribute('href', '/cuentas/salidas');
  });
});
