import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { SocioPendingAccordion } from './SocioPendingAccordion';

const api = vi.hoisted(() => ({ getMyOperations: vi.fn(), getOperationsAvailableToRequestReturn: vi.fn(), getOperationsWithRequestedReturns: vi.fn() }));
vi.mock('../api/operations.api', () => api);
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: (role: string) => role === 'SOCIO_COMERCIAL' }) }));
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
  await waitFor(() => expect(screen.getByText(/1 pagos por registrar/)).toBeInTheDocument());
  const income = screen.getByRole('button', { name: /Pagos de ingreso por registrar/ });
  const returns = screen.getByRole('button', { name: /^Retornos/ });
  expect(income).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(returns);
  expect(income).toHaveAttribute('aria-expanded', 'false');
  expect(returns).toHaveAttribute('aria-expanded', 'true');
  expect(api.getMyOperations).toHaveBeenCalledWith(0, 10, expect.objectContaining({ dateFilter: '', startDate: '', endDate: '', status: 'INGRESO_PARCIAL' }));
});

it('lleva Registrar pago al detalle de ingresos de la operación', async () => {
  renderAccordion();
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Registrar pago' }).length).toBeGreaterThan(0));
  await userEvent.click(screen.getAllByRole('button', { name: 'Registrar pago' })[0]);
  expect(screen.getByLabelText('destino')).toHaveTextContent('/operaciones/43?action=register-payment&scrollToPayments=true');
});
