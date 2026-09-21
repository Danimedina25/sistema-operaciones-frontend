import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';

export type BankMovementOrigin = 'PAGO' | 'RETORNO' | 'CAJA_GENERAL';
export type BankMovementDirection = 'ENTRADA' | 'SALIDA';

export const BANK_MOVEMENT_ORIGINS: Record<BankMovementOrigin, string> = {
  PAGO: 'Pago de operación',
  RETORNO: 'Retorno al cliente',
  CAJA_GENERAL: 'Caja General',
};

export const BANK_MOVEMENT_TYPES = {
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
  CHEQUE: 'Cheque',
  RETIRO_SIN_TARJETA: 'Retiro sin tarjeta',
} as const;

export type BankMovementType = keyof typeof BANK_MOVEMENT_TYPES;

export interface BankMovement {
  /** Identificador estable del renglón: el libro es derivado, no tiene id propio. */
  id: string;
  origen: BankMovementOrigin;
  sourceId: number;
  fecha: string;
  direccion: BankMovementDirection;
  tipo: BankMovementType;
  concepto: string;
  monto: number;
  bankAccountId: number;
  cuentaBanco: string;
  cuentaTitular: string;
  /** Llega enmascarado desde el backend. */
  cuentaNumero: string;
  cuentaActiva: boolean;
  operacionId: number | null;
  parcialidadId: number | null;
  cashMovementId: number | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
}

export interface BankMovementTotals {
  totalEntradas: number;
  totalSalidas: number;
  variacionNeta: number;
  totalMovimientos: number;
}

export interface BankMovementFilters {
  desde: string;
  hasta: string;
  bankAccountId: number | null;
  banco: string;
  direccion: BankMovementDirection | '';
  tipo: BankMovementType | '';
}

/**
 * Los filtros que el libro de movimientos captura por su cuenta. El periodo queda fuera
 * porque lo fija la cabecera de Cortes y saldos, compartida con las otras pestañas.
 */
export type BankMovementSideFilters = Omit<BankMovementFilters, 'desde' | 'hasta'>;

export type BankMovementPageApiResponse = ApiResponse<PaginatedResponse<BankMovement>>;
export type BankMovementTotalsApiResponse = ApiResponse<BankMovementTotals>;
