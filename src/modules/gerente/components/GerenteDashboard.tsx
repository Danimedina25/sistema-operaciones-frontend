import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Banknote, Eye, Landmark, Wallet } from 'lucide-react';
import { DashboardPeriodFilters } from '@/shared/components/dashboard/DashboardPeriodFilters';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { formatElapsedSince, formatMoney } from '@/shared/format';
import { cashWorkApi, type WorkTotal } from '@/modules/caja-general/api/cash-work.api';
import { cajaGeneralApi } from '@/modules/caja-general/api/caja-general.api';
import { bankWorkApi } from '@/modules/corte/api/bank-work.api';
import { getSummary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { useGerenteDashboardSummary } from '@/modules/gerente/hooks/use-gerente-dashboard-summary';
import { useStalledOperations } from '@/modules/gerente/hooks/use-stalled-operations';
import { computePeriodRange, type DashboardPeriod } from '@/modules/gerente/utils/period-range';
import { CommercialPartnersRanking } from './CommercialPartnersRanking';
import { StalledOperationsTable } from './StalledOperationsTable';
import { paths } from '@/routes/paths';

const initialPeriodFilters = { period: 'THIS_MONTH' as DashboardPeriod, customStart: '', customEnd: '' };
const sectionTitle = 'text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500';

function Priority({ icon, title, value, detail, alert, link, action, footnote, tone }: {
  icon: ReactNode; title: string; value: ReactNode; detail: string; alert?: string;
  link: string; action: string; footnote: string; tone: 'amber' | 'rose';
}) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
      <span className={`flex size-10 items-center justify-center rounded-xl ${tone === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>{icon}</span>{title}
    </div>
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"><strong className="text-3xl font-bold tabular-nums">{value}</strong><span className="text-sm text-slate-500">{detail}</span></div>
    <p className="mt-3 min-h-5 text-xs text-red-600">{alert || '\u00a0'}</p>
    <Link to={link} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#101729] px-3 py-2 text-xs font-semibold text-white">{action}<ArrowRight className="size-3.5" /></Link>
    <p className={`mt-3 text-[10px] font-semibold uppercase ${tone === 'amber' ? 'text-amber-700' : 'text-red-600'}`}>{footnote}</p>
  </article>;
}

function WorkRow({ label, total }: { label: string; total?: WorkTotal }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-slate-100 py-2.5 text-sm">
    <span className="min-w-0 text-slate-600">{label}</span>
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-800">{total?.count ?? '—'}</span>
    <strong className="min-w-24 text-right tabular-nums">{formatMoney(total?.amount)}</strong>
  </div>;
}

function Indicator({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <strong className="mt-1 block text-2xl font-bold tabular-nums">{value}</strong>
    <p className="mt-1 text-xs text-slate-400">{detail}</p>
  </div>;
}

export function GerenteDashboard() {
  const { filters, setFilters } = useTableUrlFilters(initialPeriodFilters);
  const period = useMemo(() => computePeriodRange(filters.period, new Date(),
    filters.customStart && filters.customEnd ? { startDate: filters.customStart, endDate: filters.customEnd } : undefined),
  [filters.period, filters.customStart, filters.customEnd]);
  const { summary, isLoading, error } = useGerenteDashboardSummary(period);
  const commissions = useQuery({ queryKey: ['dashboard-commissions', period.startDate, period.endDate], queryFn: () => getSummary(period) });
  const cash = useQuery({ queryKey: ['cash-work-summary'], queryFn: cashWorkApi.summary });
  const cashDay = useQuery({ queryKey: ['cash-day-latest'], queryFn: cajaGeneralApi.latest });
  const bank = useQuery({ queryKey: ['bank-work-summary'], queryFn: bankWorkApi.summary });
  const stalled = useStalledOperations();
  const oldestStalled = stalled.data?.content[0];
  const todayLabel = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  return <div className="space-y-6 pb-6">
    <div><PageHeader title="Inicio" /><p className="mt-1 text-sm text-slate-500">{todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}</p></div>
    <section className="space-y-4" aria-label="Prioridades de hoy">
      <h2 className={sectionTitle}>Prioridades de hoy</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <Priority icon={<Banknote className="size-5" />} title="Comisiones por pagar"
          value={formatMoney(commissions.data?.totalPendientes)}
          detail={commissions.data ? `${commissions.data.totalBeneficiarios} ${commissions.data.totalBeneficiarios === 1 ? 'beneficiario' : 'beneficiarios'}` : 'Cargando beneficiarios'}
          link={paths.comisionessocios} action="Ir a Comisiones" footnote="Pendiente de revisión" tone="amber" />
        <Priority icon={<AlertCircle className="size-5" />} title="Operaciones detenidas"
          value={isLoading ? '—' : summary.operacionesDetenidas ?? '—'} detail="sin avanzar"
          alert={oldestStalled ? `Más antigua: Folio #${oldestStalled.id}, ${formatElapsedSince(oldestStalled.updatedAt)}` : undefined}
          link={`${paths.operations}?view=stalled`} action="Ver operaciones detenidas" footnote="Revisar antigüedad" tone="rose" />
      </div>
    </section>
    <section className="space-y-4" aria-label="Supervisión del equipo">
      <h2 className={sectionTitle}>Supervisión del equipo · ahora</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2"><div className="flex items-center gap-3 font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><Wallet className="size-5" /></span>Caja General</div>{cashDay.data && <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cashDay.data.closedAt ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>{cashDay.data.closedAt ? 'Caja cerrada' : 'Caja abierta'}</span>}</div>
          <WorkRow label="Ingresos de operaciones por validar" total={cash.data?.income} />
          <WorkRow label="Retiros de cuentas por ingresar" total={cash.data?.withdrawals} />
          <WorkRow label="Entregas de efectivo por realizar" total={cash.data?.outflow} />
          <Link className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b6ef5]" to={paths.teamPending}><Eye className="size-3.5" />Ver detalle (solo consulta)</Link>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2"><div className="flex items-center gap-3 font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Landmark className="size-5" /></span>Cuentas bancarias</div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Jefa + auxiliares</span></div>
          <WorkRow label="Ingresos de operaciones por validar" total={bank.data?.income} />
          <WorkRow label="Retiros a Caja en tránsito" total={bank.data?.withdrawalsInTransit} />
          <WorkRow label="Retornos de operaciones por pagar" total={bank.data?.outflow} />
          <Link className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b6ef5]" to={paths.bankAccounts}><Eye className="size-3.5" />Ver detalle (solo consulta)</Link>
        </article>
      </div>
      {(cash.error || bank.error || cashDay.error) && <p role="alert" className="text-sm text-red-700">No se pudo consultar una de las áreas.</p>}
    </section>
    <section className="space-y-4" aria-label="Indicadores del periodo">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className={sectionTitle}>Indicadores del periodo</h2><DashboardPeriodFilters value={filters} onChange={setFilters} /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicator label="Operaciones creadas" value={isLoading ? '—' : summary.operacionesCreadas ?? '—'} detail={`${formatMoney(summary.montoOperado)} operados`} />
        <Indicator label="Comisiones generadas" value={formatMoney(commissions.data?.totalComisiones)} detail="socios y oficina" />
        <Indicator label="Con ingreso parcial" value={isLoading ? '—' : summary.operacionesIngresoParcial ?? '—'} detail="sin pendientes" />
        <Indicator label="Completadas" value={isLoading ? '—' : summary.operacionesCompletadas ?? '—'} detail="creadas en el periodo" />
      </div>
      {Boolean(error) && <p role="alert" className="text-sm text-red-700">No se pudieron cargar los indicadores.</p>}
    </section>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
      <StalledOperationsTable compact />
      <CommercialPartnersRanking period={period} compact />
    </div>
    <p className="text-xs text-slate-500">Supervisión financiera de solo consulta: los saldos y movimientos no se modifican desde Gerencia.</p>
  </div>;
}
