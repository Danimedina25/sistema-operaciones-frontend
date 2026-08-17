import { formatDate } from '@/shared/utils/weeks';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';

export interface ComparativePeriodPair {
  label: string;
  current: PeriodRange;
  previous: PeriodRange;
}

/**
 * Calcula los 3 pares de periodo pedidos: hoy/ayer, semana actual/anterior,
 * mes actual/anterior. Las semanas van de domingo a sábado (mismo criterio
 * que `shared/utils/weeks.ts`); "actual" siempre corta en `now` (no incluye
 * días futuros), "anterior" es el periodo completo previo.
 */
export function getComparativePeriodPairs(now: Date = new Date()): ComparativePeriodPair[] {
  const today = formatDate(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const thisSunday = new Date(now);
  thisSunday.setDate(now.getDate() - now.getDay());

  const prevSaturday = new Date(thisSunday);
  prevSaturday.setDate(thisSunday.getDate() - 1);

  const prevSunday = new Date(prevSaturday);
  prevSunday.setDate(prevSaturday.getDate() - 6);

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);

  return [
    {
      label: 'Hoy vs. ayer',
      current: { startDate: today, endDate: today },
      previous: { startDate: formatDate(yesterday), endDate: formatDate(yesterday) },
    },
    {
      label: 'Esta semana vs. semana anterior',
      current: { startDate: formatDate(thisSunday), endDate: today },
      previous: { startDate: formatDate(prevSunday), endDate: formatDate(prevSaturday) },
    },
    {
      label: 'Este mes vs. mes anterior',
      current: { startDate: formatDate(firstOfMonth), endDate: today },
      previous: { startDate: formatDate(firstOfPrevMonth), endDate: formatDate(lastOfPrevMonth) },
    },
  ];
}
