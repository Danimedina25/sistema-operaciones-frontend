import type { RoleName } from '@/modules/auth/types/auth.types';
import type { UserResponse } from '@/modules/users/types/users.types';

export interface UsersFilters {
  search: string;
  role: RoleName | 'ALL';
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export function filterUsers(users: UserResponse[], filters: UsersFilters): UserResponse[] {
  return users.filter((user) => {
    const matchesSearch =
      !filters.search ||
      user.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.correo.toLowerCase().includes(filters.search.toLowerCase());

    const matchesRole =
      filters.role === 'ALL' || user.roleName === filters.role;

    const matchesStatus =
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && user.activo) ||
      (filters.status === 'INACTIVE' && !user.activo);

    return matchesSearch && matchesRole && matchesStatus;
  });
}