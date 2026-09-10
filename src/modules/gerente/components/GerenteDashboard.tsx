import { useMemo } from 'react';
import { DashboardPeriodFilters } from '@/shared/components/dashboard/DashboardPeriodFilters';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { useGerenteDashboardSummary } from '@/modules/gerente/hooks/use-gerente-dashboard-summary';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { GerenteDashboardCards } from '@/modules/gerente/components/GerenteDashboardCards';
import { WeeklyCommissionsSummary } from '@/modules/gerente/components/WeeklyCommissionsSummary';
import { CommercialPartnersRanking } from '@/modules/gerente/components/CommercialPartnersRanking';
import { StalledOperationsTable } from '@/modules/gerente/components/StalledOperationsTable';
import { OperationalHealth } from '@/modules/gerente/components/OperationalHealth';
import { formatPeriodDate } from '@/modules/operations/utils/operation-formatters';

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };

export function GerenteDashboard() {
  const { filters, setFilters } = useTableUrlFilters(initialPeriodFilters);

  const period = useMemo(
    () =>
      computePeriodRange(
        filters.period,
        new Date(),
        filters.customStart && filters.customEnd
          ? { startDate: filters.customStart, endDate: filters.customEnd }
          : undefined,
      ),
    [filters.period, filters.customStart, filters.customEnd],
  );

  const { summary, isLoading } = useGerenteDashboardSummary(period);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dashboard gerencial</h1>
            <p className="text-xs text-slate-500">
              Periodo: {formatPeriodDate(period.startDate)} al {formatPeriodDate(period.endDate)}
            </p>
          </div>

          <DashboardPeriodFilters value={filters} onChange={setFilters} />
        </div>
      </div>

      <GerenteDashboardCards summary={summary} isLoading={isLoading} period={period} />
      <OperationalHealth period={period} summary={summary} isLoading={isLoading} />
      <WeeklyCommissionsSummary period={period} />
      <CommercialPartnersRanking period={period} />
      <StalledOperationsTable />
    </div>
  );
}
