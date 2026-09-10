import type { RoleName } from '@/modules/auth/types/auth.types';
import type { OperationsFilters } from '../types/operations.types.ts';

export type WorkQueue = 'CASH_INCOME' | 'BANK_INCOME' | 'CASH_RETURNS' | 'BANK_RETURNS';
export type SupervisedRole = Extract<RoleName, 'JEFA_CAJAS' | 'JEFA_CUENTAS' | 'AUXILIAR_CUENTAS'>;
export function staffCapabilities(roles: readonly RoleName[]) {
  return { cash: roles.includes('JEFA_CAJAS'), bank: roles.includes('JEFA_CUENTAS') || roles.includes('AUXILIAR_CUENTAS') };
}
export const emptyOperationFilters: OperationsFilters = {
  supervisedRole: '', operationId: 0, search: '', status: 'ALL', dateFilter: 'THIS_MONTH', startDate: '', endDate: '',
  activo: 'ACTIVE', paymentTypes: '', paymentStatus: '', returnStatuses: '', cuentaDestinoId: 0, banco: '', socioComercialId: 0,
  workQueue: '',
};
export function applyWorkQueue(filters: OperationsFilters): OperationsFilters {
  if (filters.workQueue === 'CASH_INCOME' || filters.workQueue === 'BANK_INCOME') return {
    ...filters, activo: 'ACTIVE', paymentStatus: 'PENDIENTE_VALIDACION',
    paymentTypes: filters.workQueue === 'CASH_INCOME' ? 'EFECTIVO' : 'TRANSFERENCIA,DEPOSITO,CHEQUE',
  };
  return filters;
}
