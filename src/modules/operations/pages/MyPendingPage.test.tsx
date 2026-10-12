import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import MyPendingPage from './MyPendingPage';

vi.mock('../components/SocioPendingAccordion', () => ({ SocioPendingAccordion: () => <output>Lista del socio</output> }));
vi.mock('../components/StaffPendingSummaryCards', () => ({
  StaffPendingSummaryCards: ({ dateFilter, startDate, endDate }: { dateFilter: string; startDate: string; endDate: string }) =>
    <output aria-label="periodo-de-pendientes">{`${dateFilter}:${startDate}:${endDate}`}</output>,
}));

it('muestra pendientes de todas las fechas sin selector que pueda ocultarlos', () => {
  window.sessionStorage.setItem('table-filters:my-pending:v2:user:1', JSON.stringify({ dateFilter: 'THIS_MONTH' }));
  render(<MyPendingPage />);
  expect(screen.getByRole('heading', { name: 'Mis pendientes' })).toBeInTheDocument();
  expect(screen.getByText('Lista del socio')).toBeInTheDocument();
  expect(screen.getByLabelText('periodo-de-pendientes')).toHaveTextContent(/^::$/);
  expect(screen.queryByRole('button', { name: /Fechas de mis pendientes/ })).not.toBeInTheDocument();
});
