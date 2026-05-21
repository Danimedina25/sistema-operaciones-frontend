import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import { OperationDetailCard } from '@/modules/operations/components/OperationDetailCard';
import { PaymentsTable } from '@/modules/operations/components/PaymentsTable';
import {
  PaymentOperationResponse,
  ReturnPaymentResponse,
} from '../types/operations.types.ts';
import { ReturnPaymentsTable } from './returns/ReturnPaymentsTable.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';

interface OperationDetailViewProps {
  operation: PaymentOperationResponse;
  returns?: ReturnPaymentResponse[];
  onBack: () => void;
  backLabel?: string;
  onValidatePayment?: (paymentId: number) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  processingPaymentId?: number | null;
  onAddPayment: (operationId: number) => void;
  onAddRequestReturnPayment?: (operation: PaymentOperationResponse, montoPendientePorSolicitar: number) => void;
  onPayReturn?: (returnPayment: ReturnPaymentResponse) => void;
  canRequestReturn?: boolean;
  canViewFinancialDetails: boolean;
  onOperationUpdated?: () => void | Promise<void>;
  scrollToPayments?: boolean;
  scrollToReturns?: boolean;
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
  onAddRequestReturnPayment,
  onPayReturn,
  canViewFinancialDetails,
  onOperationUpdated,
  scrollToPayments = false,
  scrollToReturns = false,
  onEditPayment,
  canRequestReturn = false,
}: OperationDetailViewProps) {
  const paymentsSectionRef = useRef<HTMLDivElement | null>(null);
  const returnsSectionRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDownButton, setShowScrollDownButton] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const returnsElement = returnsSectionRef.current;

    if (!returnsElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollDownButton(!entry.isIntersecting);
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(returnsElement);

    return () => {
      observer.disconnect();
    };
  }, [operation.id]);

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

  useEffect(() => {
    if (!scrollToReturns) return;

    const timeoutId = window.setTimeout(() => {
      returnsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [scrollToReturns, operation.id]);

  function scrollToTables() {
    returnsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  const montoPendientePorSolicitar = Math.max(
    operation.montoTotalDevolverCliente - operation.montoSolicitadoRetorno,
    0,
  );

  const montoPendientePorRetornar = operation.saldoPendienteRetornar
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

      <div ref={returnsSectionRef}>
        <ReturnPaymentsTable
          returns={returns}
          montoPendientePorRetornar={montoPendientePorRetornar}
          montoPendientePorSolicitar={montoPendientePorSolicitar}
          onAddRequestReturnPayment={() => {
            onAddRequestReturnPayment?.(operation, montoPendientePorSolicitar);
          }}
          canManageReturnPayments={(user?.roles?.includes('ADMIN') || user?.roles?.includes('JEFA_CAJAS')) ?? false}
          onPayReturn={onPayReturn}
          operationStatus={operation.estatus}
        />
      </div>

      {showScrollDownButton && (
        <button
          type="button"
          onClick={() => {
            returnsSectionRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }}
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800"
          aria-label="Ir a retornos"
          title="Ir a retornos"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}