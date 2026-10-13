import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowDown, ArrowUp, Banknote, Landmark } from 'lucide-react';
import { DashboardPeriodFilters } from '@/shared/components/dashboard/DashboardPeriodFilters';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { formatMoney } from '@/shared/format';
import { cashWorkApi } from '@/modules/caja-general/api/cash-work.api';
import { bankWorkApi } from '@/modules/corte/api/bank-work.api';
import { getSummary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { useGerenteDashboardSummary } from '@/modules/gerente/hooks/use-gerente-dashboard-summary';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { CommercialPartnersRanking } from './CommercialPartnersRanking';
import { StalledOperationsTable } from './StalledOperationsTable';
import { paths } from '@/routes/paths';

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };

export function GerenteDashboard() {
  const navigate = useNavigate();
  const { filters, setFilters } = useTableUrlFilters(initialPeriodFilters);
  const period = useMemo(() => computePeriodRange(filters.period, new Date(),
    filters.customStart && filters.customEnd ? { startDate: filters.customStart, endDate: filters.customEnd } : undefined),
  [filters.period, filters.customStart, filters.customEnd]);
  const { summary, isLoading, error } = useGerenteDashboardSummary(period);
  const commissions = useQuery({ queryKey: ['dashboard-commissions', period.startDate, period.endDate],
    queryFn: () => getSummary(period) });
  const cash = useQuery({ queryKey: ['cash-work-summary'], queryFn: cashWorkApi.summary });
  const bank = useQuery({ queryKey: ['bank-work-summary'], queryFn: bankWorkApi.summary });

  return <div className="space-y-6">
    <PageHeader title="Inicio" actions={<DashboardPeriodFilters value={filters} onChange={setFilters} />} />
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900">Requiere atención</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Comisiones pendientes" value={formatMoney(commissions.data?.totalPendientes)}
          isLoading={commissions.isPending} icon={Banknote} variant="amber" onClick={() => navigate(paths.comisionessocios)} />
        <MetricCard label="Operaciones detenidas" value={summary.operacionesDetenidas ?? '—'}
          isLoading={isLoading} icon={AlertTriangle} variant="rose" onClick={() => navigate(paths.operations + '?view=stalled')} />
      </div>
    </section>
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900">Supervisión del equipo</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Caja General</h3><Banknote className="h-4 w-4 text-emerald-600" /></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">Entradas</span><strong className="mt-1 flex items-center gap-1 text-lg"><ArrowDown className="h-4 w-4 text-emerald-600" />{cash.data?.income.count ?? '—'}</strong></div><div><span className="text-slate-500">Salidas</span><strong className="mt-1 flex items-center gap-1 text-lg"><ArrowUp className="h-4 w-4 text-red-600" />{cash.data?.outflow.count ?? '—'}</strong></div></div>
          <Link className="mt-4 inline-block text-sm font-medium text-blue-600" to={paths.teamPending}>Ver pendientes de Caja →</Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Cuentas bancarias</h3><Landmark className="h-4 w-4 text-blue-600" /></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">Entradas</span><strong className="mt-1 flex items-center gap-1 text-lg"><ArrowDown className="h-4 w-4 text-emerald-600" />{bank.data?.income.count ?? '—'}</strong></div><div><span className="text-slate-500">Salidas</span><strong className="mt-1 flex items-center gap-1 text-lg"><ArrowUp className="h-4 w-4 text-red-600" />{bank.data?.outflow.count ?? '—'}</strong></div></div>
          <Link className="mt-4 inline-block text-sm font-medium text-blue-600" to={paths.bankAccounts}>Ver cuentas bancarias →</Link>
        </div>
      </div>
      {(cash.error || bank.error) && <p role="alert" className="text-sm text-red-700">No se pudo consultar una de las áreas.</p>}
    </section>
    <section className="space-y-3"><h2 className="text-base font-semibold text-slate-900">Indicadores del periodo</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Operaciones creadas" value={summary.operacionesCreadas ?? '—'} isLoading={isLoading} />
        <MetricCard label="Monto comisionado" value={formatMoney(summary.montoOperado)} isLoading={isLoading} />
        <MetricCard label="Ingreso parcial" value={summary.operacionesIngresoParcial ?? '—'} isLoading={isLoading} variant="amber" />
        <MetricCard label="Completadas" value={summary.operacionesCompletadas ?? '—'} isLoading={isLoading} variant="emerald" />
      </div>
      {Boolean(error) && <p role="alert" className="text-sm text-red-700">No se pudieron cargar los indicadores.</p>}
    </section>
    <StalledOperationsTable />
    <CommercialPartnersRanking period={period} />
  </div>;
}
