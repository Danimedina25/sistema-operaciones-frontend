import { officeToday } from '@/shared/utils/period';
import { formatDate, formatDateTime } from '@/shared/format';

export function formatCashDate(value: string): string {
  return formatDate(value);
}

export function formatCashDateTime(value: string): string {
  return formatDateTime(value);
}

/** Sólo la hora, para las filas del libro donde la fecha ya la da el encabezado del día. */
export function formatCashTime(value: string): string {
  const [, time] = value.split('T');
  return time ? time.slice(0, 5) : '—';
}

/** Una caja de otro día debe cerrarse antes de recibir movimientos de hoy. */
export function resolveCashDayState(day: { id: number; fecha: string; closedAt: string | null } | null | undefined, now = new Date()) {
  const unclosed = Boolean(day && !day.closedAt);
  const openToday = unclosed && day?.fecha === officeToday(now);
  return { openDayId: openToday ? day!.id : null, openToday, pendingCloseDate: unclosed && !openToday ? day!.fecha : null };
}
