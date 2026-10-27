import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import PendingDeliveriesPage from './PendingDeliveriesPage';
import TodayCashDeliveriesPage from './TodayCashDeliveriesPage';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => ({ ...await vi.importActual<typeof import('react-router-dom')>('react-router-dom'), useNavigate: () => navigate }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 }, hasRole: () => true }) }));
const delivery = { id: 19, operationId: 47, returnRequestId: 37, monto: 100, tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA', cerradoPorJefa: false, fechaHoraRecoleccion: '2026-10-20T14:00:00' };
const result = { data: { content: [delivery], totalPages: 1, totalElements: 1 }, isLoading: false, isFetching: false, refetch: vi.fn() };
vi.mock('../hooks/use-pending-deliveries', () => ({ usePendingDeliveries: () => result }));
vi.mock('../hooks/returns/use-today-cash-deliveries', () => ({ useTodayCashDeliveries: () => result }));
for (const [name, Page] of [['pendientes', PendingDeliveriesPage], ['programadas', TodayCashDeliveriesPage]] as const) it(`abre la parcialidad exacta desde entregas ${name}`, () => {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 render(<QueryClientProvider client={client}><MemoryRouter><Page /></MemoryRouter></QueryClientProvider>);
 fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'Marcar entregado' }));
 expect(navigate).toHaveBeenCalledWith('/operaciones/47?action=deliver-installment&scrollToReturns=true&returnRequestId=37&installmentId=19');
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
