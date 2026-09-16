import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BankMovementsPage } from './BankMovementsPage';
import type { BankMovement, BankMovementTotals } from '../types/bank-movements.types';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

const accounts: BankAccountResponse[] = [
  { id: 3, banco: 'BBVA', titular: 'Operaciones SA', numeroCuenta: '00012345678', clabe: '012345678901234567', activo: true, createdAt: '', updatedAt: '' },
  { id: 9, banco: 'Bajío', titular: 'Cuenta Vieja', numeroCuenta: '55500011122', clabe: '030345678901234567', activo: false, createdAt: '', updatedAt: '' },
];

const movements: BankMovement[] = [
  {
    id: 'CAJA_GENERAL-8', origen: 'CAJA_GENERAL', sourceId: 8, fecha: '2026-09-16T14:00:00',
    direccion: 'SALIDA', tipo: 'CHEQUE', concepto: 'Cheque cobrado', monto: 400,
    bankAccountId: 3, cuentaBanco: 'BBVA', cuentaTitular: 'Operaciones SA', cuentaNumero: '••••5678',
    cuentaActiva: true, operacionId: null, parcialidadId: null, cashMovementId: 8,
    usuarioId: 2, usuarioNombre: 'Jefa de Cajas',
  },
  {
    id: 'PAGO-5', origen: 'PAGO', sourceId: 5, fecha: '2026-09-16T09:00:00',
    direccion: 'ENTRADA', tipo: 'TRANSFERENCIA', concepto: 'Pago Transferencia · Operación #12', monto: 1000,
    bankAccountId: 9, cuentaBanco: 'Bajío', cuentaTitular: 'Cuenta Vieja', cuentaNumero: '••••1122',
    cuentaActiva: false, operacionId: 12, parcialidadId: null, cashMovementId: null,
    usuarioId: 4, usuarioNombre: 'Auxiliar de Cuentas',
  },
];

/** Los totales NO coinciden con la suma de la página a propósito: deben ganar los del backend. */
const totals: BankMovementTotals = {
  totalEntradas: 25_000, totalSalidas: 9_000, variacionNeta: 16_000, totalMovimientos: 37,
};

const searchBankMovements = vi.fn();
const getBankMovementTotals = vi.fn();

vi.mock('../api/corte.api', () => ({
  searchBankMovements: (...args: unknown[]) => searchBankMovements(...args),
  getBankMovementTotals: (...args: unknown[]) => getBankMovementTotals(...args),
}));

vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts, isLoading: false, loadBankAccounts: vi.fn(), loadBankAccount: vi.fn(), setAccounts: vi.fn() }),
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1 }, hasRole: () => true }),
}));

/** El panel de filtros nace colapsado, como en el resto de las tablas. */
function openFilters() {
  fireEvent.click(screen.getByRole('button', { name: /mostrar/i }));
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter><BankMovementsPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BankMovementsPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    searchBankMovements.mockReset().mockResolvedValue({
      content: movements, totalElements: 37, totalPages: 2, size: 20, number: 0,
    });
    getBankMovementTotals.mockReset().mockResolvedValue(totals);
  });

  it('muestra entradas, salidas y neto tomados del resumen del backend', async () => {
    mount();
    await screen.findByText('$25,000.00');
    expect(screen.getByText('$9,000.00')).toBeInTheDocument();
    expect(screen.getByText('$16,000.00')).toBeInTheDocument();
    // El contador viene de totalElements, no del tamaño de la página.
    expect(screen.getByText('37 movimientos en el periodo consultado.')).toBeInTheDocument();
  });

  it('lista los movimientos con su cuenta, origen y referencia', async () => {
    mount();
    const cheque = await screen.findByText('Cheque cobrado');
    const row = cheque.closest('tr') as HTMLElement;
    expect(within(row).getByText(/Operaciones SA — BBVA — ••••5678/)).toBeInTheDocument();
    expect(within(row).getByText('Caja General')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: /Caja General · Registro #8/ })).toBeInTheDocument();
    expect(within(row).getByText('Jefa de Cajas')).toBeInTheDocument();

    const pago = screen.getByText('Pago Transferencia · Operación #12').closest('tr') as HTMLElement;
    expect(within(pago).getByRole('link', { name: 'Operación #12' })).toBeInTheDocument();
    // Las cuentas inactivas se siguen consultando en el histórico.
    expect(within(pago).getByText('(inactiva)')).toBeInTheDocument();
  });

  it('no ofrece ninguna acción de captura', async () => {
    mount();
    await screen.findByText('Cheque cobrado');
    expect(screen.queryByRole('button', { name: /registrar|agregar|nuevo|nueva|capturar/i })).toBeNull();
  });

  it('no permite consultar fechas futuras', async () => {
    mount();
    await screen.findByText('Cheque cobrado');
    openFilters();
    const desde = screen.getByLabelText('Desde') as HTMLInputElement;
    const hasta = screen.getByLabelText('Hasta') as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(desde.max).toBe(today);
    expect(hasta.max).toBe(today);

    const future = '2099-01-01';
    fireEvent.change(hasta, { target: { value: future } });
    expect(await screen.findByRole('alert')).toHaveTextContent('no sea futuro');
    expect(searchBankMovements).toHaveBeenCalledTimes(1);
  });

  it('pagina desde el backend y reinicia al cambiar un filtro', async () => {
    mount();
    await screen.findByText('Cheque cobrado');
    expect(searchBankMovements).toHaveBeenLastCalledWith(expect.anything(), 0, 20);

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(searchBankMovements).toHaveBeenLastCalledWith(expect.anything(), 1, 20));

    openFilters();
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'SALIDA' } });
    await waitFor(() => expect(searchBankMovements).toHaveBeenLastCalledWith(
      expect.objectContaining({ direccion: 'SALIDA' }), 0, 20,
    ));
  });

  it('muestra el estado vacío cuando no hay movimientos', async () => {
    searchBankMovements.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 });
    getBankMovementTotals.mockResolvedValue({ totalEntradas: 0, totalSalidas: 0, variacionNeta: 0, totalMovimientos: 0 });
    mount();
    expect(await screen.findByText('Sin movimientos')).toBeInTheDocument();
  });

  it('ofrece reintentar cuando la consulta falla', async () => {
    searchBankMovements.mockRejectedValue(new Error('network'));
    mount();
    await waitFor(() => expect(searchBankMovements).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
