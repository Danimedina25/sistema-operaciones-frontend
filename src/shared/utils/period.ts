export type PeriodPreset =
  | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH'
  | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'LAST_YEAR';

export interface PeriodRange { startDate: string; endDate: string }
export type PeriodSelection = PeriodRange & {
  mode: 'all' | 'day' | 'range';
  preset?: PeriodPreset;
};

const officeCalendar = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function officeToday(now: Date = new Date()): string {
  const parts = Object.fromEntries(officeCalendar.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function shiftDay(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function getPresetRange(preset: PeriodPreset, now: Date = new Date()): PeriodRange {
  const today = officeToday(now);
  const [year, month, day] = today.split('-').map(Number);
  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstOfYear = `${year}-01-01`;
  const sunday = shiftDay(today, -new Date(Date.UTC(year, month - 1, day)).getUTCDay());
  const monthStart = (offset: number) => new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 10);

  switch (preset) {
    case 'TODAY': return { startDate: today, endDate: today };
    case 'YESTERDAY': {
      const yesterday = shiftDay(today, -1);
      return { startDate: yesterday, endDate: yesterday };
    }
    case 'THIS_WEEK': return { startDate: sunday, endDate: today };
    case 'LAST_WEEK': return { startDate: shiftDay(sunday, -7), endDate: shiftDay(sunday, -1) };
    case 'THIS_MONTH': return { startDate: firstOfMonth, endDate: today };
    case 'LAST_MONTH': return { startDate: monthStart(-1), endDate: shiftDay(firstOfMonth, -1) };
    case 'LAST_3_MONTHS': return { startDate: monthStart(-2), endDate: today };
    case 'LAST_6_MONTHS': return { startDate: monthStart(-5), endDate: today };
    case 'THIS_YEAR': return { startDate: firstOfYear, endDate: today };
    case 'LAST_YEAR': return { startDate: `${year - 1}-01-01`, endDate: `${year - 1}-12-31` };
  }
}

export function selectionFromDates(startDate: string, endDate: string, preset?: PeriodPreset): PeriodSelection {
  if (!startDate && !endDate) return { mode: 'all', startDate: '', endDate: '' };
  if (!startDate || !endDate) return { mode: 'range', startDate, endDate, preset };
  return { mode: startDate === endDate ? 'day' : 'range', startDate, endDate, preset };
}

export function selectionFromDateFilters(filters: { dateFilter: string; startDate: string; endDate: string }): PeriodSelection {
  const legacyPreset = ['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH'].includes(filters.dateFilter)
    ? filters.dateFilter as PeriodPreset : undefined;
  if (legacyPreset) {
    const range = getPresetRange(legacyPreset);
    return { ...selectionFromDates(range.startDate, range.endDate, legacyPreset), preset: legacyPreset };
  }
  return selectionFromDates(filters.startDate, filters.endDate);
}

/** Calendar dates are converted at noon locally, avoiding midnight DST boundaries. */
export function calendarDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function calendarISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
