import { useNavigate } from 'react-router-dom';
import { BadgeDollarSign, ClipboardList, HandCoins, TrendingUp, Wallet } from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { paths } from '@/routes/paths';
import type { GerenteDashboardSummary } from '@/modules/gerente/hooks/use-gerente-dashboard-summary';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

interface GerenteDashboardCardsProps {
  summary: GerenteDashboardSummary;
  isLoading: boolean;
  period: PeriodRange;
}

export function GerenteDashboardCards({ summary, isLoading, period }: GerenteDashboardCardsProps) {
  const navigate = useNavigate();

  return (
    <DashboardSection
      title="Resumen gerencial"
      description="Indicadores del periodo seleccionado. Los accesos abren el listado correspondiente."
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <MetricCard
        label="Operaciones creadas"
        value={isLoading ? '' : summary.operacionesCreadas}
        isLoading={isLoading}
        icon={ClipboardList}
        onClick={() =>
          navigate(`${paths.operations}?startDate=${period.startDate}&endDate=${period.endDate}`)
        }
      />
      <MetricCard
        label="Monto total operado"
        value={isLoading ? '' : formatCurrency(summary.montoOperado ?? 0)}
        isLoading={isLoading}
        icon={TrendingUp}
        variant="emerald"
        helperText="Operaciones validadas del periodo"
        onClick={() => navigate(paths.comisionessocios)}
      />
      <MetricCard
        label="Pagos pendientes"
        value={isLoading ? '' : summary.pagosPendientes}
        isLoading={isLoading}
        icon={Wallet}
        variant="amber"
        onClick={() => navigate(`${paths.operations}?status=PENDIENTE_VALIDACION`)}
      />
      <MetricCard
        label="Retornos pendientes"
        value={isLoading ? '' : summary.retornosPendientes}
        isLoading={isLoading}
        icon={HandCoins}
        variant="blue"
        onClick={() => navigate(paths.returnsRequested)}
      />
      <MetricCard
        label="Comisiones pendientes"
        value={isLoading ? '' : formatCurrency(summary.comisionesPendientes ?? 0)}
        isLoading={isLoading}
        icon={BadgeDollarSign}
        onClick={() => navigate(paths.comisionessocios)}
      />
    </DashboardSection>
  );
}
