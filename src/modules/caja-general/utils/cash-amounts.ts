import { DENOMINATIONS, type CashCounts } from '../types/caja-general.types';
export const emptyCounts = (): CashCounts => Object.fromEntries(DENOMINATIONS.map(([key]) => [key, 0])) as CashCounts;
export function countCents(counts: CashCounts): number {
  const total = DENOMINATIONS.reduce((sum, [key, cents]) => {
    const quantity = counts[key];
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 2147483647) return NaN;
    return sum + quantity * cents;
  }, 0);
  return Number.isSafeInteger(total) ? total : NaN;
}
export function parseCents(value: string): number {
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(value)) return NaN;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export const currency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
export function validateCashAmount(value: string, counts: CashCounts, positive = false): string | null {
  const cents = parseCents(value);
  if (!Number.isFinite(cents) || (positive && cents === 0)) return 'Captura un importe válido con máximo dos decimales.';
  if (countCents(counts) !== cents) return 'El desglose debe sumar exactamente el importe.';
  return null;
}
