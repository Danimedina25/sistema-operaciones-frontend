import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DailyCashCutPage from './DailyCashCutPage';
import { todayIso } from '../hooks/use-bank-movements';
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

  it('abre la pestaña que indica la ruta', async () => {
    mount(paths.bankMovements);

    expect(await screen.findByRole('heading', { name: 'Movimientos bancarios' })).toBeInTheDocument();
    // Estando en el libro de movimientos no se pide corte ni saldos.
    expect(fetchDailyCut).not.toHaveBeenCalled();
    expect(fetchRangeCut).not.toHaveBeenCalled();
    expect(fetchBankBalancesGrouped).not.toHaveBeenCalled();
  });

  it('cambiar de pestaña lleva a su propia ruta', async () => {
    mount(paths.corte);

    fireEvent.click(tab('Movimientos bancarios'));
    expect(await screen.findByRole('heading', { name: 'Movimientos bancarios' })).toBeInTheDocument();

    // El estado de la pestaña se deriva de la ruta, así que volver a Saldos desde
    // Movimientos aterriza en Saldos y no en Corte.
    fireEvent.click(tab('Saldos bancarios'));
    expect(await screen.findByRole('heading', { name: 'Saldos bancarios' })).toBeInTheDocument();
  });

  it('usa el calendario de la cabecera como periodo de los movimientos', async () => {
    mount(paths.bankMovements);

    const today = todayIso();
    // En modo Día el periodo es un solo día: desde y hasta coinciden.
    await waitFor(() => expect(searchBankMovements).toHaveBeenLastCalledWith(
      expect.objectContaining({ desde: today, hasta: today }), 0, 20,
    ));

    fireEvent.change(screen.getByLabelText('Fecha de movimientos'), { target: { value: '2026-09-15' } });
    await waitFor(() => expect(searchBankMovements).toHaveBeenLastCalledWith(
      expect.objectContaining({ desde: '2026-09-15', hasta: '2026-09-15' }), 0, 20,
    ));
  });

  it('ofrece Día y Rango de fechas en movimientos, pero no en saldos', async () => {
    mount(paths.bankMovements);
    expect(tab('Día')).toBeInTheDocument();
    expect(tab('Rango de fechas')).toBeInTheDocument();

    // Los saldos son una foto a una fecha puntual: un rango no significa nada ahí.
    fireEvent.click(tab('Saldos bancarios'));
    await screen.findByRole('heading', { name: 'Saldos bancarios' });
    expect(screen.queryByRole('button', { name: 'Rango de fechas' })).toBeNull();
  });

  it('no deja consultar movimientos futuros desde el calendario', async () => {
    mount(paths.bankMovements);

    const fecha = await screen.findByLabelText('Fecha de movimientos');
    expect(fecha).toHaveAttribute('max', todayIso());
  });
});
