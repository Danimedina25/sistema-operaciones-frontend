import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import OperationDetailPage from './OperationDetailPage';
import { paths } from '@/routes/paths';
import type { PaymentOperationResponse } from '../types/operations.types.ts';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  deleteOperation: vi.fn(),
  deleteProof: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('@/modules/operations/api/operations.api', () => ({
  deleteOperation: mocks.deleteOperation,
}));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({
  deleteOperationProofByUrl: mocks.deleteProof,
}));
vi.mock('react-hot-toast', () => ({
  default: { success: mocks.success, error: mocks.error },
}));
vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    user: { userId: 1, roles: ['ADMIN'] },
    hasRole: (roles: readonly string[]) => roles.includes('ADMIN'),
  }),
}));

const operation = {
  id: 42,
  clienteNombre: 'Cliente Demo',
  montoTotal: 10000,
  estatus: 'PENDIENTE_VALIDACION',
  pagos: [],
} as unknown as PaymentOperationResponse;

// El árbol del detalle es pesado y ya se prueba aparte; aquí interesa el
// cableado de la eliminación con el modal y la navegación.
vi.mock('../components/OperationDetailContainer', () => ({
  OperationDetailContainer: ({
    onDeleteOperation,
  }: {
    onDeleteOperation?: (operation: PaymentOperationResponse) => void;
  }) => (
    <button type="button" onClick={() => onDeleteOperation?.(operation)}>
      Eliminar operación
    </button>
  ),
}));

const emptySubmit = { isSubmitting: false };
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts: [], isLoading: false }),
}));
vi.mock('../hooks/use-add-operation-payment', () => ({
  useAddOperationPayment: () => ({ ...emptySubmit, submitAddOperationPayment: vi.fn() }),
}));
vi.mock('../hooks/use-update-operation-payment', () => ({
  useUpdateOperationPayment: () => ({ ...emptySubmit, submitUpdateOperationPayment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-request-return-payment', () => ({
  useRequestReturnPayment: () => ({ ...emptySubmit, submitRequestReturnPayment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-update-request-return-payment', () => ({
  useUpdateRequestReturnPayment: () => ({ ...emptySubmit, submitUpdateRequestReturnPayment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-create-return-installment', () => ({
  useCreateReturnInstallment: () => ({ ...emptySubmit, submitCreateReturnInstallment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-confirm-return-installment', () => ({
  useConfirmReturnInstallment: () => ({ ...emptySubmit, submitConfirmReturnInstallment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-deliver-return-installment', () => ({
  useDeliverReturnInstallment: () => ({ ...emptySubmit, submitDeliverReturnInstallment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-cancel-return-installment', () => ({
  useCancelReturnInstallment: () => ({ ...emptySubmit, submitCancelReturnInstallment: vi.fn() }),
}));
vi.mock('../hooks/returns/use-return-request-summary', () => ({
  useReturnRequestSummary: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}));

const OPERATIONS_FILTERS_KEY = 'table-filters:operations:v2:1';
const SAVED_FILTERS = JSON.stringify({ dateFilter: 'LAST_MONTH', status: 'VALIDADA' });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/operaciones/42']}>
        <Routes>
          <Route path="/operaciones/:operationId" element={<OperationDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  window.sessionStorage.setItem(OPERATIONS_FILTERS_KEY, SAVED_FILTERS);
  mocks.deleteOperation.mockResolvedValue(undefined);
});

it('regresa al listado conservando los filtros tras eliminar desde el detalle', async () => {
  renderPage();

  await userEvent.click(screen.getByRole('button', { name: 'Eliminar operación' }));

  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByText('Operación #42')).toBeInTheDocument();
  expect(dialog.getByText('Cliente Demo')).toBeInTheDocument();

  await userEvent.type(screen.getByRole('textbox'), 'ELIMINAR');
  await userEvent.click(
    dialog.getByRole('button', { name: 'Eliminar definitivamente' }),
  );

  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(paths.operations));
  expect(mocks.deleteOperation).toHaveBeenCalledWith(42);
  // Los filtros del listado siguen en sessionStorage, así que se restauran al volver.
  expect(window.sessionStorage.getItem(OPERATIONS_FILTERS_KEY)).toBe(SAVED_FILTERS);
});

it('no navega y muestra el mensaje del backend cuando el borrado se rechaza', async () => {
  mocks.deleteOperation.mockRejectedValueOnce({
    isAxiosError: true,
    response: { data: { message: 'Solo se pueden eliminar operaciones pendientes de validación' } },
  });

  renderPage();

  await userEvent.click(screen.getByRole('button', { name: 'Eliminar operación' }));
  await userEvent.type(screen.getByRole('textbox'), 'ELIMINAR');
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar definitivamente' }),
  );

  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith(
      'Solo se pueden eliminar operaciones pendientes de validación',
    ),
  );
  expect(mocks.navigate).not.toHaveBeenCalledWith(paths.operations);
});
