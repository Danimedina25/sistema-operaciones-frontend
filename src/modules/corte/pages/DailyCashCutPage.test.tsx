import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { emitNotificationReceived } from '@/modules/notifications/services/notification-events';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DailyCashCutPage from './DailyCashCutPage';
import { officeToday, shiftDay } from '@/shared/utils/period';
import { paths } from '@/routes/paths';

const fetchDailyCut = vi.fn();
const fetchRangeCut = vi.fn();
const fetchBankBalancesGrouped = vi.fn();
const searchBankMovements = vi.fn();
const getBankMovementTotals = vi.fn();

vi.mock('../hooks/use-daily-cash-cut', () => ({
  useDailyCashCut: () => ({
    dailyCut: null,
    rangeCut: null,
    isLoadingDailyCut: false,
    isLoadingRangeCut: false,
    isRegisteringCut: false,
    fetchDailyCut: (...args: unknown[]) => fetchDailyCut(...args),
    fetchRangeCut: (...args: unknown[]) => fetchRangeCut(...args),
    submitRegisterDailyCutByDate: vi.fn(),
    bankBalancesGrouped: [],
    isLoadingBankBalances: false,
    fetchBankBalancesGrouped: (...args: unknown[]) => fetchBankBalancesGrouped(...args),
  }),
}));

vi.mock('../api/corte.api', () => ({
  searchBankMovements: (...args: unknown[]) => searchBankMovements(...args),
  getBankMovementTotals: (...args: unknown[]) => getBankMovementTotals(...args),
}));

vi.mock('@/modules/cash-withdrawals/api', () => ({
  cashWithdrawalsApi: { pending: () => Promise.resolve([]) },
}));

vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts: [], isLoading: false, loadBankAccounts: vi.fn(), loadBankAccount: vi.fn(), setAccounts: vi.fn() }),
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1 }, hasRole: () => true }),
}));

/** Las tres pestañas comparten página; la ruta decide cuál se ve. */
function mount(pathname: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route path={paths.corte} element={<DailyCashCutPage />} />
          <Route path={paths.bankBalances} element={<DailyCashCutPage />} />
          <Route path={paths.bankMovements} element={<DailyCashCutPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function tab(name: string) {
  return screen.getByRole('button', { name });
}

describe('DailyCashCutPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchDailyCut.mockReset();
    fetchRangeCut.mockReset();
    fetchBankBalancesGrouped.mockReset();
    searchBankMovements.mockReset().mockResolvedValue({
      content: [], totalElements: 0, totalPages: 0, size: 20, number: 0,
    });
    getBankMovementTotals.mockReset().mockResolvedValue({
      totalEntradas: 0, totalSalidas: 0, variacionNeta: 0, totalMovimientos: 0,
    });
  });

  it('reúne las tres vistas como pestañas de Cortes y saldos', () => {
    mount(paths.corte);

    expect(tab('Corte')).toBeInTheDocument();
    expect(tab('Saldos bancarios')).toBeInTheDocument();
    expect(tab('Movimientos bancarios')).toBeInTheDocument();
  });

  it('muestra corte y movimientos juntos en la ruta de Cuentas', async () => {
    mount(paths.bankMovements);

    expect(await screen.findByRole('heading', { name: 'Cortes y movimientos' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Movimientos del periodo' })).toBeInTheDocument();
    expect(fetchDailyCut).toHaveBeenCalled();
    expect(fetchRangeCut).not.toHaveBeenCalled();
    expect(fetchBankBalancesGrouped).not.toHaveBeenCalled();
  });

  it('cambiar de pestaña lleva a su propia ruta', async () => {
    mount(paths.corte);

    fireEvent.click(tab('Movimientos bancarios'));
    expect(await screen.findByRole('heading', { name: 'Cortes y movimientos' })).toBeInTheDocument();
    // La ruta dedicada de Cuentas ya no ofrece pestañas de corte genérico.
    expect(screen.queryByRole('button', { name: 'Saldos bancarios' })).toBeNull();
  });

  it('usa el calendario de la cabecera como periodo de los movimientos', async () => {
    mount(paths.bankMovements);

    const today = officeToday();
    // En modo Día el periodo es un solo día: desde y hasta coinciden.
    await waitFor(() => expect(searchBankMovements).toHaveBeenLastCalledWith(
      expect.objectContaining({ desde: today, hasta: today }), 0, 20,
    ));

    const initialRequests = searchBankMovements.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Periodo del corte:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ayer' }));
    expect(searchBankMovements).toHaveBeenCalledTimes(initialRequests);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    const yesterday = shiftDay(today, -1);
    await waitFor(() => expect(searchBankMovements).toHaveBeenLastCalledWith(
      expect.objectContaining({ desde: yesterday, hasta: yesterday }), 0, 20,
    ));
  });

  it('ofrece Día y Rango de fechas en movimientos, pero no en saldos', async () => {
    mount(paths.bankMovements);
    fireEvent.click(screen.getByRole('button', { name: /Periodo del corte:/ }));
    expect(tab('Día')).toBeInTheDocument();
    expect(tab('Rango')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Los saldos son una foto a una fecha puntual: un rango no significa nada ahí.
    cleanup();
    mount(paths.bankBalances);
    await screen.findByRole('heading', { name: 'Saldos bancarios' });
    fireEvent.click(screen.getByRole('button', { name: /Periodo del corte:/ }));
    expect(screen.queryByRole('button', { name: 'Rango' })).toBeNull();
  });

  it('no deja consultar movimientos futuros desde el calendario', async () => {
    mount(paths.bankMovements);

    fireEvent.click(screen.getByRole('button', { name: /Periodo del corte:/ }));
    const tomorrow = shiftDay(officeToday(), 1);
    const tomorrowButton = document.querySelector<HTMLButtonElement>(`[data-day="${tomorrow}"] button`);
    if (tomorrowButton) expect(tomorrowButton).toBeDisabled();
    else expect(document.querySelector<HTMLButtonElement>('.rdp-button_next')).toBeDisabled();
  });
  it('vuelve a consultar los saldos cuando Caja confirma un retiro', async () => {
    mount(paths.bankBalances);
    await waitFor(() => expect(fetchBankBalancesGrouped).toHaveBeenCalled());
    const before = fetchBankBalancesGrouped.mock.calls.length;

    act(() => emitNotificationReceived({
      id: 9, titulo: 'Retiro recibido en Caja General', mensaje: '', tipo: 'BANK_WITHDRAWAL_CONFIRMED',
      modulo: 'PAGOS', referenceType: 'BANK_CASH_WITHDRAWAL', referenceId: 5, actionUrl: '/corte',
      prioridad: 'MEDIUM', leida: false, createdAt: '2026-09-30T10:00:00',
    }));

    await waitFor(() => expect(fetchBankBalancesGrouped.mock.calls.length).toBe(before + 1));
  });
});
