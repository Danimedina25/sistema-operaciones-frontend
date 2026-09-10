import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import type { DashboardPeriod } from '@/modules/gerente/utils/period-range';

export interface DashboardPeriodFilterValue { period: DashboardPeriod; customStart: string; customEnd: string }
export function DashboardPeriodFilters({ value, onChange, executive = false }: {
  value: DashboardPeriodFilterValue; onChange: (next: DashboardPeriodFilterValue) => void; executive?: boolean;
}) {
  const options: Array<{ value: DashboardPeriod; label: string }> = [
    { value: 'TODAY', label: 'Hoy' }, { value: 'THIS_WEEK', label: 'Esta semana' },
    { value: 'THIS_MONTH', label: 'Este mes' }, { value: 'LAST_MONTH', label: 'Mes pasado' },
    ...(executive ? [
      { value: 'LAST_3_MONTHS' as const, label: 'Últimos 3 meses' }, { value: 'LAST_6_MONTHS' as const, label: 'Últimos 6 meses' },
      { value: 'THIS_YEAR' as const, label: 'Este año' }, { value: 'LAST_YEAR' as const, label: 'Año anterior' },
    ] : []), { value: 'CUSTOM', label: 'Rango personalizado' },
  ];
  const invalid = value.period === 'CUSTOM' && (!value.customStart || !value.customEnd || value.customStart > value.customEnd);
  return <div className="w-full sm:w-auto">
    <div className="flex flex-wrap items-center gap-2">{options.map((option) => <button key={option.value} type="button"
      onClick={() => onChange({ ...value, period: option.value })}
      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition ${value.period === option.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{option.label}</button>)}</div>
    {value.period === 'CUSTOM' && <div className="mt-3"><DateRangeCalendarField startDate={value.customStart} endDate={value.customEnd}
      onChange={({ startDate, endDate }) => onChange({ ...value, customStart: startDate, customEnd: endDate })} />
      {invalid && <p role="alert" className="mt-2 text-xs text-rose-600">Selecciona un rango válido con fecha inicial y final.</p>}</div>}
  </div>;
}
