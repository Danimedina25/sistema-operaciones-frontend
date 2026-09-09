import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import ReturnsForRequestPage from './ReturnsForRequestPage';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 }, hasRole: () => false }) }));
vi.mock('../hooks/returns/use-operation-returns', () => ({ useOperationsAvailableToRequestReturn: mocks.query }));
vi.mock('../hooks/returns/use-request-return-payment', () => ({ useRequestReturnPayment: () => ({}) }));
beforeEach(() => {
  window.sessionStorage.clear();
  mocks.query.mockReset().mockReturnValue({ data: { content: [], totalPages: 0, totalElements: 0 } });
});
it.each([
  ['dateFilter=LAST_MONTH&startDate=&endDate=', { dateFilter: 'LAST_MONTH', startDate: '', endDate: '' }],
  ['dateFilter=&startDate=2026-07-03&endDate=2026-07-19', { dateFilter: '', startDate: '2026-07-03', endDate: '2026-07-19' }],
  ['dateFilter=&startDate=&endDate=', { dateFilter: '', startDate: '', endDate: '' }],
])('consulta retornos por solicitar con las fechas de la URL: %s', (query, period) => {
  window.sessionStorage.setItem('table-filters:returns-for-request:v2:user:1', JSON.stringify({ dateFilter: 'TODAY', search: 'viejo' }));
  render(<MemoryRouter initialEntries={[`/retornos-por-solicitar?${query}`]}><ReturnsForRequestPage /></MemoryRouter>);
  expect(mocks.query).toHaveBeenCalledWith(0, 10, expect.objectContaining({ ...period, search: '', status: 'ALL' }));
});
