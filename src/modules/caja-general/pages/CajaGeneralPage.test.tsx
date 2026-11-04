import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CashDay } from '../types/caja-general.types';
import CajaGeneralPage from './CajaGeneralPage';

const mocks = vi.hoisted(() => ({ roles: ['JEFA_CAJAS'] as string[] }));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1, roles: mocks.roles } }),
}));
vi.mock('@/shared/utils/period', () => ({
  officeToday: () => '2026-10-28',
  selectionFromDates: () => ({ startDate: '2026-10-28', endDate: '2026-10-28' }),
}));
vi.mock('@/shared/hooks/use-table-filters', () => ({
  useTableFilters: () => ({
    filters: { mode: 'daily', fecha: '2026-10-28', startDate: '2026-10-28', endDate: '2026-10-28' },
    setFilters: vi.fn(),
  }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { income: 0, outflow: 0, movements: 0 }, isSuccess: true }),
}));
vi.mock('@/shared/components/ui/PeriodSelector', () => ({ PeriodSelector: () => <div>Periodo de prueba</div> }));
vi.mock('../components/CashLedgerTable', () => ({ CashLedgerTable: () => <div data-testid="cash-ledger">Libro cargado</div> }));
vi.mock('../components/CashMovementForm', () => ({ CashMovementForm: () => <div>Captura manual</div> }));
vi.mock('../components/DeleteCashDayModal', () => ({ DeleteCashDayModal: () => null }));
vi.mock('../hooks/use-caja-general', () => ({
  useCajaGeneral: () => {
    const day = {
      id: 1, fecha: '2026-10-28', version: 0, saldoInicial: 100, saldoActual: 100,
      saldoContado: null, closedAt: null, createdAt: '2026-10-28T08:53:00',
    } as CashDay;
    const mutation = { isPending: false, mutateAsync: vi.fn() };
    return {
      latest: { data: day, isSuccess: true, isPending: false, isError: false },
      ledger: { data: { dias: [day], movimientos: [], grupos: [] }, isSuccess: true, isPending: false, isError: false },
      open: mutation, movement: mutation, close: mutation, deleteDay: mutation,
    };
  },
}));

function show() {
  render(<MemoryRouter initialEntries={['/caja-general']}><CajaGeneralPage /></MemoryRouter>);
}

beforeEach(() => { mocks.roles = ['JEFA_CAJAS']; });

describe('Corte de caja', () => {
  it('Jefa de Cajas consulta el corte sin capturar entradas ni salidas manuales', () => {
    show();
    expect(screen.getByRole('heading', { name: 'Corte de caja' })).toBeInTheDocument();
    expect(screen.getByTestId('cash-ledger')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar caja' })).toBeInTheDocument();
    expect(screen.queryByText('Registrar movimiento')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar entrada/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar salida/ })).not.toBeInTheDocument();
  });

  it('Administración conserva la captura manual en el mismo Corte', () => {
    mocks.roles = ['ADMIN'];
    show();
    expect(screen.getByRole('button', { name: /Registrar entrada/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar salida/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrar entrada/ }));
    expect(screen.getByText('Captura manual')).toBeInTheDocument();
    expect(screen.getByTestId('cash-ledger')).toBeInTheDocument();
  });
});
