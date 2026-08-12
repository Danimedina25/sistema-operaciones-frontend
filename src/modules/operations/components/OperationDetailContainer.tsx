import { OperationDetailView } from '@/modules/operations/components/OperationDetailView';
import { useOperationDetail } from '@/modules/operations/hooks/use-operation-detail';
import { useValidatePayment } from '../hooks/use-validate-payment';
import { useRejectPayment } from '../hooks/use-reject-payment';
import { useUpdateValidationReceipt } from '../hooks/use-update-validation-receipt';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentOperationResponse, ReturnPaymentResponse } from '../types/operations.types.ts';
import { useReturnsByOperationId } from '../hooks/returns/use-operation-returns';

interface OperationDetailContainerProps {
  operationId: number;
  onBack: () => void;
  backLabel?: string;
  onAddPayment: (operation: PaymentOperationResponse) => void;
  onAddReturnPayment?: (
    operation: PaymentOperationResponse,
    montoPendienteARetornar: number,
  ) => void;
  onAddRequestReturnPayment?: (operation: PaymentOperationResponse, montoPendientePorSolicitar: number) => void;
  onDefineCashReturnTime?: (returnPayment: ReturnPaymentResponse) => void;
  onPayReturn?: (returnPayment: ReturnPaymentResponse) => void;
  scrollToPayments?: boolean;
  scrollToReturns?: boolean;
  onEditPayment: (operation: PaymentOperationResponse, paymentId: number) => void;
  onEditReturn?: (
    returnPayment: ReturnPaymentResponse,
  ) => void;
  onConfirmCashReturnPickup?: (returnPayment: ReturnPaymentResponse) => void;
  onMarkCashReturnDelivered?: (returnPayment: ReturnPaymentResponse) => void;
}

export function OperationDetailContainer({
  operationId,
  onBack,
  backLabel = 'Operaciones',
  onAddPayment,
  onAddReturnPayment,
  onAddRequestReturnPayment,
  onDefineCashReturnTime,
  onPayReturn,
  scrollToPayments = false,
  scrollToReturns = false,
  onEditPayment,
  onEditReturn,
  onConfirmCashReturnPickup,
  onMarkCashReturnDelivered
}: OperationDetailContainerProps) {
  const { hasRole } = useAuth();

  const canViewFinancialDetails = !hasRole(['SOCIO_COMERCIAL', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'JEFA_CAJAS']);
  const canViewOperationExtras = !hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'JEFA_CAJAS']);
  const canRequestReturn = hasRole(['SOCIO_COMERCIAL']) || hasRole(['ADMIN']);
  const canPayReturn = hasRole(['ADMIN']) || hasRole(['JEFA_CAJAS']) || hasRole(['JEFA_CUENTAS']) || hasRole(['AUXILIAR_CUENTAS']);
  const isSocioComercial = hasRole(['SOCIO_COMERCIAL']);

  const { operation, isLoading, error, fetchOperation } =
    useOperationDetail(operationId);

  const {
    data: returns = [],
    isLoading: isLoadingReturns,
    refetch: refetchReturns,
  } = useReturnsByOperationId(operationId);

  const { processingPaymentId: validatingPaymentId, submitValidatePayment } =
    useValidatePayment({
      onSuccess: async () => {
        await fetchOperation();
      },
    });

  const { processingPaymentId: rejectingPaymentId, submitRejectPayment } =
    useRejectPayment({
      onSuccess: async () => {
        await fetchOperation();
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

  const activeProcessingPaymentId =
    validatingPaymentId ??
    rejectingPaymentId ??
    editingValidationReceiptPaymentId ??
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
      onDefineCashReturnTime={
        canPayReturn && onDefineCashReturnTime
          ? (returnPayment) => onDefineCashReturnTime(returnPayment)
          : undefined
      }
      onPayReturn={canPayReturn && onPayReturn ? (returnPayment) => onPayReturn(returnPayment) : undefined}
      onConfirmCashReturnPickup={
        isSocioComercial && onConfirmCashReturnPickup
          ? (returnPayment) => onConfirmCashReturnPickup(returnPayment)
          : undefined
      }
      onMarkCashReturnDelivered={
        canPayReturn && onMarkCashReturnDelivered
          ? (returnPayment) => onMarkCashReturnDelivered(returnPayment)
          : undefined
      }
      backLabel={backLabel}
      onValidatePayment={submitValidatePayment}
      onRejectPayment={submitRejectPayment}
      onEditValidationReceipt={submitUpdateValidationReceipt}
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
      onEditReturn={onEditReturn}
    />
  );
}
