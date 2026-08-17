import { useEffect, useMemo, useRef } from 'react';
import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { useBeneficiarySummary } from '@/modules/comisionessocioscomerciales/hooks/use-beneficiary-summary';
import { useExecutiveDashboardSummary } from '@/modules/direccion/hooks/use-executive-dashboard-summary';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { ExecutiveDashboardCards } from '@/modules/direccion/components/ExecutiveDashboardCards';
import { PeriodComparativesSection } from '@/modules/direccion/components/PeriodComparativesSection';
import { PartnerVolumeDistribution } from '@/modules/direccion/components/PartnerVolumeDistribution';
import { BankBalanceDistribution } from '@/modules/direccion/components/BankBalanceDistribution';
import { TopOperationsTable } from '@/modules/direccion/components/TopOperationsTable';
import { ExceptionsList } from '@/modules/direccion/components/ExceptionsList';
import { ConcentrationIndicator } from '@/modules/direccion/components/ConcentrationIndicator';

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'CUSTOM', label: 'Rango personalizado' },
];

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };

export function ExecutiveDashboard() {
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

  const { summary, isLoading } = useExecutiveDashboardSummary(period);

  const { summary: beneficiarySummary, isLoading: isLoadingBeneficiaries, fetchSummary: fetchBeneficiarySummary } =
    useBeneficiarySummary();

  const fetchBeneficiarySummaryRef = useRef(fetchBeneficiarySummary);
  useEffect(() => {
    fetchBeneficiarySummaryRef.current = fetchBeneficiarySummary;
  });

  useEffect(() => {
    void fetchBeneficiarySummaryRef.current({ startDate: period.startDate, endDate: period.endDate });
  }, [period.startDate, period.endDate]);

  const socios = beneficiarySummary?.socios ?? [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dashboard ejecutivo</h1>
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
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
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

      <ExecutiveDashboardCards summary={summary} isLoading={isLoading} period={period} />
      <PeriodComparativesSection />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <PartnerVolumeDistribution socios={socios} isLoading={isLoadingBeneficiaries} />
        <BankBalanceDistribution />
      </div>

      <ConcentrationIndicator socios={socios} isLoading={isLoadingBeneficiaries} />
      <TopOperationsTable period={period} />
      <ExceptionsList period={period} />
    </div>
  );
}
