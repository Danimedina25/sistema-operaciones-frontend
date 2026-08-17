import { useAuth } from '@/modules/auth/store/auth.context';
import { GerenteDashboard } from '@/modules/gerente/components/GerenteDashboard';
import { ExecutiveDashboard } from '@/modules/direccion/components/ExecutiveDashboard';

/**
 * Selecciona los widgets de dashboard según el/los rol(es) del usuario
 * autenticado. Si un usuario tiene varios roles, se combinan sin
 * duplicarse (cada bloque se renderiza como máximo una vez).
 */
export default function DashboardPage() {
  const { hasRole } = useAuth();

  const showGerenteDashboard = hasRole(['GERENTE']);
  const showExecutiveDashboard = hasRole(['DIRECCION', 'ADMIN']);

  if (!showGerenteDashboard && !showExecutiveDashboard) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bienvenido al sistema de operaciones financieras.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showGerenteDashboard && <GerenteDashboard />}
      {showExecutiveDashboard && <ExecutiveDashboard />}
    </div>
  );
}
