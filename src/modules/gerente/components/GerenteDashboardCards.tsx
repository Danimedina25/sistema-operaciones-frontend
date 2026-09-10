import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ClipboardCheck, ClipboardList, TrendingUp, Wallet } from 'lucide-react';
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
        label="Monto de operaciones comisionadas"
        value={isLoading ? '' : formatCurrency(summary.montoOperado ?? 0)}
        isLoading={isLoading}
        icon={TrendingUp}
        variant="emerald"
        helperText="Según operaciones incluidas en comisiones"
        onClick={() => navigate(paths.comisionessocios)}
      />
      <MetricCard
        label="Creadas en el periodo y actualmente completadas"
        value={isLoading ? '' : summary.operacionesCompletadas}
        isLoading={isLoading}
        icon={ClipboardCheck}
        onClick={() => navigate(`${paths.operations}?status=COMPLETADA&startDate=${period.startDate}&endDate=${period.endDate}`)}
      />
      <MetricCard
        label="Operaciones con ingreso parcial"
        value={isLoading ? '' : summary.operacionesIngresoParcial}
        isLoading={isLoading}
        icon={Wallet}
        variant="amber"
        onClick={() => navigate(`${paths.operations}?status=INGRESO_PARCIAL&startDate=${period.startDate}&endDate=${period.endDate}`)}
      />
      <MetricCard
        label="Operaciones detenidas"
        value={isLoading ? '' : summary.operacionesDetenidas}
        isLoading={isLoading}
        icon={AlertOctagon}
        variant="rose"
        helperText="Más de 48 h sin actualizarse · al día de hoy"
        onClick={() => document.getElementById('stalled-operations')?.scrollIntoView({ behavior: 'smooth' })}
      />
    </DashboardSection>
  );
}
