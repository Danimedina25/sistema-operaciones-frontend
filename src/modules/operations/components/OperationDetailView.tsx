import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, Landmark } from 'lucide-react';
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
  onValidatePayment?: (
    operationId: number,
    paymentId: number,
    comprobanteValidacion: File
  ) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  onEditValidationReceipt?: (
    operationId: number,
    paymentId: number,
    comprobanteValidacion: File
  ) => Promise<void> | void;
  onMarkPaymentInProgress?: (
    paymentId: number,
    observaciones?: string
  ) => Promise<void> | void;
  onReleasePayment?: (paymentId: number) => Promise<void> | void;
  processingPaymentId?: number | null;
  onAddPayment: (operationId: number) => void;
  onAddRequestReturnPayment?: (operation: PaymentOperationResponse, montoPendientePorSolicitar: number) => void;
  onOpenReturn?: (returnRequest: ReturnPaymentResponse) => void;
  onManageReturn?: (returnRequest: ReturnPaymentResponse) => void;
  canRequestReturn?: boolean;
  canViewFinancialDetails: boolean;
  canViewOperationExtras: boolean;
  onOperationUpdated?: () => void | Promise<void>;
  scrollToPayments?: boolean;
  scrollToReturns?: boolean;
  onEditPayment?: (paymentId: number) => void;
  onEditReturn?: (
    returnPayment: ReturnPaymentResponse,
  ) => void;
}

export function OperationDetailView({
  operation,
  returns = [],
  onBack,
  backLabel = 'Operaciones',
  onValidatePayment,
  onRejectPayment,
  onEditValidationReceipt,
  onMarkPaymentInProgress,
  onReleasePayment,
  processingPaymentId = null,
  onAddPayment,
  onAddRequestReturnPayment,
  onOpenReturn,
  onManageReturn,
  canViewFinancialDetails,
  canViewOperationExtras,
  onOperationUpdated,
  scrollToPayments = false,
  scrollToReturns = false,
  onEditPayment,
  onEditReturn,
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

  const montoPendientePorSolicitar = Math.max(
    operation.montoTotalDevolverCliente - operation.montoSolicitadoRetorno,
    0,
  );

  const montoPendientePorRetornar = operation.saldoPendienteRetornar
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:flex">
          <Landmark className="h-4 w-4" />
          Vista financiera
        </div>
      </div>

      <OperationDetailCard
        operation={operation}
        canViewFinancialDetails={canViewFinancialDetails}
        canViewOperationExtras={canViewOperationExtras}
        onOperationUpdated={onOperationUpdated}
      />

      <div ref={paymentsSectionRef} className="scroll-mt-20">
        <PaymentsTable
          payments={operation.pagos}
          operationId={operation.id}
          clienteNombre={operation.clienteNombre}
          socioComercialTelefono={operation.socioComercialTelefono}
          onValidatePayment={(paymentId, comprobanteValidacion) =>
            onValidatePayment?.(
              operation.id,
              paymentId,
              comprobanteValidacion
            )
          }
          onAddPayment={() => onAddPayment(operation.id)}
          onEditPayment={onEditPayment}
          onRejectPayment={onRejectPayment}
          onEditValidationReceipt={(paymentId, comprobanteValidacion) =>
            onEditValidationReceipt?.(
              operation.id,
              paymentId,
              comprobanteValidacion
            )
          }
          onMarkPaymentInProgress={onMarkPaymentInProgress}
          onReleasePayment={onReleasePayment}
          montoPendientePorRegistrar={operation.saldoPendientePorRegistrar}
          processingPaymentId={processingPaymentId}
        />
      </div>

      <div ref={returnsSectionRef} className="scroll-mt-20">
        <ReturnPaymentsTable
          returns={returns}
          montoPendientePorRetornar={montoPendientePorRetornar}
          montoPendientePorSolicitar={montoPendientePorSolicitar}
          onAddRequestReturnPayment={() => {
            onAddRequestReturnPayment?.(operation, montoPendientePorSolicitar);
          }}
          canManageReturnPayments={
            (user?.roles?.includes('ADMIN') ||
              user?.roles?.includes('JEFA_CAJAS') ||
              user?.roles?.includes('JEFA_CUENTAS') ||
              user?.roles?.includes('AUXILIAR_CUENTAS')) ??
            false
          }
          canEditRequestReturnPayments={
            user?.roles?.includes('SOCIO_COMERCIAL') ||
            user?.roles?.includes('ADMIN')
          }
          onOpenReturn={onOpenReturn}
          onManageReturn={onManageReturn}
          onEditReturn={onEditReturn}
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
          className="
fixed
bottom-6
right-6
z-40
inline-flex
h-14
w-14
items-center
justify-center
rounded-2xl
border
border-slate-700
bg-slate-900
text-white
shadow-xl
shadow-slate-950/20
backdrop-blur
transition-all
duration-200
hover:scale-105
hover:bg-slate-900
active:scale-95
"
          aria-label="Ir a retornos"
          title="Ir a retornos"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
