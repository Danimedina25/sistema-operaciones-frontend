import { formatDate } from '@/shared/utils/weeks';

export type DashboardPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

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

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: formatDate(firstOfMonth), endDate: todayLabel };
}
