import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { OperationDetailCard } from '@/modules/operations/components/OperationDetailCard';
import { PaymentsTable } from '@/modules/operations/components/PaymentsTable';
import { OperationPaymentResponse, PaymentOperationResponse } from '../types/operations.types.ts';

interface OperationDetailViewProps {
  operation: PaymentOperationResponse;
  onBack: () => void;
  onValidatePayment?: (paymentId: number) => Promise<void> | void;
  processingPaymentId?: number | null;
}

export function OperationDetailView({
  operation,
  onBack,
  onValidatePayment,
  processingPaymentId = null,
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

      <OperationDetailCard operation={operation} />

      <PaymentsTable
        payments={operation.pagos}
        onValidatePayment={onValidatePayment}
        processingPaymentId={processingPaymentId}
      />
    </div>
  );
}