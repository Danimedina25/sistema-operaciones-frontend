import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import type { RoleName } from '@/modules/auth/types/auth.types';

interface CanAccessProps {
  roles: RoleName[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ roles, children, fallback = null }: CanAccessProps) {
  const { hasRole } = useAuth();

  return hasRole(roles) ? <>{children}</> : <>{fallback}</>;
}