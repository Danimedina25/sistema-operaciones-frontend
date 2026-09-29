export const DENOMINATIONS = [
  ['D1000', 100000], ['D500', 50000], ['D200', 20000], ['D100', 10000],
  ['D50', 5000], ['D20', 2000], ['D10', 1000], ['D5', 500], ['D2', 200], ['D1', 100], ['D050', 50],
] as const;
export type Denomination = typeof DENOMINATIONS[number][0];
export type CashCounts = Record<Denomination, number>;
/**
 * Lo único que se captura a mano en Caja General es efectivo. El efectivo retirado de una
 * cuenta —cheque, retiro con o sin tarjeta— lo registra Cuentas y entra al confirmarlo en
 * "Retiros por confirmar".
 */
export type CapturableCashConcept = 'EFECTIVO';
/** Tipo de lectura: incluye lo que entra por otros flujos y los pagos bancarios históricos. */
export type CashConcept = CapturableCashConcept | 'CHEQUE' | 'RETIRO_SIN_TARJETA' | 'RETIRO_CON_TARJETA'
  | 'COBRO_CHEQUE_CLIENTE' | 'TRANSFERENCIA' | 'DEPOSITO';
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
/**
 * Renglón agrupado como lo lleva negocio: "Retiro 16 de 16 TD BANORTE", "Cheques BAJIO".
 * Junta los retiros del mismo día, forma y banco; cada uno sigue siendo su propio movimiento.
 */
export interface CashWithdrawalGroup {
  diaId: number; fecha: string; forma: 'TD' | 'RST' | 'CHEQUE'; banco: string;
  /** N: cuentas distintas retiradas (null en cheques). */
  cuentas: number | null;
  /** M: cuentas activas de ese banco (null en cheques). */
  totalCuentas: number | null;
  movimientos: number; total: number; movementIds: number[];
  /** El grupo se muestra en la posición y con el saldo de este movimiento. */
  ultimoMovimientoId: number;
  etiqueta: string;
}
export interface CashLedger { dias: CashDay[]; movimientos: CashMovement[]; grupos: CashWithdrawalGroup[] }
export interface OpenCashDay { fecha: string; saldoInicial: number; denominaciones: CashCounts }
export interface CloseCashDay { saldoContado: number; version: number; denominaciones: CashCounts; observaciones: string }
export interface CreateCashMovement {
  requestId: string; direccion: 'ENTRADA' | 'SALIDA'; tipo: CashConcept; concepto: string; banco: string | null;
  bankAccountId: number | null;
  monto: number | null; parcialidadId: number | null; denominaciones: CashCounts; comprobanteUrl: string | null;
}
