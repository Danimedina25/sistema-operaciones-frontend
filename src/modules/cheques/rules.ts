import type { RoleName } from '@/modules/auth/types/auth.types';
import type { Cheque, ChequeAction, ChequeCommand } from './types';
import { countCents } from '@/modules/caja-general/utils/cash-amounts';
export function allowedChequeActions(cheque: Pick<Cheque, 'estado' | 'requiereConciliacion'>, hasRole: (roles: RoleName[]) => boolean): ChequeAction[] {
  if (cheque.requiereConciliacion || !cheque.estado || !['POR_COBRAR', 'DEPOSITADO'].includes(cheque.estado)) return [];
  const actions: ChequeAction[] = [];
  if (hasRole(['ADMIN', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS'])) {
    if (cheque.estado === 'POR_COBRAR') actions.push('DEPOSITAR');
    actions.push('COBRAR_BANCO', 'DEVOLVER');
    if (cheque.estado === 'POR_COBRAR') actions.push('CANCELAR');
  }
  if (cheque.estado === 'POR_COBRAR' && hasRole(['ADMIN', 'JEFA_CAJAS'])) actions.push('COBRAR_EFECTIVO');
  return actions;
}
export function validateChequeCommand(cheque: Cheque, command: ChequeCommand, allowed: ChequeAction[]): string | null {
  if (!allowed.includes(command.accion)) return 'Esta acción no está permitida para el cheque.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(command.fecha) || !Number.isFinite(Date.parse(command.fecha)) || new Date(command.fecha).toISOString().slice(0, 10) !== command.fecha) return 'Selecciona una fecha válida.';
  if (['DEVOLVER', 'CANCELAR'].includes(command.accion)) return command.motivo?.trim() ? null : 'Indica el motivo.';
  if (!command.comprobanteUrl) return 'Adjunta el comprobante.';
  if (['DEPOSITAR', 'COBRAR_BANCO'].includes(command.accion) && (!command.cuentaDestinoId || command.cuentaDestinoId < 1)) return 'Selecciona una cuenta bancaria.';
  if (command.accion === 'COBRAR_EFECTIVO') {
    if (!command.diaCajaId) return 'Abre Caja General para recibir el efectivo.';
    if (command.denominaciones && Object.values(command.denominaciones).some(n => !Number.isInteger(n) || n < 0)) return 'Las denominaciones deben ser cantidades enteras no negativas.';
    if (!command.denominaciones || countCents(command.denominaciones) !== Math.round(cheque.monto * 100)) return 'El desglose debe sumar exactamente el importe del cheque.';
  }
  return null;
}
