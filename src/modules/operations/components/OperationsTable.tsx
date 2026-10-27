import type { ReactNode } from 'react';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatDate, formatElapsedSince, formatMoney } from '@/shared/format';
import { isOperationEditableStatus } from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import { Button } from '@/shared/components/ui/Button';

interface OperationsTableProps {
  operations: PaymentOperationResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  isLoading?: boolean;
  stalledView?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onPageChange: (page: number) => void;
  onViewDetail: (id: number, scrollToPayments?: boolean) => void;
  onAddPayment: (id: number) => void;
  onOperationUpdated?: () => void | Promise<void>;
  onEditOperation?: (operationId: number) => void;
  onActivateOperation?: (operationId: number) => void;
  onDeactivateOperation?: (operationId: number) => void;
  onDeleteOperation?: (operation: PaymentOperationResponse) => void;
  togglingOperationId?: number | null;
}

export function OperationsTable({
  operations,
  isLoading = false,
  stalledView = false,
  emptyTitle,
  emptyDescription,
  onViewDetail,
  onAddPayment,
  onOperationUpdated,
  onEditOperation,
  onActivateOperation,
  onDeactivateOperation,
  onDeleteOperation,
  togglingOperationId,
}: OperationsTableProps) {
  useMarkOperationAsInvoiced({
    onSuccess: onOperationUpdated,
  });

  const { hasRole } = useAuth();

  const isSocioComercial = hasRole(['SOCIO_COMERCIAL']);
  const canManageOperationFlow = hasRole(['ADMIN', 'JEFA_CAJAS', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS']);
  const canModifyOperations = hasRole([
    'ADMIN',
    'SOCIO_COMERCIAL',
  ]);
  const canToggleOperationStatus = hasRole('ADMIN');
  // La eliminación física excluye a DIRECCION a propósito: no es lo mismo que
  // desactivar, y solo aplica mientras la operación siga pendiente de validación.
  const canDeleteOperation = hasRole(['ADMIN', 'GERENTE']);
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

        {canDeleteOperation && operation.estatus === 'PENDIENTE_VALIDACION' && (
          <button
            type="button"
            onClick={() => onDeleteOperation?.(operation)}
            className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 transition hover:bg-red-100"
          >
            Eliminar definitivamente
          </button>
        )}
      </>
    );
  }

  function folio(operation: PaymentOperationResponse) {
    const needsCommissionReview = canReviewCommission &&
      operation.nivelesRedComercial >= 2 &&
      isOperationEditableStatus(operation.estatus);
    return (
      <span className={needsCommissionReview
        ? 'inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-500 text-xs font-semibold text-amber-800'
        : 'text-xs font-medium text-slate-600'}>
        {operation.id}
      </span>
    );
  }

  const clientCell = (operation: PaymentOperationResponse) => (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-900" title={operation.clienteNombre}>{operation.clienteNombre}</p>
      {!isSocioComercial && <p className="mt-0.5 truncate text-xs text-slate-500" title={`Socio: ${operation.socioComercialNombre}`}>Socio: {operation.socioComercialNombre}</p>}
    </div>
  );
  const viewButton = (operation: PaymentOperationResponse) => (
    <Button type="button" variant="neutral" className={stalledView ? 'h-8 px-3 text-xs' : undefined} onClick={() => onViewDetail(operation.id)}>Ver</Button>
  );
  const mobileViewButton = (operation: PaymentOperationResponse) => (
    <Button type="button" variant="neutral" className="h-8 px-3 text-xs" onClick={() => onViewDetail(operation.id)}>Ver</Button>
  );
  const actionsCell = (operation: PaymentOperationResponse) => (
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      {viewButton(operation)}
      <RowActionsMenu triggerLabel="" ariaLabel="Más opciones" triggerClassName={stalledView ? 'h-8 min-w-8 shrink-0 justify-center px-1' : 'min-w-10 shrink-0 justify-center px-2'}>{renderActions(operation)}</RowActionsMenu>
    </div>
  );
  const commonColumns: DataTableColumn<PaymentOperationResponse>[] = [
    { key: 'folio', header: 'Folio', cell: folio, width: '64px' },
    { key: 'client', header: 'Cliente', cell: clientCell },
  ];
  const columns: DataTableColumn<PaymentOperationResponse>[] = stalledView
    ? [
        ...commonColumns,
        { key: 'updated', header: 'Último cambio', cell: (operation) => formatDate(operation.updatedAt), width: '120px' },
        { key: 'amount', header: 'Monto', cell: (operation) => <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(operation.montoTotal)}</span>, width: '124px' },
        { key: 'status', header: 'Estatus', cell: (operation) => <OperationStatusBadge status={operation.estatus} />, kind: 'status', width: '218px' },
        { key: 'elapsed', header: 'Sin avanzar', cell: (operation) => <span className="font-medium text-red-600">{formatElapsedSince(operation.updatedAt)}</span>, width: '110px' },
        { key: 'actions', header: 'Acciones', cell: actionsCell, kind: 'actions', align: 'right', width: '148px' },
      ]
    : [
        ...commonColumns,
        { key: 'created', header: 'Creada', cell: (operation) => formatDate(operation.createdAt), width: '112px' },
        { key: 'amount', header: 'Monto', cell: (operation) => <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(operation.montoTotal)}</span>, width: '124px' },
        { key: 'income', header: 'Ingreso validado', cell: (operation) => <ProgressBar total={operation.montoTotal} registered={operation.montoRegistrado} validated={operation.montoValidado} compact />, width: '150px' },
        { key: 'status', header: 'Estatus', cell: (operation) => <OperationStatusBadge status={operation.estatus} />, kind: 'status', width: '218px' },
        { key: 'actions', header: 'Acciones', cell: actionsCell, kind: 'actions', align: 'right', width: '148px' },
      ];

  return (
    <DataTable
      columns={columns}
      dense={stalledView}
      rows={operations}
      getRowKey={(operation) => operation.id}
      isLoading={isLoading}
      mobileCardClassName={isSocioComercial ? 'p-3' : undefined}
      loadingLabel="Cargando operaciones..."
      emptyTitle={emptyTitle ?? (stalledView ? 'No hay operaciones detenidas' : 'No hay operaciones con estos filtros')}
      emptyDescription={emptyDescription ?? (stalledView
        ? 'Las operaciones detenidas aparecerán aquí cuando requieran seguimiento.'
        : 'Prueba con otros filtros o busca un folio o cliente.')}
      mobile={{
        title: (operation) => isSocioComercial ? <div className="min-w-0"><p className="text-xs font-normal text-slate-400">Folio {operation.id} · {formatDate(operation.createdAt)}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900" title={operation.clienteNombre}>{operation.clienteNombre}</p><p className="mt-1 text-sm font-bold tabular-nums text-slate-900">{formatMoney(operation.montoTotal)}</p></div> : <>{folio(operation)} <span className="ml-1">{operation.clienteNombre}</span></>,
        subtitle: isSocioComercial ? undefined : (operation) => `Socio: ${operation.socioComercialNombre}`,
        status: (operation) => <OperationStatusBadge status={operation.estatus} />,
        fields: isSocioComercial ? [] : [
          { key: 'amount', label: 'Monto', value: (operation) => formatMoney(operation.montoTotal) },
          { key: 'returned', label: 'Monto retornado', value: (operation) => formatMoney(operation.montoRetornado) },
          { key: 'created', label: 'Creada', value: (operation) => formatDate(operation.createdAt) },
          { key: 'updated', label: 'Último cambio', value: (operation) => formatDate(operation.updatedAt) },
          ...(stalledView ? [{ key: 'elapsed', label: 'Sin avanzar', value: (operation: PaymentOperationResponse) => formatElapsedSince(operation.updatedAt) }] : []),
        ],
        extra: (operation) => isSocioComercial ? <div><ProgressBar total={operation.montoTotal} registered={operation.montoRegistrado} validated={operation.montoValidado} compact /><p className="mt-1 text-xs text-slate-500">{operation.pagos.length} {operation.pagos.length === 1 ? 'pago' : 'pagos'} registrado{operation.pagos.length === 1 ? '' : 's'}</p></div> : <ProgressBar total={operation.montoTotal} registered={operation.montoRegistrado} validated={operation.montoValidado} />,
        actions: (operation) => <>
          {isSocioComercial ? mobileViewButton(operation) : viewButton(operation)}
          <RowActionsMenu triggerLabel="" ariaLabel="Más opciones" triggerClassName={isSocioComercial ? 'h-8 min-w-8 justify-center px-1' : 'min-w-11 justify-center px-2'}>{renderActions(operation)}</RowActionsMenu>
        </>,
      }}
    />
  );
}
