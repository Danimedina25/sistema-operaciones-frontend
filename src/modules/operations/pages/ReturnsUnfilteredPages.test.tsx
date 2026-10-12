import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import ReturnsForPaymentPage from './ReturnsForPaymentPage';
import ReturnsRequestedPage from './ReturnsRequestedPage';

const mocks = vi.hoisted(() => ({ payment: vi.fn(), requested: vi.fn() }));
const page = { content: [{ id: 1 }, { id: 2 }], totalPages: 1, totalElements: 2 };

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
vi.mock('../hooks/use-work-operations', () => ({ useWorkOperations: mocks.payment }));
vi.mock('../hooks/returns/use-operation-returns', () => ({ useOperationsWithRequestedReturns: mocks.requested }));
vi.mock('../components/returns/ReturnsForPaymentTable', () => ({
  ReturnsForPaymentTable: ({ operations }: { operations: unknown[] }) => <output aria-label="filas">{operations.length}</output>,
}));
vi.mock('../components/returns/ReturnsRequestedTable', () => ({
  ReturnsRequestedTable: ({ operations }: { operations: unknown[] }) => <output aria-label="filas">{operations.length}</output>,
}));

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.payment.mockReset().mockReturnValue({ data: page, isFetching: false, error: null, refetch: vi.fn() });
  mocks.requested.mockReset().mockReturnValue({ data: page, isLoading: false, refetch: vi.fn() });
});

it.each([
  ['Retornos por pagar', '/retornos-por-pagar', ReturnsForPaymentPage, mocks.payment],
  ['Retornos solicitados', '/retornos-solicitados', ReturnsRequestedPage, mocks.requested],
] as const)('%s ignora Este mes heredado y muestra el total de la lista sin fecha', (_name, path, Page, query) => {
  render(<MemoryRouter initialEntries={[`${path}?dateFilter=THIS_MONTH&status=VALIDADA`]}><Page /></MemoryRouter>);
  expect(query).toHaveBeenCalled();
  for (const call of query.mock.calls) {
    const filters = path === '/retornos-por-pagar' ? call[0] : call[2];
    expect(filters).toMatchObject({ dateFilter: '', startDate: '', endDate: '', status: 'VALIDADA' });
  }
  expect(screen.getByLabelText('filas')).toHaveTextContent('2');
  expect(screen.getByText(/2 registros en total/)).toBeInTheDocument();
});
