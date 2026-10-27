import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  api.getMyOperations.mockImplementation((_page, _size, _filters, options) => Promise.resolve({ totalElements: options?.missingIncome ? 1 : 0, content: options?.missingIncome ? [operation] : [] }));
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 0, content: [] });
  api.getOperationsWithRequestedReturns.mockResolvedValue({ totalElements: 0, content: [] });
});

it('muestra tarjetas con contadores del servidor y un único listado, sin filtrar por fecha', async () => {
  api.getMyOperations.mockImplementation((_page, _size, _filters, options) => Promise.resolve({ totalElements: options?.missingIncome ? 23 : 0, content: options?.missingIncome ? [operation] : [] }));
  renderAccordion();
  const income = screen.getByRole('button', { name: 'Ver pagos por registrar' });
  await waitFor(() => expect(income).toBeEnabled());
  const card = screen.getByRole('article', { name: 'Pagos de ingreso por registrar' });
  expect(within(card).getByText('23')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(5);
  expect(income).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(income);
  expect(screen.getByRole('region', { name: 'Listado de pagos de ingreso por registrar' })).toBeInTheDocument();
  expect(screen.getByText(/Mostrando las primeras 10/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Ver retornos por solicitar' }));
  expect(income).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('region', { name: 'Listado de pagos de ingreso por registrar' })).not.toBeInTheDocument();
  expect(api.getMyOperations).toHaveBeenCalledWith(0, 10, expect.objectContaining({ dateFilter: '', startDate: '', endDate: '', status: 'ALL' }), { missingIncome: true });
});

it('navega al detalle para registrar el pago', async () => {
  renderAccordion();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ver pagos por registrar' })).toBeEnabled());
  await userEvent.click(screen.getByRole('button', { name: 'Ver pagos por registrar' }));
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Registrar pago' }).length).toBeGreaterThan(0));
  await userEvent.click(screen.getAllByRole('button', { name: 'Registrar pago' })[0]);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByLabelText('destino')).toHaveTextContent('/operaciones/43?action=register-payment&scrollToPayments=true');
});

it('separa retornos por solicitar y en seguimiento sin duplicar filas', async () => {
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 1, content: [{ ...operation, id: 39, clienteNombre: 'Cliente por solicitar', estatus: 'VALIDADA' }] });
  api.getOperationsWithRequestedReturns.mockImplementation((_page, _size, filters) => Promise.resolve({ totalElements: filters.returnStatuses === 'EN_RECOLECCION' ? 0 : 1, content: filters.returnStatuses === 'EN_RECOLECCION' ? [] : [{ ...operation, id: 40, clienteNombre: 'Cliente en seguimiento', estatus: 'VALIDADA' }] }));
  renderAccordion();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ver retornos por solicitar' })).toBeEnabled());
  await userEvent.click(screen.getByRole('button', { name: 'Ver retornos por solicitar' }));
  await waitFor(() => expect(screen.getAllByText('Cliente por solicitar').length).toBeGreaterThan(0));
  expect(screen.queryAllByText('Cliente en seguimiento')).toHaveLength(0);
  const followCard = screen.getByRole('article', { name: 'Retornos en seguimiento' });
  expect(within(followCard).getByText('1')).toBeInTheDocument();
  expect(within(followCard).getByText('Solo seguimiento')).toBeInTheDocument();
  expect(within(followCard).queryByText('Requiere atención')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Ver seguimiento' }));
  expect(screen.getAllByText('Cliente en seguimiento').length).toBeGreaterThan(0);
  expect(screen.queryAllByText('Cliente por solicitar')).toHaveLength(0);
});

it('navega al detalle para solicitar el retorno', async () => {
  api.getOperationsAvailableToRequestReturn.mockResolvedValue({ totalElements: 1, content: [{ ...operation, id: 39, clienteNombre: 'Juan Bustos', montoTotalDevolverCliente: 500, montoSolicitadoRetorno: 0, clienteId: 7, estatus: 'VALIDADA' }] });
  renderAccordion();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ver retornos por solicitar' })).toBeEnabled());
  await userEvent.click(screen.getByRole('button', { name: 'Ver retornos por solicitar' }));
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Solicitar retorno' }).length).toBeGreaterThan(0));
  await userEvent.click(screen.getAllByRole('button', { name: 'Solicitar retorno' })[0]);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByLabelText('destino')).toHaveTextContent('/operaciones/39?action=request-return&scrollToReturns=true');
});

it('muestra retornos por confirmar y abre la pestaña Retornos de su operación', async () => {
 api.getOperationsWithRequestedReturns.mockImplementation((_page, _size, filters) => Promise.resolve({ totalElements: filters.returnStatuses === 'EN_RECOLECCION' ? 1 : 6, content: filters.returnStatuses === 'EN_RECOLECCION' ? [{ ...operation, estatus: 'RETORNO_PARCIAL_ENTREGADO' }] : [] }));
 renderAccordion();
 const button = screen.getByRole('button', { name: 'Ver retornos por confirmar' });
 await waitFor(() => expect(button).toBeEnabled());
 expect(within(screen.getByRole('article', { name: 'Retornos por confirmar' })).getByText('1')).toBeInTheDocument();
 expect(screen.getByText(/No se cuentan como pendientes/)).toBeInTheDocument();
 await userEvent.click(button);
 await userEvent.click(screen.getAllByRole('button', { name: 'Ver retornos' })[0]);
 expect(screen.getByLabelText('destino')).toHaveTextContent('/operaciones/43?action=confirm-return&scrollToReturns=true');
});
it('no presenta errores de carga como cero pendientes', async () => {
 api.getMyOperations.mockRejectedValue(new Error('Sin conexión'));
 renderAccordion();
 await waitFor(() => expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument());
 const card = screen.getByRole('article', { name: 'Comprobantes rechazados' });
 expect(within(card).getByText('No disponible')).toBeInTheDocument();
 expect(within(card).queryByText('Sin pendientes')).not.toBeInTheDocument();
 expect(within(card).getByRole('button')).toBeDisabled();
});

it('lista en comprobantes rechazados las operaciones con algún pago rechazado y abre su corrección', async () => {
  api.getMyOperations.mockImplementation((_page, _size, filters) => Promise.resolve(filters.paymentStatus === 'RECHAZADA'
    ? { totalElements: 1, content: [{ ...operation, id: 48, clienteNombre: 'QA-cliente-01', estatus: 'INGRESO_PARCIAL' }] }
    : { totalElements: 0, content: [] }));
  renderAccordion();
  const rejected = screen.getByRole('button', { name: 'Ver comprobantes rechazados' });
  await waitFor(() => expect(rejected).toBeEnabled());
  expect(within(screen.getByRole('article', { name: 'Comprobantes rechazados' })).getByText('1')).toBeInTheDocument();
  expect(api.getMyOperations).toHaveBeenCalledWith(0, 10, expect.objectContaining({ status: 'ALL', paymentStatus: 'RECHAZADA' }));
  await userEvent.click(rejected);
  await userEvent.click((await screen.findAllByRole('button', { name: 'Revisar' }))[0]);
  expect(screen.getByLabelText('destino')).toHaveTextContent('/operaciones/48?action=review-rejected-payment');
});
