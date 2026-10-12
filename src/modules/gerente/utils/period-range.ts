import { getPresetRange, officeToday, shiftDay } from '@/shared/utils/period';

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
  if (period === 'CUSTOM') return custom ?? { startDate: officeToday(now), endDate: officeToday(now) };
  return getPresetRange(period, now);
}

export function previousEquivalentPeriod(period: PeriodRange): PeriodRange {
  const days = Math.round((Date.parse(`${period.endDate}T12:00:00Z`) - Date.parse(`${period.startDate}T12:00:00Z`)) / 86_400_000) + 1;
  const previousEnd = shiftDay(period.startDate, -1);
  return { startDate: shiftDay(previousEnd, -days + 1), endDate: previousEnd };
}
