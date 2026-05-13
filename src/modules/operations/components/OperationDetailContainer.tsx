import { OperationDetailView } from '@/modules/operations/components/OperationDetailView';
import { useOperationDetail } from '@/modules/operations/hooks/use-operation-detail';
import { useValidatePayment } from '../hooks/use-validate-payment';
import { useRejectPayment } from '../hooks/use-reject-payment';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { useReturnsByOperationId } from '../hooks/returns/use-operation-returns';

interface OperationDetailContainerProps {
  operationId: number;
  onBack: () => void;
  onAddPayment: (operation: PaymentOperationResponse) => void;
  onAddReturnPayment: (operation: PaymentOperationResponse, montoPendienteARetornar: number) => void;
  scrollToPayments?: boolean;
  onEditPayment: (operation: PaymentOperationResponse, paymentId: number) => void;
}

export function OperationDetailContainer({
  operationId,
  onBack,
  onAddPayment,
  onAddReturnPayment,
  scrollToPayments = false,
  onEditPayment
}: OperationDetailContainerProps) {
  const { operation, isLoading, fetchOperation } =
    useOperationDetail(operationId);

  const {
    data: returns = [],
    isLoading: isLoadingReturns,
    refetch: refetchReturns,
  } = useReturnsByOperationId(operationId);

  const { hasRole } = useAuth();

  const canViewFinancialDetails = !hasRole(['SOCIO_COMERCIAL']);

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
          No se pudo cargar el detalle de la operación.
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
      onAddReturnPayment={(montoPendienteARetornar: number) =>
        onAddReturnPayment(operation, montoPendienteARetornar)
      }
      onValidatePayment={submitValidatePayment}
      onRejectPayment={submitRejectPayment}
      processingPaymentId={activeProcessingPaymentId}
      canViewFinancialDetails={canViewFinancialDetails}
      onOperationUpdated={async () => {
        await fetchOperation();
        await refetchReturns();
      }}
      scrollToPayments={scrollToPayments}
    />
  );
}