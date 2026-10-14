import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { SocioPendingAccordion } from './SocioPendingAccordion';

const api = vi.hoisted(() => ({ getMyOperations: vi.fn(), getOperationsAvailableToRequestReturn: vi.fn(), getOperationsWithRequestedReturns: vi.fn() }));
vi.mock('../api/operations.api', () => api);
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: (role: string) => role === 'SOCIO_COMERCIAL' }) }));
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({ useBankAccounts: () => ({ accounts: [], isLoading: false }) }));
const operation = { id: 43, clienteNombre: 'Cliente de prueba', montoTotal: 1000, montoRegistrado: 400, saldoPendientePorRegistrar: 600, saldoPendientePorSolicitar: 500 };

function Destination() { const location = useLocation(); return <output aria-label="destino">{`${location.pathname}${location.search}`}</output>; }
function renderAccordion() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/mis-pendientes']}><Routes>
    <Route path="/mis-pendientes" element={<SocioPendingAccordion />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  api.getMyOperations.mockImplementation((_page, _size, filters) => Promise.resolve({ totalElements: filters.status === 'INGRESO_PARCIAL' ? 1 : 0, content: filters.status === 'INGRESO_PARCIAL' ? [operation] : [] }));
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 0, content: [] });
  api.getOperationsWithRequestedReturns.mockResolvedValue({ totalElements: 0, content: [] });
});

it('abre un solo grupo, usa todas las fechas y mantiene los contadores del servidor', async () => {
  renderAccordion();
  await waitFor(() => expect(screen.getByText(/1 pago por registrar/)).toBeInTheDocument());
  const income = screen.getByRole('button', { name: /Pagos de ingreso por registrar/ });
  const returns = screen.getByRole('button', { name: /^Retornos/ });
  expect(income).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(returns);
  expect(income).toHaveAttribute('aria-expanded', 'false');
  expect(returns).toHaveAttribute('aria-expanded', 'true');
  expect(api.getMyOperations).toHaveBeenCalledWith(0, 10, expect.objectContaining({ dateFilter: '', startDate: '', endDate: '', status: 'INGRESO_PARCIAL' }));
});

it('abre Registrar pago sobre Mis pendientes', async () => {
  renderAccordion();
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Registrar pago' }).length).toBeGreaterThan(0));
  await userEvent.click(screen.getAllByRole('button', { name: 'Registrar pago' })[0]);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Operación #43 · Cliente de prueba')).toBeInTheDocument();
  expect(screen.queryByLabelText('destino')).not.toBeInTheDocument();
});

it('separa retornos por solicitar y en seguimiento sin duplicar filas', async () => {
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 1, content: [{ ...operation, id: 39, clienteNombre: 'Cliente por solicitar', estatus: 'VALIDADA' }] });
  api.getOperationsWithRequestedReturns.mockImplementation((_page, _size, filters) => Promise.resolve({ totalElements: filters.returnStatuses === 'EN_RECOLECCION' ? 0 : 1, content: filters.returnStatuses === 'EN_RECOLECCION' ? [] : [{ ...operation, id: 40, clienteNombre: 'Cliente en seguimiento', estatus: 'VALIDADA' }] }));
  renderAccordion();
  await userEvent.click(screen.getByRole('button', { name: /^Retornos/ }));
  await waitFor(() => expect(screen.getAllByText('Cliente por solicitar').length).toBeGreaterThan(0));
  expect(screen.queryAllByText('Cliente en seguimiento')).toHaveLength(0);
  await userEvent.click(screen.getByRole('tab', { name: /Seguimiento/ }));
  expect(screen.getAllByText('Cliente en seguimiento').length).toBeGreaterThan(0);
  expect(screen.queryAllByText('Cliente por solicitar')).toHaveLength(0);
});

it('abre Solicitar retorno sobre Mis pendientes sin navegar al detalle', async () => {
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 1, content: [{ ...operation, id: 39, clienteNombre: 'Juan Bustos', montoTotalDevolverCliente: 500, montoSolicitadoRetorno: 0, clienteId: 7, estatus: 'VALIDADA' }] });
  renderAccordion();
  await userEvent.click(screen.getByRole('button', { name: /^Retornos/ }));
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Solicitar retorno' }).length).toBeGreaterThan(0));
  await userEvent.click(screen.getAllByRole('button', { name: 'Solicitar retorno' })[0]);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Operación #39 · Juan Bustos')).toBeInTheDocument();
  expect(screen.queryByLabelText('destino')).not.toBeInTheDocument();
});
