import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { ValidationReceiptViewerModal } from './ValidationReceiptViewerModal';
import { AgingBadge } from '@/shared/components/dashboard/AgingBadge';
import { useClipboard } from '@/shared/hooks/use-clipboard';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import {
  buildPaymentRejectedMessage,
  buildPaymentValidatedMessage,
} from '@/shared/utils/whatsapp-message';
import { buildOperationDetailPath } from '@/routes/paths';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import { CircleDollarSign, ClipboardCopy, Check, FileCheck2, MessageCircle, Plus, ReceiptText, X } from 'lucide-react';

const BANK_PAYMENT_TYPES: PaymentType[] = ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'];

interface PaymentsTableProps {
  payments: OperationPaymentResponse[];
  operationId?: number;
  clienteNombre?: string;
  socioComercialTelefono?: string | null;
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

function isImageFile(file?: File | null) {
  if (!file) return false;

  return file.type.startsWith('image/');
}

function isImageUrl(url: string) {
  const path = url.split('?')[0].toLowerCase();
  return /\.(jpe?g|png|webp|gif)$/.test(path);
}


export function PaymentsTable({
  payments,
  operationId,
  clienteNombre,
  socioComercialTelefono,
  onValidatePayment,
  onRejectPayment,
  onEditValidationReceipt,
  processingPaymentId = null,
  montoPendientePorRegistrar = null,
  onAddPayment,
  onEditPayment
}: PaymentsTableProps) {
  const { hasRole } = useAuth();
  const { openWhatsApp } = useWhatsAppLink();

  function handleNotifyPaymentStatus(payment: OperationPaymentResponse) {
    if (!operationId) return;

    const publicUrl = `${window.location.origin}${buildOperationDetailPath(operationId)}`;

    const message =
      payment.estatus === 'RECHAZADA'
        ? buildPaymentRejectedMessage({
            operationId,
            monto: payment.monto,
            motivo: payment.observaciones,
            publicUrl,
          })
        : buildPaymentValidatedMessage({
            operationId,
            monto: payment.monto,
            publicUrl,
          });

    openWhatsApp(message, socioComercialTelefono);
  }

  const canModifyPayments = hasRole([
    'ADMIN',
    'GERENTE',
    'DIRECCION',
    'SOCIO_COMERCIAL',
  ]);
  const { copy } = useClipboard();
  const [copiedPaymentId, setCopiedPaymentId] = useState<number | null>(null);

  const [reviewingPaymentId, setReviewingPaymentId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<PaymentActionType | null>(null);
  const [rejectReasonCode, setRejectReasonCode] = useState<PaymentRejectReasonCode | ''>('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');
  const canAddPayment = (montoPendientePorRegistrar ?? 0) > 0 && canModifyPayments;
  const [validationReceipt, setValidationReceipt] = useState<File | null>(null);
  const [validationReceiptError, setValidationReceiptError] = useState('');
  const [validationReceiptPreviewUrl, setValidationReceiptPreviewUrl] =
    useState<string | null>(null);
  const [viewingPaymentId, setViewingPaymentId] = useState<number | null>(null);

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

  function canSeePayment(tipoPago: PaymentType) {
    if (isJefaCajas) return tipoPago === 'EFECTIVO';
    if (isCuentas) return BANK_PAYMENT_TYPES.includes(tipoPago);
    return true; // ADMIN, GERENTE, DIRECCION, SOCIO_COMERCIAL ven todo
  }

  const visiblePayments = useMemo(
    () => payments.filter((payment) => canSeePayment(payment.tipoPago)),
    [payments, isJefaCajas, isCuentas],
  );

  const reviewingPayment = useMemo(() => {
    if (reviewingPaymentId === null) return null;
    return payments.find((payment) => payment.id === reviewingPaymentId) ?? null;
  }, [reviewingPaymentId, payments]);

  const viewingPayment = useMemo(() => {
    if (viewingPaymentId === null) return null;
    return payments.find((payment) => payment.id === viewingPaymentId) ?? null;
  }, [viewingPaymentId, payments]);

  const resetReviewFormState = () => {
    setActiveAction(null);
    setRejectReasonCode('');
    setRejectReason('');
    setRejectReasonError('');
    setValidationReceipt(null);
    setValidationReceiptError('');
  };

  const closeReviewDrawer = () => {
    if (processingPaymentId !== null) return;
    setReviewingPaymentId(null);
    resetReviewFormState();
  };

  const openReviewDrawer = (paymentId: number) => {
    setReviewingPaymentId(paymentId);
    resetReviewFormState();
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
    if (reviewingPaymentId === null || !activeAction) return;

    try {
      if (activeAction === 'VALIDATE') {
        if (!validationReceipt) {
          setValidationReceiptError(
            'El comprobante de validación es obligatorio.'
          );
          return;
        }

        await onValidatePayment?.(
          reviewingPaymentId,
          validationReceipt
        );

        setReviewingPaymentId(null);
        resetReviewFormState();
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

      await onRejectPayment?.(reviewingPaymentId, finalReason);
      setReviewingPaymentId(null);
      resetReviewFormState();
    } catch (error) {
      console.error('Error al procesar la acción del pago:', error);
    }
  };

  if (visiblePayments.length === 0) {
    const hasOtherTypePayments = payments.length > 0;

    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <ReceiptText className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          {hasOtherTypePayments ? 'Sin comprobantes de tu tipo' : 'Sin pagos registrados'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {hasOtherTypePayments
            ? 'Esta operación no tiene comprobantes del tipo que te corresponde validar.'
            : 'Los comprobantes de ingreso aparecerán aquí.'}
        </p>
      </div>
    );
  }

  const isConfirmingAction =
    reviewingPaymentId !== null && processingPaymentId === reviewingPaymentId;

  const isRejectAction = activeAction === 'REJECT';

  const confirmButtonText =
    activeAction === 'VALIDATE'
      ? isConfirmingAction
        ? 'Validando...'
        : 'Confirmar validación'
      : isConfirmingAction
        ? 'Rechazando...'
        : 'Confirmar rechazo';

  function getPaymentActionFlags(payment: OperationPaymentResponse) {
    const isPendingValidation = payment.estatus === 'PENDIENTE_VALIDACION';
    const isProcessing = processingPaymentId === payment.id;
    const canEdit = isPendingValidation && !!onEditPayment && canModifyPayments;
    const canValidate =
      canValidatePaymentType(payment.tipoPago) && isPendingValidation;
    const canNotify =
      (payment.estatus === 'VALIDADA' || payment.estatus === 'RECHAZADA') &&
      canValidatePaymentType(payment.tipoPago) &&
      !!socioComercialTelefono;
    const hasActions = canEdit || canValidate || canNotify;

    return { isProcessing, canEdit, canValidate, canNotify, hasActions };
  }

  function renderViewOptions(payment: OperationPaymentResponse): ReactNode {
    return (
      <>
        <a
          href={payment.comprobanteUrl}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Ver comprobante de ingreso
        </a>

        {payment.comprobanteValidacionUrl ? (
          <button
            type="button"
            onClick={() => setViewingPaymentId(payment.id)}
            className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver comprobante de validación
          </button>
        ) : null}
      </>
    );
  }

  function renderRowActions(payment: OperationPaymentResponse): ReactNode {
    const { isProcessing, canEdit, canValidate, canNotify, hasActions } =
      getPaymentActionFlags(payment);

    return (
      <>
        {canValidate && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => openReviewDrawer(payment.id)}
            className="
  flex-1
  inline-flex
  h-9
  items-center
  justify-center
  rounded-lg
  bg-blue-600
  px-4
  text-sm
  font-medium
  text-white
  shadow-sm
  transition-all
  hover:-translate-y-0.5
  hover:bg-blue-700
  disabled:cursor-not-allowed
  disabled:opacity-50
"
          >
            {isProcessing ? 'Procesando...' : 'Revisar'}
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => onEditPayment?.(payment.id)}
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

        {canNotify && (
          <button
            type="button"
            onClick={() => handleNotifyPaymentStatus(payment)}
            className="
  flex-1
  inline-flex
  items-center
  justify-center
  gap-1.5
  h-9
  rounded-lg
  border
  border-emerald-200
  bg-emerald-50
  px-4
  text-xs
  font-medium
  text-emerald-700
  shadow-sm
  transition-all
  hover:bg-emerald-100
  hover:-translate-y-0.5
"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Avisar por WhatsApp
          </button>
        )}

        {!hasActions && (
          <span className="text-xs text-slate-400">
            Sin acciones
          </span>
        )}
      </>
    );
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
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300"><FileCheck2 className="h-4 w-4" /> Ingresos</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Pagos y comprobantes</h3>
              <p className="mt-1 text-sm text-slate-400">Registro, conciliación y validación de ingresos.</p>
            </div>

            <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
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
                w-full
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
                md:w-auto
                md:min-w-[200px]
                "
                >
                  <Plus className="h-4 w-4" /> Registrar ingreso
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
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
              {visiblePayments.map((payment) => {
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
                        <RowActionsMenu triggerLabel="Ver opciones">
                          {renderViewOptions(payment)}
                        </RowActionsMenu>

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
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {renderRowActions(payment)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Móvil: tarjetas apiladas */}
        <div className="space-y-3 p-3 min-[375px]:p-4 md:hidden">
          {visiblePayments.map((payment) => {
            const { isProcessing, canEdit, canValidate, canNotify, hasActions } =
              getPaymentActionFlags(payment);

            return (
              <div
                key={payment.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/5 min-[375px]:p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-lg font-bold tabular-nums text-slate-950">
                      <CircleDollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
                      {formatCurrency(payment.monto)}
                    </span>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                      {paymentTypeLabels[payment.tipoPago]}
                    </p>
                  </div>

                  <div className="flex max-w-full shrink-0 items-center gap-2">
                    <PaymentStatusBadge status={payment.estatus} />
                    <button
                      type="button"
                      title="Copiar datos del comprobante"
                      onClick={() => void handleCopyPaymentData(payment)}
                      aria-label="Copiar datos del comprobante"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white"
                    >
                      {copiedPaymentId === payment.id ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ClipboardCopy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Cuenta destino</p>
                    <p className="font-medium text-slate-900">{payment.cuentaDestinoBanco ?? '-'}</p>
                    <p className="text-slate-400">{payment.cuentaDestinoTitular ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Fecha comprobante</p>
                    <p>{formatDate(payment.fechaComprobante)}</p>
                  </div>
                </div>

                <details className="group mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <summary className="min-h-8 cursor-pointer select-none py-1 font-semibold text-slate-700 marker:text-slate-400">
                    Ver más detalles
                  </summary>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Antigüedad</p>
                      {BANK_PAYMENT_TYPES.includes(payment.tipoPago) ? (
                        <AgingBadge effectiveDate={payment.fechaComprobante} createdAt={payment.createdAt} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Fecha registro</p>
                      <p>{formatDate(payment.fechaPago)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Validado por</p>
                      <p className="break-words">{payment.validadoPorNombre ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Fecha validación</p>
                      <p>{formatDate(payment.fechaValidacion)}</p>
                    </div>
                    {payment.observaciones ? (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Observaciones</p>
                        <p className="break-words">{payment.observaciones}</p>
                      </div>
                    ) : null}
                  </div>
                </details>

                <div className="mt-4 flex flex-col gap-2 min-[360px]:flex-row min-[360px]:items-center">
                  {canValidate ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => openReviewDrawer(payment.id)}
                      className="min-h-[44px] flex-1 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? 'Procesando...' : 'Revisar'}
                    </button>
                  ) : canEdit ? (
                    <button
                      type="button"
                      onClick={() => onEditPayment?.(payment.id)}
                      className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Editar pago
                    </button>
                  ) : canNotify ? (
                    <button
                      type="button"
                      onClick={() => handleNotifyPaymentStatus(payment)}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Avisar
                    </button>
                  ) : (
                    <span className="flex-1 text-xs text-slate-400">
                      {hasActions ? '' : 'Sin acciones'}
                    </span>
                  )}

                  <RowActionsMenu triggerLabel="Más" triggerClassName="min-h-[44px] justify-center" menuClassName="w-64 max-w-[calc(100vw-1rem)]">
                    {renderViewOptions(payment)}
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 p-2">
                      {renderRowActions(payment)}
                    </div>
                  </RowActionsMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {reviewingPayment ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar panel de revisión"
            onClick={closeReviewDrawer}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Revisar comprobante
                </p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCurrency(reviewingPayment.monto)} · {paymentTypeLabels[reviewingPayment.tipoPago]}
                </h4>
              </div>

              <button
                type="button"
                onClick={closeReviewDrawer}
                disabled={isConfirmingAction}
                aria-label="Cerrar"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Comprobante de ingreso
                  </p>

                  <a
                    href={reviewingPayment.comprobanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Ver en pestaña nueva
                  </a>
                </div>

                <div className="mt-2 flex max-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {isImageUrl(reviewingPayment.comprobanteUrl) ? (
                    <img
                      src={reviewingPayment.comprobanteUrl}
                      alt="Comprobante de ingreso"
                      className="max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={reviewingPayment.comprobanteUrl}
                      title="Comprobante de ingreso"
                      className="h-[420px] w-full border-0"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-medium">Cuenta destino:</span>{' '}
                  {reviewingPayment.cuentaDestinoBanco ?? '-'}
                </p>
                <p>
                  <span className="font-medium">Titular:</span>{' '}
                  {reviewingPayment.cuentaDestinoTitular ?? '-'}
                </p>
                <p>
                  <span className="font-medium">Fecha comprobante:</span>{' '}
                  {formatDate(reviewingPayment.fechaComprobante)}
                </p>
                <p>
                  <span className="font-medium">Registrado por:</span>{' '}
                  {reviewingPayment.registradoPorNombre}
                </p>
                {reviewingPayment.observaciones ? (
                  <p className="col-span-2">
                    <span className="font-medium">Observaciones:</span>{' '}
                    {reviewingPayment.observaciones}
                  </p>
                ) : null}
              </div>

              {activeAction === null ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveAction('VALIDATE')}
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Validar
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAction('REJECT')}
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700"
                  >
                    Rechazar
                  </button>
                </div>
              ) : activeAction === 'VALIDATE' ? (
                <div>
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
              ) : (
                <div className="space-y-3">
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
              )}
            </div>

            {activeAction ? (
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetReviewFormState}
                  disabled={isConfirmingAction}
                  className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Volver
                </button>

                <button
                  type="button"
                  onClick={() => void handleConfirmAction()}
                  disabled={isConfirmingAction}
                  className={`inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${isRejectAction
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                  {confirmButtonText}
                </button>
              </div>
            ) : null}
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
