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
