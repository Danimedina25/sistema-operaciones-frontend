import { useNavigate } from 'react-router-dom';
import { BadgeDollarSign, CheckCircle2, HandCoins, Landmark, TrendingUp } from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { paths } from '@/routes/paths';
import type { ExecutiveDashboardSummary } from '@/modules/direccion/hooks/use-executive-dashboard-summary';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

interface ExecutiveDashboardCardsProps {
  summary: ExecutiveDashboardSummary;
  isLoading: boolean;
  period: PeriodRange;
}

export function ExecutiveDashboardCards({ summary, isLoading, period }: ExecutiveDashboardCardsProps) {
  const navigate = useNavigate();

  return (
    <DashboardSection
      title="Resumen ejecutivo"
      description="Indicadores del periodo seleccionado."
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <MetricCard
        label="Volumen operado"
        value={isLoading ? '' : formatCurrency(summary.volumenOperado ?? 0)}
        isLoading={isLoading}
        icon={TrendingUp}
        variant="emerald"
        helperText="Operaciones validadas del periodo"
        onClick={() => navigate(paths.comisionessocios)}
      />
      <MetricCard
        label="Saldo bancario"
        value={isLoading ? '' : formatCurrency(summary.saldoBancario ?? 0)}
        isLoading={isLoading}
        icon={Landmark}
        variant="blue"
        helperText="Al día de hoy"
        onClick={() => navigate(paths.corte)}
      />
      <MetricCard
        label="Retornos pendientes"
        value={isLoading ? '' : summary.retornosPendientes}
        isLoading={isLoading}
        icon={HandCoins}
        variant="amber"
        onClick={() => navigate(paths.returnsRequested)}
      />
      <MetricCard
        label="Comisiones pagadas"
        value={isLoading ? '' : formatCurrency(summary.comisionesPagadas ?? 0)}
        isLoading={isLoading}
        icon={BadgeDollarSign}
        onClick={() => navigate(paths.comisionessocios)}
      />
      <MetricCard
        label="Operaciones completadas"
        value={isLoading ? '' : summary.operacionesCompletadas}
        isLoading={isLoading}
        icon={CheckCircle2}
        onClick={() =>
          navigate(
            `${paths.operations}?status=COMPLETADA&startDate=${period.startDate}&endDate=${period.endDate}`,
          )
        }
      />
    </DashboardSection>
  );
}
