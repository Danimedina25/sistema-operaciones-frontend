import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { Button } from './Button';
import { formatPeriod } from '@/shared/format';
import {
  calendarDate, calendarISO, getPresetRange, officeToday, selectionFromDates,
  type PeriodPreset, type PeriodSelection,
} from '@/shared/utils/period';
import { cn } from '@/shared/lib/cn';
import calendarIcon from '@/shared/assets/period-calendar.svg';
import chevronIcon from '@/shared/assets/period-chevron.svg';
import compactCalendarIcon from '@/shared/assets/period-calendar-compact.svg';
import compactChevronIcon from '@/shared/assets/period-chevron-compact.svg';

const SHORTCUTS: ReadonlyArray<{ preset: PeriodPreset; label: string }> = [
  { preset: 'TODAY', label: 'Hoy' },
  { preset: 'YESTERDAY', label: 'Ayer' },
  { preset: 'THIS_WEEK', label: 'Esta semana' },
  { preset: 'LAST_WEEK', label: 'Semana pasada' },
  { preset: 'THIS_MONTH', label: 'Este mes' },
  { preset: 'LAST_MONTH', label: 'Mes pasado' },
];
const EXTRA_SHORTCUTS: ReadonlyArray<{ preset: PeriodPreset; label: string }> = [
  { preset: 'LAST_3_MONTHS', label: 'Últimos 3 meses' },
  { preset: 'LAST_6_MONTHS', label: 'Últimos 6 meses' },
  { preset: 'THIS_YEAR', label: 'Este año' },
  { preset: 'LAST_YEAR', label: 'Año anterior' },
];

interface PeriodSelectorProps {
  value: PeriodSelection;
  onApply: (value: PeriodSelection) => void;
  label?: string;
  allowAll?: boolean;
  allowRange?: boolean;
  extendedPresets?: boolean;
  compact?: boolean;
  className?: string;
  now?: Date;
}

export function PeriodSelector({
  value, onApply, label = 'Periodo', allowAll = true, allowRange = true, extendedPresets = false,
  compact = false, className, now = new Date(),
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState(() => calendarDate(value.startDate || officeToday(now)));
  const rootRef = useRef<HTMLDivElement>(null);
  const today = officeToday(now);
  const todayDate = calendarDate(today);
  const shortcuts = allowRange
    ? extendedPresets ? [...SHORTCUTS, ...EXTRA_SHORTCUTS] : SHORTCUTS
    : SHORTCUTS.filter(({ preset }) => preset === 'TODAY' || preset === 'YESTERDAY');
  const selectedPreset = shortcuts.find(({ preset }) => preset === value.preset)?.label;
  const dateLabel = formatPeriod(value.startDate, value.endDate);
  const buttonLabel = compact && selectedPreset ? `${selectedPreset} · ${dateLabel}` : dateLabel;
  const isValid = draft.mode === 'range' && !allowRange ? false : draft.mode === 'all'
    ? allowAll
    : Boolean(draft.startDate && draft.endDate && draft.startDate <= draft.endDate && draft.endDate <= today);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  function toggle() {
    if (open) { setOpen(false); return; }
    setDraft(value);
    setMonth(calendarDate(value.startDate || today));
    setOpen(true);
  }

  function changeMode(mode: 'day' | 'range') {
    const startDate = draft.startDate && draft.startDate <= today ? draft.startDate : today;
    setDraft({ mode, startDate, endDate: mode === 'day' ? startDate : draft.endDate || startDate });
    setMonth(calendarDate(startDate));
  }

  function choosePreset(preset: PeriodPreset) {
    const range = getPresetRange(preset, now);
    setDraft({ ...selectionFromDates(range.startDate, range.endDate, preset), preset });
    setMonth(calendarDate(range.startDate));
  }

  function apply() {
    if (!isValid) return;
    onApply(draft);
    setOpen(false);
  }

  return <div ref={rootRef} className={cn('relative inline-block max-w-full', className)}>
    <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="dialog"
      aria-label={`${label}: ${buttonLabel}`}
      className={cn('inline-flex max-w-full items-center gap-2 rounded-[10px] border border-border-strong bg-white text-left text-ink transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand',
        compact ? 'min-h-9 px-3 py-2 text-sm font-semibold' : 'min-h-[53px] px-3.5 py-2.5')}>
      <img src={compact ? compactCalendarIcon : calendarIcon} alt="" className="shrink-0" />
      <span className="min-w-0 truncate">
        {!compact && <span className="block text-[10px] font-semibold tracking-[1px] text-ink-muted">PERIODO</span>}
        <span className={cn('block truncate font-semibold', compact ? 'text-sm' : 'text-[15px]')}>{buttonLabel}</span>
      </span>
      <img src={compact ? compactChevronIcon : chevronIcon} alt="" className="shrink-0" />
    </button>

    {open && <>
      <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 sm:hidden" />
      <div role="dialog" aria-label="Seleccionar periodo"
        className="fixed inset-x-3 top-1/2 z-50 max-h-[88vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-strong bg-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] sm:max-h-[min(80vh,680px)] sm:translate-y-0">
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Tipo de periodo">
          {allowAll && <button type="button" aria-pressed={draft.mode === 'all'}
            onClick={() => setDraft({ mode: 'all', startDate: '', endDate: '' })}
            className={modeClass(draft.mode === 'all')}>Todas las fechas</button>}
          <button type="button" aria-pressed={draft.mode === 'day'} onClick={() => changeMode('day')}
            className={modeClass(draft.mode === 'day')}>Día</button>
          {allowRange && <button type="button" aria-pressed={draft.mode === 'range'} onClick={() => changeMode('range')}
            className={modeClass(draft.mode === 'range')}>Rango</button>}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-1.5" role="group" aria-label="Atajos de periodo">
          {shortcuts.map(({ preset, label: shortcutLabel }) => <button key={preset} type="button"
            aria-pressed={draft.preset === preset} onClick={() => choosePreset(preset)}
            className={modeClass(draft.preset === preset)}>{shortcutLabel}</button>)}
        </div>
        <div className="period-calendar flex justify-center border-t border-slate-100 pt-3">
          {draft.mode === 'range' ? <DayPicker locale={es} weekStartsOn={0} mode="range" month={month} onMonthChange={setMonth}
            selected={{ from: draft.startDate ? calendarDate(draft.startDate) : undefined,
              to: draft.endDate ? calendarDate(draft.endDate) : undefined }}
            onSelect={range => setDraft({ mode: 'range', startDate: range?.from ? calendarISO(range.from) : '',
              endDate: range?.to ? calendarISO(range.to) : '' })}
            disabled={{ after: todayDate }} endMonth={todayDate} showOutsideDays />
            : <DayPicker locale={es} weekStartsOn={0} mode="single" month={month} onMonthChange={setMonth}
              selected={draft.mode === 'day' && draft.startDate ? calendarDate(draft.startDate) : undefined}
              onSelect={date => date && setDraft({ mode: 'day', startDate: calendarISO(date), endDate: calendarISO(date) })}
              disabled={{ after: todayDate }} endMonth={todayDate} showOutsideDays />}
        </div>
        <p className="mt-2 text-center text-sm font-medium text-slate-700">{formatPeriod(draft.startDate, draft.endDate)}</p>
        <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button type="button" variant="neutral" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="button" disabled={!isValid} onClick={apply}>Aplicar</Button>
        </div>
      </div>
    </>}
  </div>;
}

function modeClass(selected: boolean) {
  return cn('min-h-9 rounded-lg border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-brand',
    selected ? 'border-brand bg-brand-soft text-brand' : 'border-border-strong bg-white text-slate-700 hover:bg-slate-50');
}
