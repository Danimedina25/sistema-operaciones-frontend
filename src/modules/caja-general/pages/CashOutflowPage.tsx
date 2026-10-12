import { useDeferredValue, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { QueryState } from '@/shared/components/ui/QueryState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatDate, formatMoney } from '@/shared/format';
import { buildOperationDetailPath } from '@/routes/paths';
import { cashWorkApi } from '../api/cash-work.api';
import type { ReturnPaymentResponse, ReturnInstallment } from '@/modules/operations/types/operations.types.ts';
import { useTodayCashDeliveries } from '@/modules/operations/hooks/returns/use-today-cash-deliveries';
import { TodayDeliveriesTable } from '@/modules/operations/components/returns/TodayDeliveriesTable';
import { MarkCashReturnDeliveredModal } from '@/modules/operations/components/returns/MarkCashReturnDeliveredModal';
import { useDeliverReturnInstallment } from '@/modules/operations/hooks/returns/use-deliver-return-installment';
import { installmentToCashDeliveryTarget } from '@/modules/operations/utils/return-installment';
import { useAuth } from '@/modules/auth/store/auth.context';

function status(request: ReturnPaymentResponse) {
  if (request.estatus === 'EN_RECOLECCION') return <StatusBadge tone="pending">Programada</StatusBadge>;
  if (request.estatus === 'ENTREGADO') return <StatusBadge tone="active">Entregada</StatusBadge>;
  if (request.estatus === 'PARCIALMENTE_RETORNADO') return <StatusBadge tone="request">Parcial</StatusBadge>;
  return <StatusBadge tone="request">Por programar</StatusBadge>;
}

export default function CashOutflowPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole(['JEFA_CAJAS', 'ADMIN']);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['cash-work', 'outflow', page, deferredSearch, method], queryFn: () => cashWorkApi.outflow(page, deferredSearch, method) });
  const action = (request: ReturnPaymentResponse) => <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(request.operationId)} aria-label={`Ver operación #${request.operationId}`}><Button variant="neutral">Ver</Button></Link>
    {canManage && <Button variant="primary" onClick={() => navigate(`${buildOperationDetailPath(request.operationId)}?action=manage-return&returnRequestId=${request.id}`)}>
      {request.montoDisponible && request.montoDisponible > 0 ? 'Programar' : 'Ver retorno'}
    </Button>}
  </div>;
  const columns: DataTableColumn<ReturnPaymentResponse>[] = [
    { key: 'folio', header: 'Folio', width: '9%', cell: row => `#${row.operationId}` },
    { key: 'client', header: 'Cliente', width: '19%', cell: row => <span className="block min-w-0 truncate" title={`${row.clienteNombre ?? ''} · ${row.socioComercialNombre ?? ''}`}><strong className="block truncate text-slate-900">{row.clienteNombre}</strong><small className="block truncate text-slate-500">{row.socioComercialNombre}</small></span> },
    { key: 'date', header: 'Solicitado', width: '12%', cell: row => formatDate(row.fechaSolicitud) },
    { key: 'method', header: 'Método', width: '12%', cell: row => row.tipoPago === 'RETIRO_SIN_TARJETA' ? 'Retiro sin tarjeta' : 'Efectivo' },
    { key: 'amount', header: 'Por entregar', width: '12%', cell: row => <strong className="whitespace-nowrap tabular-nums text-slate-900">{formatMoney(row.montoPendiente ?? 0)}</strong> },
    { key: 'status', header: 'Estatus', kind: 'status', width: '12%', cell: status },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '24%', cell: action },
  ];
  return <div className="space-y-5">
    <PageHeader title="Salidas de efectivo" />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Retornos de operaciones</h2><p className="text-xs text-slate-500">Una fila por solicitud de efectivo o retiro sin tarjeta.</p></div>
      <SearchFilterBar search={search} onSearchChange={value => { setSearch(value); setPage(0); }} searchPlaceholder="Buscar folio, cliente o socio"
        activeFilters={method ? [{ key: 'method', label: method === 'EFECTIVO' ? 'Efectivo' : 'Retiro sin tarjeta', onRemove: () => { setMethod(''); setPage(0); } }] : []}
        filters={<label className="block max-w-xs text-sm font-medium text-slate-700">Método
          <select aria-label="Método de salida" value={method} onChange={event => { setMethod(event.target.value); setPage(0); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="RETIRO_SIN_TARJETA">Retiro sin tarjeta</option>
          </select></label>} />
      <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando solicitudes…">
        <DataTable columns={columns} rows={query.data?.content ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `Operación #${row.operationId}`, subtitle: row => `${row.clienteNombre ?? ''} · ${row.socioComercialNombre ?? ''}`, status,
            fields: [{ key: 'method', label: 'Método', value: row => row.tipoPago === 'RETIRO_SIN_TARJETA' ? 'Retiro sin tarjeta' : 'Efectivo' },
              { key: 'amount', label: 'Por entregar', value: row => formatMoney(row.montoPendiente ?? 0) },
              { key: 'date', label: 'Solicitado', value: row => formatDate(row.fechaSolicitud) }], actions: action }}
          emptyTitle="Sin solicitudes por entregar" emptyDescription="Las solicitudes de efectivo y retiro sin tarjeta aparecerán aquí." />
      </QueryState>
      <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>
    </section>
    {hasRole(['JEFA_CAJAS']) && <ScheduledDeliveriesSection onChanged={() => void query.refetch()} />}
  </div>;
}

function ScheduledDeliveriesSection({ onChanged }: { onChanged: () => void }) {
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<ReturnInstallment | null>(null);
  const deliveries = useTodayCashDeliveries({});
  const { isSubmitting, submitDeliverReturnInstallment } = useDeliverReturnInstallment({ onSuccess: async () => {
    setSelectedDelivery(null); await deliveries.refetch(); await queryClient.invalidateQueries({ queryKey: ['cash-work'] }); onChanged();
  } });
  return <section className="space-y-3">
    <h2 className="text-sm font-semibold text-slate-900">Entregas programadas para hoy</h2>
    <QueryState isLoading={deliveries.isPending} error={deliveries.error} onRetry={() => void deliveries.refetch()} emptyTitle="Sin entregas programadas">
      <TodayDeliveriesTable deliveries={deliveries.data?.content ?? []} onMarkAsDelivered={setSelectedDelivery} />
    </QueryState>
    <MarkCashReturnDeliveredModal target={selectedDelivery ? installmentToCashDeliveryTarget(selectedDelivery) : null} isSubmitting={isSubmitting}
      onConfirm={(id, operationId, proof, person, denominaciones) => void submitDeliverReturnInstallment(id, operationId, proof, person, denominaciones)} onClose={() => setSelectedDelivery(null)} />
  </section>;
}
