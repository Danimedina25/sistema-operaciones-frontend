import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { dateToISO, formatDisplayDate, isoToDate } from '@/shared/utils/date-formats';

interface DateRangeValue {
  startDate: string;
  endDate: string;
}

interface DateRangeCalendarFieldProps {
  startDate: string;
  endDate: string;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangeCalendarField({
  startDate,
  endDate,
  onChange,
  placeholder = 'Selecciona un rango de fechas',
  className = '',
}: DateRangeCalendarFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState({
    startDate: startDate ? isoToDate(startDate) : new Date(),
    endDate: endDate ? isoToDate(endDate) : new Date(),
    key: 'selection' as const,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setDraftRange({
      startDate: startDate ? isoToDate(startDate) : new Date(),
      endDate: endDate ? isoToDate(endDate) : new Date(),
      key: 'selection',
    });
  }, [open, startDate, endDate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasValue = Boolean(startDate && endDate);

  const label = hasValue
    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
    : placeholder;

  function handleApply() {
    onChange({
      startDate: dateToISO(draftRange.startDate),
      endDate: dateToISO(draftRange.endDate),
    });
    setOpen(false);
  }

  function handleClear() {
    onChange({ startDate: '', endDate: '' });
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 outline-none focus:border-slate-900"
      >
        <span className={hasValue ? '' : 'text-slate-400'}>{label}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <DateRange
            ranges={[draftRange]}
            onChange={(item: any) => {
              const selection = item.selection;

              setDraftRange({
                startDate: selection.startDate ?? new Date(),
                endDate: selection.endDate ?? new Date(),
                key: 'selection',
              });
            }}
            showMonthArrow
            moveRangeOnFirstSelection={false}
            editableDateInputs={false}
            showDateDisplay={false}
            showMonthAndYearPickers
            rangeColors={['#0f172a']}
            months={1}
            direction="horizontal"
          />

          <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
