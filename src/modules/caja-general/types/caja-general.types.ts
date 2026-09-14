export const DENOMINATIONS = [
  ['D1000', 100000], ['D500', 50000], ['D200', 20000], ['D100', 10000],
  ['D50', 5000], ['D20', 2000], ['D10', 1000], ['D5', 500], ['D2', 200], ['D1', 100], ['D050', 50],
] as const;
export type Denomination = typeof DENOMINATIONS[number][0];
export type CashCounts = Record<Denomination, number>;
export const CASH_BANKS = ['BBVA', 'Banorte', 'Kapital', 'Inbursa', 'Bajío', 'Scotiabank', 'Scotiabank Nómina', 'Scotiabank RST'] as const;
export const CONCEPTS = {
  EFECTIVO: 'Efectivo', CHEQUE: 'Cheque cobrado', TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito',
  RETIRO_CON_TARJETA: 'Retiro con tarjeta (TD)', RETIRO_SIN_TARJETA: 'Retiro sin tarjeta (RST)',
} as const;
export type CashConcept = keyof typeof CONCEPTS;
export interface CashDay {
  id: number; fecha: string; version: number; saldoInicial: number; saldoActual: number;
  saldoContado: number | null; diferencia: number | null; apertura: CashCounts; cierre: Partial<CashCounts>;
  observacionesCierre: string | null; closedAt: string | null; abiertoPor: number; cerradoPor: number | null;
}
export interface CashMovement {
  id: number; diaId: number; fecha: string; createdAt: string; direccion: 'ENTRADA' | 'SALIDA';
  tipo: CashConcept; concepto: string; banco: string | null; monto: number; saldoAcumulado: number;
  parcialidadId: number | null; operacionId: number | null; denominaciones: CashCounts;
  comprobanteUrl: string | null; creadoPor: number;
}
export interface CashDelivery {
  id: number; operacionId: number; monto: number; fechaRealizacion: string; personaQueRecibioEfectivo: string | null;
}
export interface CashLedger { dias: CashDay[]; movimientos: CashMovement[] }
export interface OpenCashDay { fecha: string; saldoInicial: number; denominaciones: CashCounts }
export interface CloseCashDay { saldoContado: number; version: number; denominaciones: CashCounts; observaciones: string }
export interface CreateCashMovement {
  requestId: string; direccion: 'ENTRADA' | 'SALIDA'; tipo: CashConcept; concepto: string; banco: string | null;
  monto: number | null; parcialidadId: number | null; denominaciones: CashCounts; comprobanteUrl: string | null;
}
