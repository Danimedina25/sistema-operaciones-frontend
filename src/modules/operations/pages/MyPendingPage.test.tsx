import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import MyPendingPage from './MyPendingPage';
import { officeToday } from '@/shared/utils/period';

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
vi.mock('../components/SocioPendingSummaryCards', () => ({
  SocioPendingSummaryCards: ({ dateFilter, startDate, endDate }: { dateFilter: string; startDate: string; endDate: string }) =>
    <output aria-label="periodo-de-pendientes">{`${dateFilter || 'TODAS'}:${startDate}:${endDate}`}</output>,
}));
beforeEach(() => { window.sessionStorage.clear(); window.localStorage.clear(); });

it('inicia sin fecha, aplica el periodo solo al confirmar y lo restaura sin tocar operaciones', async () => {
  const operationsKey = 'table-filters:operations:v2:1';
  const operations = JSON.stringify({ dateFilter: 'LAST_MONTH', status: 'VALIDADA' });
  window.sessionStorage.setItem(operationsKey, operations);
  const first = render(<MyPendingPage />);
  expect(screen.getByLabelText('periodo-de-pendientes')).toHaveTextContent('TODAS::');
  await userEvent.click(screen.getByRole('button', { name: /Fechas de mis pendientes: Todas las fechas/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Hoy' }));
  expect(screen.getByLabelText('periodo-de-pendientes')).toHaveTextContent('TODAS::');
  await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(screen.getByLabelText('periodo-de-pendientes')).toHaveTextContent(`TODAS:${officeToday()}:${officeToday()}`);
  first.unmount();
  render(<MyPendingPage />);
  expect(screen.getByLabelText('periodo-de-pendientes')).toHaveTextContent(`TODAS:${officeToday()}:${officeToday()}`);
  expect(window.sessionStorage.getItem(operationsKey)).toBe(operations);
});

it('descarta el antiguo Este mes guardado sin cambiar otros filtros', () => {
  window.sessionStorage.setItem('table-filters:my-pending:v2:user:1', JSON.stringify({ dateFilter: 'THIS_MONTH', startDate: '', endDate: '' }));
  render(<MyPendingPage />);
  expect(screen.getByLabelText('periodo-de-pendientes')).toHaveTextContent('TODAS::');
  expect(JSON.parse(window.sessionStorage.getItem('table-filters:my-pending:v2:user:1')!)).toMatchObject({ dateFilter: '' });
});
