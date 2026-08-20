import type { ReactNode } from 'react';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import {
  formatCurrency,
  formatDate,
  isOperationEditableStatus,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';

interface OperationsTableProps {
  operations: PaymentOperationResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onViewDetail: (id: number, scrollToPayments?: boolean) => void;
  onAddPayment: (id: number) => void;
  onOperationUpdated?: () => void | Promise<void>;
  onEditOperation?: (operationId: number) => void;
  onActivateOperation?: (operationId: number) => void;
  onDeactivateOperation?: (operationId: number) => void;
  togglingOperationId?: number | null;
}

export function OperationsTable({
  operations,
  isLoading = false,
  onViewDetail,
  onAddPayment,
  onOperationUpdated,
  onEditOperation,
  onActivateOperation,
  onDeactivateOperation,
  togglingOperationId,
}: OperationsTableProps) {
  useMarkOperationAsInvoiced({
    onSuccess: onOperationUpdated,
  });

  const { hasRole } = useAuth();

  const isSocioComercial = hasRole(['SOCIO_COMERCIAL']);
  const canManageOperationFlow = !isSocioComercial;
  const canModifyOperations = hasRole([
    'ADMIN',
    'GERENTE',
    'DIRECCION',
    'SOCIO_COMERCIAL',
  ]);
  const canToggleOperationStatus = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);
  const canReviewCommission = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);

  function renderActions(operation: PaymentOperationResponse): ReactNode {
    return (
      <>
        <button
          type="button"
          onClick={() => onViewDetail(operation.id)}
          className="block w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50"
        >
          Ver detalle
        </button>

        {canManageOperationFlow &&
          (operation.estatus === 'PENDIENTE_VALIDACION' ||
            operation.estatus === 'INGRESO_PARCIAL') && (
            <button
              type="button"
              onClick={() => onViewDetail(operation.id, true)}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Validar pagos de ingreso
            </button>
          )}

        {canModifyOperations && operation.saldoPendientePorRegistrar > 0 && (
          <button
            type="button"
            onClick={() => onAddPayment(operation.id)}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Registrar pago de ingreso
          </button>
        )}

        {canModifyOperations && isOperationEditableStatus(operation.estatus) ? (
          <button
            type="button"
            onClick={() => onEditOperation?.(operation.id)}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Editar
          </button>
        ) : null}

        {canToggleOperationStatus &&
          (operation.activo ? (
            <button
              type="button"
              disabled={togglingOperationId === operation.id}
              onClick={() => onDeactivateOperation?.(operation.id)}
              className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Desactivar
            </button>
          ) : (
            <button
              type="button"
              disabled={togglingOperationId === operation.id}
              onClick={() => onActivateOperation?.(operation.id)}
              className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Activar
            </button>
          ))}
      </>
    );
  }

  if (!isLoading && operations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No hay operaciones registradas con los filtros seleccionados.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm shadow-slate-950/5">
        Cargando operaciones...
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet ancho: tabla completa */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium text-center">Folio</th>
                <th className="px-4 py-3 font-medium text-center">Cliente primario</th>
                <th className="px-4 py-3 font-medium text-center">Socio comercial</th>
                <th className="px-4 py-3 font-medium text-center">Fecha de creación</th>
                <th className="px-4 py-3 font-medium text-center">Última actualización</th>
                <th className="px-4 py-3 font-medium text-center">Monto total</th>
                <th className="px-4 py-3 font-medium text-center">Monto ingresado</th>
                <th className="px-4 py-3 font-medium text-center">Monto retornado</th>
                <th className="px-4 py-3 font-medium text-center">Estatus</th>
                <th className="px-4 py-3 font-medium text-center">Activo</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {operations.map((operation) => {
                const showCommissionReviewMark =
                  canReviewCommission &&
                  operation.nivelesRedComercial >= 2 &&
                  isOperationEditableStatus(operation.estatus);

                return (
                  <tr
                    key={operation.id}
                    className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <div
                        className={
                          showCommissionReviewMark
                            ? 'mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-500 text-xs font-semibold text-amber-800'
                            : 'mt-1 text-xs font-normal text-slate-400'
                        }
                      >
                        {operation.id}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <div>{operation.clienteNombre}</div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {operation.socioComercialNombre}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(operation.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {operation.updatedAt &&
                      operation.createdAt &&
                      new Date(operation.updatedAt).getTime() !==
                        new Date(operation.createdAt).getTime()
                        ? formatDate(operation.updatedAt)
                        : 'Sin cambios posteriores'}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatCurrency(operation.montoTotal)}
                    </td>

                    <td className="min-w-[160px] px-4 py-4 text-slate-600">
                      <div>
                        {operation.pagos.length} pago
                        {operation.pagos.length === 1 ? '' : 's'} registrado
                        {operation.pagos.length === 1 ? '' : 's'}
                      </div>
                      <ProgressBar
                        className="mt-2"
                        total={operation.montoTotal}
                        registered={operation.montoRegistrado}
                        validated={operation.montoValidado}
                      />
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <div className="mt-1 text-xs text-slate-400">
                        {formatCurrency(operation.montoRetornado)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <OperationStatusBadge status={operation.estatus} />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <StatusBadge active={operation.activo} />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <RowActionsMenu>{renderActions(operation)}</RowActionsMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Móvil: tarjetas apiladas */}
      <div className="space-y-3 md:hidden">
        {operations.map((operation) => {
          const showCommissionReviewMark =
            canReviewCommission &&
            operation.nivelesRedComercial >= 2 &&
            isOperationEditableStatus(operation.estatus);

          return (
            <div
              key={operation.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        showCommissionReviewMark
                          ? 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 text-xs font-semibold text-amber-800'
                          : 'text-xs font-normal text-slate-400'
                      }
                    >
                      #{operation.id}
                    </span>
                    <StatusBadge active={operation.activo} />
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {operation.clienteNombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {operation.socioComercialNombre}
                  </p>
                </div>
                <OperationStatusBadge status={operation.estatus} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Monto total</p>
                  <p className="font-medium text-slate-900">{formatCurrency(operation.montoTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Monto retornado</p>
                  <p className="font-medium text-slate-900">{formatCurrency(operation.montoRetornado)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Creación</p>
                  <p>{formatDate(operation.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Última actualización</p>
                  <p>
                    {operation.updatedAt &&
                    operation.createdAt &&
                    new Date(operation.updatedAt).getTime() !==
                      new Date(operation.createdAt).getTime()
                      ? formatDate(operation.updatedAt)
                      : 'Sin cambios'}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {operation.pagos.length} pago{operation.pagos.length === 1 ? '' : 's'} registrado
                  {operation.pagos.length === 1 ? '' : 's'}
                </p>
                <ProgressBar
                  className="mt-1"
                  total={operation.montoTotal}
                  registered={operation.montoRegistrado}
                  validated={operation.montoValidado}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(operation.id)}
                  className="min-h-[44px] flex-1 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ver detalle
                </button>
                <RowActionsMenu triggerLabel="Más">{renderActions(operation)}</RowActionsMenu>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}