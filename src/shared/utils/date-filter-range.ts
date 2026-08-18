import { formatDate } from './weeks';
import type { OperationDateFilter } from '@/modules/operations/types/operations.types.ts';

export interface DateRange {
  startDate: string;
  endDate: string;
}

function currentWeekMondaySunday(now: Date): DateRange {
  const day = now.getDay(); // 0 = domingo
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { startDate: formatDate(monday), endDate: formatDate(sunday) };
}

/**
 * Replica en frontend la resolución de `dateFilter` a fechas concretas que
 * hace el backend (PaymentOperationServiceImpl.resolveStartDate/resolveEndDate),
 * para endpoints que solo aceptan startDate/endDate y no el enum.
 */
export function resolveDateFilterRange(
  dateFilter: OperationDateFilter | '',
  customStartDate: string,
  customEndDate: string,
  now: Date = new Date(),
): DateRange {
  if (dateFilter === '') {
    if (customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    return currentWeekMondaySunday(now);
  }

  if (dateFilter === 'TODAY') {
    const today = formatDate(now);
    return { startDate: today, endDate: today };
  }

  if (dateFilter === 'THIS_WEEK') {
    return currentWeekMondaySunday(now);
  }

  if (dateFilter === 'THIS_MONTH') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatDate(first), endDate: formatDate(last) };
  }

  // LAST_MONTH
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return { startDate: formatDate(first), endDate: formatDate(last) };
}
