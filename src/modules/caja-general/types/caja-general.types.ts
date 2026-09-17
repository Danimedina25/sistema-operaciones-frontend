export const DENOMINATIONS = [
  ['D1000', 100000], ['D500', 50000], ['D200', 20000], ['D100', 10000],
  ['D50', 5000], ['D20', 2000], ['D10', 1000], ['D5', 500], ['D2', 200], ['D1', 100], ['D050', 50],
] as const;
export type Denomination = typeof DENOMINATIONS[number][0];
export type CashCounts = Record<Denomination, number>;
export const CASH_MOVEMENT_CONCEPTS = {
  EFECTIVO: 'Efectivo', CHEQUE: 'Cheque cobrado', RETIRO_SIN_TARJETA: 'Retiro sin tarjeta',
} as const;
/**
 * Conceptos que sacan efectivo de una cuenta bancaria y lo meten a la caja: exigen la
 * cuenta real y sólo existen como entrada.
 */
export const BANK_WITHDRAWAL_CONCEPTS = ['CHEQUE', 'RETIRO_SIN_TARJETA'] as const;
export type CapturableCashConcept = keyof typeof CASH_MOVEMENT_CONCEPTS;
/**
 * Tipo de lectura. Incluye conceptos que ya no se capturan: los pagos bancarios y
 * `RETIRO_CON_TARJETA`, que nunca existió en la operación y sólo aparece en movimientos
 * históricos anteriores al cambio.
 */
export type CashConcept = CapturableCashConcept | 'TRANSFERENCIA' | 'DEPOSITO' | 'RETIRO_CON_TARJETA';
export interface CashDay {
  id: number; fecha: string; version: number; saldoInicial: number; saldoActual: number;
  saldoContado: number | null; diferencia: number | null; apertura: CashCounts; cierre: Partial<CashCounts>;
  /** Desglose que debería haber: apertura + entradas − salidas. Null si la caja ya cerró. */
  denominacionesEsperadas: Partial<CashCounts> | null;
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
