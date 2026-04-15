import type { RoleName } from '@/modules/auth/types/auth.types';

export interface UserRoleOption {
  id: number;
  name: RoleName;
  label: string;
}

export const USER_ROLE_OPTIONS: UserRoleOption[] = [
  { id: 1, name: 'ADMIN', label: 'Administrador' },
  { id: 2, name: 'GERENTE', label: 'Gerente' },
  { id: 3, name: 'SOCIO_COMERCIAL', label: 'Socio Comercial' },
  { id: 4, name: 'VALIDADOR', label: 'Validador' },
  { id: 5, name: 'JEFA_CAJAS', label: 'Jefa de Cajas' },
  { id: 6, name: 'AUXILIAR_CUENTAS', label: 'Auxiliar de Cuentas' },
];

export function getRoleLabelById(roleId: number): string {
  return USER_ROLE_OPTIONS.find((role) => role.id === roleId)?.label ?? 'Rol desconocido';
}