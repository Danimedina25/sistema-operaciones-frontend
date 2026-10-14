import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign } from 'lucide-react';
import { useTableCacheKey } from '@/shared/hooks/use-table-filters';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Tabs } from '@/shared/components/ui/Tabs';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { formatPeriod } from '@/shared/format';
import { officeToday, shiftDay } from '@/shared/utils/period';
import { getWeeksOfYear } from '@/shared/utils/weeks';
import { useMyWeeklyCommissions } from '../hooks/use-my-weekly-commissions';
import { MyCommissionsTable } from '../components/MyCommissionsTable';
import { MyCommissionsSummaryCards } from '../components/MyCommissionsSummaryCards';
import { CommissionSummaryCardsSkeleton } from '../components/CommissionSummaryCardsSkeleton';

function weekAt(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  const sunday = shiftDay(day, -new Date(Date.UTC(year, month - 1, date)).getUTCDay());
  return { startDate: sunday, endDate: shiftDay(sunday, 6) };
}

function lastCompletedWeek() { return weekAt(shiftDay(weekAt(officeToday()).startDate, -1)); }

export default function MyCommercialPartnerCommissionsPage() {
  const [defaults] = useState(() => ({ ...lastCompletedWeek(), commissionStatus: 'ALL' }));
  const cacheKey = useTableCacheKey('table-filters:my-commissions');
  const { filters, setFilters } = useUrlFilters(defaults, cacheKey);
  const { commissions, isLoading, error, fetchCommissions } = useMyWeeklyCommissions();
  useEffect(() => { void fetchCommissions({ startDate: filters.startDate, endDate: filters.endDate }); }, [fetchCommissions, filters.startDate, filters.endDate]);

  const current = weekAt(officeToday());
  const week = getWeeksOfYear(Number(filters.startDate.slice(0, 4))).find((item) => item.startDate === filters.startDate);
  const updateWeek = (day: string) => setFilters({ ...filters, ...weekAt(day) });
  const operations = commissions?.operaciones.filter((operation) => filters.commissionStatus === 'ALL' || operation.myCommissionStatus === filters.commissionStatus) ?? [];

  const weekControls = <div className="flex w-full flex-col-reverse items-start gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
    <button type="button" onClick={() => setFilters({ ...filters, ...current })} className="px-2 text-xs font-semibold text-blue-600 hover:underline">Ir a la semana actual</button>
    <div className="flex w-full items-center justify-between gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:w-auto">
      <button type="button" aria-label="Semana anterior" onClick={() => updateWeek(shiftDay(filters.startDate, -7))} className="rounded-md bg-slate-100 p-2 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
      <div className="flex min-w-[155px] items-center justify-center gap-2 px-2 text-center text-xs"><CalendarDays className="hidden h-4 w-4 text-slate-500 sm:block" /><span><strong className="block text-slate-800">{week ? `Semana ${week.weekNumber}` : 'Periodo'}</strong><span className="text-slate-500">{formatPeriod(filters.startDate, filters.endDate)}</span></span></div>
      <button type="button" aria-label="Semana siguiente" disabled={filters.startDate >= current.startDate} onClick={() => updateWeek(shiftDay(filters.startDate, 7))} className="rounded-md bg-slate-100 p-2 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
    </div>
  </div>;

  return <div className="space-y-3 sm:space-y-5">
    <PageHeader title="Mis comisiones" className="max-sm:gap-0 max-sm:[&_h1]:hidden" actions={weekControls} />
    {isLoading ? <CommissionSummaryCardsSkeleton /> : commissions ? <MyCommissionsSummaryCards summary={commissions} /> : null}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">No se pudieron cargar las comisiones. <button type="button" className="font-semibold underline" onClick={() => void fetchCommissions({ startDate: filters.startDate, endDate: filters.endDate })}>Reintentar</button></p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="hidden text-sm font-semibold text-slate-900 sm:block">Operaciones de la semana</h2>
        <Tabs label="Estatus de comisión" value={filters.commissionStatus} onChange={(commissionStatus) => setFilters({ ...filters, commissionStatus })}
          className="grid w-full grid-cols-3 rounded-lg bg-slate-200/60 p-1 sm:flex sm:w-auto sm:bg-transparent sm:p-0 [&>button]:justify-center"
          options={[{ value: 'ALL', label: 'Todas' }, { value: 'GENERADA', label: 'Pendientes' }, { value: 'PAGADA', label: 'Pagadas' }]} />
      </div>
      {isLoading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Cargando comisiones...</p>
        : error ? <EmptyState title="No se pudieron cargar las operaciones" description="Intenta de nuevo." className="border-0" />
        : operations.length ? <MyCommissionsTable operations={operations} />
          : <EmptyState icon={CircleDollarSign} title={commissions?.operaciones.length ? 'No hay comisiones con este filtro' : 'Aún no hay comisiones esta semana'} description={commissions?.operaciones.length ? 'Prueba con otro estado para consultar las operaciones.' : 'Aparecerán aquí cuando se registren operaciones tuyas o de tu red.'} action={<button type="button" className="font-semibold text-blue-600 hover:underline" onClick={() => updateWeek(shiftDay(filters.startDate, -7))}>← Ver semana anterior</button>} className="border-0" />}
    </section>
  </div>;
}
