import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperations, getOperationsWithRequestedReturns } from '../api/operations.api';
import type { OperationsFilters } from '../types/operations.types.ts';
import { applyWorkQueue } from '../utils/staff-work';

export function useWorkOperations(filters: OperationsFilters, page = 0, returns = false, enabled = true) {
  const { user, hasRole } = useAuth();
  const effective = applyWorkQueue(filters);
  const mode = returns ? 'returns' : hasRole(['SOCIO_COMERCIAL']) && !filters.workQueue ? 'my' : 'all';
  return useQuery({
    queryKey: ['work-operations', user?.userId, mode, effective, page, 10],
    queryFn: () => returns ? getOperationsWithRequestedReturns(page, 10, effective)
      : mode === 'my' ? getMyOperations(page, 10, effective) : getOperations(page, 10, effective),
    enabled,
    refetchInterval: 30_000,
  });
}
