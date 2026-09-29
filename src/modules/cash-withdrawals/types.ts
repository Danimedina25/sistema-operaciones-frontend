import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';

/** Cómo salió el efectivo de la cuenta. La forma separa grupos en el libro de Caja General. */
export type WithdrawalMethod = 'RETIRO_CON_TARJETA' | 'RETIRO_SIN_TARJETA' | 'COBRO_CHEQUE';

export const WITHDRAWAL_METHODS: Record<WithdrawalMethod, string> = {
  RETIRO_CON_TARJETA: 'Retiro con tarjeta (TD)',
  RETIRO_SIN_TARJETA: 'Retiro sin tarjeta (RST)',
  COBRO_CHEQUE: 'Cobro de cheque',
};

/**
 * PENDIENTE: el efectivo va en camino; el saldo del banco no ha bajado pero ya no está
 * disponible. CONFIRMADO: entró a la caja y salió del banco.
 */
export type WithdrawalStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'CANCELADO';

export const WITHDRAWAL_STATUSES: Record<WithdrawalStatus, string> = {
  PENDIENTE: 'En tránsito',
  CONFIRMADO: 'Recibido en caja',
  RECHAZADO: 'Rechazado por Caja',
  CANCELADO: 'Cancelado',
};

export interface BankCashWithdrawal {
  id: number;
  registradoEn: string;
  bankAccountId: number;
  cuenta: string;
  cuentaTitular: string;
  cuentaNumero: string;
  /** Banco agrupado: "SCOTIABANK" para "SCOTIA NOMINA". */
  banco: string;
  forma: WithdrawalMethod;
  formaEtiqueta: string;
  monto: number;
  referencia: string | null;
  comprobanteUrl: string | null;
  estatus: WithdrawalStatus;
  motivo: string | null;
  registradoPorId: number;
  registradoPorNombre: string;
  resueltoPorNombre: string | null;
  resueltoEn: string | null;
  cashMovementId: number | null;
}

export interface RegisterWithdrawal {
  requestId: string;
  bankAccountId: number;
  forma: WithdrawalMethod;
  monto: number;
  referencia: string | null;
  comprobanteUrl: string | null;
}

export interface ConfirmWithdrawal {
  diaCajaId: number;
  denominaciones: CashCounts;
}
