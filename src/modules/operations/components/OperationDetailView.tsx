import { ArrowLeft } from 'lucide-react';
import { OperationDetailCard } from '@/modules/operations/components/OperationDetailCard';
import { PaymentsTable } from '@/modules/operations/components/PaymentsTable';
import { PaymentOperationResponse } from '../types/operations.types.ts';

interface OperationDetailViewProps {
  operation: PaymentOperationResponse;
  onBack: () => void;
  onValidatePayment?: (paymentId: number) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  processingPaymentId?: number | null;
  onAddPayment: (operationId: number) => void;
  canViewFinancialDetails: boolean;
}

export function OperationDetailView({
  operation,
  onBack,
  onValidatePayment,
  onRejectPayment,
  processingPaymentId = null,
  onAddPayment,
  canViewFinancialDetails,
}: OperationDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Operaciones
        </button>
      </div>

      <OperationDetailCard
        operation={operation}
        canViewFinancialDetails={canViewFinancialDetails}
      />

      <PaymentsTable
        payments={operation.pagos}
        onValidatePayment={onValidatePayment}
        onAddPayment={() => onAddPayment(operation.id)}
        onRejectPayment={onRejectPayment}
        montoPendientePorRegistrar={operation.saldoPendientePorRegistrar}
        processingPaymentId={processingPaymentId}
      />
    </div>
  );
}