import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';
export type ChequeState = 'POR_COBRAR' | 'DEPOSITADO' | 'PENDIENTE_COBRO_EFECTIVO' | 'COBRADO' | 'DEVUELTO' | 'CANCELADO';
export type ChequeAction =
  | 'DEPOSITAR'
  | 'COBRAR_BANCO'
  | 'ASIGNAR_COBRO_EFECTIVO'
  | 'CONFIRMAR_COBRO_EFECTIVO'
  | 'DEVOLVER_A_CUENTAS'
  | 'RETIRAR_COBRO_EFECTIVO'
  | 'DEVOLVER'
  | 'CANCELAR';
export const chequeLabels: Record<ChequeState, string> = {
  POR_COBRAR: 'Recibido',
  DEPOSITADO: 'En compensación',
  PENDIENTE_COBRO_EFECTIVO: 'Pendiente de cobro en efectivo',
  COBRADO: 'Cobrado',
  DEVUELTO: 'Devuelto',
  CANCELADO: 'Anulado',
};
export const actionLabels: Record<ChequeAction, string> = {
  DEPOSITAR: 'Depositar en cuenta',
  COBRAR_BANCO: 'Confirmar acreditación bancaria',
  ASIGNAR_COBRO_EFECTIVO: 'Enviar a cobro en efectivo',
  CONFIRMAR_COBRO_EFECTIVO: 'Confirmar efectivo recibido',
  DEVOLVER_A_CUENTAS: 'No se pudo cobrar',
  RETIRAR_COBRO_EFECTIVO: 'Retirar solicitud de cobro en efectivo',
  DEVOLVER: 'Registrar devolución bancaria',
  CANCELAR: 'Anular recepción',
};
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
