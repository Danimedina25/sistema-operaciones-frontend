import { useMemo } from 'react';
import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { useGerenteDashboardSummary } from '@/modules/gerente/hooks/use-gerente-dashboard-summary';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { GerenteDashboardCards } from '@/modules/gerente/components/GerenteDashboardCards';
import { WeeklyCommissionsSummary } from '@/modules/gerente/components/WeeklyCommissionsSummary';
import { CommercialPartnersRanking } from '@/modules/gerente/components/CommercialPartnersRanking';
import { StalledOperationsTable } from '@/modules/gerente/components/StalledOperationsTable';

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'CUSTOM', label: 'Rango personalizado' },
];

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };

export function GerenteDashboard() {
  const { filters, setFilters } = useUrlFilters(initialPeriodFilters);

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
              Periodo: {period.startDate} a {period.endDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilters({ ...filters, period: option.value })}
                className={`min-h-[40px] rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  filters.period === option.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filters.period === 'CUSTOM' && (
          <DateRangeCalendarField
            startDate={filters.customStart}
            endDate={filters.customEnd}
            onChange={({ startDate, endDate }) =>
              setFilters({ ...filters, customStart: startDate, customEnd: endDate })
            }
          />
        )}
      </div>

      <GerenteDashboardCards summary={summary} isLoading={isLoading} period={period} />
      <WeeklyCommissionsSummary period={period} />
      <CommercialPartnersRanking period={period} />
      <StalledOperationsTable />
    </div>
  );
}
