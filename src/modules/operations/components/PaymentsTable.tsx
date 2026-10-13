import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentStatusBadge } from '@/modules/operations/components/PaymentStatusBadge';
import {
  PAYMENT_REJECT_REASONS,
  paymentTypeLabels,
  type PaymentRejectReasonCode,
} from '@/modules/operations/constants/operations.constants';
import { formatMoney as formatCurrency, formatDate } from '@/shared/format';
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
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { FileCheck2, MessageCircle, Plus, ReceiptText } from 'lucide-react';
import { DenominationFields } from '@/modules/caja-general/components/DenominationFields';
import { countCents, currency, emptyCounts } from '@/modules/caja-general/utils/cash-amounts';
import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';

import { ChequeManager } from '@/modules/cheques/ChequeManager';
import { chequeLabels } from '@/modules/cheques/types';

const BANK_PAYMENT_TYPES: PaymentType[] = ['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'];

interface PaymentsTableProps {
  payments: OperationPaymentResponse[];
  operationId?: number;
  clienteNombre?: string;
  socioComercialTelefono?: string | null;
  onValidatePayment?: (
    paymentId: number,
    comprobanteValidacion: File,
    denominaciones?: CashCounts
  ) => Promise<void> | void;
  onRejectPayment?: (paymentId: number, motivo: string) => Promise<void> | void;
  onEditValidationReceipt?: (
    paymentId: number,
    comprobanteValidacion: File
  ) => Promise<void> | void;
  onMarkPaymentInProgress?: (
    paymentId: number,
    observaciones?: string
  ) => Promise<void> | void;
  onReleasePayment?: (paymentId: number) => Promise<void> | void;
  processingPaymentId?: number | null;
  montoPendientePorRegistrar?: number | null;
  onAddPayment?: () => void;
  onEditPayment?: (paymentId: number) => void;
  initialReviewPaymentId?: number;
  onInitialReviewHandled?: () => void;
}

type PaymentActionType = 'VALIDATE' | 'REJECT';

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
  onMarkPaymentInProgress,
  onReleasePayment,
  processingPaymentId = null,
  montoPendientePorRegistrar = null,
  onAddPayment,
  onEditPayment,
  initialReviewPaymentId,
  onInitialReviewHandled,
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
  // Un pago en efectivo validado entra a Caja General, y allí todo movimiento exige su
  // desglose por denominación. Se captura aquí, con quien recibe físicamente el dinero.
  const [cashCounts, setCashCounts] = useState<CashCounts>(emptyCounts);
  const [cashCountsError, setCashCountsError] = useState('');
  const [validationReceipt, setValidationReceipt] = useState<File | null>(null);
  const [validationReceiptError, setValidationReceiptError] = useState('');
  const [chequePaymentId, setChequePaymentId] = useState<number | null>(null);
  const [viewingPaymentId, setViewingPaymentId] = useState<number | null>(null);

  const isAdmin = hasRole(['ADMIN']);
  const isJefaCajas = hasRole(['JEFA_CAJAS']);
  const isCuentas = hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']);

  function canValidatePaymentType(tipoPago: PaymentType) {
    if (tipoPago === 'CHEQUE') return false;
    if (isAdmin) return true;
    if (tipoPago === 'EFECTIVO') return isJefaCajas;
    if (
      tipoPago === 'TRANSFERENCIA' ||
      tipoPago === 'DEPOSITO'
    ) {
      return isCuentas;
    }
    return false; // RETIRO_SIN_TARJETA no aplica a ingresos
  }

  function canSeePayment(payment: OperationPaymentResponse) {
    if (isAdmin) return true;
    if (isJefaCajas) {
      if (payment.tipoPago === 'EFECTIVO') return true;
      return payment.tipoPago === 'CHEQUE' && (
        payment.chequeEstado === 'PENDIENTE_COBRO_EFECTIVO' ||
        (payment.chequeEstado === 'COBRADO' && payment.cuentaDestinoId === null)
      );
    }
    if (isCuentas) return BANK_PAYMENT_TYPES.includes(payment.tipoPago);
    return true; // ADMIN, GERENTE, DIRECCION, SOCIO_COMERCIAL ven todo
  }

  const visiblePayments = useMemo(
    () => payments.filter(canSeePayment),
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
    setCashCounts(emptyCounts());
    setCashCountsError('');
  };

  const closeReviewDrawer = () => {
    if (processingPaymentId !== null) return;
    setReviewingPaymentId(null);
    resetReviewFormState();
  };

  const openReviewDrawer = (paymentId: number) => {
    if (payments.find(p => p.id === paymentId)?.tipoPago === 'CHEQUE') { setChequePaymentId(paymentId); return; }
    setReviewingPaymentId(paymentId);
    resetReviewFormState();
  };

  const initialReviewHandled = useRef(false);
  useEffect(() => {
    if (!initialReviewPaymentId || initialReviewHandled.current) return;
    const payment = visiblePayments.find(item => item.id === initialReviewPaymentId);
    if (!payment || (payment.tipoPago !== 'CHEQUE' && !canValidatePaymentType(payment.tipoPago))) return;
    initialReviewHandled.current = true;
    openReviewDrawer(payment.id);
    onInitialReviewHandled?.();
  }, [initialReviewPaymentId, visiblePayments, onInitialReviewHandled]);

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

        const esEfectivo = reviewingPayment?.tipoPago === 'EFECTIVO';

        if (esEfectivo) {
          const capturado = countCents(cashCounts);
          if (!Number.isFinite(capturado) || capturado <= 0) {
            setCashCountsError('Captura el desglose del efectivo recibido.');
            return;
          }
          if (capturado !== Math.round((reviewingPayment?.monto ?? 0) * 100)) {
            setCashCountsError('El desglose debe sumar exactamente el importe del pago.');
            return;
          }
        }

        await onValidatePayment?.(
          reviewingPaymentId,
          validationReceipt,
          esEfectivo ? cashCounts : undefined
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
    const isInProgress = payment.estatus === 'EN_PROCESO';
    const isProcessing = processingPaymentId === payment.id;
    const chequeEditable = payment.tipoPago !== 'CHEQUE' || payment.chequeEstado === 'POR_COBRAR';
    const canEdit = chequeEditable && isPendingValidation && !!onEditPayment && canModifyPayments;
    // "Revisar" abre el panel con Validar / Rechazar / Marcar en proceso /
    // Liberar; disponible tanto en pendiente como en proceso.
    const canValidate =
      canValidatePaymentType(payment.tipoPago) &&
      (isPendingValidation || isInProgress);
    const canNotify =
      (payment.estatus === 'VALIDADA' || payment.estatus === 'RECHAZADA') &&
      canValidatePaymentType(payment.tipoPago) &&
      !!socioComercialTelefono;
    // El cheque no se valida por el panel genérico, pero su gestión es la misma acción
    // para el usuario: revisar el pago. Por eso vive en Acciones junto a las demás.
    const canManageCheque =
      payment.tipoPago === 'CHEQUE' && (
        isAdmin || isCuentas || (isJefaCajas && payment.chequeEstado === 'PENDIENTE_COBRO_EFECTIVO')
      );
    const canReview = canValidate || canManageCheque;
    const hasActions = canEdit || canReview || canNotify;

    return { isProcessing, canEdit, canValidate, canManageCheque, canReview, canNotify, hasActions };
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
    const { isProcessing, canEdit, canManageCheque, canReview, canNotify, hasActions } =
      getPaymentActionFlags(payment);

    return (
      <>
        {canReview && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              canManageCheque
                ? setChequePaymentId(payment.id)
                : openReviewDrawer(payment.id)
            }
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

  function paymentActions(payment: OperationPaymentResponse): ReactNode {
    return <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      <a href={payment.comprobanteUrl} target="_blank" rel="noreferrer"
        className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Ver</a>
      <RowActionsMenu triggerLabel="" ariaLabel="Más opciones" triggerClassName="min-w-9 justify-center px-2">
        {renderViewOptions(payment)}
        <button type="button" onClick={() => void handleCopyPaymentData(payment)}
          className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
          {copiedPaymentId === payment.id ? 'Copiado' : 'Copiar datos del comprobante'}
        </button>
        <div className="border-t border-slate-100 px-4 py-2 text-left text-xs text-slate-500">
          <p>Registrado: {formatDate(payment.fechaPago)}</p>
          <p>Validación: {formatDate(payment.fechaValidacion)}</p>
          {payment.observaciones && <p className="break-words">{payment.observaciones}</p>}
        </div>
      </RowActionsMenu>
      <div className="flex flex-wrap justify-end gap-1">{renderRowActions(payment)}</div>
    </div>;
  }

  return (
    <>
      {chequePaymentId !== null && <ChequeManager paymentId={chequePaymentId} onClose={() => setChequePaymentId(null)} />}
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
        <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600"><FileCheck2 className="h-4 w-4" /> Ingresos</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">Pagos y comprobantes</h3>
              <p className="mt-1 text-xs text-slate-500">Registro, conciliación y validación de ingresos.</p>
            </div>

            <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
              <div
                className="
    rounded-lg border border-slate-200 bg-slate-50 px-3 py-2
  "
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pendiente de registro en ingreso
                </p>

                <p className="mt-1 text-lg font-bold tabular-nums text-amber-700">
                  {formatCurrency(montoPendientePorRegistrar ?? 0)}
                </p>

                {montoPendientePorRegistrar === 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
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

        <DataTable
          columns={[
            { key: 'amount', header: 'Monto', width: '132px', cell: (payment: OperationPaymentResponse) => <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(payment.monto)}</span> },
            { key: 'type', header: 'Tipo', width: '128px', cell: (payment: OperationPaymentResponse) => <span>{paymentTypeLabels[payment.tipoPago]}{payment.tipoPago === 'CHEQUE' && <span className="block text-xs text-slate-500">{payment.chequeEstado ? chequeLabels[payment.chequeEstado] : 'Requiere conciliación'}</span>}</span> },
            { key: 'account', header: 'Cuenta destino', cell: (payment: OperationPaymentResponse) => <span className="block min-w-0 truncate" title={`${payment.cuentaDestinoBanco ?? '—'} · ${payment.cuentaDestinoTitular ?? ''}`}>{payment.cuentaDestinoBanco ?? '—'}<span className="block truncate text-xs text-slate-500">{payment.cuentaDestinoTitular}</span></span> },
            { key: 'date', header: 'Fecha comprobante', width: '132px', cell: (payment: OperationPaymentResponse) => formatDate(payment.fechaComprobante) },
            { key: 'status', header: 'Estatus', kind: 'status', width: '162px', cell: (payment: OperationPaymentResponse) => <span><PaymentStatusBadge status={payment.estatus} />{payment.validadoPorNombre && <span className="mt-1 block text-xs text-slate-500">por {payment.validadoPorNombre}</span>}</span> },
            { key: 'actions', header: 'Acciones', kind: 'actions', align: 'right', width: '250px', cell: (payment: OperationPaymentResponse) => paymentActions(payment) },
          ] satisfies DataTableColumn<OperationPaymentResponse>[]}
          rows={visiblePayments}
          getRowKey={(payment) => payment.id}
          emptyTitle="Sin pagos de ingreso"
          mobile={{
            title: (payment) => <>{formatCurrency(payment.monto)} · {paymentTypeLabels[payment.tipoPago]}</>,
            status: (payment) => <PaymentStatusBadge status={payment.estatus} />,
            fields: [
              { key: 'account', label: 'Cuenta destino', value: (payment) => payment.cuentaDestinoBanco ?? '—' },
              { key: 'date', label: 'Fecha comprobante', value: (payment) => formatDate(payment.fechaComprobante) },
              { key: 'registered', label: 'Registrado', value: (payment) => formatDate(payment.fechaPago) },
              { key: 'validated', label: 'Validado por', value: (payment) => payment.validadoPorNombre ?? '—' },
              { key: 'age', label: 'Antigüedad', value: (payment) => BANK_PAYMENT_TYPES.includes(payment.tipoPago) ? <AgingBadge effectiveDate={payment.fechaComprobante} createdAt={payment.createdAt} /> : '—' },
              { key: 'observations', label: 'Observaciones', value: (payment) => payment.observaciones || '—' },
            ],
            actions: paymentActions,
          }}
        />
      </div>

      {reviewingPayment ? (
        <ActionDrawer open eyebrow="Validar pago de ingreso"
          title={`${formatCurrency(reviewingPayment.monto)} · ${paymentTypeLabels[reviewingPayment.tipoPago]}`}
          subtitle={operationId ? `Operación #${operationId}${clienteNombre ? ` · ${clienteNombre}` : ''}` : undefined}
          onClose={() => { if (!isConfirmingAction) closeReviewDrawer(); }}
          footer={activeAction ? <div className="flex gap-3">
            <button type="button" onClick={resetReviewFormState} disabled={isConfirmingAction}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Volver</button>
            <button type="button" onClick={() => void handleConfirmAction()} disabled={isConfirmingAction}
              className={`min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${isRejectAction ? 'bg-rose-600' : 'bg-[#3b6ef5]'}`}>
              {confirmButtonText}
            </button>
          </div> : undefined}>
            <div className="space-y-5">
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
                <div className="space-y-3">
                  {reviewingPayment.estatus === 'EN_PROCESO' ? (
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                      Marcado en proceso
                      {reviewingPayment.enProcesoPorNombre
                        ? ` por ${reviewingPayment.enProcesoPorNombre}`
                        : ''}
                      {reviewingPayment.fechaEnProceso
                        ? ` · ${formatDate(reviewingPayment.fechaEnProceso)}`
                        : ''}
                      . El movimiento aún no se refleja en las cuentas.
                    </p>
                  ) : null}

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

                  {(reviewingPayment.tipoPago === 'TRANSFERENCIA' ||
                    reviewingPayment.tipoPago === 'DEPOSITO') &&
                  reviewingPayment.estatus === 'PENDIENTE_VALIDACION' &&
                  onMarkPaymentInProgress ? (
                    <button
                      type="button"
                      disabled={isConfirmingAction}
                      onClick={async () => {
                        try {
                          await onMarkPaymentInProgress(reviewingPayment.id);
                          setReviewingPaymentId(null);
                          resetReviewFormState();
                        } catch {
                          // el hook ya muestra el toast de error
                        }
                      }}
                      className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition-all hover:-translate-y-0.5 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Marcar en proceso
                    </button>
                  ) : null}

                  {reviewingPayment.estatus === 'EN_PROCESO' && onReleasePayment ? (
                    <button
                      type="button"
                      disabled={isConfirmingAction}
                      onClick={async () => {
                        try {
                          await onReleasePayment(reviewingPayment.id);
                          setReviewingPaymentId(null);
                          resetReviewFormState();
                        } catch {
                          // el hook ya muestra el toast de error
                        }
                      }}
                      className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Liberar (volver a pendiente)
                    </button>
                  ) : null}
                </div>
              ) : activeAction === 'VALIDATE' ? (
                <div>
                  {reviewingPayment.tipoPago === 'EFECTIVO' ? (
                    <div className="mb-5 space-y-3">
                      <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        Este pago entra como efectivo a Caja General al validarse. Captura el
                        desglose de lo que recibiste; debe sumar {currency(reviewingPayment.monto)}.
                      </p>
                      <DenominationFields
                        value={cashCounts}
                        onChange={(next) => { setCashCounts(next); setCashCountsError(''); }}
                        disabled={isConfirmingAction}
                      />
                      {cashCountsError ? (
                        <p role="alert" className="text-xs font-medium text-rose-600">{cashCountsError}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <ReceiptUploadField label="Comprobante de validación *" file={validationReceipt}
                    onChange={next => { setValidationReceipt(next); setValidationReceiptError(''); }}
                    disabled={isConfirmingAction} />
                  {validationReceiptError && <p role="alert" className="mt-2 text-sm text-rose-600">{validationReceiptError}</p>}
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
        </ActionDrawer>
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
