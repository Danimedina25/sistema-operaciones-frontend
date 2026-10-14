import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Landmark } from 'lucide-react';
import { DashboardPeriodFilters } from '@/shared/components/dashboard/DashboardPeriodFilters';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { formatElapsedSince, formatMoney } from '@/shared/format';
import { useExecutiveDashboardSummary } from '@/modules/direccion/hooks/use-executive-dashboard-summary';
import { getGeneralCut } from '@/modules/corte/api/general-cut.api';
import { getSummaryByBeneficiary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { useStalledOperations } from '@/modules/gerente/hooks/use-stalled-operations';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { paths, buildOperationDetailPath } from '@/routes/paths';

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };
const moneyOrDash = (value: number | null) => value === null ? '—' : formatMoney(value);

export function ExecutiveDashboard() {
  const dateLabel = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
  const { filters, setFilters } = useTableUrlFilters(initialPeriodFilters);
  const [attentionTab, setAttentionTab] = useState<'stalled' | 'commissions'>('stalled');
  const period = useMemo(() => computePeriodRange(filters.period, new Date(),
    filters.customStart && filters.customEnd ? { startDate: filters.customStart, endDate: filters.customEnd } : undefined),
  [filters.period, filters.customStart, filters.customEnd]);
  const { summary, error } = useExecutiveDashboardSummary(period);
  const cut = useQuery({
    queryKey: ['general-cut', period.startDate, period.endDate, 0],
    queryFn: () => getGeneralCut(period.startDate, period.endDate, 0),
  });
  const partners = useQuery({
    queryKey: ['executive-partners', period.startDate, period.endDate],
    queryFn: () => getSummaryByBeneficiary(period),
  });
  const stalled = useStalledOperations();
  const commissionRows = partners.data?.socios.filter(row => row.totalPendientes > 0) ?? [];
  const banks = cut.data?.banks ?? [];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><PageHeader title="Inicio" /><p className="mt-1 text-sm text-slate-500">Cómo va el negocio · {dateLabel}</p></div>
      <DashboardPeriodFilters value={filters} onChange={setFilters} executive />
    </div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-slate-100 px-5 pt-4">
        <h2 className="flex items-center gap-2 pb-3.5 text-base font-semibold text-slate-900"><AlertTriangle className="size-4 text-red-600" />Requiere atención</h2>
        <button type="button" onClick={() => setAttentionTab('stalled')} aria-pressed={attentionTab === 'stalled'}
          className={`border-b-[3px] pb-3 text-sm ${attentionTab === 'stalled' ? 'border-red-500 font-semibold text-slate-950' : 'border-transparent text-slate-500'}`}>
          Operaciones detenidas <span className="ml-1 rounded-full bg-red-100 px-1.5 text-xs font-bold text-red-700">{stalled.data?.totalElements ?? '—'}</span>
        </button>
        <button type="button" onClick={() => setAttentionTab('commissions')} aria-pressed={attentionTab === 'commissions'}
          className={`border-b-[3px] pb-3 text-sm ${attentionTab === 'commissions' ? 'border-amber-500 font-semibold text-slate-950' : 'border-transparent text-slate-500'}`}>
          Comisiones pendientes <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-700">{commissionRows.length || '—'}</span>
        </button>
      </div>
      {attentionTab === 'stalled' ? <>
        {stalled.isPending ? <p className="p-5 text-sm text-slate-500">Cargando operaciones detenidas…</p>
          : stalled.error ? <p role="alert" className="p-5 text-sm text-red-700">No se pudieron consultar las operaciones detenidas.</p>
          : stalled.data?.content.length ? stalled.data.content.slice(0, 4).map(row =>
            <Link key={row.id} to={buildOperationDetailPath(row.id)} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-slate-100 px-5 py-2.5 text-sm hover:bg-slate-50 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <span className="text-slate-500">#{row.id}</span><strong className="truncate text-slate-900" title={row.clienteNombre}>{row.clienteNombre}</strong>
              <span className="hidden min-w-0 truncate sm:block"><OperationStatusBadge status={row.estatus} /></span>
              <span className="whitespace-nowrap font-semibold text-red-600">{formatElapsedSince(row.updatedAt)}</span>
            </Link>) : <p className="p-5 text-sm text-slate-500">No hay operaciones detenidas.</p>}
        <Link to={`${paths.operations}?view=stalled`} className="flex items-center gap-1 px-5 py-3 text-sm font-semibold text-[#3b6ef5]">Ver las {stalled.data?.totalElements ?? '—'} en Operaciones <ArrowRight className="size-4" /></Link>
      </> : <>
        {partners.isPending ? <p className="p-5 text-sm text-slate-500">Cargando comisiones…</p>
          : partners.error ? <p role="alert" className="p-5 text-sm text-red-700">No se pudieron consultar las comisiones.</p>
          : commissionRows.length ? commissionRows.slice(0, 4).map(row =>
            <div key={`${row.beneficiaryType}-${row.beneficiaryId}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-2.5 text-sm">
              <strong className="min-w-0 truncate">{row.nombre}</strong><span className="whitespace-nowrap font-semibold text-amber-800">{formatMoney(row.totalPendientes)}</span>
            </div>) : <p className="p-5 text-sm text-slate-500">Sin comisiones pendientes en este periodo.</p>}
        <Link to={paths.comisionessocios} className="flex items-center gap-1 px-5 py-3 text-sm font-semibold text-[#3b6ef5]">Ver Comisiones <ArrowRight className="size-4" /></Link>
      </>}
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex min-h-32 flex-col rounded-2xl bg-[#0b1222] p-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Saldo bancario total</p>
        <strong className="mt-2 text-2xl tabular-nums">{moneyOrDash(cut.data?.bankFinal ?? null)}</strong>
        <span className="mt-auto text-xs text-slate-400">Saldo al cierre del periodo</span>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Monto operado</p><strong className="mt-2 block text-2xl tabular-nums">{moneyOrDash(summary.volumenOperado)}</strong><p className="mt-3 text-xs text-slate-500">Periodo seleccionado</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Comisiones pendientes</p><strong className="mt-2 block text-2xl tabular-nums">{moneyOrDash(summary.comisionesPendientes)}</strong><p className="mt-3 text-xs text-slate-500">{commissionRows.length} {commissionRows.length === 1 ? 'beneficiario' : 'beneficiarios'}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Operaciones completadas</p><strong className="mt-2 block text-2xl tabular-nums">{summary.operacionesCompletadas ?? '—'}</strong><p className="mt-3 text-xs text-slate-500">Periodo seleccionado</p></div>
    </section>
    {Boolean(error) && <p role="alert" className="text-sm text-red-700">No se pudieron cargar los indicadores.</p>}

    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Socios con actividad</h2><p className="text-xs text-slate-400">Monto operado por beneficiario en el periodo</p></div>
        {partners.isPending ? <p className="p-5 text-sm text-slate-500">Cargando socios…</p>
          : partners.error ? <p role="alert" className="p-5 text-sm text-red-700">No se pudo consultar la actividad.</p>
          : partners.data?.socios.length ? [...partners.data.socios].sort((a,b) => b.montoOperado - a.montoOperado).slice(0,5).map(row =>
            <div key={`${row.beneficiaryType}-${row.beneficiaryId}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-sm"><strong className="min-w-0 truncate">{row.nombre}</strong><span className="whitespace-nowrap tabular-nums">{formatMoney(row.montoOperado)}</span></div>)
          : <p className="p-5 text-sm text-slate-500">Sin socios con actividad en este periodo.</p>}
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Saldos por banco</h2><p className="text-xs text-slate-400">Saldo al cierre del periodo</p></div>
        {cut.isPending ? <p className="p-5 text-sm text-slate-500">Cargando saldos…</p>
          : cut.error ? <p role="alert" className="p-5 text-sm text-red-700">No se pudieron consultar los saldos.</p>
          : banks.length ? banks.map(row =>
            <div key={row.bank} className={`flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-sm ${row.amount < 0 ? 'bg-red-50' : ''}`}>
              <span className="flex min-w-0 items-center gap-2 truncate"><Landmark className="size-4 shrink-0 text-blue-500" /><span className="truncate">{row.bank}<small className="block text-xs text-slate-400">{row.accounts} cuentas</small></span></span>
              <strong className={`shrink-0 tabular-nums ${row.amount < 0 ? 'text-red-700' : ''}`}>{formatMoney(row.amount)}</strong>
            </div>) : <p className="p-5 text-sm text-slate-500">Sin bancos con saldo.</p>}
      </section>
    </div>
  </div>;
}
