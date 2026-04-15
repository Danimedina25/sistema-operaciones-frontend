import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import type { RoleName } from '@/modules/auth/types/auth.types';
import { paths } from '@/routes/paths';

interface RoleGuardProps {
  allowedRoles: RoleName[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Cargando permisos...</p>
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}