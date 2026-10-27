import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CashOutflowPage from './CashOutflowPage';

const fixtures = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], cashier: false, navigate: vi.fn() }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual<typeof import('react-router-dom')>('react-router-dom'), useNavigate: () => fixtures.navigate }));
vi.mock('@/modules/operations/hooks/returns/use-today-cash-deliveries', () => ({ useTodayCashDeliveries: () => ({ isSuccess: true, isPending: false, data: { content: [{ id: 19, operationId: 47, returnRequestId: 37, tipoPago: 'EFECTIVO', monto: 100, estatus: 'PROGRAMADA', cerradoPorJefa: false }] } }) }));

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: () => fixtures.cashier }) }));
vi.mock('../api/cash-work.api', () => ({ cashWorkApi: {
  outflow: async () => ({ content: fixtures.rows, totalPages: 0, totalElements: 3, totalAmount: 500 }),
} }));
vi.mock('@/modules/cash-bank-deposits/api', () => ({ cashBankDepositsApi: {
  pending: async () => [
    { id: 1, origen: 'EFECTIVO_CAJA' },
    { id: 2, origen: 'CHEQUE' },
  ],
  preview: async () => ({ reservadoEnTransito: 300 }),
} }));
vi.mock('@/modules/cash-bank-deposits/CashBankDepositOutflow', () => ({ CashBankDepositOutflow: () => <div>Formulario de envío de efectivo</div> }));

describe('Pestañas de Salidas de efectivo', () => {
  it('identifica efectivo y retiro sin tarjeta en la tabla y en tarjetas', async () => {
    fixtures.rows = ['EFECTIVO', 'RETIRO_SIN_TARJETA'].map((tipoPago, index) => ({
      id: index + 1, operationId: 47 + index, tipoPago, clienteNombre: 'Cliente', socioComercialNombre: 'Socio',
      montoSolicitado: 100, montoPendiente: 100, montoRetornado: 0, montoDisponible: 100,
      createdAt: '2026-10-17', fechaSolicitud: '2026-10-17',
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><CashOutflowPage /></MemoryRouter></QueryClientProvider>);
    const table = await screen.findByRole('table');
    expect(await within(table).findByText('Retiro sin tarjeta')).toBeInTheDocument();
    expect(within(table).getByText('Efectivo')).toBeInTheDocument();
    expect(within(table).getAllByRole('columnheader')).toHaveLength(7);
    expect(within(table).getByRole('columnheader', { name: 'Método' })).toBeInTheDocument();
    for (const method of ['Retiro sin tarjeta', 'Efectivo']) {
      const cells = within(table).getByText(method).closest('tr')!.querySelectorAll('td');
      expect(cells[0]).not.toHaveTextContent(method);
      expect(cells[2]).toHaveTextContent(method);
    }
    const cards = screen.getByTestId('data-table-mobile');
    expect(within(cards).getByText('Retiro sin tarjeta')).toBeInTheDocument();
    expect(within(cards).getByText('Efectivo')).toBeInTheDocument();
    fixtures.rows = [];
  });
  it('usa la barra compartida y excluye los cheques del contador de envíos de efectivo', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><CashOutflowPage /></MemoryRouter></QueryClientProvider>);
    const tabs = screen.getByRole('tablist', { name: 'Tipo de salida de efectivo' });
    expect(await within(tabs).findByText('3')).toBeInTheDocument();
    expect(within(tabs).getByText('1')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    fireEvent.click(within(tabs).getByRole('tab', { name: /Envíos a cuentas bancarias/ }));
    expect(await screen.findByText('$300.00')).toBeInTheDocument();
    expect(screen.getByText('Formulario de envío de efectivo')).toBeInTheDocument();
  });
});

it('abre la entrega programada desde Salidas en el detalle de operación', async () => {
 fixtures.cashier = true;
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 render(<QueryClientProvider client={client}><MemoryRouter><CashOutflowPage /></MemoryRouter></QueryClientProvider>);
 fireEvent.click((await screen.findAllByRole('button', { name: 'Marcar entregado' }))[0]);
 expect(fixtures.navigate).toHaveBeenCalledWith('/operaciones/47?action=deliver-installment&scrollToReturns=true&returnRequestId=37&installmentId=19');
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); fixtures.cashier = false;
});
