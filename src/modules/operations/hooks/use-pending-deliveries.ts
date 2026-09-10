import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getPendingInstallmentPickups } from '../api/operations.api';

export function usePendingDeliveries(queue: string, page = 0, tipoPago = '', supervisedRole = '') {
  const { user, hasRole } = useAuth();
  // Cambia la clave al cambiar el día de negocio; CONFIRMATION incluye todo el historial.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cancun' }).format(new Date());
  return useQuery({
    queryKey: ['staff-deliveries', user?.userId, supervisedRole, queue, queue === 'TODAY' ? today : '', tipoPago, page, 10],
    queryFn: () => getPendingInstallmentPickups(queue, page, tipoPago, supervisedRole),
    enabled: (hasRole(['JEFA_CAJAS']) || (hasRole(['GERENTE']) && supervisedRole === 'JEFA_CAJAS')) && ['TODAY', 'CONFIRMATION'].includes(queue),
    refetchInterval: 30_000,
  });
}
