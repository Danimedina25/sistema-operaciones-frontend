import type { RoleName } from '@/modules/auth/types/auth.types';
import type { Cheque, ChequeAction, ChequeCommand } from './types';
import { countCents } from '@/modules/caja-general/utils/cash-amounts';
export function allowedChequeActions(cheque: Pick<Cheque, 'estado' | 'requiereConciliacion'>, hasRole: (roles: RoleName[]) => boolean): ChequeAction[] {
  if (cheque.requiereConciliacion || !cheque.estado) return [];
  const actions: ChequeAction[] = [];
  if (cheque.estado === 'POR_COBRAR') {
    if (hasRole(['ADMIN', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS'])) actions.push('DEPOSITAR');
    if (hasRole(['ADMIN', 'JEFA_CUENTAS'])) actions.push('COBRAR_BANCO', 'ASIGNAR_COBRO_EFECTIVO', 'CANCELAR');
  }
  if (cheque.estado === 'DEPOSITADO' && hasRole(['ADMIN', 'JEFA_CUENTAS'])) {
    actions.push('COBRAR_BANCO', 'DEVOLVER');
  }
  if (cheque.estado === 'PENDIENTE_COBRO_EFECTIVO') {
    if (hasRole(['ADMIN', 'JEFA_CAJAS'])) actions.push('CONFIRMAR_COBRO_EFECTIVO', 'DEVOLVER_A_CUENTAS');
    if (hasRole(['ADMIN', 'JEFA_CUENTAS'])) actions.push('RETIRAR_COBRO_EFECTIVO');
  }
  return actions;
}
export function validateChequeCommand(cheque: Cheque, command: ChequeCommand, allowed: ChequeAction[]): string | null {
  if (!allowed.includes(command.accion)) return 'Esta acción no está permitida para el cheque.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(command.fecha) || !Number.isFinite(Date.parse(command.fecha)) || new Date(command.fecha).toISOString().slice(0, 10) !== command.fecha) return 'Selecciona una fecha válida.';
  if (['DEVOLVER', 'CANCELAR', 'DEVOLVER_A_CUENTAS', 'RETIRAR_COBRO_EFECTIVO'].includes(command.accion)) return command.motivo?.trim() ? null : 'Indica el motivo.';
  if (['ASIGNAR_COBRO_EFECTIVO'].includes(command.accion)) return null;
  if (!command.comprobanteUrl) return 'Adjunta el comprobante.';
  if (['DEPOSITAR', 'COBRAR_BANCO'].includes(command.accion) && (!command.cuentaDestinoId || command.cuentaDestinoId < 1)) return 'Selecciona una cuenta bancaria.';
  if (command.accion === 'CONFIRMAR_COBRO_EFECTIVO') {
    if (!command.diaCajaId) return 'Abre Caja General para recibir el efectivo.';
    if (command.denominaciones && Object.values(command.denominaciones).some(n => !Number.isInteger(n) || n < 0)) return 'Las denominaciones deben ser cantidades enteras no negativas.';
    if (!command.denominaciones || countCents(command.denominaciones) !== Math.round(cheque.monto * 100)) return 'El desglose debe sumar exactamente el importe del cheque.';
  }
  return null;
}
