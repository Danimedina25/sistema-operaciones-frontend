import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import MyCommercialPartnerCommissionsPage from './MyCommercialPartnerCommissionsPage';

const mocks = vi.hoisted(() => ({ fetchCommissions: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
vi.mock('../hooks/use-my-weekly-commissions', () => ({
  useMyWeeklyCommissions: () => ({ ...mocks, isLoading: false, commissions: { operaciones: [
    { id: 1, myCommissionStatus: 'GENERADA' }, { id: 2, myCommissionStatus: 'PAGADA' },
  ] } }),
}));
vi.mock('../components/MyCommissionsSummaryCards', () => ({ MyCommissionsSummaryCards: () => null }));
vi.mock('../components/MyCommissionsTable', () => ({
  MyCommissionsTable: ({ operations }: { operations: { id: number }[] }) => <output>{operations.map((op) => op.id).join(',')}</output>,
}));

beforeEach(() => { window.sessionStorage.clear(); vi.clearAllMocks(); });
it('consulta las fechas del acceso y muestra solo comisiones pendientes, ignorando el caché anterior', async () => {
  window.sessionStorage.setItem('table-filters:my-commissions:v2:user:1', JSON.stringify({ startDate: '2026-01-01', endDate: '2026-01-07' }));
  render(<MemoryRouter initialEntries={['/mis-comisiones?startDate=2026-08-01&endDate=2026-08-31&commissionStatus=GENERADA']}><MyCommercialPartnerCommissionsPage /></MemoryRouter>);
  await waitFor(() => expect(mocks.fetchCommissions).toHaveBeenCalledWith({ startDate: '2026-08-01', endDate: '2026-08-31' }));
  expect(screen.getByRole('combobox', { name: 'Estatus de comisión' })).toHaveValue('GENERADA');
  expect(screen.getByRole('status')).toHaveTextContent(/^1$/);
});
