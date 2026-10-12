import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import TeamPendingPage from './TeamPendingPage';
import { MemoryRouter } from 'react-router-dom';
import { getPresetRange } from '@/shared/utils/period';

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 42, roles: ['GERENTE'] } }) }));
vi.mock('../components/StaffPendingSummaryCards', () => ({
  StaffPendingSummaryCards: ({ supervisedRole, dateFilter, startDate, endDate }: { supervisedRole: string; dateFilter: string; startDate: string; endDate: string }) =>
    <output aria-label="pending-state">{`${supervisedRole}:${dateFilter || 'TODAS'}:${startDate}:${endDate}`}</output>,
}));

beforeEach(() => { window.sessionStorage.clear(); window.localStorage.clear(); });

it('usa cajas por defecto y persiste el perfil y período elegidos por gerente', async () => {
  const first = render(<MemoryRouter initialEntries={['/pendientes-del-equipo']}><TeamPendingPage /></MemoryRouter>);
  expect(screen.getByLabelText('pending-state')).toHaveTextContent('JEFA_CAJAS:TODAS::');
  await userEvent.selectOptions(screen.getByLabelText('Perfil'), 'AUXILIAR_CUENTAS');
  await userEvent.click(screen.getByRole('button', { name: /Fechas de pendientes del equipo: Todas las fechas/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Mes pasado' }));
  expect(screen.getByLabelText('pending-state')).toHaveTextContent('AUXILIAR_CUENTAS:TODAS::');
  await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  const { startDate, endDate } = getPresetRange('LAST_MONTH');
  expect(screen.getByLabelText('pending-state')).toHaveTextContent(`AUXILIAR_CUENTAS:TODAS:${startDate}:${endDate}`);
  first.unmount();
  render(<MemoryRouter initialEntries={['/pendientes-del-equipo']}><TeamPendingPage /></MemoryRouter>);
  expect(screen.getByLabelText('pending-state')).toHaveTextContent(`AUXILIAR_CUENTAS:TODAS:${startDate}:${endDate}`);
});
