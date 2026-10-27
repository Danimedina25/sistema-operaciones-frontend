import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BankIncomePage from './BankIncomePage';

const navigation = vi.hoisted(() => vi.fn());
const rows = vi.hoisted(() => ({ data: [] as Record<string, unknown>[] }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual<typeof import('react-router-dom')>('react-router-dom'), useNavigate: () => navigation }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: () => true }) }));
vi.mock('../api/bank-work.api', () => ({ bankWorkApi: {
  income: async () => ({ content: rows.data, totalPages: 0 }),
  summary: async () => ({ income: { count: 2, amount: 150000 } }),
} }));
vi.mock('@/modules/cash-bank-deposits/api', () => ({ cashBankDepositsApi: {
  summary: async () => ({ count: 3, amount: 425 }),
} }));
vi.mock('@/modules/cash-bank-deposits/CashBankDepositIncome', () => ({ CashBankDepositIncome: () => <div>Bandeja de envíos</div> }));
vi.mock('@/modules/cheques/ChequeManager', () => ({ ChequeManager: () => null }));
vi.mock('@/modules/operations/components/IncomePaymentReview', () => ({ IncomePaymentReview: () => null }));

describe('Pestañas de Entradas bancarias', () => {
  it('comparte el diseño de Cajas y actualiza el total al cambiar de pestaña', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><BankIncomePage /></MemoryRouter></QueryClientProvider>);
    const tabs = screen.getByRole('tablist', { name: 'Tipo de entrada bancaria' });
    expect(await within(tabs).findByText('2')).toBeInTheDocument();
    expect(within(tabs).getByText('3')).toBeInTheDocument();
    expect(screen.getByText('$150,000.00')).toBeInTheDocument();
    fireEvent.click(within(tabs).getByRole('tab', { name: /Envíos desde Caja General/ }));
    expect(screen.getByText('$425.00')).toBeInTheDocument();
    expect(screen.getByText('Bandeja de envíos')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pagos de ingreso de operaciones' })).toBeNull();
  });
});

it.each(['TRANSFERENCIA', 'CHEQUE'])('abre el pago de %s en el detalle de su operación', async method => {
 rows.data = [{ id: 9, operationId: 47, tipoPago: method, monto: 100, clienteNombre: 'Cliente', socioComercialNombre: 'Socio' }];
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 render(<QueryClientProvider client={client}><MemoryRouter><BankIncomePage /></MemoryRouter></QueryClientProvider>);
 const table = await screen.findByRole('table');
 fireEvent.click(within(table).getByRole('button', { name: method === 'CHEQUE' ? 'Gestionar cheque' : 'Confirmar' }));
 expect(navigation).toHaveBeenCalledWith('/operaciones/47?action=review-payment&scrollToPayments=true&paymentId=9');
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); rows.data = [];
});
