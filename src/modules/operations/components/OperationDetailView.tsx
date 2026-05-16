import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { OperationDetailCard } from '@/modules/operations/components/OperationDetailCard';
import { PaymentsTable } from '@/modules/operations/components/PaymentsTable';
import {
  PaymentOperationResponse,
  ReturnPaymentResponse,
} from '../types/operations.types.ts';
import { ReturnPaymentsTable } from './returns/ReturnPaymentsTable.js';

interface OperationDetailViewProps {
  operation: PaymentOperationResponse;
  returns?: ReturnPaymentResponse[];
  onBack: () => void;
  backLabel?: string;
  onValidatePayment?: (paymentId: number) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  processingPaymentId?: number | null;
  onAddPayment: (operationId: number) => void;
  onAddReturnPayment?: (montoPendienteARetornar: number) => void;
  canRequestReturn?: boolean;
  canViewFinancialDetails: boolean;
  onOperationUpdated?: () => void | Promise<void>;
  scrollToPayments?: boolean;
  onEditPayment?: (paymentId: number) => void;
}

export function OperationDetailView({
  operation,
  returns = [],
  onBack,
  backLabel = 'Operaciones',
  onValidatePayment,
  onRejectPayment,
  processingPaymentId = null,
  onAddPayment,
  onAddReturnPayment,
  canViewFinancialDetails,
  onOperationUpdated,
  scrollToPayments = false,
  onEditPayment,
  canRequestReturn = false,
}: OperationDetailViewProps) {
  const paymentsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollToPayments) return;

    const timeoutId = window.setTimeout(() => {
      paymentsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [scrollToPayments, operation.id]);

  const totalRetornado = returns
  .filter((item) => item.estatus === 'REALIZADO')
  .reduce((total, item) => total + item.monto, 0);  
  
  const totalRetornoComprometido = returns
  .filter((item) => item.estatus === 'SOLICITADO' || item.estatus === 'REALIZADO')
  .reduce((total, item) => total + item.monto, 0);

  const montoPendientePorSolicitar = Math.max(
    (operation.montoTotalDevolverCliente ?? 0) - totalRetornoComprometido,
    0,
  );

  const montoPendientePorRetornar = Math.max(
    (operation.montoTotalDevolverCliente ?? 0) - totalRetornado,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
      </div>

      <OperationDetailCard
        operation={operation}
        canViewFinancialDetails={canViewFinancialDetails}
        onOperationUpdated={onOperationUpdated}
      />

      <div ref={paymentsSectionRef}>
       <PaymentsTable
          payments={operation.pagos}
          onValidatePayment={onValidatePayment}
          onAddPayment={() => onAddPayment(operation.id)}
          onEditPayment={onEditPayment}
          onRejectPayment={onRejectPayment}
          montoPendientePorRegistrar={operation.saldoPendientePorRegistrar}
          processingPaymentId={processingPaymentId}
        />
      </div>

    <ReturnPaymentsTable
      returns={returns}
      montoPendientePorRetornar={montoPendientePorSolicitar}
      onAddReturnPayment={onAddReturnPayment}
      canAddReturn={
        canRequestReturn &&
        !!onAddReturnPayment &&
        montoPendientePorSolicitar > 0 &&
        (
          operation.estatus === 'VALIDADA' ||
          operation.estatus === 'RETORNO_SOLICITADO' ||
          operation.estatus === 'RETORNO_PARCIAL'
        )
      }
    />
    </div>
  );
}