import type { RoleName } from '@/modules/auth/types/auth.types';

export const roleLabels: Record<RoleName, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  SOCIO_COMERCIAL: 'Socio Comercial',
  VALIDADOR: 'Validador',
  JEFA_CAJAS: 'Jefa de Cajas',
  AUXILIAR_CUENTAS: 'Auxiliar de Cuentas',
};

export function formatRole(role: RoleName): string {
  return roleLabels[role] ?? role;
}

export function formatRoles(roles: RoleName[]): string {
  return roles.map(formatRole).join(', ');
}