import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import OperationsPage from './OperationsPage';
import type { PaymentOperationResponse } from '../types/operations.types.ts';
import type { RoleName } from '@/modules/auth/types/auth.types';

const mocks = vi.hoisted(() => ({
  roles: ['ADMIN'] as string[],
  deleteOperation: vi.fn(),
  deleteProof: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  fetchOperations: vi.fn(),
  setCurrentPage: vi.fn(),
  operations: [] as PaymentOperationResponse[],
  currentPage: 0,
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    user: { userId: 1, roles: mocks.roles },
    hasRole: (roles: RoleName | readonly RoleName[]) =>
      (Array.isArray(roles) ? roles : [roles]).some((role) => mocks.roles.includes(role)),
  }),
}));

vi.mock('@/modules/operations/api/operations.api', () => ({
  deleteOperation: mocks.deleteOperation,
}));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({
  deleteOperationProofByUrl: mocks.deleteProof,
}));
vi.mock('react-hot-toast', () => ({
  default: { success: mocks.success, error: mocks.error },
}));

vi.mock('@/modules/operations/hooks/use-operations', () => ({
  useOperations: () => ({
    operations: mocks.operations,
    error: null,
    isLoading: false,
    fetchOperations: mocks.fetchOperations,
    currentPage: mocks.currentPage,
    totalPages: 3,
    totalElements: 21,
    setCurrentPage: mocks.setCurrentPage,
    processingOperationId: null,
    handleActivate: vi.fn(),
    handleDeactivate: vi.fn(),
  }),
}));

vi.mock('@/modules/operations/hooks/use-create-operation', () => ({
  useCreateOperation: () => ({ isSubmitting: false, submitCreateOperation: vi.fn() }),
}));
vi.mock('@/modules/operations/hooks/use-add-operation-payment', () => ({
  useAddOperationPayment: () => ({ isSubmitting: false, submitAddOperationPayment: vi.fn() }),
}));
vi.mock('../hooks/use-update-operation.js', () => ({
  useUpdateOperation: () => ({ isSubmitting: false, submitUpdateOperation: vi.fn() }),
}));
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts: [], isLoading: false }),
}));
vi.mock('@/modules/clientes/hooks/use-clientes.js', () => ({
  useClientes: () => ({ clientes: [], isLoading: false }),
}));
vi.mock('@/modules/socioscomerciales/hooks/use-commercial-partners.js', () => ({
  useCommercialPartners: () => ({ commercialPartners: [], isLoading: false }),
}));
vi.mock('@/modules/configuraciones/hooks/use-configuracion-general', () => ({
  useConfiguracionGeneral: () => ({ configuracionGeneral: null }),
}));
vi.mock('@/modules/users/hooks/use-commercial-level-one-users', () => ({
  useCommercialLevelOneUsers: () => ({ commercialLevelOneUsers: [], isLoading: false }),
}));

function buildOperation(id: number): PaymentOperationResponse {
  return {
    id,
    activo: true,
    clienteId: 1,
    clienteNombre: 'Cliente Demo',
    montoTotal: 10000,
    montoValidado: 0,
    montoRegistrado: 0,
    saldoPendientePorValidar: 10000,
    saldoPendientePorRegistrar: 10000,
    estatus: 'PENDIENTE_VALIDACION',
    socioComercialId: 1,
    socioComercialNombre: 'Socio Demo',
    nivelesRedComercial: 1,
    porcentajeComisionSocio: 1,
    porcentajeComisionOficina: 1,
    montoComisionSocioNivel1: 0,
    montoComisionSocioNivel2: 0,
    montoComisionSocioNivel3: 0,
    porcentajeComisionRedTotal: 1,
    montoComisionRedTotal: 0,
    porcentajeComisionOficinaTotal: 1,
    montoComisionOficinaTotal: 0,
    porcentajeComisionTotal: 2,
    montoComisionTotal: 0,
    montoTotalDevolverCliente: 0,
    montoSolicitadoRetorno: 0,
    montoRetornado: 0,
    saldoPendienteRetornar: 0,
    numeroRetornosSolicitados: 0,
    pagos: [],
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    contieneRetornosEnEfectivo: false,
    contieneRetornosRetiroSinTarjeta: false,
    contieneRetornosEnTransferencia: false,
  } as PaymentOperationResponse;
}

async function openDeleteModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OperationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  await userEvent.click(screen.getAllByRole('button', { name: /acciones|más/i })[0]);
  await userEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
}

async function confirmDeletion() {
  await userEvent.type(screen.getByRole('textbox'), 'ELIMINAR');
  const [confirm] = screen
    .getAllByRole('button', { name: 'Eliminar definitivamente' })
    .filter((button) => button.className.includes('bg-red-700'));
  await userEvent.click(confirm);
  return confirm;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  mocks.roles = ['ADMIN'];
  mocks.operations = [buildOperation(42)];
  mocks.currentPage = 0;
  mocks.deleteOperation.mockResolvedValue(undefined);
});

it('el modal muestra folio, cliente, monto y la advertencia de permanencia', async () => {
  await openDeleteModal();

  const dialog = within(screen.getByRole('dialog'));

  expect(dialog.getByText('Eliminar operación')).toBeInTheDocument();
  expect(dialog.getByText('Folio')).toBeInTheDocument();
  expect(dialog.getByText('Operación #42')).toBeInTheDocument();
  expect(dialog.getByText('Cliente Demo')).toBeInTheDocument();
  expect(dialog.getByText('$10,000.00')).toBeInTheDocument();
  expect(dialog.getByText('Esta eliminación es permanente')).toBeInTheDocument();
});

it('no elimina hasta que se confirma y deshabilita el botón mientras procesa', async () => {
  let finish!: () => void;
  mocks.deleteOperation.mockImplementationOnce(
    () => new Promise<void>((resolve) => { finish = resolve; }),
  );

  await openDeleteModal();
  expect(mocks.deleteOperation).not.toHaveBeenCalled();

  const confirm = await confirmDeletion();

  await waitFor(() => expect(confirm).toBeDisabled());
  expect(mocks.deleteOperation).toHaveBeenCalledWith(42);

  finish();
  await waitFor(() => expect(mocks.fetchOperations).toHaveBeenCalledWith(0));
});

it('refresca el listado tras una eliminación exitosa', async () => {
  await openDeleteModal();
  await confirmDeletion();

  await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Operación eliminada permanentemente'));
  expect(mocks.fetchOperations).toHaveBeenCalledWith(0);
  expect(mocks.setCurrentPage).not.toHaveBeenCalled();
});

it('retrocede una página cuando se elimina el último registro de la página actual', async () => {
  mocks.currentPage = 2;
  mocks.operations = [buildOperation(42)];

  await openDeleteModal();
  await confirmDeletion();

  await waitFor(() => expect(mocks.setCurrentPage).toHaveBeenCalledWith(1));
  expect(mocks.fetchOperations).not.toHaveBeenCalled();
});

it('conserva la operación y vuelve a consultar cuando el backend rechaza el borrado', async () => {
  mocks.deleteOperation.mockRejectedValueOnce({
    isAxiosError: true,
    response: { data: { message: 'Solo se pueden eliminar operaciones pendientes de validación' } },
  });

  await openDeleteModal();
  await confirmDeletion();

  await waitFor(() => expect(mocks.error).toHaveBeenCalled());
  expect(mocks.success).not.toHaveBeenCalled();
  // El listado se recarga para dejar de mostrar un estatus viejo.
  expect(mocks.fetchOperations).toHaveBeenCalledWith(0);
  // El modal sigue abierto: la operación no se retiró de la vista.
  expect(within(screen.getByRole('dialog')).getByText('Eliminar operación')).toBeInTheDocument();
});
