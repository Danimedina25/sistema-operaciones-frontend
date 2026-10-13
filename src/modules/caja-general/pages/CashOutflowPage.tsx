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
import { formatDate, formatMoney, formatPercent } from '@/shared/format';
import { buildOperationDetailPath } from '@/routes/paths';
import { cashWorkApi } from '../api/cash-work.api';
import type { ReturnPaymentResponse, ReturnInstallment } from '@/modules/operations/types/operations.types.ts';
import { useTodayCashDeliveries } from '@/modules/operations/hooks/returns/use-today-cash-deliveries';
import { TodayDeliveriesTable } from '@/modules/operations/components/returns/TodayDeliveriesTable';
import { MarkCashReturnDeliveredModal } from '@/modules/operations/components/returns/MarkCashReturnDeliveredModal';
import { useDeliverReturnInstallment } from '@/modules/operations/hooks/returns/use-deliver-return-installment';
import { installmentToCashDeliveryTarget } from '@/modules/operations/utils/return-installment';
import { useAuth } from '@/modules/auth/store/auth.context';
import { ArrowUp, Truck, Undo2 } from 'lucide-react';

function status(request: ReturnPaymentResponse) {
  if (request.estatus === 'EN_RECOLECCION') return <StatusBadge tone="pending">Programada</StatusBadge>;
  if (request.estatus === 'ENTREGADO') return <StatusBadge tone="active">Entregada</StatusBadge>;
  if (request.estatus === 'PARCIALMENTE_RETORNADO') return <StatusBadge tone="info">Parcial entregado</StatusBadge>;
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
  const action = (request: ReturnPaymentResponse) => <div className="flex items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(request.operationId)} aria-label={`Ver operación #${request.operationId}`}><Button variant="neutral" className="h-9 px-3 text-xs">Ver</Button></Link>
    {canManage && <button type="button" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800" onClick={() => navigate(`${buildOperationDetailPath(request.operationId)}?action=manage-return&returnRequestId=${request.id}`)}>
      {request.montoDisponible && request.montoDisponible > 0 ? <><Truck className="h-4 w-4" />Programar recolección</> : 'Ver retorno'}
    </button>}
  </div>;
  const columns: DataTableColumn<ReturnPaymentResponse>[] = [
    { key: 'folio', header: 'Folio', width: '7%', cell: row => row.operationId },
    { key: 'client', header: 'Cliente', width: '15%', cell: row => <span className="block min-w-0 truncate" title={`${row.clienteNombre ?? ''} · ${row.socioComercialNombre ?? ''}`}><strong className="block truncate text-slate-900">{row.clienteNombre}</strong><small className="block truncate text-slate-500">Socio: {row.socioComercialNombre}</small></span> },
    { key: 'date', header: 'Creada', width: '11%', cell: row => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span> },
    { key: 'amount', header: 'Por retornar', width: '14%', align: 'right', cell: row => <span className="block text-right"><strong className="whitespace-nowrap tabular-nums text-slate-900">{formatMoney(row.montoPendiente)}</strong><small className="block whitespace-nowrap text-slate-400">de {formatMoney(row.montoSolicitado)} neto</small></span> },
    { key: 'progress', header: 'Avance', width: '15%', cell: row => <span className="block"><span className="block truncate text-xs text-slate-700" title={`${formatMoney(row.montoRetornado)} retornado`}>{formatMoney(row.montoRetornado)} retornado</span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, row.porcentajeAvance ?? 0))}%` }} /></span><small className="mt-1 block text-slate-400">{formatPercent(row.porcentajeAvance)} entregado</small></span> },
    { key: 'status', header: 'Estatus', kind: 'status', width: '13%', cell: row => <span className="whitespace-nowrap">{status(row)}</span> },
    { key: 'actions', header: '', kind: 'actions', width: '25%', cell: action },
  ];
  return <div className="mx-4 space-y-6 pt-2">
    <PageHeader title="Salidas de efectivo" />
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-3 shadow-sm"><span className="flex items-center gap-2 text-sm font-semibold text-slate-950"><ArrowUp className="h-4 w-4 text-red-600" />Retornos de operaciones <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{query.data?.totalElements ?? '—'}</span></span><span className="text-sm text-slate-500">Pendiente <strong className="ml-2 text-lg tabular-nums text-slate-950">{formatMoney(query.data?.totalAmount)}</strong></span></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SearchFilterBar search={search} onSearchChange={value => { setSearch(value); setPage(0); }} searchPlaceholder="Buscar folio, cliente o socio"
        activeFilters={method ? [{ key: 'method', label: method === 'EFECTIVO' ? 'Efectivo' : 'Retiro sin tarjeta', onRemove: () => { setMethod(''); setPage(0); } }] : []}
        filters={<label className="block max-w-xs text-sm font-medium text-slate-700">Método
          <select aria-label="Método de salida" value={method} onChange={event => { setMethod(event.target.value); setPage(0); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="RETIRO_SIN_TARJETA">Retiro sin tarjeta</option>
          </select></label>} />
      <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando solicitudes…">
        <DataTable columns={columns} rows={query.data?.content ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `Folio #${row.operationId}`, subtitle: row => `${row.clienteNombre ?? ''} · ${row.socioComercialNombre ?? ''}`, status,
            fields: [{ key: 'method', label: 'Método', value: row => row.tipoPago === 'RETIRO_SIN_TARJETA' ? 'Retiro sin tarjeta' : 'Efectivo' },
              { key: 'amount', label: 'Por entregar', value: row => formatMoney(row.montoPendiente ?? 0) },
              { key: 'date', label: 'Solicitado', value: row => formatDate(row.fechaSolicitud) }], actions: action }}
          emptyTitle="No hay retornos de operaciones por pagar" emptyDescription="Cuando un socio comercial indique cómo desea su retorno, la solicitud aparecerá aquí." emptyIcon={Undo2} showHeaderWhenEmpty />
      </QueryState>
      {(query.data?.totalPages ?? 0) > 1 && <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>}
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
  if (deliveries.isSuccess && (deliveries.data?.content.length ?? 0) === 0) return null;
  return <section className="space-y-3">
    <h2 className="text-sm font-semibold text-slate-900">Entregas programadas para hoy</h2>
    <QueryState isLoading={deliveries.isPending} error={deliveries.error} onRetry={() => void deliveries.refetch()} emptyTitle="Sin entregas programadas">
      <TodayDeliveriesTable deliveries={deliveries.data?.content ?? []} onMarkAsDelivered={setSelectedDelivery} />
    </QueryState>
    <MarkCashReturnDeliveredModal target={selectedDelivery ? installmentToCashDeliveryTarget(selectedDelivery) : null} isSubmitting={isSubmitting}
      onConfirm={(id, operationId, proof, person, denominaciones) => void submitDeliverReturnInstallment(id, operationId, proof, person, denominaciones)} onClose={() => setSelectedDelivery(null)} />
  </section>;
}
