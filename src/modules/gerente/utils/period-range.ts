import { formatDate } from '@/shared/utils/weeks';

export type DashboardPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM';

export interface PeriodRange {
  startDate: string;
  endDate: string;
}

/**
 * Calcula el rango de fechas concreto (formato YYYY-MM-DD) para el
 * selector de periodo del dashboard de GERENTE. Para 'CUSTOM' devuelve el
 * rango provisto tal cual (o el día de hoy si no se ha elegido nada aún).
 */
export function computePeriodRange(
  period: DashboardPeriod,
  now: Date = new Date(),
  custom?: PeriodRange,
): PeriodRange {
  const todayLabel = formatDate(now);

  if (period === 'CUSTOM') {
    return custom ?? { startDate: todayLabel, endDate: todayLabel };
  }

  if (period === 'TODAY') {
    return { startDate: todayLabel, endDate: todayLabel };
  }

  if (period === 'THIS_WEEK') {
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    return { startDate: formatDate(sunday), endDate: todayLabel };
  }

  if (period === 'LAST_MONTH') {
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: formatDate(new Date(end.getFullYear(), end.getMonth(), 1)), endDate: formatDate(end) };
  }
  if (period === 'LAST_3_MONTHS' || period === 'LAST_6_MONTHS') {
    const months = period === 'LAST_3_MONTHS' ? 3 : 6;
    return { startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - months + 1, 1)), endDate: todayLabel };
  }
  if (period === 'THIS_YEAR') return { startDate: formatDate(new Date(now.getFullYear(), 0, 1)), endDate: todayLabel };
  if (period === 'LAST_YEAR') return {
    startDate: formatDate(new Date(now.getFullYear() - 1, 0, 1)),
    endDate: formatDate(new Date(now.getFullYear() - 1, 11, 31)),
  };

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: formatDate(firstOfMonth), endDate: todayLabel };
}

export function previousEquivalentPeriod(period: PeriodRange): PeriodRange {
  const start = new Date(`${period.startDate}T12:00:00`);
  const end = new Date(`${period.endDate}T12:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const previousEnd = new Date(start); previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd); previousStart.setDate(previousStart.getDate() - days + 1);
  return { startDate: formatDate(previousStart), endDate: formatDate(previousEnd) };
}
