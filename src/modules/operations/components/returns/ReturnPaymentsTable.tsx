// components/ReturnPaymentsTable.tsx

import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import {
  OperationStatus,
  ReturnPaymentResponse,
} from '../../types/operations.types.ts';
import { ReturnStatusBadge } from './ReturnStatusBadge.js';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ReturnPaymentDetailModal } from './ReturnPaymentDetailModal.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildReturnPaidMessage } from '@/shared/utils/whatsapp-message';
import { buildOperationDetailPath } from '@/routes/paths';
import { ArrowUpRight, BanknoteArrowDown, MessageCircle, Paperclip, Plus } from 'lucide-react';

interface ReturnPaymentsTableProps {
  returns: ReturnPaymentResponse[];
  montoPendientePorRetornar?: number | null;
  montoPendientePorSolicitar?: number | null;
  onAddRequestReturnPayment?: (montoPendientePorSolicitar: number) => void;
  canManageReturnPayments?: boolean;
  canEditRequestReturnPayments?: boolean;
  onDefineCashReturnTime?: (returnPayment: ReturnPaymentResponse) => void;
  onPayReturn?: (returnPayment: ReturnPaymentResponse) => void;
  onEditReturn?: (
    returnPayment: ReturnPaymentResponse,
  ) => void;
  onConfirmCashReturnPickup?: (returnPayment: ReturnPaymentResponse) => void;
  onMarkCashReturnDelivered?: (returnPayment: ReturnPaymentResponse) => void;
  operationStatus?: OperationStatus;
}

export function ReturnPaymentsTable({
  returns,
  montoPendientePorRetornar = null,
  montoPendientePorSolicitar = null,
  onAddRequestReturnPayment,
  canManageReturnPayments = false,
  canEditRequestReturnPayments = false,
  onDefineCashReturnTime,
  onPayReturn,
  onEditReturn,
  onConfirmCashReturnPickup,
  onMarkCashReturnDelivered,
  operationStatus,
}: ReturnPaymentsTableProps) {
  const { user } = useAuth();
  const { openWhatsApp } = useWhatsAppLink();

  function handleNotifyReturnPaid(returnPayment: ReturnPaymentResponse) {
    const publicUrl = `${window.location.origin}${buildOperationDetailPath(returnPayment.operationId)}`;

    const message = buildReturnPaidMessage({
      operationId: returnPayment.operationId,
      monto: returnPayment.monto,
      publicUrl,
    });

    openWhatsApp(message, returnPayment.socioComercialTelefono);
  }

  const roles = user?.roles ?? [];

  const isAdmin = roles.includes('ADMIN');
  const isJefaCajas = roles.includes('JEFA_CAJAS');
  const isJefaCuentas = roles.includes('JEFA_CUENTAS');
  const isAuxiliarCuentas = roles.includes('AUXILIAR_CUENTAS');
  const isSocioComercial = roles.includes('SOCIO_COMERCIAL')
  const hasPendingAmountToRequest = (montoPendientePorSolicitar ?? 0) > 0;
  const hasPendingAmountToPay = (montoPendientePorRetornar ?? 0) > 0;
  const [openOptionsReturnId, setOpenOptionsReturnId] = useState<number | null>(null);

  const [optionsMenuPosition, setOptionsMenuPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  const optionsMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedReturnDetail, setSelectedReturnDetail] =
    useState<ReturnPaymentResponse | null>(null);

  function closeOptionsMenu() {
    setOpenOptionsReturnId(null);
    setOptionsMenuPosition(null);
  }

  function handleToggleOptionsMenu(
    returnPaymentId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (openOptionsReturnId === returnPaymentId) {
      closeOptionsMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 260;
    const estimatedMenuHeight = 80;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedMenuHeight;

    setOptionsMenuPosition({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - menuWidth),
      openUp,
    });

    setOpenOptionsReturnId(returnPaymentId);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        closeOptionsMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleCloseMenu() {
      closeOptionsMenu();
    }

    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);

    return () => {
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  const hasRequestedReturns = returns.some(
    (returnPayment) =>
      returnPayment.estatus === 'SOLICITADO' ||
      returnPayment.estatus === 'EN_RECOLECCION' ||
      returnPayment.estatus === 'RETORNADO',
  );
  function canDefineCashReturnTime(returnPayment: ReturnPaymentResponse) {
    if (!hasPendingAmountToPay) return false;
    if (!canManageReturnPayments) return false;
    if (!onDefineCashReturnTime) return false;
    if (
      returnPayment.estatus !== 'SOLICITADO' &&
      returnPayment.estatus !== 'EN_RECOLECCION'
    ) return false;

    return (
      (isJefaCajas || isAdmin) &&
      (returnPayment.tipoPago === 'EFECTIVO' || returnPayment.tipoPago === 'RETIRO_SIN_TARJETA')
    );
  }

  function canConfirmCashReturnPickup(returnPayment: ReturnPaymentResponse) {
    if (!isSocioComercial) return false;
    if (!onConfirmCashReturnPickup) return false;
    if (returnPayment.estatus !== 'ENTREGADO') return false;

    return (
      returnPayment.tipoPago === 'EFECTIVO' ||
      returnPayment.tipoPago === 'RETIRO_SIN_TARJETA'
    );
  }

  function canMarkCashReturnDelivered(returnPayment: ReturnPaymentResponse) {
    if (!canManageReturnPayments) return false;
    if (!onMarkCashReturnDelivered) return false;
    // estatus EN_RECOLECCION ya implica que hay fecha de recolección programada
    if (returnPayment.estatus !== 'EN_RECOLECCION') return false;

    return (
      (isJefaCajas || isAdmin) &&
      (returnPayment.tipoPago === 'EFECTIVO' || returnPayment.tipoPago === 'RETIRO_SIN_TARJETA')
    );
  }

  function canPayThisReturn(returnPayment: ReturnPaymentResponse) {
    if (!hasPendingAmountToPay) return false;
    if (!canManageReturnPayments) return false;
    if (!onPayReturn) return false;
    if (returnPayment.estatus !== 'SOLICITADO') return false;

    return (
      (isJefaCuentas || isAuxiliarCuentas || isAdmin) &&
      returnPayment.tipoPago === 'TRANSFERENCIA'
    );
  }

  const canOperationRequestReturns =
    operationStatus === 'VALIDADA' ||
    operationStatus === 'RETORNO_PARCIAL_SOLICITADO' ||
    operationStatus === 'RETORNO_TOTAL_SOLICITADO' ||
    operationStatus === 'RETORNO_PARCIAL_ENTREGADO';

  const canRequestReturns =
    canOperationRequestReturns &&
    hasPendingAmountToRequest &&
    !!onAddRequestReturnPayment && isSocioComercial;

  let requestStatusMessage: string | null = null;

  if (!canOperationRequestReturns) {
    requestStatusMessage = 'No se pueden solicitar retornos todavía';
  } else if (!hasPendingAmountToRequest) {
    requestStatusMessage = 'Se ha solicitado el retorno completo';
  }

  const paymentStatusMessage =
    !hasPendingAmountToPay
      ? 'Retornos liquidados'
      : !hasRequestedReturns
        ? 'Esperando solicitud de retorno'
        : 'Pendiente de pago';

  return (
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
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"><BanknoteArrowDown className="h-4 w-4" /> Egresos</p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Retornos al cliente</h3>
            <p className="mt-1 text-sm text-slate-400">Seguimiento de solicitudes y liquidaciones.</p>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-10 md:w-auto md:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por solicitar
              </p>

              <p
                className={`mt-1 text-lg font-bold tabular-nums ${hasPendingAmountToRequest ? 'text-cyan-300' : 'text-slate-500'
                  }`}
              >
                {formatCurrency(montoPendientePorSolicitar ?? 0)}
              </p>

              <div className="mt-1 flex h-[28px] items-center">
                {canRequestReturns ? (
                  <button
                    type="button"
                    onClick={() =>
                      onAddRequestReturnPayment?.(
                        montoPendientePorSolicitar ?? 0,
                      )
                    }
                    className="
                    inline-flex
                    items-center
                    justify-center
                    gap-1.5 rounded-lg
                    bg-blue-600
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-500
                    hover:-translate-y-0.5
                    "
                  >
                    <Plus className="h-3.5 w-3.5" /> Solicitar retorno
                  </button>
                ) : requestStatusMessage ? (
                  <p className="text-xs font-medium text-slate-400">
                    {requestStatusMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por retornar
              </p>

              <p
                className={`mt-1 text-lg font-bold tabular-nums ${hasPendingAmountToPay ? 'text-amber-300' : 'text-slate-500'
                  }`}
              >
                {formatCurrency(montoPendientePorRetornar ?? 0)}
              </p>

              <div className="mt-1 flex h-[28px] items-center">
                <p className="text-xs font-medium text-slate-400">
                  {paymentStatusMessage}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {returns.length === 0 ? (
        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <ArrowUpRight className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Sin retornos registrados</p>
            <p className="mt-1 text-xs text-slate-500">Las solicitudes y pagos de retorno aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-[1] bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cuenta destino</th>
                <th className="px-4 py-3 font-medium">Fecha solicitud</th>
                <th className="px-4 py-3 font-medium">Pagado por</th>
                <th className="px-4 py-3 font-medium">Fecha de recolección</th>
                <th className="px-4 py-3 font-medium">Fecha retorno</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
                <th className="px-4 py-3 font-medium">Opciones</th>
                {(canManageReturnPayments || canEditRequestReturnPayments) && (
                  <th className="px-4 py-3 font-medium">Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {returns.map((returnPayment) => {
                //const canEditReturn = canEditRequestReturnPayments && returnPayment.estatus === 'SOLICITADO'
                const canPayReturn = canPayThisReturn(returnPayment);
                const hasPickupScheduled = !!returnPayment.fechaHoraRecoleccionEfectivo;
                const canEditReturn =
                  canEditRequestReturnPayments &&
                  returnPayment.estatus === 'SOLICITADO' &&
                  !hasPickupScheduled;
                const canDefineTime = canDefineCashReturnTime(returnPayment);
                const canEditPickupTime = canDefineTime && hasPickupScheduled;
                const canCreatePickupTime = canDefineTime && !hasPickupScheduled;
                const canConfirmPickup = canConfirmCashReturnPickup(returnPayment);
                const canMarkDelivered = canMarkCashReturnDelivered(returnPayment);
                const canNotify =
                  canManageReturnPayments &&
                  returnPayment.estatus === 'RETORNADO' &&
                  !!returnPayment.socioComercialTelefono;

                const hasActions =
                  canPayReturn ||
                  canCreatePickupTime ||
                  canEditPickupTime ||
                  canEditReturn ||
                  canConfirmPickup ||
                  canMarkDelivered ||
                  canNotify;
                return (
                  <tr
                    key={returnPayment.id}
                    className="
          border-t
          border-slate-100
          text-sm
          transition
          hover:bg-cyan-50/40
        "
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-bold tabular-nums text-slate-950">
                      {formatCurrency(returnPayment.monto)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center md:justify-start">
                        <ReturnStatusBadge status={returnPayment.estatus} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {paymentTypeLabels[returnPayment.tipoPago]}
                    </td>

                    <td className="px-4 py-4">
                      <div className="max-w-[240px]">
                        <p className="text-sm font-semibold tracking-tight text-slate-900">
                          {returnPayment.cuentaClabeCliente ?? '-'}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>
                            {returnPayment.cuentaDestinoBanco ?? 'Sin banco'}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-slate-300" />

                          <span className="truncate">
                            {returnPayment.cuentaDestinoTitular ?? '-'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {returnPayment.fechaSolicitud
                        ? formatDate(returnPayment.fechaSolicitud)
                        : '-'}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {returnPayment.pagadoPorNombre ?? '-'}
                    </td>

                    <td className="px-4 py-4">
                      {(returnPayment.tipoPago === 'EFECTIVO' ||
                        returnPayment.tipoPago === 'RETIRO_SIN_TARJETA') &&
                      returnPayment.fechaHoraRecoleccionEfectivo ? (
                        <span className="animate-return-pickup-highlight inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {formatDateTime(returnPayment.fechaHoraRecoleccionEfectivo)}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {returnPayment.estatus === 'RETORNADO' && returnPayment.fechaPago
                        ? formatDateTime(returnPayment.fechaPago)
                        : '-'}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {returnPayment.observaciones ?? '-'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {returnPayment.archivoNominaUrl ? (
                          <span
                            title="Tiene archivo de nóminas adjunto"
                            className="
      inline-flex
      h-9
      w-9
      shrink-0
      items-center
      justify-center
      rounded-lg
      border
      border-emerald-200
      bg-emerald-50
      text-emerald-600
    "
                          >
                            <Paperclip className="h-4 w-4" />
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={(event) =>
                            handleToggleOptionsMenu(returnPayment.id, event)
                          }
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
                      </div>

                      {openOptionsReturnId === returnPayment.id &&
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
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReturnDetail(returnPayment);
                                closeOptionsMenu();
                              }}
                              className="
            block
            w-full
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
                              Ver detalles de retorno
                            </button>

                            {returnPayment.comprobanteUrl ? (
                              <a
                                href={returnPayment.comprobanteUrl}
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
                                Ver comprobante de retorno
                              </a>
                            ) : (
                              <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-400">
                                Sin comprobante
                              </div>
                            )}

                            {returnPayment.archivoNominaUrl ? (
                              <a
                                href={returnPayment.archivoNominaUrl}
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
                                Descargar archivo de nóminas
                              </a>
                            ) : null}
                          </div>,
                          document.body,
                        )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-stretch gap-2">
                        {hasActions ? (
                          <>
                            {(canCreatePickupTime || canEditPickupTime) && (
                              <button
                                type="button"
                                onClick={() => onDefineCashReturnTime?.(returnPayment)}
                                className="
      inline-flex
      h-8
      w-44
      items-center
      justify-center
      rounded-lg
      bg-amber-600
      px-3
      text-center
      text-xs
      font-medium
      text-white
      shadow-sm
      transition
      hover:bg-amber-700
    "
                              >
                                {canEditPickupTime
                                  ? 'Editar recolección'
                                  : 'Programar recolección'}
                              </button>
                            )}

                            {canMarkDelivered && (
                              <button
                                type="button"
                                onClick={() => onMarkCashReturnDelivered?.(returnPayment)}
                                className="
      inline-flex
      h-8
      w-44
      items-center
      justify-center
      rounded-lg
      bg-indigo-600
      px-3
      text-center
      text-xs
      font-medium
      text-white
      shadow-sm
      transition
      hover:bg-indigo-700
    "
                              >
                                Marcar como entregado
                              </button>
                            )}

                            {canPayReturn && (
                              <button
                                type="button"
                                onClick={() => onPayReturn?.(returnPayment)}
                                className="
      h-8
      rounded-lg
      bg-emerald-600
      px-3
      text-xs
      font-medium
      text-white
      shadow-sm
      transition
      hover:bg-emerald-700
    "
                              >
                                Retornar
                              </button>
                            )}

                            {canNotify && (
                              <button
                                type="button"
                                onClick={() => handleNotifyReturnPaid(returnPayment)}
                                className="
      inline-flex
      h-8
      w-44
      items-center
      justify-center
      gap-1.5
      rounded-lg
      border
      border-emerald-200
      bg-emerald-50
      px-3
      text-xs
      font-medium
      text-emerald-700
      shadow-sm
      transition
      hover:bg-emerald-100
    "
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Avisar por WhatsApp
                              </button>
                            )}

                            {canEditReturn && (
                              <button
                                type="button"
                                onClick={() => onEditReturn?.(returnPayment)}
                                className="
              h-8
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3
              text-xs
              font-medium
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
            "
                              >
                                Editar
                              </button>
                            )}

                            {canConfirmPickup && (
                              <button
                                type="button"
                                onClick={() => onConfirmCashReturnPickup?.(returnPayment)}
                                className="
      h-8
      rounded-lg
      bg-blue-600
      px-3
      text-xs
      font-medium
      text-white
      shadow-sm
      transition
      hover:bg-blue-700
    "
                              >
                                Confirmar recepción
                              </button>
                            )}
                          </>
                        ) : (
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
      )}

      <ReturnPaymentDetailModal
        open={!!selectedReturnDetail}
        onClose={() => setSelectedReturnDetail(null)}
        returnPayment={selectedReturnDetail}
      />
    </div>
  );
}
