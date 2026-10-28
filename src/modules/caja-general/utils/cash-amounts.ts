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

export interface CountCheck { tone: 'green' | 'amber' | 'red'; text: string; error: string | null }

/** Compara lo contado con el monto que debe cuadrar: verde si es exacto, ámbar si falta y rojo (error) si sobra. */
export function checkCount(countedCents: number, expectedCents: number): CountCheck {
  if (!Number.isFinite(countedCents)) return { tone: 'red', text: 'Total contado — · revisa las cantidades', error: 'Revisa las cantidades capturadas.' };
  const counted = currency(countedCents / 100);
  const difference = countedCents - expectedCents;
  if (difference === 0) return { tone: 'green', text: `Total contado ${counted} · cuadra`, error: null };
  if (difference < 0) return { tone: 'amber', text: `Total contado ${counted} · faltan ${currency(-difference / 100)}`, error: null };
  return { tone: 'red', text: `Total contado ${counted} · sobran ${currency(difference / 100)}`, error: `El conteo excede el monto por ${currency(difference / 100)}. Debe cuadrar exacto.` };
}
