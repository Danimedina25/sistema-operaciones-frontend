import { OperationDetailView } from '@/modules/operations/components/OperationDetailView';
import { useOperationDetail } from '@/modules/operations/hooks/use-operation-detail';
import { useValidatePayment } from '../hooks/use-validate-payment';
import { useRejectPayment } from '../hooks/use-reject-payment';
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
  onEditReturn
}: OperationDetailContainerProps) {
  const { hasRole } = useAuth();

  const canViewFinancialDetails = !hasRole(['SOCIO_COMERCIAL']);
  const canRequestReturn = hasRole(['SOCIO_COMERCIAL']) || hasRole(['ADMIN']);
  const canPayReturn = hasRole(['ADMIN']) || hasRole(['JEFA_CAJAS']) || hasRole(['JEFA_CUENTAS']);

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

  const activeProcessingPaymentId =
    validatingPaymentId ?? rejectingPaymentId ?? null;

  if (isLoading || isLoadingReturns) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Cargando detalle de la operación...
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

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
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
      backLabel={backLabel}
      onValidatePayment={submitValidatePayment}
      onRejectPayment={submitRejectPayment}
      processingPaymentId={activeProcessingPaymentId}
      canViewFinancialDetails={canViewFinancialDetails}
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