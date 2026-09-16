export const DENOMINATIONS = [
  ['D1000', 100000], ['D500', 50000], ['D200', 20000], ['D100', 10000],
  ['D50', 5000], ['D20', 2000], ['D10', 1000], ['D5', 500], ['D2', 200], ['D1', 100], ['D050', 50],
] as const;
export type Denomination = typeof DENOMINATIONS[number][0];
export type CashCounts = Record<Denomination, number>;
/**
 * Catálogo fijo heredado. Sólo sigue vigente para `RETIRO_CON_TARJETA`: el cheque cobrado
 * ya no usa nombres de banco sino la cuenta bancaria real del sistema.
 */
export const CASH_CARD_BANKS = ['BBVA', 'Banorte', 'Scotiabank', 'Inbursa', 'Kapital', 'Bajío'] as const;
export const CASH_MOVEMENT_CONCEPTS = {
  EFECTIVO: 'Efectivo', CHEQUE: 'Cheque cobrado', RETIRO_CON_TARJETA: 'Retiro con tarjeta',
} as const;
export type CapturableCashConcept = keyof typeof CASH_MOVEMENT_CONCEPTS;
export type CashConcept = CapturableCashConcept | 'TRANSFERENCIA' | 'DEPOSITO' | 'RETIRO_SIN_TARJETA';
export interface CashDay {
  id: number; fecha: string; version: number; saldoInicial: number; saldoActual: number;
  saldoContado: number | null; diferencia: number | null; apertura: CashCounts; cierre: Partial<CashCounts>;
  observacionesCierre: string | null; createdAt: string; closedAt: string | null;
  abiertoPor: number; abiertoPorNombre: string; cerradoPor: number | null;
}
export interface CashMovement {
  id: number; diaId: number; fecha: string; createdAt: string; direccion: 'ENTRADA' | 'SALIDA';
  tipo: CashConcept; concepto: string; banco: string | null; monto: number; saldoAcumulado: number;
  bankAccountId: number | null; cuentaBanco: string | null; cuentaTitular: string | null;
  cuentaNumero: string | null; cuentaActiva: boolean | null;
  parcialidadId: number | null; operacionId: number | null; denominaciones: CashCounts;
  comprobanteUrl: string | null; creadoPor: number;
}
export interface CashLedger { dias: CashDay[]; movimientos: CashMovement[] }
export interface OpenCashDay { fecha: string; saldoInicial: number; denominaciones: CashCounts }
export interface CloseCashDay { saldoContado: number; version: number; denominaciones: CashCounts; observaciones: string }
export interface CreateCashMovement {
  requestId: string; direccion: 'ENTRADA' | 'SALIDA'; tipo: CashConcept; concepto: string; banco: string | null;
  bankAccountId: number | null;
  monto: number | null; parcialidadId: number | null; denominaciones: CashCounts; comprobanteUrl: string | null;
}
