import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import TeamPendingPage from './TeamPendingPage';

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 42, roles: ['GERENTE'] } }) }));
vi.mock('../components/StaffPendingSummaryCards', () => ({
  StaffPendingSummaryCards: ({ supervisedRole, dateFilter }: { supervisedRole: string; dateFilter: string }) =>
    <output aria-label="pending-state">{supervisedRole}:{dateFilter}</output>,
}));

beforeEach(() => window.sessionStorage.clear());

it('usa cajas por defecto y persiste el perfil y período elegidos por gerente', async () => {
  const first = render(<TeamPendingPage />);
  expect(screen.getByLabelText('pending-state')).toHaveTextContent('JEFA_CAJAS:THIS_MONTH');
  await userEvent.selectOptions(screen.getByLabelText('Perfil'), 'AUXILIAR_CUENTAS');
  await userEvent.click(screen.getByRole('button', { name: 'Mes pasado' }));
  expect(screen.getByLabelText('pending-state')).toHaveTextContent('AUXILIAR_CUENTAS:LAST_MONTH');
  first.unmount();
  render(<TeamPendingPage />);
  expect(screen.getByLabelText('pending-state')).toHaveTextContent('AUXILIAR_CUENTAS:LAST_MONTH');
});
