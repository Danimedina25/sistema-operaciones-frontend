import type { OperationDetailAction } from '@/routes/paths';
import { useReturnRequestSummary } from '../hooks/returns/use-return-request-summary';
import { canJefaDeliverInstallment } from '../utils/return-installment';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OperationDetailView } from '@/modules/operations/components/OperationDetailView';
import { useOperationDetail } from '@/modules/operations/hooks/use-operation-detail';
import { useValidatePayment } from '../hooks/use-validate-payment';
import { useRejectPayment } from '../hooks/use-reject-payment';
import { useUpdateValidationReceipt } from '../hooks/use-update-validation-receipt';
import { useMarkPaymentInProgress } from '../hooks/use-mark-payment-in-progress';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentOperationResponse, ReturnPaymentResponse, ReturnInstallment } from '../types/operations.types.ts';
import { useReturnsByOperationId } from '../hooks/returns/use-operation-returns';

interface OperationDetailContainerProps {
  operationId: number;
  onBack: () => void;
  backLabel?: string;
  onAddPayment: (operation: PaymentOperationResponse) => void;
  onAddRequestReturnPayment?: (operation: PaymentOperationResponse, montoPendientePorSolicitar: number) => void;
  onOpenReturn?: (returnRequest: ReturnPaymentResponse) => void;
  onManageReturn?: (returnRequest: ReturnPaymentResponse) => void;
  scrollToPayments?: boolean;
  scrollToReturns?: boolean;
  initialAction?: OperationDetailAction;
  initialInstallmentId?: number;
  onDeliverInstallment?: (installment: ReturnInstallment) => void;
  initialTargetId?: number;
  onInitialActionHandled?: () => void;
  onEditPayment: (operation: PaymentOperationResponse, paymentId: number) => void;
  onEditReturn?: (
    returnPayment: ReturnPaymentResponse,
  ) => void;
  onDeleteOperation?: (operation: PaymentOperationResponse) => void;
}

export function OperationDetailContainer({
  operationId,
  onBack,
  backLabel = 'Operaciones',
  onAddPayment,
  onAddRequestReturnPayment,
  onOpenReturn,
  onManageReturn,
  scrollToPayments = false,
  scrollToReturns = false,
  initialAction,
  initialTargetId,
  initialInstallmentId,
  onDeliverInstallment,
  onInitialActionHandled,
  onEditPayment,
  onEditReturn,
  onDeleteOperation,
}: OperationDetailContainerProps) {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const canViewFinancialDetails = !hasRole(['SOCIO_COMERCIAL', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'JEFA_CAJAS']);
  const canViewOperationExtras = !hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'JEFA_CAJAS']);
  const canRequestReturn = hasRole(['SOCIO_COMERCIAL']) || hasRole(['ADMIN']);
  const canRegisterPayment = hasRole(['SOCIO_COMERCIAL', 'ADMIN']);
  // Misma regla que en el listado: rol ADMIN/GERENTE y operación aún pendiente.
  const canDeleteOperation = hasRole(['ADMIN', 'GERENTE']);

  const { operation, isLoading, error, fetchOperation } =
    useOperationDetail(operationId);
  const handledInitialAction = useRef(false);
  useEffect(() => { handledInitialAction.current = false; }, [operationId, initialAction, initialTargetId, initialInstallmentId]);

  useEffect(() => {
    if (!operation || !initialAction || initialAction === 'review-payment' || initialAction === 'manage-return' || initialAction === 'deliver-installment' || initialAction === 'confirm-return' || handledInitialAction.current) return;
    handledInitialAction.current = true;
    if (initialAction === 'register-payment' && canRegisterPayment && operation.saldoPendientePorRegistrar > 0) onAddPayment(operation);
    if (initialAction === 'review-rejected-payment' && canRegisterPayment) {
      // El rechazo se corrige sobre el mismo pago; solo el cheque rechazado se sustituye con uno nuevo.
      const rejected = operation.pagos.filter(payment => payment.estatus === 'RECHAZADA');
      const correctable = rejected.find(payment => payment.tipoPago !== 'CHEQUE');
      if (correctable) onEditPayment(operation, correctable.id);
      else if (rejected.length > 0 && operation.saldoPendientePorRegistrar > 0) onAddPayment(operation);
    }
    if (initialAction === 'request-return' && canRequestReturn && operation.saldoPendientePorSolicitar > 0) {
      onAddRequestReturnPayment?.(operation, operation.saldoPendientePorSolicitar);
    }
    onInitialActionHandled?.();
  }, [operation, initialAction, canRegisterPayment, canRequestReturn, onAddPayment, onAddRequestReturnPayment, onEditPayment, onInitialActionHandled]);

  const {
    data: returns = [],
    isLoading: isLoadingReturns,
    refetch: refetchReturns,
  } = useReturnsByOperationId(operationId);

  const deliverySummary = useReturnRequestSummary(initialAction === 'deliver-installment' && returns.some(item => item.id === initialTargetId) ? initialTargetId : undefined);

  useEffect(() => {
    if (!operation || isLoadingReturns || handledInitialAction.current) return;
    if (initialAction === 'manage-return' && initialTargetId) {
      const target = returns.find(item => item.id === initialTargetId);
      handledInitialAction.current = true;
      if (target) {
        const allowed = hasRole(['ADMIN', 'SOCIO_COMERCIAL']) ||
          (target.tipoPago === 'EFECTIVO' ? hasRole(['JEFA_CAJAS']) : target.tipoPago === 'RETIRO_SIN_TARJETA' ? hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']) || (hasRole(['JEFA_CAJAS']) && target.parcialidades?.some(i => !i.codigoParaCliente)) : hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']));
        if (allowed) onManageReturn?.(target);
        else onOpenReturn?.(target);
      }
      onInitialActionHandled?.();
    }
    if (initialAction === 'confirm-return' && hasRole(['SOCIO_COMERCIAL', 'ADMIN'])) {
      const target = returns.find(item => item.parcialidades?.some(i => !i.confirmadoPorSocio && i.estatus !== 'CANCELADA' && i.estatus !== 'COMPLETADA' && (i.tipoPago === 'EFECTIVO' || i.tipoPago === 'RETIRO_SIN_TARJETA')));
      handledInitialAction.current = true;
      if (target) onManageReturn?.(target);
      onInitialActionHandled?.();
    }
    if (initialAction === 'deliver-installment' && initialTargetId && initialInstallmentId) {
      if (!returns.some(item => item.id === initialTargetId)) {
        handledInitialAction.current = true; onInitialActionHandled?.(); return;
      }
      if (!deliverySummary.data && !deliverySummary.isError) return;
      const target = deliverySummary.data?.parcialidades.find(i => i.id === initialInstallmentId && i.operationId === operationId && i.returnRequestId === initialTargetId);
      handledInitialAction.current = true;
      if (target && !target.codigoParaCliente && canJefaDeliverInstallment(target, { isJefaCajas: hasRole(['JEFA_CAJAS']), isAdmin: hasRole(['ADMIN']) })) onDeliverInstallment?.(target);
      onInitialActionHandled?.();
    }
  }, [operation, operationId, isLoadingReturns, initialAction, initialTargetId, initialInstallmentId, returns, deliverySummary.data, deliverySummary.isError, onManageReturn, onOpenReturn, onDeliverInstallment, onInitialActionHandled, hasRole]);

  const { processingPaymentId: validatingPaymentId, submitValidatePayment } =
    useValidatePayment({
      onSuccess: async () => {
        await fetchOperation();
        await queryClient.invalidateQueries({ queryKey: ['cash-work'] });
      },
    });

  const { processingPaymentId: rejectingPaymentId, submitRejectPayment } =
    useRejectPayment({
      onSuccess: async () => {
        await fetchOperation();
        await queryClient.invalidateQueries({ queryKey: ['cash-work'] });
      },
    });

  const {
    processingPaymentId: editingValidationReceiptPaymentId,
    submitUpdateValidationReceipt,
  } = useUpdateValidationReceipt({
    onSuccess: async () => {
      await fetchOperation();
    },
  });

  const {
    processingPaymentId: markingInProgressPaymentId,
    submitMarkInProgress,
    submitRelease,
  } = useMarkPaymentInProgress({
    onSuccess: async () => {
      await fetchOperation();
    },
  });

  const activeProcessingPaymentId =
    validatingPaymentId ??
    rejectingPaymentId ??
    editingValidationReceiptPaymentId ??
    markingInProgressPaymentId ??
    null;

  if (isLoading || isLoadingReturns) {
    return (
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/[0.06]">
        <div className="animate-pulse bg-gradient-to-r from-slate-950 to-slate-800 p-8">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-4 h-8 w-72 max-w-full rounded bg-white/10" />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-20 rounded-2xl bg-white/5" />)}
          </div>
        </div>
        <p className="p-6 text-center text-sm font-medium text-slate-500">Preparando resumen financiero...</p>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-slate-700 hover:underline"
        >
          Regresar
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm">
          {error ?? 'No se pudo cargar el detalle de la operación.'}
        </div>
      </div>
    );
  }

  return (
    <OperationDetailView
      operation={operation}
      returns={returns}
      onBack={onBack}
      onAddPayment={() => onAddPayment(operation)}
      onEditPayment={(paymentId) => onEditPayment(operation, paymentId)}
      onAddRequestReturnPayment={
        canRequestReturn && onAddRequestReturnPayment
          ? (operation: PaymentOperationResponse, montoPendientePorSolicitar: number) =>
            onAddRequestReturnPayment(operation, montoPendientePorSolicitar)
          : undefined
      }
      onOpenReturn={onOpenReturn}
      onManageReturn={onManageReturn}
      backLabel={backLabel}
      onValidatePayment={submitValidatePayment}
      onRejectPayment={submitRejectPayment}
      onEditValidationReceipt={submitUpdateValidationReceipt}
      onMarkPaymentInProgress={submitMarkInProgress}
      onReleasePayment={submitRelease}
      processingPaymentId={activeProcessingPaymentId}
      canViewFinancialDetails={canViewFinancialDetails}
      canViewOperationExtras={canViewOperationExtras}
      canRequestReturn={canRequestReturn}
      onOperationUpdated={async () => {
        await fetchOperation();
        await refetchReturns();
      }}
      scrollToPayments={scrollToPayments}
      scrollToReturns={scrollToReturns}
      initialReviewPaymentId={initialAction === 'review-payment' ? initialTargetId : undefined}
      onInitialReviewHandled={onInitialActionHandled}
      onEditReturn={onEditReturn}
      onDeleteOperation={
        canDeleteOperation &&
        onDeleteOperation &&
        operation.estatus === 'PENDIENTE_VALIDACION'
          ? onDeleteOperation
          : undefined
      }
    />
  );
}
