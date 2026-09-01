// components/returns/ReturnPaymentsTable.tsx

import { type ReactNode } from 'react';
import { BanknoteArrowDown, Paperclip, Plus } from 'lucide-react';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import {
  isCashReturnMethod,
  resolveRegisterInstallmentAvailability,
  resolveReturnRequestTotals,
  resolveReturnRowActions,
} from '@/modules/operations/utils/return-installment';
import {
  OperationStatus,
  ReturnPaymentResponse,
} from '../../types/operations.types.ts';
import { ReturnStatusBadge } from './ReturnStatusBadge.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';

interface ReturnPaymentsTableProps {
  returns: ReturnPaymentResponse[];
  montoPendientePorRetornar?: number | null;
  montoPendientePorSolicitar?: number | null;
  onAddRequestReturnPayment?: (montoPendientePorSolicitar: number) => void;
  canManageReturnPayments?: boolean;
  canEditRequestReturnPayments?: boolean;
  /** "Ver retorno" / "Ver recolección" — consulta de solo lectura. */
  onOpenReturn?: (returnRequest: ReturnPaymentResponse) => void;
  /** "Retornar" (no efectivo) / "Confirmar recolección" (efectivo) — operativo. */
  onManageReturn?: (returnRequest: ReturnPaymentResponse) => void;
  onEditReturn?: (returnPayment: ReturnPaymentResponse) => void;
  operationStatus?: OperationStatus;
}

export function ReturnPaymentsTable({
  returns,
  montoPendientePorRetornar = null,
  montoPendientePorSolicitar = null,
  onAddRequestReturnPayment,
  canManageReturnPayments = false,
  canEditRequestReturnPayments = false,
  onOpenReturn,
  onManageReturn,
  onEditReturn,
  operationStatus,
}: ReturnPaymentsTableProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const isAdmin = roles.includes('ADMIN');
  const isJefaCajas = roles.includes('JEFA_CAJAS');
  const isJefaCuentas = roles.includes('JEFA_CUENTAS');
  const isAuxiliarCuentas = roles.includes('AUXILIAR_CUENTAS');
  const isSocioComercial = roles.includes('SOCIO_COMERCIAL');

  const visibleReturns = returns.filter((returnPayment) => {
    if (isJefaCajas) {
      return isCashReturnMethod(returnPayment.tipoPago);
    }
    if (isJefaCuentas || isAuxiliarCuentas) {
      return !isCashReturnMethod(returnPayment.tipoPago);
    }
    return true; // ADMIN, GERENTE, DIRECCION, SOCIO_COMERCIAL ven todo
  });

  const hasPendingAmountToRequest = (montoPendientePorSolicitar ?? 0) > 0;
  const hasPendingAmountToPay = (montoPendientePorRetornar ?? 0) > 0;

  const canOperationRequestReturns =
    operationStatus === 'VALIDADA' ||
    operationStatus === 'RETORNO_PARCIAL_SOLICITADO' ||
    operationStatus === 'RETORNO_TOTAL_SOLICITADO' ||
    operationStatus === 'RETORNO_PARCIAL_ENTREGADO';

  const canRequestReturns =
    canOperationRequestReturns &&
    hasPendingAmountToRequest &&
    !!onAddRequestReturnPayment &&
    isSocioComercial;

  let requestStatusMessage: string | null = null;
  if (!canOperationRequestReturns) {
    requestStatusMessage = 'No se pueden solicitar retornos todavía';
  } else if (!hasPendingAmountToRequest) {
    requestStatusMessage = 'Se ha solicitado el retorno completo';
  }

  const paymentStatusMessage = !hasPendingAmountToPay
    ? 'Retornos liquidados'
    : 'Pendiente de pago';

  function roleCanHandleMethod(returnPayment: ReturnPaymentResponse): boolean {
    if (isAdmin) return true;
    if (isCashReturnMethod(returnPayment.tipoPago)) return isJefaCajas;
    return isJefaCuentas || isAuxiliarCuentas;
  }

  function registerAvailability(returnPayment: ReturnPaymentResponse) {
    return resolveRegisterInstallmentAvailability({
      totals: resolveReturnRequestTotals(returnPayment),
      estatus: returnPayment.estatus,
      hasPermission:
        canManageReturnPayments && roleCanHandleMethod(returnPayment) && hasPendingAmountToPay,
    });
  }

  function renderRowActions(returnPayment: ReturnPaymentResponse): ReactNode {
    const totals = resolveReturnRequestTotals(returnPayment);
    const availability = registerAvailability(returnPayment);
    const puedeGestionar =
      canManageReturnPayments && roleCanHandleMethod(returnPayment);
    const canEdit =
      canEditRequestReturnPayments &&
      returnPayment.estatus === 'SOLICITADO' &&
      totals.numeroParcialidades === 0;

    const rowActions = resolveReturnRowActions({
      tipoPago: returnPayment.tipoPago,
      parcialidades: returnPayment.parcialidades ?? [],
      canRegister: availability.canRegister,
      isSocioComercial,
      isJefaCajas,
      isAdmin,
    });

    const primaryIsManage = rowActions.primaryVariant === 'manage';
    const openPrimary = () =>
      primaryIsManage
        ? onManageReturn?.(returnPayment)
        : onOpenReturn?.(returnPayment);

    return (
      <div className="flex flex-col items-stretch gap-2">
        <button
          type="button"
          onClick={openPrimary}
          className={
            primaryIsManage
              ? 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700'
              : 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50'
          }
        >
          {primaryIsManage ? (
            <>
              <Plus className="h-3.5 w-3.5" /> {rowActions.primaryLabel}
            </>
          ) : (
            rowActions.primaryLabel
          )}
        </button>

        {rowActions.showConfirmRecoleccion && (
          <button
            type="button"
            onClick={() => onManageReturn?.(returnPayment)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Confirmar recolección
          </button>
        )}

        {puedeGestionar && !rowActions.esEfectivo && !availability.canRegister && availability.reason ? (
          <span className="text-center text-xs text-slate-400">{availability.reason}</span>
        ) : null}

        {canEdit && (
          <button
            type="button"
            onClick={() => onEditReturn?.(returnPayment)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Editar solicitud
          </button>
        )}
      </div>
    );
  }

  function renderProgress(returnPayment: ReturnPaymentResponse): ReactNode {
    const totals = resolveReturnRequestTotals(returnPayment);
    const pct = Math.min(Math.max(totals.porcentajeAvance, 0), 100);
    return (
      <div className="min-w-[160px]">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {pct.toFixed(1)}% · {totals.numeroParcialidades} parcialidad(es)
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-950/[0.06]">
      <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-left">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <BanknoteArrowDown className="h-4 w-4" /> Egresos
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Retornos al cliente</h3>
            <p className="mt-1 text-sm text-slate-400">
              Seguimiento de solicitudes y sus parcialidades.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-3 md:w-auto md:grid-cols-[1fr_1fr] md:gap-10">
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por solicitar
              </p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  hasPendingAmountToRequest ? 'text-cyan-300' : 'text-slate-500'
                }`}
              >
                {formatCurrency(montoPendientePorSolicitar ?? 0)}
              </p>
              <div className="mt-2 flex min-h-11 items-center md:mt-1 md:min-h-[28px]">
                {canRequestReturns ? (
                  <button
                    type="button"
                    onClick={() => onAddRequestReturnPayment?.(montoPendientePorSolicitar ?? 0)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    <Plus className="h-3.5 w-3.5" /> Solicitar retorno
                  </button>
                ) : requestStatusMessage ? (
                  <p className="text-xs font-medium text-slate-400">{requestStatusMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por retornar
              </p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  hasPendingAmountToPay ? 'text-amber-300' : 'text-slate-500'
                }`}
              >
                {formatCurrency(montoPendientePorRetornar ?? 0)}
              </p>
              <div className="mt-1 flex min-h-[28px] items-center">
                <p className="text-xs font-medium text-slate-400">{paymentStatusMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {visibleReturns.length === 0 ? (
        <div className="px-6 pb-6 pt-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              {returns.length > 0 ? 'Sin solicitudes de tu tipo' : 'Sin solicitudes de retorno'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {returns.length > 0
                ? 'Esta operación no tiene solicitudes del tipo que te corresponde.'
                : 'Las solicitudes y sus parcialidades aparecerán aquí.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-slate-100">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Solicitado</th>
                  <th className="px-4 py-3 font-medium">Retornado</th>
                  <th className="px-4 py-3 font-medium">Pendiente</th>
                  <th className="px-4 py-3 font-medium">Avance</th>
                  <th className="px-4 py-3 font-medium">Estatus</th>
                  <th className="px-4 py-3 font-medium">Fecha solicitud</th>
                  <th className="px-4 py-3 font-medium">Nómina</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleReturns.map((returnPayment) => {
                  const totals = resolveReturnRequestTotals(returnPayment);
                  return (
                    <tr
                      key={returnPayment.id}
                      className="border-t border-slate-100 text-sm transition hover:bg-cyan-50/40"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        #{returnPayment.id}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {paymentTypeLabels[returnPayment.tipoPago]}
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums text-slate-950">
                        {formatCurrency(totals.montoSolicitado)}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-emerald-700">
                        {formatCurrency(totals.montoRetornado)}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-amber-700">
                        {formatCurrency(totals.montoPendiente)}
                      </td>
                      <td className="px-4 py-4">{renderProgress(returnPayment)}</td>
                      <td className="px-4 py-4">
                        <ReturnStatusBadge status={returnPayment.estatus} />
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {returnPayment.fechaSolicitud
                          ? formatDate(returnPayment.fechaSolicitud)
                          : '-'}
                      </td>
                      <td className="px-4 py-4">
                        {returnPayment.archivoNominaUrl ? (
                          <a
                            href={returnPayment.archivoNominaUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Descargar archivo de nóminas"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                          >
                            <Paperclip className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">{renderRowActions(returnPayment)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil */}
          <div className="space-y-3 px-3 pb-4 pt-3 md:hidden">
            {visibleReturns.map((returnPayment) => {
              const totals = resolveReturnRequestTotals(returnPayment);
              return (
                <div
                  key={returnPayment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        #{returnPayment.id} · {paymentTypeLabels[returnPayment.tipoPago]}
                      </p>
                      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-950">
                        {formatCurrency(totals.montoSolicitado)}
                      </p>
                    </div>
                    <ReturnStatusBadge status={returnPayment.estatus} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Retornado</p>
                      <p className="font-semibold text-emerald-700">
                        {formatCurrency(totals.montoRetornado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pendiente</p>
                      <p className="font-semibold text-amber-700">
                        {formatCurrency(totals.montoPendiente)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">{renderProgress(returnPayment)}</div>

                  {returnPayment.archivoNominaUrl ? (
                    <a
                      href={returnPayment.archivoNominaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"
                    >
                      <Paperclip className="h-3.5 w-3.5" /> Descargar archivo de nóminas
                    </a>
                  ) : null}

                  <div className="mt-4">{renderRowActions(returnPayment)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
