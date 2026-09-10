import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';

const pendingPeriods = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'LAST_MONTH', label: 'Mes pasado' },
] as const;

export function PendingDateFilters({ filters, onChange, label }: {
  filters: SocioPendingSummaryParams;
  onChange: (next: SocioPendingSummaryParams) => void;
  label: string;
}) {
  const incompleteRange = Boolean(filters.startDate) !== Boolean(filters.endDate);
  return <section aria-label={label} className="rounded-2xl bg-white p-4 shadow-sm">
    <div className="grid gap-3 md:grid-cols-[minmax(0,20rem)_1fr] md:items-end">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-slate-600">Rango de fechas</p>
        <DateRangeCalendarField startDate={filters.startDate} endDate={filters.endDate}
          onChange={({ startDate, endDate }) => onChange({ dateFilter: '', startDate, endDate })} />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Filtros rápidos de fecha</p>
        <QuickFilters options={[...pendingPeriods]} value={filters.dateFilter}
          onChange={(dateFilter) => onChange({ dateFilter: filters.dateFilter === dateFilter ? '' : dateFilter, startDate: '', endDate: '' })} />
      </div>
    </div>
    {incompleteRange && <p role="alert" className="mt-2 text-xs text-rose-600">Selecciona la fecha inicial y final para aplicar el rango.</p>}
  </section>;
}
