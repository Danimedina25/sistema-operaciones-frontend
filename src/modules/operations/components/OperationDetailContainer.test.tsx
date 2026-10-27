import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationDetailContainer } from './OperationDetailContainer';
import type { OperationStatus, PaymentOperationResponse, ReturnInstallment, ReturnPaymentResponse, OperationPaymentResponse } from '../types/operations.types.ts';
import type { RoleName } from '@/modules/auth/types/auth.types';

const mocks = vi.hoisted(() => ({
  roles: ['ADMIN'] as string[],
  estatus: 'PENDIENTE_VALIDACION' as OperationStatus,
  returns: [] as ReturnPaymentResponse[],
  installments: [] as ReturnInstallment[],
  payments: [] as OperationPaymentResponse[],
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
    operation: { id: 42, estatus: mocks.estatus, pagos: mocks.payments, saldoPendientePorRegistrar: 100, saldoPendientePorSolicitar: 100 } as unknown as PaymentOperationResponse,
    isLoading: false,
    error: null,
    fetchOperation: vi.fn(),
  }),
}));
vi.mock('../hooks/returns/use-operation-returns', () => ({
  useReturnsByOperationId: () => ({ data: mocks.returns, isLoading: false, refetch: vi.fn() }),
}));

vi.mock('../hooks/returns/use-return-request-summary', () => ({
 useReturnRequestSummary: () => ({ data: { parcialidades: mocks.installments }, isError: false }),
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

  const client = new QueryClient();
  render(
    <OperationDetailContainer
      operationId={42}
      onBack={vi.fn()}
      onAddPayment={vi.fn()}
      onEditPayment={vi.fn()}
      onDeleteOperation={vi.fn()}
    />,
    { wrapper: ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider> },
  );
}

beforeEach(() => { vi.clearAllMocks(); mocks.returns = []; mocks.installments = []; mocks.payments = []; });

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

it('abre una sola vez la acción inicial de registrar pago del Socio', () => {
  mocks.roles = ['SOCIO_COMERCIAL'];
  const onAddPayment = vi.fn();
  const props = { operationId: 42, onBack: vi.fn(), onAddPayment, onEditPayment: vi.fn(), initialAction: 'register-payment' as const };
  const client = new QueryClient();
  const view = render(<OperationDetailContainer {...props} />, { wrapper: ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
  expect(onAddPayment).toHaveBeenCalledTimes(1);
  view.rerender(<OperationDetailContainer {...props} />);
  expect(onAddPayment).toHaveBeenCalledTimes(1);
});

function initial(props: Partial<React.ComponentProps<typeof OperationDetailContainer>> = {}) {
 const onAddPayment = vi.fn(), onRequest = vi.fn(), onManage = vi.fn(), onDeliver = vi.fn(), onEdit = vi.fn(), handled = vi.fn();
 const client = new QueryClient();
 render(<QueryClientProvider client={client}><OperationDetailContainer operationId={42} onBack={vi.fn()} onAddPayment={onAddPayment} onEditPayment={onEdit} onAddRequestReturnPayment={onRequest} onManageReturn={onManage} onDeliverInstallment={onDeliver} onInitialActionHandled={handled} {...props} /></QueryClientProvider>);
 return { onAddPayment, onRequest, onManage, onDeliver, onEdit, handled };
}
it.each(['SOCIO_COMERCIAL','ADMIN'])('abre Solicitar retorno para %s dentro del detalle', role => {
 mocks.roles = [role];
 const result = initial({ initialAction: 'request-return' });
 expect(result.onRequest).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }), 100);
 expect(result.handled).toHaveBeenCalledOnce();
});
it('no permite solicitar retornos ni registrar ingresos con un perfil de consulta', () => {
 mocks.roles = ['DIRECCION'];
 expect(initial({ initialAction: 'request-return' }).onRequest).not.toHaveBeenCalled();
 expect(initial({ initialAction: 'register-payment' }).onAddPayment).not.toHaveBeenCalled();
});
it('gestiona la solicitud seleccionada y no otra del mismo folio', () => {
 mocks.roles = ['JEFA_CUENTAS'];
 mocks.returns = [{ id: 7, tipoPago: 'TRANSFERENCIA' }, { id: 8, tipoPago: 'TRANSFERENCIA' }] as ReturnPaymentResponse[];
 const result = initial({ initialAction: 'manage-return', initialTargetId: 8 });
 expect(result.onManage).toHaveBeenCalledExactlyOnceWith(mocks.returns[1]);
});
it('abre la solicitud con una confirmación del socio pendiente', () => {
 mocks.roles = ['SOCIO_COMERCIAL'];
 mocks.returns = [{ id: 7, parcialidades: [{ tipoPago: 'EFECTIVO', estatus: 'COMPLETADA' }] }, { id: 8, parcialidades: [{ tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA', confirmadoPorSocio: false }] }] as ReturnPaymentResponse[];
 expect(initial({ initialAction: 'confirm-return' }).onManage).toHaveBeenCalledWith(mocks.returns[1]);
});
it.each(['JEFA_CAJAS','ADMIN'])('abre la entrega exacta seleccionada para %s', role => {
 mocks.roles = [role]; mocks.returns = [{ id: 7 }] as ReturnPaymentResponse[];
 mocks.installments = [{ id: 18, returnRequestId: 7, operationId: 42, tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA', cerradoPorJefa: false }, { id: 19, returnRequestId: 7, operationId: 42, tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA', cerradoPorJefa: false }] as ReturnInstallment[];
 expect(initial({ initialAction: 'deliver-installment', initialTargetId: 7, initialInstallmentId: 19 }).onDeliver).toHaveBeenCalledExactlyOnceWith(mocks.installments[1]);
});
it.each([
 { role: 'JEFA_CUENTAS', operationId: 42, code: false, closed: false },
 { role: 'JEFA_CAJAS', operationId: 99, code: false, closed: false },
 { role: 'JEFA_CAJAS', operationId: 42, code: true, closed: false },
 { role: 'JEFA_CAJAS', operationId: 42, code: false, closed: true },
])('bloquea entregas no autorizadas o no vigentes: %j', item => {
 mocks.roles = [item.role]; mocks.returns = [{ id: 7 }] as ReturnPaymentResponse[];
 mocks.installments = [{ id: 18, returnRequestId: 7, operationId: item.operationId, codigoParaCliente: item.code, tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA', cerradoPorJefa: item.closed }] as ReturnInstallment[];
 expect(initial({ initialAction: 'deliver-installment', initialTargetId: 7, initialInstallmentId: 18 }).onDeliver).not.toHaveBeenCalled();
});
it('abre la corrección del mismo pago rechazado, sin tocar un comprobante validado', () => {
 mocks.roles = ['SOCIO_COMERCIAL']; mocks.payments = [{ id: 1, estatus: 'VALIDADA', tipoPago: 'EFECTIVO' }, { id: 2, estatus: 'RECHAZADA', tipoPago: 'DEPOSITO' }] as OperationPaymentResponse[];
 const result = initial({ initialAction: 'review-rejected-payment' });
 expect(result.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }), 2);
 expect(result.onAddPayment).not.toHaveBeenCalled();
});

it('un cheque rechazado se sustituye registrando un pago nuevo', () => {
 mocks.roles = ['SOCIO_COMERCIAL']; mocks.payments = [{ id: 3, estatus: 'RECHAZADA', tipoPago: 'CHEQUE' }] as OperationPaymentResponse[];
 const result = initial({ initialAction: 'review-rejected-payment' });
 expect(result.onAddPayment).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
 expect(result.onEdit).not.toHaveBeenCalled();
});

it('no ofrece gestión de un retorno bancario a Cajas desde un enlace directo', () => {
 mocks.roles = ['JEFA_CAJAS']; mocks.returns = [{ id: 8, tipoPago: 'TRANSFERENCIA' }] as ReturnPaymentResponse[];
 expect(initial({ initialAction: 'manage-return', initialTargetId: 8 }).onManage).not.toHaveBeenCalled();
});
