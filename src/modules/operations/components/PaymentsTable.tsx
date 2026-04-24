import { useMemo, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentStatusBadge } from '@/modules/operations/components/PaymentStatusBadge';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { OperationPaymentResponse } from '../types/operations.types.ts';

interface PaymentsTableProps {
  payments: OperationPaymentResponse[];
  onValidatePayment?: (paymentId: number) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  processingPaymentId?: number | null;
}

type PaymentActionType = 'VALIDATE' | 'REJECT';

interface PendingAction {
  paymentId: number;
  action: PaymentActionType;
}

export function PaymentsTable({
  payments,
  onValidatePayment,
  onRejectPayment,
  processingPaymentId = null,
}: PaymentsTableProps) {
  const { hasRole } = useAuth();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  const canValidatePayments = hasRole([
    'JEFA_CAJAS',
    'AUXILIAR_CUENTAS',
    'ADMIN',
  ]);

  const selectedPayment = useMemo(() => {
    if (!pendingAction) return null;
    return payments.find((payment) => payment.id === pendingAction.paymentId) ?? null;
  }, [pendingAction, payments]);

  const resetModalState = () => {
    setPendingAction(null);
    setRejectReason('');
    setRejectReasonError('');
  };

  const closeModal = () => {
    if (processingPaymentId !== null) return;
    resetModalState();
  };

  const openConfirmModal = (paymentId: number, action: PaymentActionType) => {
    setPendingAction({ paymentId, action });
    setRejectReason('');
    setRejectReasonError('');
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.action === 'VALIDATE') {
        await onValidatePayment?.(pendingAction.paymentId);
        resetModalState();
        return;
      }

      const trimmedReason = rejectReason.trim();

      if (!trimmedReason) {
        setRejectReasonError('El motivo de rechazo es obligatorio.');
        return;
      }

      await onRejectPayment?.(pendingAction.paymentId, trimmedReason);
      resetModalState();
    } catch (error) {
      console.error('Error al procesar la acción del pago:', error);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Esta operación aún no tiene pagos registrados.
      </div>
    );
  }

  const isConfirmingAction =
    pendingAction !== null && processingPaymentId === pendingAction.paymentId;

  const isRejectAction = pendingAction?.action === 'REJECT';

  const confirmTitle =
    pendingAction?.action === 'VALIDATE'
      ? 'Confirmar validación'
      : 'Confirmar rechazo';

  const confirmDescription =
    pendingAction?.action === 'VALIDATE'
      ? '¿Estás seguro de que deseas validar este pago? Esta acción actualizará el estatus del pago.'
      : '¿Estás seguro de que deseas rechazar este pago? Esta acción cambiará el estatus del pago a rechazado.';

  const confirmButtonText =
    pendingAction?.action === 'VALIDATE'
      ? isConfirmingAction
        ? 'Validando...'
        : 'Sí, validar pago'
      : isConfirmingAction
        ? 'Rechazando...'
        : 'Sí, rechazar pago';

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Pagos registrados
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Historial completo de pagos, validaciones y comprobantes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
                <th className="px-4 py-3 font-medium">Fecha pago</th>
                <th className="px-4 py-3 font-medium">Validado por</th>
                <th className="px-4 py-3 font-medium">Fecha validación</th>
                <th className="px-4 py-3 font-medium">Comprobante</th>
                {canValidatePayments ? (
                  <th className="px-4 py-3 font-medium">Acciones</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => {
                const isPendingValidation =
                  payment.estatus === 'PENDIENTE_VALIDACION';
                const isProcessing = processingPaymentId === payment.id;

                return (
                  <tr
                    key={payment.id}
                    className="border-t border-slate-200 text-sm"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {formatCurrency(payment.monto)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {paymentTypeLabels[payment.tipoPago]}
                    </td>

                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={payment.estatus} />
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {payment.observaciones ?? ''}
                    </td>             

                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(payment.fechaPago)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {payment.validadoPorNombre ?? 'Pendiente'}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(payment.fechaValidacion)}
                    </td>

                    <td className="px-4 py-4">
                      <a
                        href={payment.comprobanteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Ver comprobante
                      </a>
                    </td>

                    {canValidatePayments ? (
                      <td className="px-4 py-4">
                        {isPendingValidation ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                openConfirmModal(payment.id, 'VALIDATE')
                              }
                              className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Validando...' : 'Validar pago'}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                openConfirmModal(payment.id, 'REJECT')
                              }
                              className="inline-flex rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Procesando...' : 'Rechazar pago'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sin acciones
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">
              {confirmTitle}
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmDescription}
            </p>

            {selectedPayment ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-medium">Monto:</span>{' '}
                  {formatCurrency(selectedPayment.monto)}
                </p>
                <p>
                  <span className="font-medium">Tipo:</span>{' '}
                  {paymentTypeLabels[selectedPayment.tipoPago]}
                </p>
                <p>
                  <span className="font-medium">Registrado por:</span>{' '}
                  {selectedPayment.registradoPorNombre}
                </p>
              </div>
            ) : null}

            {isRejectAction ? (
              <div className="mt-4">
                <label
                  htmlFor="reject-reason"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Motivo del rechazo <span className="text-rose-600">*</span>
                </label>

                <textarea
                  id="reject-reason"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => {
                    setRejectReason(event.target.value);
                    if (rejectReasonError) {
                      setRejectReasonError('');
                    }
                  }}
                  disabled={isConfirmingAction}
                  placeholder="Escribe el motivo del rechazo"
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 outline-none transition ${
                    rejectReasonError
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-300 focus:border-slate-400'
                  } disabled:cursor-not-allowed disabled:bg-slate-100`}
                />

                {rejectReasonError ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {rejectReasonError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isConfirmingAction}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void handleConfirmAction()}
                disabled={isConfirmingAction}
                className={`inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  pendingAction.action === 'VALIDATE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmButtonText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}