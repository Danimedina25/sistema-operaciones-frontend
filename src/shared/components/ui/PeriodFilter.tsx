import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { fieldControl, fieldLabel, panelShell } from '@/shared/styles/ui-tokens';
import { isoToDate } from '@/shared/utils/date-formats';

export type PeriodMode = 'daily' | 'range';

/**
 * El control de periodo del sistema: un día suelto o un rango de fechas.
 *
 * Vive aquí y no en cada módulo porque Caja General y Cortes y saldos consultan el mismo
 * dinero; que el interruptor se viera o se comportara distinto según la pantalla obligaba
 * al usuario a reaprender el mismo filtro dos veces.
 *
 * Son dos piezas separadas a propósito: el interruptor va en las acciones de la cabecera y
 * el campo en el panel de abajo, que es donde ya los pone Cortes y saldos.
 */
export function PeriodModeToggle({ mode, onChange }: {
  mode: PeriodMode;
  onChange: (mode: PeriodMode) => void;
}) {
  const option = (value: PeriodMode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={mode === value}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        mode === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      {option('daily', 'Día')}
      {option('range', 'Rango de fechas')}
    </div>
  );
}

export function PeriodDateField({
  id,
  mode,
  dailyLabel,
  fecha,
  startDate,
  endDate,
  maxDate,
  onFechaChange,
  onRangeChange,
}: {
  /** Necesario para asociar la etiqueta cuando hay más de un filtro en la pantalla. */
  id: string;
  mode: PeriodMode;
  dailyLabel: string;
  fecha: string;
  startDate: string;
  endDate: string;
  /** Fecha tope en ISO. Sin ella se admite cualquier fecha, como hace el corte. */
  maxDate?: string;
  onFechaChange: (fecha: string) => void;
  onRangeChange: (range: { startDate: string; endDate: string }) => void;
}) {
  return (
    <section className={panelShell}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        {mode === 'daily' ? (
          <div>
            <label htmlFor={id} className={fieldLabel}>{dailyLabel}</label>
            <input
              id={id}
              type="date"
              value={fecha}
              max={maxDate}
              onChange={event => onFechaChange(event.target.value)}
              className={`${fieldControl} lg:max-w-xs`}
            />
          </div>
        ) : (
          <div>
            <span className={fieldLabel}>Rango de fechas</span>

            <DateRangeCalendarField
              startDate={startDate}
              endDate={endDate}
              maxDate={maxDate ? isoToDate(maxDate) : undefined}
              className="min-w-[320px]"
              onChange={({ startDate: start, endDate: end }) => {
                if (!start || !end) {
                  return;
                }

                onRangeChange({ startDate: start, endDate: end });
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
