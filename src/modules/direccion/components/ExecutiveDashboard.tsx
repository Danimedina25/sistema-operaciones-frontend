import { useEffect, useMemo, useRef } from 'react';
import { DashboardPeriodFilters } from '@/shared/components/dashboard/DashboardPeriodFilters';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
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
import { RegisteredProfitability } from '@/modules/direccion/components/RegisteredProfitability';

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };

export function ExecutiveDashboard() {
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
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dashboard ejecutivo</h1>
            <p className="text-xs text-slate-500">
              Periodo: {period.startDate} a {period.endDate}
            </p>
          </div>

          <DashboardPeriodFilters value={filters} onChange={setFilters} executive />
        </div>
      </div>

      <ExecutiveDashboardCards summary={summary} isLoading={isLoading} period={period} />
      <RegisteredProfitability summary={summary} isLoading={isLoading} />
      <PeriodComparativesSection period={period} />

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
