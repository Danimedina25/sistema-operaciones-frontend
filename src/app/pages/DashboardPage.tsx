import { useAuth } from '@/modules/auth/store/auth.context';
import { GerenteDashboard } from '@/modules/gerente/components/GerenteDashboard';
import { ExecutiveDashboard } from '@/modules/direccion/components/ExecutiveDashboard';

export default function DashboardPage() {
  const { hasRole } = useAuth();
  if (hasRole(['DIRECCION', 'ADMIN'])) return <ExecutiveDashboard />;
  if (hasRole(['GERENTE'])) return <GerenteDashboard />;
  return null;
}
