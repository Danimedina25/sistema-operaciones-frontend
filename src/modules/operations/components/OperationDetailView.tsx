import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Trash2 } from 'lucide-react';
import { OperationDetailCard } from '@/modules/operations/components/OperationDetailCard';
import { PaymentsTable } from '@/modules/operations/components/PaymentsTable';
import {
  PaymentOperationResponse,
  ReturnPaymentResponse,
} from '../types/operations.types.ts';
import { ReturnPaymentsTable } from './returns/ReturnPaymentsTable.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';
import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';
import { Tabs } from '@/shared/components/ui/Tabs';
import { isCashReturnMethod } from '@/modules/operations/utils/return-installment';

interface OperationDetailViewProps {
  operation: PaymentOperationResponse;
  returns?: ReturnPaymentResponse[];
  onBack: () => void;
  backLabel?: string;
  onValidatePayment?: (
    operationId: number,
    paymentId: number,
    comprobanteValidacion: File,
    denominaciones?: CashCounts
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
  initialReviewPaymentId?: number;
  onInitialReviewHandled?: () => void;
  onEditPayment?: (paymentId: number) => void;
  onEditReturn?: (
    returnPayment: ReturnPaymentResponse,
  ) => void;
  onDeleteOperation?: (operation: PaymentOperationResponse) => void;
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
  initialReviewPaymentId,
  onInitialReviewHandled,
  onEditPayment,
  onEditReturn,
  onDeleteOperation,
}: OperationDetailViewProps) {
  const paymentsSectionRef = useRef<HTMLDivElement | null>(null);
  const returnsSectionRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<'income' | 'returns'>(scrollToReturns ? 'returns' : 'income');
  const { user } = useAuth();
  const isSocio = user?.roles.includes('SOCIO_COMERCIAL');
  const isCuentas = user?.roles.includes('JEFA_CUENTAS') || user?.roles.includes('AUXILIAR_CUENTAS');
  const isCajas = user?.roles.includes('JEFA_CAJAS');
  const visibleReturnCount = returns.filter((item) => isCuentas ? !isCashReturnMethod(item.tipoPago) : isCajas ? isCashReturnMethod(item.tipoPago) : true).length;

  useEffect(() => {
    if (!scrollToPayments) return;
    setActiveTab('income');

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
    setActiveTab('returns');

    const timeoutId = window.setTimeout(() => {
      returnsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [scrollToReturns, operation.id]);

  const montoPendientePorSolicitar = operation.saldoPendientePorSolicitar;

  const montoPendientePorRetornar = operation.saldoPendienteRetornar;
  const sectionTabs = <Tabs variant="method" label="Secciones de la operación" value={activeTab} onChange={setActiveTab}
    className={isSocio ? 'max-sm:grid max-sm:w-full max-sm:grid-cols-2 max-sm:gap-0 max-sm:rounded-xl max-sm:bg-slate-200 max-sm:p-1 max-sm:[&>button]:justify-center max-sm:[&>button]:rounded-lg max-sm:[&>button]:border-0 max-sm:[&>button[aria-selected=true]]:bg-white max-sm:[&>button[aria-selected=true]]:text-slate-900 max-sm:[&>button[aria-selected=true]]:shadow-sm' : ''}
    options={[{ value: 'income', label: 'Ingresos', count: operation.pagos.length, icon: <ArrowDown className="size-3.5 text-emerald-600" /> }, { value: 'returns', label: isCuentas ? 'Retornos bancarios' : isCajas ? 'Retornos en efectivo' : 'Retornos', count: visibleReturnCount, icon: <ArrowUp className="size-3.5 text-slate-400" /> }]} />;
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-8 max-sm:flex max-sm:flex-col max-sm:gap-4 max-sm:space-y-0">
      <div className={`flex items-center justify-between ${user?.roles.includes('SOCIO_COMERCIAL') ? 'max-sm:hidden' : ''}`}>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 py-1 text-sm font-semibold text-[#3b6ef5] transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <div className="flex items-center gap-3">
          {onDeleteOperation && (
            <button
              type="button"
              onClick={() => onDeleteOperation(operation)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar operación
            </button>
          )}

        </div>
      </div>

      <OperationDetailCard
        operation={operation}
        canViewFinancialDetails={canViewFinancialDetails}
        canViewOperationExtras={canViewOperationExtras}
        onOperationUpdated={onOperationUpdated}
      />

      <div ref={paymentsSectionRef} className={activeTab === 'income' ? 'scroll-mt-20' : 'hidden'}>
        <PaymentsTable
          sectionTabs={sectionTabs}
          pendingValidationAmount={operation.saldoPendientePorValidar}
          payments={operation.pagos}
          operationId={operation.id}
          clienteNombre={operation.clienteNombre}
          socioComercialNombre={operation.socioComercialNombre}
          socioComercialTelefono={operation.socioComercialTelefono}
          onValidatePayment={(paymentId, comprobanteValidacion, denominaciones) =>
            onValidatePayment?.(
              operation.id,
              paymentId,
              comprobanteValidacion,
              denominaciones
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
          initialReviewPaymentId={initialReviewPaymentId}
          onInitialReviewHandled={onInitialReviewHandled}
        />
      </div>

      <div ref={returnsSectionRef} className={activeTab === 'returns' ? 'scroll-mt-20' : 'hidden'}>
        <ReturnPaymentsTable
          sectionTabs={sectionTabs}
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

    </div>
  );
}
