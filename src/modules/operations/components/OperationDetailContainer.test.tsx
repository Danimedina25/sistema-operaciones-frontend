import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationDetailContainer } from './OperationDetailContainer';
import type { OperationStatus, PaymentOperationResponse } from '../types/operations.types.ts';
import type { RoleName } from '@/modules/auth/types/auth.types';

const mocks = vi.hoisted(() => ({
  roles: ['ADMIN'] as string[],
  estatus: 'PENDIENTE_VALIDACION' as OperationStatus,
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    user: { userId: 1, roles: mocks.roles },
    hasRole: (roles: RoleName | readonly RoleName[]) =>
      (Array.isArray(roles) ? roles : [roles]).some((role) => mocks.roles.includes(role)),
  }),
}));

vi.mock('../hooks/use-operation-detail', () => ({
  useOperationDetail: () => ({
    operation: { id: 42, estatus: mocks.estatus, pagos: [] } as unknown as PaymentOperationResponse,
    isLoading: false,
    error: null,
    fetchOperation: vi.fn(),
  }),
}));
vi.mock('../hooks/returns/use-operation-returns', () => ({
  useReturnsByOperationId: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
}));

const noop = { isSubmitting: false, processingPaymentId: null };
vi.mock('../hooks/use-validate-payment', () => ({
  useValidatePayment: () => ({ ...noop, submitValidatePayment: vi.fn() }),
}));
vi.mock('../hooks/use-reject-payment', () => ({
  useRejectPayment: () => ({ ...noop, submitRejectPayment: vi.fn() }),
}));
vi.mock('../hooks/use-update-validation-receipt', () => ({
  useUpdateValidationReceipt: () => ({ ...noop, submitUpdateValidationReceipt: vi.fn() }),
}));
vi.mock('../hooks/use-mark-payment-in-progress', () => ({
  useMarkPaymentInProgress: () => ({
    ...noop,
    submitMarkInProgress: vi.fn(),
    submitRelease: vi.fn(),
  }),
}));

// Solo interesa si el contenedor entrega o no la acción de eliminar.
vi.mock('@/modules/operations/components/OperationDetailView', () => ({
  OperationDetailView: ({ onDeleteOperation }: { onDeleteOperation?: unknown }) => (
    <output>{onDeleteOperation ? 'con-eliminar' : 'sin-eliminar'}</output>
  ),
}));

function renderContainer(roles: string[], estatus: OperationStatus) {
  mocks.roles = roles;
  mocks.estatus = estatus;

  render(
    <OperationDetailContainer
      operationId={42}
      onBack={vi.fn()}
      onAddPayment={vi.fn()}
      onEditPayment={vi.fn()}
      onDeleteOperation={vi.fn()}
    />,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('acción de eliminar en el detalle', () => {
  it.each([['ADMIN'], ['GERENTE']])('se ofrece a %s sobre una operación pendiente', (role) => {
    renderContainer([role], 'PENDIENTE_VALIDACION');

    expect(screen.getByRole('status')).toHaveTextContent('con-eliminar');
  });

  it.each([['DIRECCION'], ['SOCIO_COMERCIAL'], ['JEFA_CAJAS'], ['AUXILIAR_CUENTAS']])(
    'no se ofrece a %s',
    (role) => {
      renderContainer([role], 'PENDIENTE_VALIDACION');

      expect(screen.getByRole('status')).toHaveTextContent('sin-eliminar');
    },
  );

  it.each([['INGRESO_PARCIAL'], ['VALIDADA'], ['COMPLETADA']])(
    'no se ofrece a ADMIN cuando la operación está en %s',
    (estatus) => {
      renderContainer(['ADMIN'], estatus as OperationStatus);

      expect(screen.getByRole('status')).toHaveTextContent('sin-eliminar');
    },
  );
});
