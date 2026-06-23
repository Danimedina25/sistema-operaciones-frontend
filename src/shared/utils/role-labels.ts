import type { RoleName } from '@/modules/auth/types/auth.types';

export const roleLabels: Record<RoleName, string> = {
  DIRECCION: 'Director',
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  SOCIO_COMERCIAL: 'Socio Comercial',
  JEFA_CAJAS: 'Jefa de Cajas',
  JEFA_CUENTAS: 'Jefa de Cuentas',
  AUXILIAR_CUENTAS: 'Auxiliar de Cuentas',
};

export function formatRole(role: RoleName): string {
  return roleLabels[role] ?? role;
}

export function formatRoles(roles: RoleName[]): string {
  return roles.map(formatRole).join(', ');
}