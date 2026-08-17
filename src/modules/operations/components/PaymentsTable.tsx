import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentStatusBadge } from '@/modules/operations/components/PaymentStatusBadge';
import {
  PAYMENT_REJECT_REASONS,
  paymentTypeLabels,
  type PaymentRejectReasonCode,
} from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { buildRejectReasonText } from '@/modules/operations/utils/reject-reason';
import { OperationPaymentResponse, PaymentType } from '../types/operations.types.ts';
import { createPortal } from 'react-dom';
import { ValidationReceiptViewerModal } from './ValidationReceiptViewerModal';
import { AgingBadge } from '@/shared/components/dashboard/AgingBadge';
import { useClipboard } from '@/shared/hooks/use-clipboard';
import { CircleDollarSign, ClipboardCopy, Check, FileCheck2, Plus, ReceiptText } from 'lucide-react';

const BANK_PAYMENT_TYPES: PaymentType[] = ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'];

interface PaymentsTableProps {
  payments: OperationPaymentResponse[];
  operationId?: number;
  clienteNombre?: string;
  onValidatePayment?: (
    paymentId: number,
    comprobanteValidacion: File
  ) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  onEditValidationReceipt?: (
    paymentId: number,
    comprobanteValidacion: File
  ) => Promise<void> | void;
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
  operationId,
  clienteNombre,
  onValidatePayment,
  onRejectPayment,
  onEditValidationReceipt,
  processingPaymentId = null,
  montoPendientePorRegistrar = null,
  onAddPayment,
  onEditPayment
}: PaymentsTableProps) {
  const { hasRole } = useAuth();
  const canModifyPayments = !hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']);
  const { copy } = useClipboard();
  const [copiedPaymentId, setCopiedPaymentId] = useState<number | null>(null);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [rejectReasonCode, setRejectReasonCode] = useState<PaymentRejectReasonCode | ''>('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');
  const canAddPayment = (montoPendientePorRegistrar ?? 0) > 0 && canModifyPayments;
  const [validationReceipt, setValidationReceipt] = useState<File | null>(null);
  const [validationReceiptError, setValidationReceiptError] = useState('');
  const [validationReceiptPreviewUrl, setValidationReceiptPreviewUrl] =
    useState<string | null>(null);
  const [viewingPaymentId, setViewingPaymentId] = useState<number | null>(null);
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

  const isAdmin = hasRole(['ADMIN']);
  const isJefaCajas = hasRole(['JEFA_CAJAS']);
  const isCuentas = hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']);

  function canValidatePaymentType(tipoPago: PaymentType) {
    if (isAdmin) return true;
    if (tipoPago === 'EFECTIVO') return isJefaCajas;
    if (
      tipoPago === 'TRANSFERENCIA' ||
      tipoPago === 'DEPOSITO' ||
      tipoPago === 'CHEQUE'
    ) {
      return isCuentas;
    }
    return false; // RETIRO_SIN_TARJETA no aplica a ingresos
  }



  const selectedPayment = useMemo(() => {
    if (!pendingAction) return null;
    return payments.find((payment) => payment.id === pendingAction.paymentId) ?? null;
  }, [pendingAction, payments]);

  const viewingPayment = useMemo(() => {
    if (viewingPaymentId === null) return null;
    return payments.find((payment) => payment.id === viewingPaymentId) ?? null;
  }, [viewingPaymentId, payments]);

  const resetModalState = () => {
    setPendingAction(null);
    setRejectReasonCode('');
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
    setRejectReasonCode('');
    setRejectReason('');
    setRejectReasonError('');
    setValidationReceipt(null);
    setValidationReceiptError('');
  };

  const handleCopyPaymentData = async (payment: OperationPaymentResponse) => {
    const text = [
      operationId ? `ID operación: ${operationId}` : null,
      `ID pago: ${payment.id}`,
      clienteNombre ? `Cliente: ${clienteNombre}` : null,
      `Monto: ${formatCurrency(payment.monto)}`,
      `Fecha: ${formatDate(payment.fechaComprobante ?? payment.fechaPago)}`,
      `Tipo: ${paymentTypeLabels[payment.tipoPago]}`,
      `Banco: ${payment.cuentaDestinoBanco ?? '-'}`,
      `Titular cuenta destino: ${payment.cuentaDestinoTitular ?? '-'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const success = await copy(text);

    if (success) {
      setCopiedPaymentId(payment.id);
      window.setTimeout(() => setCopiedPaymentId(null), 2000);
    }
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

      if (!rejectReasonCode) {
        setRejectReasonError('Selecciona un motivo de rechazo.');
        return;
      }

      const trimmedReason = rejectReason.trim();

      if (rejectReasonCode === 'OTRO' && !trimmedReason) {
        setRejectReasonError('Escribe el motivo del rechazo.');
        return;
      }

      const finalReason = buildRejectReasonText(rejectReasonCode, trimmedReason);

      await onRejectPayment?.(pendingAction.paymentId, finalReason);
      resetModalState();
    } catch (error) {
      console.error('Error al procesar la acción del pago:', error);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <ReceiptText className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">Sin pagos registrados</p>
        <p className="mt-1 text-xs text-slate-500">Los comprobantes de ingreso aparecerán aquí.</p>
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
    rounded-[1.75rem]
    border
    border-slate-200/80
    bg-white
    shadow-xl
    shadow-slate-950/[0.06]
  "
      >
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300"><FileCheck2 className="h-4 w-4" /> Ingresos</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Pagos y comprobantes</h3>
              <p className="mt-1 text-sm text-slate-400">Registro, conciliación y validación de ingresos.</p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <div
                className="
    rounded-2xl
    border
    border-white/10
    bg-white/5
    px-4
    py-3
  "
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Pendiente de registro en ingreso
                </p>

                <p className="mt-1 text-lg font-bold tabular-nums text-amber-300">
                  {formatCurrency(montoPendientePorRegistrar ?? 0)}
                </p>

                {montoPendientePorRegistrar === 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-300">
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
                gap-2 rounded-xl
                bg-blue-600
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-blue-950/30
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-blue-500
                "
                >
                  <Plus className="h-4 w-4" /> Registrar ingreso
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-[1] bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cuenta destino</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
                <th className="px-4 py-3 font-medium">Fecha registro</th>
                <th className="px-4 py-3 font-medium">Fecha comprobante</th>
                <th className="px-4 py-3 font-medium">Antigüedad</th>
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
                const canEdit =
                  isPendingValidation && !!onEditPayment && canModifyPayments;
                const canValidate =
                  canValidatePaymentType(payment.tipoPago) && isPendingValidation;
                const hasActions = canEdit || canValidate;

                return (
                  <tr
                    key={payment.id}
                    className="
                    border-t
                    border-slate-100
                    text-sm
                    transition-colors
                    hover:bg-blue-50/40
                    "
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex items-center gap-2 font-bold tabular-nums text-slate-950"><CircleDollarSign className="h-4 w-4 text-emerald-600" />
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

                    <td className="px-4 py-4">
                      {BANK_PAYMENT_TYPES.includes(payment.tipoPago) ? (
                        <AgingBadge
                          effectiveDate={payment.fechaComprobante}
                          createdAt={payment.createdAt}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => handleToggleOptionsMenu(payment.id, event)}
                          className="
      inline-flex
      h-9
      items-center
      justify-center
      rounded-xl
      border
      border-slate-200
      bg-slate-50
      px-4
      text-xs
      font-medium
      text-slate-700
      shadow-sm
      transition-all
      hover:border-slate-300 hover:bg-white
      hover:-translate-y-0.5
    "
                        >
                          Ver opciones
                        </button>

                        <button
                          type="button"
                          title="Copiar datos del comprobante"
                          onClick={() => void handleCopyPaymentData(payment)}
                          className="
      inline-flex
      h-9
      w-9
      items-center
      justify-center
      rounded-xl
      border
      border-slate-200
      bg-slate-50
      text-slate-600
      shadow-sm
      transition-all
      hover:border-slate-300 hover:bg-white
      hover:-translate-y-0.5
    "
                        >
                          {copiedPaymentId === payment.id ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ClipboardCopy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

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
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingPaymentId(payment.id);
                                  closeOptionsMenu();
                                }}
                                className="
              block
              w-full
              border-t
              border-slate-100
              px-4
              py-3
              text-left
              text-sm
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
            "
                              >
                                Ver comprobante de validación
                              </button>
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
              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="reject-reason-code"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Motivo del rechazo <span className="text-rose-600">*</span>
                  </label>

                  <select
                    id="reject-reason-code"
                    value={rejectReasonCode}
                    disabled={isConfirmingAction}
                    onChange={(event) => {
                      setRejectReasonCode(event.target.value as PaymentRejectReasonCode);
                      if (rejectReasonError) {
                        setRejectReasonError('');
                      }
                    }}
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
  ${rejectReasonError && !rejectReasonCode
                        ? 'border-rose-500'
                        : 'border-slate-200 focus:border-slate-400'
                      }
`}
                  >
                    <option value="" disabled>
                      Selecciona un motivo
                    </option>
                    {PAYMENT_REJECT_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reject-reason"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Observaciones{' '}
                    {rejectReasonCode === 'OTRO' ? (
                      <span className="text-rose-600">*</span>
                    ) : (
                      <span className="font-normal text-slate-400">(opcional)</span>
                    )}
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
                    placeholder={
                      rejectReasonCode === 'OTRO'
                        ? 'Escribe el motivo del rechazo'
                        : 'Agrega contexto adicional (opcional)'
                    }
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
  ${rejectReasonError && rejectReasonCode === 'OTRO'
                        ? 'border-rose-500'
                        : 'border-slate-200 focus:border-slate-400'
                      }
`}
                  />
                </div>

                {rejectReasonError ? (
                  <p className="text-sm text-rose-600">{rejectReasonError}</p>
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

      {viewingPayment?.comprobanteValidacionUrl ? (
        <ValidationReceiptViewerModal
          receiptUrl={viewingPayment.comprobanteValidacionUrl}
          canReplace={
            viewingPayment.estatus === 'VALIDADA' &&
            canValidatePaymentType(viewingPayment.tipoPago)
          }
          isSaving={processingPaymentId === viewingPayment.id}
          onClose={() => setViewingPaymentId(null)}
          onReplace={(file) =>
            onEditValidationReceipt?.(viewingPayment.id, file)
          }
        />
      ) : null}
    </>
  );
}
