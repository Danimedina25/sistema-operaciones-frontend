import type { RoleName } from '@/modules/auth/types/auth.types';

/**
 * Fuente única de verdad de acceso por ruta/módulo.
 * Los valores replican exactamente los roles que ya aplicaba `RoleGuard`
 * en el router antes de esta centralización — no se cambia ninguna regla
 * de negocio, solo se deduplica entre router, Sidebar y permissions.ts.
 */
export const ROUTE_ACCESS = {
  corte: ['ADMIN', 'GERENTE', 'DIRECCION'],
  users: ['ADMIN', 'GERENTE', 'DIRECCION'],
  clientes: ['ADMIN', 'GERENTE', 'DIRECCION', 'SOCIO_COMERCIAL'],
  mycomercialpartners: ['ADMIN', 'GERENTE', 'DIRECCION', 'SOCIO_COMERCIAL'],
  returnsforrequest: ['ADMIN', 'GERENTE', 'DIRECCION', 'SOCIO_COMERCIAL'],
  returnsRequested: ['ADMIN', 'GERENTE', 'DIRECCION', 'SOCIO_COMERCIAL'],
  returnRequestDetail: ['ADMIN', 'GERENTE', 'DIRECCION', 'SOCIO_COMERCIAL'],
  returnsRequestedDetail: ['ADMIN', 'GERENTE', 'DIRECCION', 'SOCIO_COMERCIAL'],
  miscomisiones: ['ADMIN', 'SOCIO_COMERCIAL'],
  operations: [
    'ADMIN',
    'SOCIO_COMERCIAL',
    'GERENTE',
    'DIRECCION',
    'JEFA_CAJAS',
    'JEFA_CUENTAS',
    'AUXILIAR_CUENTAS',
  ],
  bankAccounts: ['ADMIN', 'GERENTE', 'DIRECCION', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS'],
  comisionessocios: ['ADMIN', 'GERENTE', 'DIRECCION'],
  configuraciones: ['ADMIN', 'GERENTE', 'DIRECCION'],
  operationDetail: [
    'ADMIN',
    'SOCIO_COMERCIAL',
    'JEFA_CAJAS',
    'JEFA_CUENTAS',
    'AUXILIAR_CUENTAS',
    'GERENTE',
    'DIRECCION',
  ],
  returnsforpayment: [
    'ADMIN',
    'GERENTE',
    'DIRECCION',
    'JEFA_CAJAS',
    'JEFA_CUENTAS',
    'AUXILIAR_CUENTAS',
  ],
  devolutionDetail: [
    'ADMIN',
    'GERENTE',
    'DIRECCION',
    'JEFA_CAJAS',
    'JEFA_CUENTAS',
    'AUXILIAR_CUENTAS',
  ],
  todayCashDeliveries: ['ADMIN', 'GERENTE', 'DIRECCION', 'JEFA_CAJAS'],
} as const satisfies Record<string, RoleName[]>;

export type RouteAccessKey = keyof typeof ROUTE_ACCESS;

export function getRouteAllowedRoles(key: RouteAccessKey): RoleName[] {
  return ROUTE_ACCESS[key];
}
