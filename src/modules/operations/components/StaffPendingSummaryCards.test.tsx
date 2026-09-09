import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import type { RoleName } from '@/modules/auth/types/auth.types';
import { StaffPendingSummaryCards } from './StaffPendingSummaryCards';

const mocks = vi.hoisted(() => ({ roles: [] as RoleName[], userId: 1, operations: vi.fn(), returns: vi.fn(), deliveries: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: mocks.userId, roles: mocks.roles }, hasRole: (roles: RoleName[]) => roles.some((r) => mocks.roles.includes(r)) }) }));
vi.mock('../api/operations.api', () => ({ getOperations: mocks.operations, getMyOperations: mocks.operations, getOperationsWithRequestedReturns: mocks.returns, getPendingInstallmentPickups: mocks.deliveries }));
function Location() { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; }
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><StaffPendingSummaryCards dateFilter="LAST_MONTH" startDate="" endDate="" /><Location /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  window.sessionStorage.clear(); vi.clearAllMocks(); mocks.roles = []; mocks.userId = 1;
  for (const fn of [mocks.operations, mocks.returns, mocks.deliveries]) fn.mockResolvedValue({ content: [], totalElements: 3, totalPages: 1 });
});
it.each(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS'] as RoleName[])('muestra la misma cola bancaria para %s y transmite fechas', async (role) => {
  mocks.roles = [role]; mount(); await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  await waitFor(() => expect(mocks.operations).toHaveBeenCalled());
  expect(screen.queryByText('Entregas de cajas')).not.toBeInTheDocument();
  expect(mocks.operations).toHaveBeenCalledWith(0, 10, expect.objectContaining({ workQueue: 'BANK_INCOME', paymentStatus: 'PENDIENTE_VALIDACION', paymentTypes: 'TRANSFERENCIA,DEPOSITO,CHEQUE', dateFilter: 'LAST_MONTH' }));
  await userEvent.click(screen.getByRole('button', { name: /Operaciones con retornos bancarios por pagar/ }));
  const url = new URL(screen.getByRole('status').textContent!, 'http://test');
  expect(url.pathname).toBe('/retornos-por-pagar'); expect(url.searchParams.get('workQueue')).toBe('BANK_RETURNS'); expect(url.searchParams.get('dateFilter')).toBe('LAST_MONTH');
});
it('combina cajas y cuentas sin duplicar tarjetas y separa entregas del período', async () => {
  mocks.roles = ['JEFA_CAJAS', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS']; mount();
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  await waitFor(() => expect(mocks.deliveries).toHaveBeenCalledWith('CONFIRMATION', 0, ''));
  expect(screen.getAllByText('Operaciones con ingresos bancarios por validar')).toHaveLength(1);
  expect(mocks.operations).toHaveBeenCalledWith(0, 10, expect.objectContaining({ workQueue: 'CASH_INCOME', paymentTypes: 'EFECTIVO' }));
  expect(mocks.returns).toHaveBeenCalledWith(0, 10, expect.objectContaining({ workQueue: 'CASH_RETURNS', dateFilter: 'LAST_MONTH' }));
  await userEvent.click(screen.getByRole('button', { name: /Entregas pendientes de tu confirmación/ }));
  expect(screen.getByRole('status').textContent).toBe('/entregas-de-hoy?queue=CONFIRMATION&tipoPago=');
});
it('un error muestra reintento y nunca cero pendientes', async () => {
  mocks.roles = ['JEFA_CUENTAS']; mocks.operations.mockRejectedValue(new Error('offline')); mocks.returns.mockRejectedValue(new Error('offline'));
  mount(); await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
  expect(screen.queryByText('Sin pendientes')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Reintentar' })).toHaveLength(2);
});
