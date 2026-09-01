import { useMemo } from 'react';
import { History, PlusCircle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useAuth } from '@/modules/auth/store/auth.context';
import {
  isCashReturnMethod,
  resolveRegisterInstallmentAvailability,
  resolveReturnRequestTotals,
  shouldShowInstallmentHistory,
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
 * Vista única de una solicitud de retorno: datos de la solicitud + avance
 * (retornado / pendiente / disponible), formulario para registrar un retorno
 * parcial e historial de parcialidades con sus acciones.
 */
export function ReturnPaymentModal({
  open,
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

  const availability =
    returnRequest && totals
      ? resolveRegisterInstallmentAvailability({
          totals,
          estatus: returnRequest.estatus,
          hasPermission: canManageReturnPayments && roleCanHandleMethod(returnRequest),
        })
      : { canRegister: false, reason: null };

  const showHistory = !!totals && shouldShowInstallmentHistory(totals, installments);

  const title =
    returnRequest && returnRequest.estatus === 'RETORNADO' ? 'Retorno' : 'Retornar';

  const esEfectivo = returnRequest
    ? isCashReturnMethod(returnRequest.tipoPago)
    : false;
  const registrarSectionTitle = esEfectivo
    ? 'Programar recolección'
    : 'Registrar retorno';

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {returnRequest === null ? (
        <div className="py-8 text-center text-sm text-slate-500">Cargando...</div>
      ) : (
        <div className="space-y-6">
          <ReturnRequestSummarySection returnRequest={returnRequest} />

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

          {showHistory ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Historial de retornos parciales
                </h3>
              </div>
              <InstallmentHistoryTable
                installments={installments}
                isLoading={isLoadingHistory}
                canConfirm={canConfirm}
                canDeliver={canDeliver}
                canCancel={canCancel}
                onConfirm={onConfirm}
                onDeliver={onDeliver}
                onCancel={onCancel}
              />
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
