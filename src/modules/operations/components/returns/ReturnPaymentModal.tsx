import { useCallback, useMemo, useState } from 'react';
import { History, PlusCircle } from 'lucide-react';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useAuth } from '@/modules/auth/store/auth.context';
import {
  isCashReturnMethod,
  resolveRegisterInstallmentAvailability,
  resolveReturnHistoryHeading,
  resolveReturnModalTitle,
  resolveReturnRequestTotals,
  shouldShowInstallmentHistory,
  type ReturnModalVariant,
} from '../../utils/return-installment';
import type {
  ReturnInstallment,
  ReturnPaymentResponse,
} from '../../types/operations.types.ts';
import {
  RegisterInstallmentForm,
  type RegisterInstallmentFormValues,
} from './RegisterInstallmentForm';
import { ReturnRequestSummarySection } from './ReturnRequestSummarySection';
import { InstallmentHistoryTable } from './InstallmentHistoryTable';
import { formatCurrency } from '../../utils/operation-formatters';
import { CardlessCodePanel } from './CardlessCodePanel';

interface ReturnPaymentModalProps {
  open: boolean;
  /**
   * `view`   → consulta (historial de retornos / recolecciones), solo lectura.
   * `manage` → registrar/programar y avanzar el proceso (confirmar recolección).
   */
  variant?: ReturnModalVariant;
  returnRequest: ReturnPaymentResponse | null;
  installments: ReturnInstallment[];
  isLoadingHistory?: boolean;
  /** El usuario puede registrar retornos parciales de este método. */
  canManageReturnPayments?: boolean;
  isSubmittingInstallment: boolean;
  onSubmitInstallment: (
    returnRequestId: number,
    values: RegisterInstallmentFormValues & { operationId: number },
  ) => Promise<void>;
  canConfirm: (installment: ReturnInstallment) => boolean;
  canDeliver: (installment: ReturnInstallment) => boolean;
  canCancel: (installment: ReturnInstallment) => boolean;
  onConfirm: (installment: ReturnInstallment) => void;
  onDeliver: (installment: ReturnInstallment) => void;
  onCancel: (installment: ReturnInstallment) => void;
  onClose: () => void;
  onAccountAssigned?: () => void | Promise<void>;
}

/**
 * Vista de una solicitud de retorno.
 *
 * - `variant="view"`: datos de la solicitud + historial de solo lectura. Sin
 *   formulario y sin acciones — es la pantalla de "Ver retorno" / "Ver
 *   recolección".
 * - `variant="manage"`: además, formulario para registrar/programar (si el rol
 *   lo permite) e historial con las acciones de la parcialidad (confirmar /
 *   entregar / cancelar) — es "Retornar" (no efectivo) y "Confirmar recolección"
 *   (efectivo).
 */
export function ReturnPaymentModal({
  open,
  variant = 'view',
  returnRequest,
  installments,
  isLoadingHistory = false,
  canManageReturnPayments = false,
  isSubmittingInstallment,
  onSubmitInstallment,
  canConfirm,
  canDeliver,
  canCancel,
  onConfirm,
  onDeliver,
  onCancel,
  onClose,
  onAccountAssigned,
}: ReturnPaymentModalProps) {
  const { user } = useAuth();
  const [cardlessBusy, setCardlessBusy] = useState(false);
  const roles = user?.roles ?? [];
  const isSocioComercial = roles.includes('SOCIO_COMERCIAL');
  const { accounts } = useBankAccounts();
  const [cashDraft, setCashDraft] = useState<{ requestId: number | null; amount: number }>({
    requestId: null,
    amount: 0,
  });

  const validationKey = `${open}-${returnRequest?.id}-${returnRequest?.montoRetornado}-${returnRequest?.montoEnProceso}`;
  const [validationState, setValidationState] = useState<{ key: string; messages: string[] }>({ key: '', messages: [] });
  const onValidationErrors = useCallback((messages: string[]) => {
    setValidationState({ key: validationKey, messages });
  }, [validationKey]);
  const collectionErrors = validationState.key === validationKey ? validationState.messages : [];

  const isManage = variant === 'manage';
  const isCashManage =
    isManage && !!returnRequest && isCashReturnMethod(returnRequest.tipoPago);
  const isBankManage = isManage && !!returnRequest && !isCashReturnMethod(returnRequest.tipoPago);

  const bankAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.activo)
        .map((account) => ({
          id: account.id,
          label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
        })),
    [accounts],
  );

  const roleCanHandleMethod = (rp: ReturnPaymentResponse): boolean => {
    if (roles.includes('ADMIN')) return true;
    if (isCashReturnMethod(rp.tipoPago)) return roles.includes('JEFA_CAJAS');
    return roles.includes('JEFA_CUENTAS') || roles.includes('AUXILIAR_CUENTAS');
  };

  const totals = returnRequest ? resolveReturnRequestTotals(returnRequest) : null;
  const cashDraftAmount = returnRequest?.id === cashDraft.requestId ? cashDraft.amount : 0;
  const esEfectivo = returnRequest
    ? isCashReturnMethod(returnRequest.tipoPago)
    : false;

  // La sección de registro solo aparece en modo "manage" y solo para roles que
  // gestionan ese método (el Socio Comercial nunca la ve).
  const userManagesMethod =
    !!returnRequest && canManageReturnPayments && roleCanHandleMethod(returnRequest);
  const showRegisterSection = isManage && userManagesMethod;

  const baseAvailability =
    returnRequest && totals && showRegisterSection
      ? resolveRegisterInstallmentAvailability({
          totals,
          estatus: returnRequest.estatus,
          hasPermission: true,
        })
      : { canRegister: false, reason: null };
  const availability = returnRequest?.tipoPago === 'RETIRO_SIN_TARJETA' && !returnRequest.cuentaAsignadaEn
    ? { canRegister: false, reason: 'Jefa de Cuentas debe asignar la cuenta origen antes de preparar el retiro.' } : baseAvailability;

  const showHistory =
    !!totals &&
    (variant === 'view' || esEfectivo
      ? true
      : shouldShowInstallmentHistory(totals, installments));

  const title = returnRequest
    ? resolveReturnModalTitle({
        variant,
        tipoPago: returnRequest.tipoPago,
        estatus: returnRequest.estatus,
        isSocioComercial,
      })
    : 'Retorno';

  const historyHeading = returnRequest
    ? resolveReturnHistoryHeading({ variant, tipoPago: returnRequest.tipoPago })
    : 'Historial';

  const registrarSectionTitle = esEfectivo
    ? 'Programar recolección'
    : 'Registrar retorno';

  const emptyHistoryMessage = esEfectivo
    ? 'Esta solicitud aún no tiene recolecciones registradas.'
    : 'Esta solicitud aún no tiene retornos registrados.';

  const registerFormSection =
    showRegisterSection && returnRequest ? (
      <section className={isBankManage ? '' : 'rounded-2xl border border-slate-200 bg-white p-4'}>
        {!isBankManage && <div className="mb-3 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            {registrarSectionTitle}
          </h3>
        </div>}

        {availability.canRegister ? (
          <RegisterInstallmentForm
            key={`${returnRequest.id}-${returnRequest.montoRetornado ?? 0}-${returnRequest.montoEnProceso ?? 0}`}
            returnRequest={returnRequest}
            bankAccounts={bankAccounts}
            isSubmitting={isSubmittingInstallment}
            hideSummary
            onValidationErrors={isManage ? onValidationErrors : undefined}
            compactBankPanel={isBankManage}
            onCancel={onClose}
            onAmountChange={(amount) => setCashDraft({ requestId: returnRequest.id, amount })}
            onSubmit={async (values) => {
              await onSubmitInstallment(returnRequest.id, {
                ...values,
                operationId: returnRequest.operationId,
              });
              setCashDraft({ requestId: null, amount: 0 });
            }}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            {returnRequest.estatus === 'RETORNADO'
              ? 'Esta solicitud ya fue retornada por completo.'
              : (availability.reason ??
                'No hay retornos parciales por registrar para esta solicitud.')}
          </p>
        )}
      </section>
    ) : null;

  const historyTable = (
    <InstallmentHistoryTable
      installments={returnRequest?.tipoPago === 'RETIRO_SIN_TARJETA' ? installments.filter(i => !i.codigoParaCliente) : installments}
      isLoading={isLoadingHistory}
      emptyMessage={emptyHistoryMessage}
      canConfirm={isManage ? canConfirm : undefined}
      canDeliver={isManage ? canDeliver : undefined}
      canCancel={isManage ? canCancel : undefined}
      onConfirm={isManage ? onConfirm : undefined}
      onDeliver={isManage ? onDeliver : undefined}
      onCancel={isManage ? onCancel : undefined}
    />
  );

  return (
    <ActionDrawer open={open} busy={isSubmittingInstallment || cardlessBusy} title={returnRequest?.tipoPago === 'RETIRO_SIN_TARJETA' && !roles.includes('JEFA_CAJAS') ? 'Códigos de retiro sin tarjeta' : isBankManage ? 'Registrar retorno' : title} subtitle={isBankManage && returnRequest ? `Solicitud #${returnRequest.id} · Operación #${returnRequest.operationId} · ${returnRequest.clienteNombre ?? 'Cliente'}` : undefined} onClose={onClose}>
      {returnRequest === null ? (
        <div className="py-8 text-center text-sm text-slate-500">Cargando...</div>
      ) : returnRequest.tipoPago === 'RETIRO_SIN_TARJETA' && (!installments.some(i => !i.codigoParaCliente) || roles.some(r => ['JEFA_CUENTAS','AUXILIAR_CUENTAS','SOCIO_COMERCIAL','ADMIN'].includes(r))) ? (
        <CardlessCodePanel onBusyChange={setCardlessBusy} request={returnRequest} installments={installments} readOnly={!isManage} onChanged={onAccountAssigned} onClose={onClose} legacyHistory={installments.some(i => !i.codigoParaCliente) ? historyTable : undefined} />
      ) : isCashManage ? (
        // "Confirmar recolección": solo la tabla de recolecciones (primero) y,
        // si aplica, el formulario para programar una nueva. Sin secciones
        // informativas.
        <div className="space-y-6">
          {totals ? (
            <FinancialSummaryCard label="Resumen de la recolección" testId="cash-collection-summary"
              metrics={[
                { label: 'Total solicitado', value: formatCurrency(totals.montoSolicitado), tone: 'blue' },
                { label: isSocioComercial ? 'Registrado' : 'Ya programado', value: formatCurrency(totals.montoRetornado + totals.montoEnProceso), tone: 'green' },
                { label: 'Pendiente', value: formatCurrency(Math.max(totals.montoDisponible - cashDraftAmount, 0)), tone: 'amber' },
              ]}
              status={!isSocioComercial ? { text: `Nueva recolección: ${formatCurrency(cashDraftAmount)}`, ok: cashDraftAmount > 0 && cashDraftAmount <= totals.montoDisponible } : undefined}
              errors={[
                ...collectionErrors.filter(message => !(cashDraftAmount > totals.montoDisponible && message.startsWith('El importe no puede superar'))),
                cashDraftAmount > totals.montoDisponible && `El importe no puede superar ${formatCurrency(totals.montoDisponible)}. Exceso: ${formatCurrency(cashDraftAmount - totals.montoDisponible)}.`,
              ]} />
          ) : null}
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Recolecciones registradas
            </h3>
            {historyTable}
          </section>

          {showRegisterSection && availability.canRegister ? registerFormSection : null}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Solo la gestión bancaria usa el resumen fijo; en las demás vistas es una sección normal. */}
          {isBankManage ? <FinancialSummaryCard label="Resumen del retorno" errors={collectionErrors}>
            <ReturnRequestSummarySection returnRequest={returnRequest} bankManage />
          </FinancialSummaryCard> : <section aria-label="Resumen del retorno">
            <ReturnRequestSummarySection returnRequest={returnRequest} />
            {collectionErrors.map(message => <p key={message} role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>)}
          </section>}

          {registerFormSection}

          {showHistory ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">{historyHeading}</h3>
              </div>
              {historyTable}
            </section>
          ) : null}
        </div>
      )}
    </ActionDrawer>
  );
}
