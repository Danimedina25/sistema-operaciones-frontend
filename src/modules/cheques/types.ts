import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';
export type ChequeState = 'POR_COBRAR' | 'DEPOSITADO' | 'COBRADO' | 'DEVUELTO' | 'CANCELADO';
export type ChequeAction = 'DEPOSITAR' | 'COBRAR_BANCO' | 'COBRAR_EFECTIVO' | 'DEVOLVER' | 'CANCELAR';
export const chequeLabels: Record<ChequeState, string> = { POR_COBRAR: 'Por cobrar', DEPOSITADO: 'Depositado / en compensación', COBRADO: 'Cobrado', DEVUELTO: 'Devuelto', CANCELADO: 'Cancelado' };
export const actionLabels: Record<ChequeAction, string> = { DEPOSITAR: 'Registrar depósito', COBRAR_BANCO: 'Confirmar cobro en banco', COBRAR_EFECTIVO: 'Confirmar cobro en efectivo', DEVOLVER: 'Registrar devolución', CANCELAR: 'Cancelar cheque' };
export interface Cheque {
  id: number; pagoId: number; operacionId: number; clienteNombre: string; numeroCheque: string;
  bancoEmisor: string; emisor: string; beneficiario: string; monto: number; moneda: string;
  estado: ChequeState | null; requiereConciliacion: boolean; version: number;
  fechaRecepcion: string; cuentaDestinoId: number | null; cuentaDestinoEtiqueta: string | null;
  destinoCobro: 'EFECTIVO' | 'CUENTA_BANCARIA' | null; comprobanteUrl: string;
  historial: { id: number; accion: string; fecha: string; usuarioNombre: string; motivo?: string; comprobanteUrl?: string }[];
}
export interface ChequeCommand {
  requestId: string; version: number; accion: ChequeAction; fecha: string;
  cuentaDestinoId?: number; comprobanteUrl?: string; motivo?: string; diaCajaId?: number; denominaciones?: CashCounts;
}
export interface ChequeFilters { estados: string; busqueda: string; cliente: string; operacionId: string; banco: string; desde: string; hasta: string; page: number }
export interface ChequesPage { content: Cheque[]; totalPages: number; totalElements: number; totales: { moneda: string; porCobrar: number; depositados: number; cobrados: number }[] }
