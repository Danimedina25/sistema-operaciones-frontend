import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { useState } from 'react';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';
import { Pagination } from '@/shared/components/ui/Pagination';
import { QueryState } from '@/shared/components/ui/QueryState';
import { TodayDeliveriesTable } from '../components/returns/TodayDeliveriesTable';
import { MarkCashReturnDeliveredModal } from '../components/returns/MarkCashReturnDeliveredModal';
import { useDeliverReturnInstallment } from '../hooks/returns/use-deliver-return-installment';
import { usePendingDeliveries } from '../hooks/use-pending-deliveries';
import { installmentToCashDeliveryTarget } from '../utils/return-installment';
import type { ReturnInstallment } from '../types/operations.types.ts';

const defaults = { queue: '', tipoPago: '' };
export default function PendingDeliveriesPage() {
  const { filters, setFilters } = useTableUrlFilters(defaults);
  const [pagination, setPagination] = useState({ filters, page: 0 });
  const page = pagination.filters === filters ? pagination.page : 0;
  const query = usePendingDeliveries(filters.queue, page, filters.tipoPago);
  const [selected, setSelected] = useState<ReturnInstallment | null>(null);
  const { isSubmitting, submitDeliverReturnInstallment } = useDeliverReturnInstallment({ onSuccess: async () => { setSelected(null); await query.refetch(); } });
  return <div className="space-y-3">
    <header className="rounded-2xl bg-white p-4 shadow-sm">
      <h1 className="text-lg font-semibold">{filters.queue === 'CONFIRMATION' ? 'Entregas pendientes de tu confirmación' : 'Entregas pendientes de hoy'}</h1>
      <p className="text-sm text-slate-500">{filters.queue === 'CONFIRMATION' ? 'Confirmadas por el socio y sin cierre de cajas. Incluye días anteriores.' : 'Recolecciones de hoy, hora de Cancún, sin confirmación del socio ni cierre de cajas.'}</p>
    </header>
    <TableFilterSection title="Filtros de entregas">
      <QuickFilters options={[{ value: 'TODAY', label: 'Pendientes de hoy' }, { value: 'CONFIRMATION', label: 'Pendientes de tu confirmación' }]}
        value={filters.queue} onChange={(queue) => setFilters({ ...filters, queue })} />
      <QuickFilters options={[{ value: '', label: 'Todos los métodos' }, { value: 'EFECTIVO', label: 'Efectivo' }, { value: 'RETIRO_SIN_TARJETA', label: 'Retiro sin tarjeta' }]}
        value={filters.tipoPago} onChange={(tipoPago) => setFilters({ ...filters, tipoPago })} />
    </TableFilterSection>
    <QueryState isLoading={query.isFetching} error={query.error} isEmpty={!query.data?.content.length} onRetry={() => void query.refetch()} emptyTitle="Sin entregas pendientes">
      <TodayDeliveriesTable deliveries={query.data?.content ?? []} onMarkAsDelivered={setSelected} />
    </QueryState>
    <Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={(value) => setPagination({ filters, page: value - 1 })} />
    <MarkCashReturnDeliveredModal target={selected ? installmentToCashDeliveryTarget(selected) : null} isSubmitting={isSubmitting}
      onConfirm={(id, operationId, proof, person) => void submitDeliverReturnInstallment(id, operationId, proof, person)} onClose={() => setSelected(null)} />
  </div>;
}
