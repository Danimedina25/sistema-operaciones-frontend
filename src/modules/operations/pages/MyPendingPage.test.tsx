import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import MyPendingPage from './MyPendingPage';

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
vi.mock('../components/SocioPendingSummaryCards', () => ({
  SocioPendingSummaryCards: ({ dateFilter }: { dateFilter: string }) => <output>{dateFilter}</output>,
}));
beforeEach(() => window.sessionStorage.clear());

it('restaura su período sin leer ni modificar los filtros de operaciones', async () => {
  const operationsKey = 'table-filters:operations:v2:1';
  const operations = JSON.stringify({ dateFilter: 'LAST_MONTH', status: 'VALIDADA' });
  window.sessionStorage.setItem(operationsKey, operations);
  const first = render(<MyPendingPage />);
  expect(screen.getByRole('status')).toHaveTextContent('THIS_MONTH');
  await userEvent.click(screen.getByRole('button', { name: 'Hoy' }));
  expect(screen.getByRole('status')).toHaveTextContent('TODAY');
  first.unmount();
  render(<MyPendingPage />);
  expect(screen.getByRole('status')).toHaveTextContent('TODAY');
  expect(window.sessionStorage.getItem(operationsKey)).toBe(operations);
});
