import { BadgeDollarSign, CircleDollarSign, Clock } from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { paths } from '@/routes/paths';
import { useNavigate } from 'react-router-dom';
import type { ExecutiveDashboardSummary } from '../hooks/use-executive-dashboard-summary';

const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value);
export function RegisteredProfitability({ summary, isLoading }: { summary: ExecutiveDashboardSummary; isLoading: boolean }) {
  const navigate = useNavigate();
  return <DashboardSection title="Comisiones registradas" description="Importes de socios comerciales. El sistema no registra todos los costos necesarios para calcular margen neto ni margen de oficina.">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <MetricCard className="h-32" label="Comisiones generadas" value={isLoading ? '' : money(summary.comisionesGeneradas ?? 0)} isLoading={isLoading} icon={CircleDollarSign} onClick={() => navigate(paths.comisionessocios)} />
      <MetricCard className="h-32" label="Comisiones pagadas" value={isLoading ? '' : money(summary.comisionesPagadas ?? 0)} isLoading={isLoading} icon={BadgeDollarSign} variant="emerald" onClick={() => navigate(paths.comisionessocios)} />
      <MetricCard className="h-32" label="Comisiones pendientes" value={isLoading ? '' : money(summary.comisionesPendientes ?? 0)} isLoading={isLoading} icon={Clock} variant="amber" onClick={() => navigate(paths.comisionessocios)} />
    </div>
  </DashboardSection>;
}
