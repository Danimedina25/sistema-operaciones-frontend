import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentStatusBadge } from '@/modules/operations/components/PaymentStatusBadge';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { OperationPaymentResponse } from '../types/operations.types.ts';
import { createPortal } from 'react-dom';

interface PaymentsTableProps {
  payments: OperationPaymentResponse[];
  onValidatePayment?: (
    paymentId: number,
    comprobanteValidacion: File
  ) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  processingPaymentId?: number | null;
  montoPendientePorRegistrar?: number | null;
  onAddPayment?: () => void;
  onEditPayment?: (paymentId: number) => void;
}

type PaymentActionType = 'VALIDATE' | 'REJECT';

interface PendingAction {
  paymentId: number;
  action: PaymentActionType;
}

function isImageFile(file?: File | null) {
  if (!file) return false;

  return file.type.startsWith('image/');
}


export function PaymentsTable({
  payments,
  onValidatePayment,
  onRejectPayment,
  processingPaymentId = null,
  montoPendientePorRegistrar = null,
  onAddPayment,
  onEditPayment
}: PaymentsTableProps) {
  const { hasRole } = useAuth();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');
  const canAddPayment = (montoPendientePorRegistrar ?? 0) > 0;
  const [validationReceipt, setValidationReceipt] = useState<File | null>(null);
  const [validationReceiptError, setValidationReceiptError] = useState('');
  const [validationReceiptPreviewUrl, setValidationReceiptPreviewUrl] =
    useState<string | null>(null);
  const [openOptionsPaymentId, setOpenOptionsPaymentId] = useState<number | null>(null);
  const [optionsMenuPosition, setOptionsMenuPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  const optionsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setOpenOptionsPaymentId(null);
        setOptionsMenuPosition(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleCloseMenu() {
      setOpenOptionsPaymentId(null);
      setOptionsMenuPosition(null);
    }

    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);

    return () => {
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  useEffect(() => {
    if (!validationReceipt || !isImageFile(validationReceipt)) {
      setValidationReceiptPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(validationReceipt);

    setValidationReceiptPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [validationReceipt]);

  const canValidatePayments = hasRole([
    'JEFA_CUENTAS',
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
    setValidationReceipt(null);
    setValidationReceiptError('');
  };

  const closeModal = () => {
    if (processingPaymentId !== null) return;
    resetModalState();
  };

  const openConfirmModal = (paymentId: number, action: PaymentActionType) => {
    setPendingAction({ paymentId, action });
    setRejectReason('');
    setRejectReasonError('');
    setValidationReceipt(null);
    setValidationReceiptError('');
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.action === 'VALIDATE') {
        if (!validationReceipt) {
          setValidationReceiptError(
            'El comprobante de validación es obligatorio.'
          );
          return;
        }

        await onValidatePayment?.(
          pendingAction.paymentId,
          validationReceipt
        );

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
      ? '¿Estás seguro de que deseas validar este comprobante? Esta acción actualizará el estatus.'
      : '¿Estás seguro de que deseas rechazar este comprobante? Esta acción cambiará el estatus a rechazado.';

  const confirmButtonText =
    pendingAction?.action === 'VALIDATE'
      ? isConfirmingAction
        ? 'Validando...'
        : 'Sí, validar comprobante'
      : isConfirmingAction
        ? 'Rechazando...'
        : 'Sí, rechazar comprobante';

  function handleToggleOptionsMenu(
    paymentId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (openOptionsPaymentId === paymentId) {
      setOpenOptionsPaymentId(null);
      setOptionsMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 260;
    const estimatedMenuHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedMenuHeight;

    setOptionsMenuPosition({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - menuWidth),
      openUp,
    });

    setOpenOptionsPaymentId(paymentId);
  }

  function closeOptionsMenu() {
    setOpenOptionsPaymentId(null);
    setOptionsMenuPosition(null);
  }

  return (
    <>
      <div
        className="
    overflow-hidden
    rounded-[2rem]
    border
    border-slate-200/80
    bg-white
    shadow-lg
    shadow-slate-950/5
  "
      >
        <div className="px-6 py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                Ingreso
              </p>

              <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Comprobantes y validaciones de ingreso de dinero
              </h3>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <div
                className="
    rounded-2xl
    border
    border-amber-200
    bg-amber-50
    px-4
    py-3
  "
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Pendiente de registro en ingreso
                </p>

                <p className="mt-0.5 text-base font-semibold text-red-600">
                  {formatCurrency(montoPendientePorRegistrar ?? 0)}
                </p>

                {montoPendientePorRegistrar === 0 && (
                  <p className="mt-1 text-sm font-medium text-emerald-600">
                    No hay más pagos de ingreso por registrar
                  </p>
                )}
              </div>

              {canAddPayment && onAddPayment ? (
                <button
                  type="button"
                  onClick={onAddPayment}
                  className="
                inline-flex
                min-w-[200px]
                items-center
                justify-center
                rounded-2xl
                bg-slate-950
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-blue-500/20
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-slate-900
                "
                >
                  Registrar pago de ingreso
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-6 h-px bg-slate-100" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cuenta destino</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
                <th className="px-4 py-3 font-medium">Fecha registro</th>
                <th className="px-4 py-3 font-medium">Fecha comprobante</th>
                <th className="px-4 py-3 font-medium">Validado por</th>
                <th className="px-4 py-3 font-medium">Fecha validación</th>
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="px-4 py-3 font-medium">Opciones</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => {
                const isPendingValidation =
                  payment.estatus === 'PENDIENTE_VALIDACION';
                const isProcessing = processingPaymentId === payment.id;
                const canEdit = isPendingValidation && !!onEditPayment;
                const canValidate = canValidatePayments && isPendingValidation;
                const hasActions = canEdit || canValidate;

                return (
                  <tr
                    key={payment.id}
                    className="
                    border-t
                    border-slate-100
                    text-sm
                    transition-colors
                    hover:bg-slate-50/70
                    "
                  >
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-950">
                        {formatCurrency(payment.monto)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {paymentTypeLabels[payment.tipoPago]}
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">
                          {payment.cuentaDestinoBanco ?? '-'}
                        </p>

                        <p className="max-w-[180px] text-xs leading-5 text-slate-400">
                          {payment.cuentaDestinoTitular}
                        </p>
                      </div>
                    </td>

                    <td className="max-w-[220px] px-4 py-4 text-slate-600">
                      <p className="truncate">
                        {payment.observaciones ?? '-'}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(payment.fechaPago)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(payment.fechaComprobante)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {payment.validadoPorNombre ?? '-'}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(payment.fechaValidacion)}
                    </td>

                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={payment.estatus} />
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={(event) => handleToggleOptionsMenu(payment.id, event)}
                        className="
      inline-flex
      h-9
      items-center
      justify-center
      rounded-lg
      border
      border-slate-300
      bg-white
      px-4
      text-xs
      font-medium
      text-slate-700
      shadow-sm
      transition-all
      hover:bg-slate-50
      hover:-translate-y-0.5
    "
                      >
                        Ver opciones
                      </button>

                      {openOptionsPaymentId === payment.id &&
                        optionsMenuPosition &&
                        createPortal(
                          <div
                            ref={optionsMenuRef}
                            className="
          fixed
          z-[9999]
          w-64
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-xl
          shadow-slate-950/10
        "
                            style={{
                              top: optionsMenuPosition.top,
                              left: optionsMenuPosition.left,
                              transform: optionsMenuPosition.openUp
                                ? 'translateY(-100%)'
                                : 'none',
                            }}
                          >
                            <a
                              href={payment.comprobanteUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={closeOptionsMenu}
                              className="
            block
            px-4
            py-3
            text-sm
            font-medium
            text-slate-700
            transition
            hover:bg-slate-50
          "
                            >
                              Ver comprobante de ingreso
                            </a>

                            {payment.comprobanteValidacionUrl ? (
                              <a
                                href={payment.comprobanteValidacionUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={closeOptionsMenu}
                                className="
              block
              border-t
              border-slate-100
              px-4
              py-3
              text-sm
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
            "
                              >
                                Ver comprobante de validación
                              </a>
                            ) : null}
                          </div>,
                          document.body,
                        )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {canValidate && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                openConfirmModal(payment.id, 'VALIDATE')
                              }
                              className="
  flex-1
  inline-flex
  h-9
  items-center
  justify-center
  rounded-lg
  bg-emerald-600
  px-4
  text-sm
  font-medium
  text-white
  shadow-sm
  transition-all
  hover:-translate-y-0.5
  hover:bg-emerald-700
  disabled:cursor-not-allowed
  disabled:opacity-50
"
                            >
                              {isProcessing ? 'Validando...' : 'Validar'}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                openConfirmModal(payment.id, 'REJECT')
                              }
                              className="
  flex-1
  inline-flex
  h-9
  items-center
  justify-center
  rounded-lg
  bg-rose-600
  px-4
  text-sm
  font-medium
  text-white
  shadow-sm
  transition-all
  hover:-translate-y-0.5
  hover:bg-rose-700
  disabled:cursor-not-allowed
  disabled:opacity-50
"
                            >
                              {isProcessing ? 'Procesando...' : 'Rechazar'}
                            </button>
                          </>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEditPayment(payment.id)}
                            className="
  flex-1
  inline-flex
  h-9
  items-center
  justify-center
  rounded-lg
  border
  border-slate-300
  bg-white
  px-4
  text-xs
  font-medium
  shadow-sm
  transition-all
  hover:bg-slate-50
  hover:-translate-y-0.5
"
                          >
                            Editar pago
                          </button>
                        )}

                        {!hasActions && (
                          <span className="text-xs text-slate-400">
                            Sin acciones
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-[2rem]
border
border-slate-200
bg-white
p-8
shadow-2xl
shadow-slate-950/10">
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

            {pendingAction.action === 'VALIDATE' ? (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Comprobante de validación <span className="text-rose-600">*</span>
                </label>

                <label
                  className={`
        flex
        min-h-[130px]
        w-full
        cursor-pointer
        flex-col
        items-center
        justify-center
        rounded-xl
        border-2
        border-dashed
        px-4
        py-6
        text-center
        transition
        ${validationReceiptError
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                    }
      `}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    disabled={isConfirmingAction}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;

                      setValidationReceipt(file);
                      setValidationReceiptError('');

                      event.target.value = '';
                    }}
                  />

                  {validationReceipt ? (
                    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                          {validationReceiptPreviewUrl ? (
                            <img
                              src={validationReceiptPreviewUrl}
                              alt="Comprobante de validación"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="px-2 text-center text-xs text-slate-500">
                              PDF
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-semibold text-slate-900">
                            Comprobante seleccionado
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {validationReceipt.name}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {validationReceiptPreviewUrl ? (
                              <a
                                href={validationReceiptPreviewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="
                inline-flex
                items-center
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-xs
                font-medium
                text-slate-700
                hover:bg-slate-50
              "
                              >
                                Ver imagen
                              </a>
                            ) : null}

                            <span
                              className="
              inline-flex
              items-center
              rounded-lg
              bg-slate-900
              px-3
              py-2
              text-xs
              font-semibold
              text-white
            "
                            >
                              Cambiar comprobante
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-700">
                        Haz clic para seleccionar el comprobante
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        PDF, JPG, JPEG, PNG o WEBP
                      </p>
                    </>
                  )}
                </label>

                {validationReceiptError ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {validationReceiptError}
                  </p>
                ) : null}
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
                  className={`
  w-full
  rounded-2xl
  border
  bg-slate-50
  px-4
  py-3
  text-sm
  text-slate-700
  outline-none
  transition
  focus:bg-white
  ${rejectReasonError
                      ? 'border-rose-500'
                      : 'border-slate-200 focus:border-slate-400'
                    }
`}
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
                className={`inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${pendingAction.action === 'VALIDATE'
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