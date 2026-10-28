// components/returns/ReturnPaymentsTable.tsx

import { type ReactNode } from 'react';
import { BanknoteArrowDown, Eye, Paperclip, Pencil, Plus, Send } from 'lucide-react';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import { formatMoney as formatCurrency, formatDate } from '@/shared/format';
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
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';

interface ReturnPaymentsTableProps {
  returns: ReturnPaymentResponse[];
  montoPendientePorRetornar?: number | null;
  montoPendientePorSolicitar?: number | null;
  onAddRequestReturnPayment?: (montoPendientePorSolicitar: number) => void;
  canManageReturnPayments?: boolean;
  canEditRequestReturnPayments?: boolean;
  /** "Ver retorno" / "Ver recolección" — consulta de solo lectura. */
  onOpenReturn?: (returnRequest: ReturnPaymentResponse) => void;
  /** Acción operativa: retornar, programar una recolección o confirmar su recepción. */
  onManageReturn?: (returnRequest: ReturnPaymentResponse) => void;
  onEditReturn?: (returnPayment: ReturnPaymentResponse) => void;
  operationStatus?: OperationStatus;
  sectionTabs?: ReactNode;
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
  sectionTabs,
}: ReturnPaymentsTableProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const isAdmin = roles.includes('ADMIN');
  const isJefaCajas = roles.includes('JEFA_CAJAS');
  const isJefaCuentas = roles.includes('JEFA_CUENTAS');
  const isAuxiliarCuentas = roles.includes('AUXILIAR_CUENTAS');
  const isSocioComercial = roles.includes('SOCIO_COMERCIAL');

  const visibleReturns = returns.filter((returnPayment) => {
    if (isAdmin) return true;
    if (returnPayment.tipoPago === 'RETIRO_SIN_TARJETA') return !isJefaCajas || Boolean(returnPayment.parcialidades?.some(i => !i.codigoParaCliente));
    if (isJefaCajas || isJefaCuentas || isAuxiliarCuentas) {
      return isCashReturnMethod(returnPayment.tipoPago) ? isJefaCajas : isJefaCuentas || isAuxiliarCuentas;
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
    if (returnPayment.tipoPago === 'RETIRO_SIN_TARJETA') return isJefaCuentas || isAuxiliarCuentas;
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

  const menuItem = 'flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50';

  /** Igual que Ingresos: la acción de trabajo queda visible y lo demás vive en el menú ⋯. */
  function renderRowActions(returnPayment: ReturnPaymentResponse): ReactNode {
    const totals = resolveReturnRequestTotals(returnPayment);
    const availability = registerAvailability(returnPayment);
    const puedeGestionar =
      canManageReturnPayments && roleCanHandleMethod(returnPayment);
    const canEdit =
      canEditRequestReturnPayments &&
      returnPayment.estatus === 'SOLICITADO' &&
      totals.numeroParcialidades === 0;
    const cardless = returnPayment.tipoPago === 'RETIRO_SIN_TARJETA' && !isJefaCajas;

    const rowActions = resolveReturnRowActions({
      tipoPago: returnPayment.tipoPago,
      parcialidades: returnPayment.parcialidades ?? [],
      canRegister: availability.canRegister,
      isSocioComercial,
      isJefaCajas,
      isAdmin,
    });
    const primaryIsManage = !cardless && rowActions.primaryVariant === 'manage';
    const viewLabel = rowActions.esEfectivo ? 'Ver recolección' : 'Ver retorno';
    const workButton = 'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold text-white shadow-sm transition';

    return (
      <div className="flex min-w-0 flex-col items-end gap-1 max-sm:w-full max-sm:items-stretch">
        <div className="flex min-w-0 items-center justify-end gap-2">
          {cardless && (
            <button type="button" onClick={() => isJefaCuentas || isAuxiliarCuentas || isAdmin || isSocioComercial ? onManageReturn?.(returnPayment) : onOpenReturn?.(returnPayment)}
              className={`${workButton} bg-blue-600 hover:bg-blue-700`}>
              {isJefaCuentas || isAuxiliarCuentas || isAdmin ? 'Gestionar códigos' : 'Ver códigos de retiro'}
            </button>
          )}
          {primaryIsManage && (
            <button type="button" onClick={() => onManageReturn?.(returnPayment)} className={`${workButton} bg-slate-950 hover:bg-slate-800`}>
              <Plus className="h-3.5 w-3.5" /> {(isJefaCuentas || isAuxiliarCuentas) && !rowActions.esEfectivo && rowActions.primaryLabel === 'Retornar' ? 'Pagar' : rowActions.primaryLabel}
            </button>
          )}
          {!cardless && rowActions.showConfirmRecoleccion && (
            <button type="button" onClick={() => onManageReturn?.(returnPayment)} className={`${workButton} bg-blue-600 hover:bg-blue-700`}>
              {rowActions.collectionActionLabel}
            </button>
          )}
          <RowActionsMenu triggerLabel="" ariaLabel="Más opciones" triggerClassName="min-w-9 justify-center px-2">
            {!cardless && (
              <button type="button" onClick={() => onOpenReturn?.(returnPayment)} className={menuItem}>
                <Eye className="h-4 w-4" /> {viewLabel}
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={() => onEditReturn?.(returnPayment)} className={menuItem}>
                <Pencil className="h-4 w-4" /> Editar solicitud
              </button>
            )}
            {returnPayment.archivoNominaUrl && (
              <a href={returnPayment.archivoNominaUrl} target="_blank" rel="noreferrer" className={menuItem}>
                <Paperclip className="h-4 w-4" /> Descargar nómina
              </a>
            )}
            <p className="border-t border-slate-100 px-4 py-2 text-left text-xs text-slate-500">
              Solicitado: {formatDate(returnPayment.fechaSolicitud)}
            </p>
          </RowActionsMenu>
        </div>
        {!cardless && puedeGestionar && !rowActions.esEfectivo && !availability.canRegister && availability.reason ? (
          <span className="text-right text-xs text-slate-400">{availability.reason}</span>
        ) : null}
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
          {formatCurrency(totals.montoRetornado)} de {formatCurrency(totals.montoSolicitado)} retornado
        </p>
      </div>
    );
  }

  function renderMobileProgress(returnPayment: ReturnPaymentResponse): ReactNode {
    const totals = resolveReturnRequestTotals(returnPayment);
    const pct = Math.min(Math.max(totals.porcentajeAvance, 0), 100);
    return <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
      <div className="flex justify-between gap-2 text-xs text-slate-500"><span>{formatCurrency(totals.montoRetornado)} retornado</span><span>{Math.round(pct)}%</span></div>
      <div className="flex justify-between gap-2 text-xs"><span className="text-slate-500">Pendiente</span><strong className="text-amber-700">{formatCurrency(totals.montoPendiente)}</strong></div>
    </div>;
  }

  if (isSocioComercial && visibleReturns.length === 0 && canRequestReturns) {
    return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none">
      {sectionTabs && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 pt-2 text-left max-sm:border-0 max-sm:px-0 max-sm:pt-0">
        {sectionTabs}
        <p className="pb-2 text-sm text-slate-500 max-sm:pb-0">Por solicitar <strong className="ml-1 text-violet-700">{formatCurrency(montoPendientePorSolicitar ?? 0)}</strong></p>
      </div>}
      <div className="px-4 py-10 max-sm:rounded-2xl max-sm:border max-sm:border-slate-200 max-sm:bg-white max-sm:py-7">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-violet-100 text-violet-600"><Send className="size-5" /></span>
      <h3 className="mt-3 text-base font-semibold text-slate-900">Aún no has solicitado el retorno</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Indica cómo se le devolverán {formatCurrency(montoPendientePorSolicitar ?? 0)} al cliente. Puedes dividirlo en varios pagos.</p>
      <button type="button" onClick={() => onAddRequestReturnPayment?.(montoPendientePorSolicitar ?? 0)} className="mx-auto mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white max-sm:w-full"><Send className="size-4" /> Solicitar retorno</button>
      </div>
    </div>;
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${sectionTabs ? 'max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none' : ''}`}>
      {sectionTabs ? <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-slate-200 bg-white px-5 pt-2 sm:px-6 max-sm:border-0 max-sm:bg-transparent max-sm:px-0 max-sm:pt-0">
        {sectionTabs}
        <div className="flex flex-wrap items-center gap-3 pb-2 text-sm text-slate-500 max-sm:hidden">
          {isSocioComercial && hasPendingAmountToRequest && <span>Por solicitar <strong className="ml-1 font-bold text-violet-700">{formatCurrency(montoPendientePorSolicitar ?? 0)}</strong></span>}
          {isSocioComercial && <span>Pendiente <strong className="ml-1 font-bold text-amber-700">{formatCurrency(montoPendientePorRetornar ?? 0)}</strong></span>}
          {canRequestReturns && <button type="button" onClick={() => onAddRequestReturnPayment?.(montoPendientePorSolicitar ?? 0)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" /> Solicitar retorno</button>}
        </div>
      </div> : <div className={`border-b border-slate-100 bg-white px-4 py-3 sm:px-6 ${isSocioComercial ? 'max-sm:hidden' : ''}`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-left">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              <BanknoteArrowDown className="h-4 w-4" /> Egresos
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">Retornos al cliente</h3>
            <p className="mt-1 text-xs text-slate-500">
              Seguimiento de solicitudes y sus parcialidades.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-3 md:w-auto md:grid-cols-[1fr_1fr] md:gap-10">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Pendiente por solicitar
              </p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  hasPendingAmountToRequest ? 'text-blue-600' : 'text-slate-500'
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
                  <p className="text-xs font-medium text-slate-500">{requestStatusMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Pendiente por retornar
              </p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  hasPendingAmountToPay ? 'text-amber-700' : 'text-slate-500'
                }`}
              >
                {formatCurrency(montoPendientePorRetornar ?? 0)}
              </p>
              <div className="mt-1 flex min-h-[28px] items-center">
                <p className="text-xs font-medium text-slate-500">{paymentStatusMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>}

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
          {isSocioComercial && <p className="hidden border-b border-slate-100 px-4 py-3 text-xs text-slate-500 max-sm:block">Pendiente {formatCurrency(montoPendientePorRetornar ?? 0)} · Por solicitar {formatCurrency(montoPendientePorSolicitar ?? 0)}</p>}
          {canRequestReturns && sectionTabs && <button type="button" onClick={() => onAddRequestReturnPayment?.(montoPendientePorSolicitar ?? 0)} className="mx-4 mb-3 hidden min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white max-sm:flex">Solicitar retorno</button>}
          <DataTable
            mobileFieldsLayout="rows"
            mobileTitleClassName="text-sm"
            rowClassName={(request) => (isJefaCuentas || isAuxiliarCuentas) && (request.montoPendiente ?? 0) > 0 ? 'bg-amber-50/70' : ''}
            columns={[
              { key: 'folio', header: 'Folio', width: '64px', cell: (request: ReturnPaymentResponse) => <span className="font-semibold text-slate-900">#{request.id}</span> },
              { key: 'method', header: 'Método', width: '128px', cell: (request: ReturnPaymentResponse) => paymentTypeLabels[request.tipoPago] },
              { key: 'requested', header: 'Solicitado', width: '126px', cell: (request: ReturnPaymentResponse) => <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(resolveReturnRequestTotals(request).montoSolicitado)}</span> },
              { key: 'progress', header: 'Avance', cell: renderProgress },
              { key: 'pending', header: 'Pendiente', width: '118px', cell: (request: ReturnPaymentResponse) => <span className="font-semibold tabular-nums text-amber-700">{formatCurrency(resolveReturnRequestTotals(request).montoPendiente)}</span> },
              { key: 'status', header: 'Estatus', kind: 'status', width: '170px', cell: (request: ReturnPaymentResponse) => <ReturnStatusBadge status={request.estatus} stage={request.retiroEtapa} /> },
              { key: 'actions', header: 'Acciones', kind: 'actions', align: 'right', width: '210px', cell: renderRowActions },
            ] satisfies DataTableColumn<ReturnPaymentResponse>[]}
            rows={visibleReturns}
            getRowKey={(request) => request.id}
            emptyTitle="Sin solicitudes de retorno"
            mobile={{
              title: (request) => <>#{request.id} · {paymentTypeLabels[request.tipoPago]}</>,
              status: (request) => <ReturnStatusBadge status={request.estatus} stage={request.retiroEtapa} />,
              fields: [
                { key: 'requested', label: 'Solicitado', value: (request) => formatCurrency(resolveReturnRequestTotals(request).montoSolicitado) },
              ],
              extra: renderMobileProgress,
              actions: renderRowActions,
            }}
          />
          {(isJefaCuentas || isAuxiliarCuentas) && returns.some((request) => isCashReturnMethod(request.tipoPago)) && <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">Cuentas y Auxiliares registran los códigos de retiro para el cliente y verifican su cobro. No pasan por Caja General.</p>}
          {isJefaCajas && returns.some((request) => !isCashReturnMethod(request.tipoPago)) && <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">Los retornos por transferencia de esta operación los paga Cuentas.</p>}
        </>
      )}
    </div>
  );
}
