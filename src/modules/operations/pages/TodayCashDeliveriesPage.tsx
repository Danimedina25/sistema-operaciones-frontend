import { useMemo, useState } from 'react';
import { Clock, HandCoins, ListChecks, PackageCheck, Wallet } from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';
import { QueryState } from '@/shared/components/ui/QueryState';
import { CollapsibleFilterSection } from '@/shared/components/ui/CollapsibleFilterSection';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { useTodayCashDeliveries } from '@/modules/operations/hooks/returns/use-today-cash-deliveries';
import { useDeliverReturnInstallment } from '@/modules/operations/hooks/returns/use-deliver-return-installment';
import { TodayDeliveriesTable } from '@/modules/operations/components/returns/TodayDeliveriesTable';
import { MarkCashReturnDeliveredModal } from '@/modules/operations/components/returns/MarkCashReturnDeliveredModal';
import { installmentToCashDeliveryTarget } from '@/modules/operations/utils/return-installment';
import {
  computeDailyDeliverySummary,
  installmentToDeliveryLike,
} from '@/modules/operations/utils/daily-delivery-summary';
import { formatCurrency, formatDateTime } from '@/modules/operations/utils/operation-formatters';
import type { ReturnInstallment } from '@/modules/operations/types/operations.types.ts';

const QUICK_TIPO_RETORNO_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'RETIRO_SIN_TARJETA', label: 'Retiro sin tarjeta' },
] as const;

const initialFilters = { tipoPago: '' };

export default function TodayCashDeliveriesPage() {
  const { filters, setFilters } = useUrlFilters(initialFilters);
  const [selectedDelivery, setSelectedDelivery] = useState<ReturnInstallment | null>(null);

  const { data, isLoading, error, refetch } = useTodayCashDeliveries({
    tipoPago: filters.tipoPago || undefined,
  });

  const { isSubmitting, submitDeliverReturnInstallment } = useDeliverReturnInstallment({
    onSuccess: async () => {
      setSelectedDelivery(null);
      await refetch();
    },
  });

  const deliveries = useMemo(() => data?.content ?? [], [data]);

  const summary = useMemo(
    () => computeDailyDeliverySummary(deliveries.map(installmentToDeliveryLike)),
    [deliveries],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Entregas de hoy</h1>
        <p className="text-xs text-slate-500">
          Recolecciones de efectivo y retiro sin tarjeta programadas para hoy.
        </p>
      </div>

      <DashboardSection
        title="Resumen del día"
        contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <MetricCard
          label="Total entregado hoy"
          value={isLoading ? '' : formatCurrency(summary.totalDelivered)}
          isLoading={isLoading}
          icon={Wallet}
          variant="emerald"
        />
        <MetricCard
          label="Total pendiente hoy"
          value={isLoading ? '' : formatCurrency(summary.totalPending)}
          isLoading={isLoading}
          icon={HandCoins}
          variant="amber"
        />
        <MetricCard
          label="Número de entregas"
          value={isLoading ? '' : summary.deliveriesCount}
          isLoading={isLoading}
          icon={ListChecks}
        />
        <MetricCard
          label="Próxima recolección"
          value={isLoading ? '' : summary.nextPickup ? formatDateTime(summary.nextPickup) : 'Sin pendientes'}
          isLoading={isLoading}
          icon={Clock}
          variant="blue"
        />
        <MetricCard
          label="Pendientes de tu confirmación"
          value={isLoading ? '' : summary.pendingConfirmationCount}
          isLoading={isLoading}
          icon={PackageCheck}
          variant={!isLoading && summary.pendingConfirmationCount > 0 ? 'amber' : 'default'}
        />
      </DashboardSection>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4">
          <CollapsibleFilterSection title="Filtro por tipo de retorno">
          <QuickFilters
            options={QUICK_TIPO_RETORNO_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={filters.tipoPago}
            onChange={(tipoPago) => setFilters({ tipoPago })}
          />
          </CollapsibleFilterSection>
        </div>

        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={deliveries.length === 0}
          onRetry={() => void refetch()}
          loadingLabel="Cargando entregas de hoy..."
          emptyTitle="Sin entregas programadas para hoy"
          emptyDescription="Las recolecciones de efectivo y retiro sin tarjeta de hoy aparecerán aquí."
          errorTitle="No se pudieron cargar las entregas de hoy."
        >
          <TodayDeliveriesTable deliveries={deliveries} onMarkAsDelivered={setSelectedDelivery} />
        </QueryState>
      </section>

      <MarkCashReturnDeliveredModal
        target={
          selectedDelivery ? installmentToCashDeliveryTarget(selectedDelivery) : null
        }
        isSubmitting={isSubmitting}
        onConfirm={(installmentId, operationId, comprobante, personaQueRecibioEfectivo) =>
          void submitDeliverReturnInstallment(
            installmentId,
            operationId,
            comprobante,
            personaQueRecibioEfectivo,
          )
        }
        onClose={() => setSelectedDelivery(null)}
      />
    </div>
  );
}
