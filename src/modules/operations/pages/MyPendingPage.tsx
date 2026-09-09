import { StaffPendingSummaryCards } from '../components/StaffPendingSummaryCards';
import { SocioPendingSummaryCards } from '../components/SocioPendingSummaryCards';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';

const defaults: SocioPendingSummaryParams = {
  dateFilter: 'THIS_MONTH', startDate: '', endDate: '',
};
const periods = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'LAST_MONTH', label: 'Mes pasado' },
] as const;

export default function MyPendingPage() {
  const { filters, setFilters } = useTableFilters('table-filters:my-pending', defaults);

  return (
    <div className="space-y-3">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Mis pendientes</h1>
        <p className="text-sm text-slate-500">Consulta tus pendientes y accede a las operaciones que requieren tu atención.</p>
      </header>
      <section aria-label="Fechas de mis pendientes" className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,20rem)_1fr] md:items-end">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-slate-600">Rango de fechas</p>
            <DateRangeCalendarField
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={({ startDate, endDate }) => setFilters({ dateFilter: '', startDate, endDate })}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-600">Filtros rápidos de fecha</p>
            <QuickFilters
              options={[...periods]}
              value={filters.dateFilter}
              onChange={(dateFilter) => setFilters({
                dateFilter: filters.dateFilter === dateFilter ? '' : dateFilter,
                startDate: '', endDate: '',
              })}
            />
          </div>
        </div>
      </section>
      <SocioPendingSummaryCards {...filters} />
      <StaffPendingSummaryCards {...filters} />
    </div>
  );
}
