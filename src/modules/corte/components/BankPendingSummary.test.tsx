import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BankPendingSummary } from './BankPendingSummary';
import MyPendingPage from '@/modules/operations/pages/MyPendingPage';
const auth = vi.hoisted(() => ({ role: 'JEFA_CUENTAS' }));
vi.mock('@/shared/lib/axios', () => ({ api: { get: vi.fn(async () => ({ data: { data: [{ requestId: 39, operationId: 47, cliente: 'Cliente de prueba', porRegistrar: 68000, porConfirmar: 0 }] } })) } }));

const summary = vi.fn();
const deposits = vi.fn();
vi.mock('../api/bank-work.api', () => ({ bankWorkApi: { summary: () => summary() } }));
vi.mock('@/modules/cash-bank-deposits/api', () => ({ cashBankDepositsApi: { summary: () => deposits() } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({
  hasRole: (roles: string | string[]) => Array.isArray(roles) ? roles.includes(auth.role) : roles === auth.role,
}) }));

beforeEach(() => { auth.role = 'JEFA_CUENTAS'; });

describe('BankPendingSummary', () => {
  it('usa las cantidades e importes del servidor y enlaza a las colas sin fecha', async () => {
    summary.mockResolvedValue({ income: { count: 3, amount: 250000, oldest: '2026-10-01T10:00:00' },
      outflow: { count: 2, amount: 65000, oldest: '2026-09-30T10:00:00' } });
    deposits.mockResolvedValue({ count: 1, amount: 20000, oldest: '2026-10-02T12:00:00' });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><BankPendingSummary /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText('$250,000.00')).toBeInTheDocument();
    expect(screen.getByText('$65,000.00')).toBeInTheDocument();
    expect(await screen.findByText('$20,000.00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a Entradas › Pagos de ingreso/ })).toHaveAttribute('href', '/cuentas/entradas');
    expect(screen.getByRole('link', { name: /Ir a Salidas/ })).toHaveAttribute('href', '/cuentas/salidas');
    expect(screen.getByRole('link', { name: /Ir a Entradas › Envíos/ })).toHaveAttribute('href', '/cuentas/entradas?view=deposits');
  });
});

it.each(['JEFA_CUENTAS','AUXILIAR_CUENTAS'])('Mis pendientes de %s integra los códigos en la tarjeta de retornos sin duplicar solicitudes', async role => {
  auth.role = role;
  summary.mockResolvedValue({ income: { count: 0, amount: 0, oldest: null }, outflow: { count: 1, amount: 68000, oldest: null } });
  deposits.mockResolvedValue({ count: 0, amount: 0, oldest: null });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><MyPendingPage /></MemoryRouter></QueryClientProvider>);
  const methods = await screen.findByLabelText('Retornos por método');
  await screen.findByText('Retiros sin tarjeta');
  const card = screen.getByRole('heading', { name: 'Retornos de operaciones para pagar' }).closest('article')!;
  expect(within(card).getByText('1', { selector: 'strong.text-4xl' })).toBeInTheDocument();
  expect(within(card).getByText('$68,000.00')).toBeInTheDocument();
  expect(methods).toHaveTextContent('Transferencias0');
  expect(methods).toHaveTextContent('Retiros sin tarjeta1');
  expect(screen.getByText('1 pendientes')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /Retiros sin tarjeta · códigos y cobros/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Ir a Salidas › Retornos/ })).toHaveAttribute('href','/cuentas/salidas');
});

it('el total de retornos ya incluye los códigos y no los suma otra vez', async () => {
  summary.mockResolvedValue({ income: { count: 2, amount: 150000, oldest: null }, outflow: { count: 4, amount: 233000, oldest: null } });
  deposits.mockResolvedValue({ count: 1, amount: 1000, oldest: null });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><BankPendingSummary /></MemoryRouter></QueryClientProvider>);
  await screen.findByText('Retiros sin tarjeta');
  expect(screen.getByLabelText('Retornos por método')).toHaveTextContent('Transferencias3');
  expect(screen.getByLabelText('Retornos por método')).toHaveTextContent('Retiros sin tarjeta1');
  expect(screen.getByText('7 pendientes')).toBeInTheDocument();
  expect(screen.getAllByRole('heading', { name: 'Retornos de operaciones para pagar' })).toHaveLength(1);
});
