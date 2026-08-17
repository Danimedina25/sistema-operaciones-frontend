import { useEffect, useRef } from 'react';
import { BadgeDollarSign, CheckCircle2, Clock, Users } from 'lucide-react';
import { useCommissionSummary } from '@/modules/comisionessocioscomerciales/hooks/use-commission-summary';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

interface WeeklyCommissionsSummaryProps {
  period: PeriodRange;
}

export function WeeklyCommissionsSummary({ period }: WeeklyCommissionsSummaryProps) {
  const { summary, isLoading, fetchSummary } = useCommissionSummary();

  const fetchSummaryRef = useRef(fetchSummary);
  useEffect(() => {
    fetchSummaryRef.current = fetchSummary;
  });

  useEffect(() => {
    void fetchSummaryRef.current({ startDate: period.startDate, endDate: period.endDate });
  }, [period.startDate, period.endDate]);

  return (
    <DashboardSection
      title="Resumen de comisiones"
      description="Generadas, pendientes y pagadas del periodo seleccionado."
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <MetricCard
        label="Comisiones generadas"
        value={isLoading ? '' : formatCurrency(summary?.totalComisiones ?? 0)}
        isLoading={isLoading}
        icon={BadgeDollarSign}
      />
      <MetricCard
        label="Comisiones pendientes"
        value={isLoading ? '' : formatCurrency(summary?.totalPendientes ?? 0)}
        isLoading={isLoading}
        icon={Clock}
        variant="amber"
      />
      <MetricCard
        label="Comisiones pagadas"
        value={isLoading ? '' : formatCurrency(summary?.totalPagadas ?? 0)}
        isLoading={isLoading}
        icon={CheckCircle2}
        variant="emerald"
      />
      <MetricCard
        label="Beneficiarios"
        value={isLoading ? '' : (summary?.totalBeneficiarios ?? 0)}
        isLoading={isLoading}
        icon={Users}
      />
    </DashboardSection>
  );
}
