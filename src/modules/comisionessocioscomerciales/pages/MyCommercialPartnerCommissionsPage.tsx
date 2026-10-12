import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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

  return <div className="space-y-5">
    <PageHeader title="Mis comisiones" actions={<div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setFilters({ ...filters, ...current })} className="px-2 text-xs font-semibold text-blue-600 hover:underline">Ir a la semana actual</button>
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" aria-label="Semana anterior" onClick={() => updateWeek(shiftDay(filters.startDate, -7))} className="rounded-md p-2 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
        <div className="flex min-w-[155px] items-center justify-center gap-2 px-2 text-center text-xs"><CalendarDays className="h-4 w-4 text-slate-500" /><span><strong className="block text-slate-800">{week ? `Semana ${week.weekNumber}` : 'Periodo'}</strong><span className="text-slate-500">{formatPeriod(filters.startDate, filters.endDate)}</span></span></div>
        <button type="button" aria-label="Semana siguiente" disabled={filters.startDate >= current.startDate} onClick={() => updateWeek(shiftDay(filters.startDate, 7))} className="rounded-md p-2 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>} />
    {isLoading ? <CommissionSummaryCardsSkeleton /> : commissions ? <MyCommissionsSummaryCards summary={commissions} /> : null}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">No se pudieron cargar las comisiones. <button type="button" className="font-semibold underline" onClick={() => void fetchCommissions({ startDate: filters.startDate, endDate: filters.endDate })}>Reintentar</button></p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Operaciones de la semana</h2>
        <Tabs label="Estatus de comisión" value={filters.commissionStatus} onChange={(commissionStatus) => setFilters({ ...filters, commissionStatus })}
          options={[{ value: 'ALL', label: 'Todas' }, { value: 'GENERADA', label: 'Pendientes' }, { value: 'PAGADA', label: 'Pagadas' }]} />
      </div>
      {isLoading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Cargando comisiones...</p>
        : error ? <EmptyState title="No se pudieron cargar las operaciones" description="Intenta de nuevo." className="border-0" />
        : operations.length ? <MyCommissionsTable operations={operations} />
          : <EmptyState title="No hay comisiones para esta semana" description="Cambia la semana o el estado para consultar otras operaciones." className="border-0" />}
    </section>
  </div>;
}
