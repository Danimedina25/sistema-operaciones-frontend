import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, CheckCircle2, Landmark, TrendingUp } from 'lucide-react';
import { DashboardPeriodFilters } from '@/shared/components/dashboard/DashboardPeriodFilters';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { formatMoney } from '@/shared/format';
import { officeToday } from '@/shared/utils/period';
import { useExecutiveDashboardSummary } from '@/modules/direccion/hooks/use-executive-dashboard-summary';
import { getGeneralCut } from '@/modules/corte/api/general-cut.api';
import { getSummaryByBeneficiary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { useStalledOperations } from '@/modules/gerente/hooks/use-stalled-operations';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { paths, buildOperationDetailPath } from '@/routes/paths';

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };

export function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { filters, setFilters } = useTableUrlFilters(initialPeriodFilters);
  const period = useMemo(() => computePeriodRange(filters.period, new Date(),
    filters.customStart && filters.customEnd ? { startDate: filters.customStart, endDate: filters.customEnd } : undefined),
  [filters.period, filters.customStart, filters.customEnd]);
  const { summary, isLoading, error } = useExecutiveDashboardSummary(period);
  const today = officeToday();
  const cut = useQuery({ queryKey: ['general-cut', today, today, 0], queryFn: () => getGeneralCut(today, today, 0) });
  const partners = useQuery({ queryKey: ['executive-partners', period.startDate, period.endDate],
    queryFn: () => getSummaryByBeneficiary(period) });
  const stalled = useStalledOperations();

  return <div className="space-y-6">
    <PageHeader title="Inicio" actions={<DashboardPeriodFilters value={filters} onChange={setFilters} executive />} />
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900">Requiere atención</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Operaciones detenidas" value={stalled.data?.totalElements ?? '—'} isLoading={stalled.isPending}
          icon={AlertTriangle} variant="rose" onClick={() => navigate(paths.operations)} />
        <MetricCard label="Retornos pendientes" value={summary.retornosPendientes ?? '—'} isLoading={isLoading}
          icon={Banknote} variant="amber" onClick={() => navigate(paths.operations)} />
        <MetricCard label="Comisiones pendientes" value={formatMoney(summary.comisionesPendientes)} isLoading={isLoading}
          icon={Banknote} variant="amber" onClick={() => navigate(paths.comisionessocios)} />
      </div>
    </section>
    <section className="space-y-3"><h2 className="text-base font-semibold text-slate-900">Indicadores del periodo</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monto comisionado" value={formatMoney(summary.volumenOperado)} isLoading={isLoading} icon={TrendingUp} />
        <MetricCard label="Saldo bancario actual" value={formatMoney(summary.saldoBancario)} isLoading={isLoading} icon={Landmark}
          onClick={() => navigate(paths.generalCut)} />
        <MetricCard label="Comisiones pagadas" value={formatMoney(summary.comisionesPagadas)} isLoading={isLoading} icon={Banknote} />
        <MetricCard label="Operaciones completadas" value={summary.operacionesCompletadas ?? '—'} isLoading={isLoading} icon={CheckCircle2} />
      </div>
      {Boolean(error) && <p role="alert" className="text-sm text-red-700">No se pudieron cargar los indicadores.</p>}
    </section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Saldos por banco</h2><Link className="text-sm font-medium text-blue-600" to={paths.generalCut}>Ver corte →</Link></div>
        {cut.isPending ? <p className="mt-4 text-sm text-slate-500">Cargando saldos…</p> : cut.error ? <p role="alert" className="mt-4 text-sm text-red-700">No se pudieron consultar los saldos.</p>
          : cut.data?.banks.length ? <div className="mt-3 divide-y divide-slate-100">{cut.data.banks.map(row =>
              <div key={row.bank} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate" title={row.bank}>{row.bank}</span><strong className="shrink-0 tabular-nums">{formatMoney(row.amount)}</strong></div>)}</div>
          : <p className="mt-4 text-sm text-slate-500">Sin bancos con saldo.</p>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Socios con actividad</h2><Link className="text-sm font-medium text-blue-600" to={paths.comisionessocios}>Ver comisiones →</Link></div>
        {partners.isPending ? <p className="mt-4 text-sm text-slate-500">Cargando socios…</p> : partners.error ? <p role="alert" className="mt-4 text-sm text-red-700">No se pudo consultar la actividad.</p>
          : partners.data?.socios.length ? <div className="mt-3 divide-y divide-slate-100">{[...partners.data.socios].sort((a,b) => b.montoOperado - a.montoOperado).slice(0,5).map(row =>
              <div key={row.beneficiaryId} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate" title={row.nombre}>{row.nombre}</span><strong className="shrink-0 tabular-nums">{formatMoney(row.montoOperado)}</strong></div>)}</div>
          : <p className="mt-4 text-sm text-slate-500">Sin socios con actividad en este periodo.</p>}
      </section>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Operaciones detenidas</h2><Link className="text-sm font-medium text-blue-600" to={paths.operations}>Ver operaciones →</Link></div>
      {stalled.isPending ? <p className="mt-4 text-sm text-slate-500">Cargando operaciones…</p> : stalled.error ? <p role="alert" className="mt-4 text-sm text-red-700">No se pudieron consultar las operaciones.</p>
        : stalled.data?.content.length ? <div className="mt-3 divide-y divide-slate-100">{stalled.data.content.slice(0,5).map(row =>
            <Link key={row.id} to={buildOperationDetailPath(row.id)} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-blue-600"><span className="min-w-0 truncate">#{row.id} · {row.clienteNombre}</span><span className="shrink-0 font-semibold">{formatMoney(row.montoTotal)}</span></Link>)}</div>
        : <p className="mt-4 text-sm text-slate-500">No hay operaciones detenidas.</p>}
    </section>
  </div>;
}
