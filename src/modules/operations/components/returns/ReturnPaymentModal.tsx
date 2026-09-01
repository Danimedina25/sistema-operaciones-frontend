import { useMemo } from 'react';
import { History, PlusCircle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
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
}: ReturnPaymentModalProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const { accounts } = useBankAccounts();

  const isManage = variant === 'manage';

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
  const esEfectivo = returnRequest
    ? isCashReturnMethod(returnRequest.tipoPago)
    : false;

  // La sección de registro solo aparece en modo "manage" y solo para roles que
  // gestionan ese método (el Socio Comercial nunca la ve).
  const userManagesMethod =
    !!returnRequest && canManageReturnPayments && roleCanHandleMethod(returnRequest);
  const showRegisterSection = isManage && userManagesMethod;

  const availability =
    returnRequest && totals && showRegisterSection
      ? resolveRegisterInstallmentAvailability({
          totals,
          estatus: returnRequest.estatus,
          hasPermission: true,
        })
      : { canRegister: false, reason: null };

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

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {returnRequest === null ? (
        <div className="py-8 text-center text-sm text-slate-500">Cargando...</div>
      ) : (
        <div className="space-y-6">
          <ReturnRequestSummarySection returnRequest={returnRequest} />

          {showRegisterSection ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {registrarSectionTitle}
                </h3>
              </div>

              {availability.canRegister ? (
                <RegisterInstallmentForm
                  key={`${returnRequest.id}-${returnRequest.montoRetornado ?? 0}-${returnRequest.montoEnProceso ?? 0}`}
                  returnRequest={returnRequest}
                  bankAccounts={bankAccounts}
                  isSubmitting={isSubmittingInstallment}
                  hideSummary
                  onSubmit={(values) =>
                    onSubmitInstallment(returnRequest.id, {
                      ...values,
                      operationId: returnRequest.operationId,
                    })
                  }
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
          ) : null}

          {showHistory ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">{historyHeading}</h3>
              </div>
              <InstallmentHistoryTable
                installments={installments}
                isLoading={isLoadingHistory}
                emptyMessage={emptyHistoryMessage}
                canConfirm={isManage ? canConfirm : undefined}
                canDeliver={isManage ? canDeliver : undefined}
                canCancel={isManage ? canCancel : undefined}
                onConfirm={isManage ? onConfirm : undefined}
                onDeliver={isManage ? onDeliver : undefined}
                onCancel={isManage ? onCancel : undefined}
              />
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
