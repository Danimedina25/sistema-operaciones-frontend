import type { RoleName } from '@/modules/auth/types/auth.types';

export const permissions = {
  usersModule: ['ADMIN'] as RoleName[],
  bankAccountsModule: ['ADMIN', 'GERENTE', 'AUXILIAR_CUENTAS'] as RoleName[],
};