import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { paths } from '@/routes/paths';

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}