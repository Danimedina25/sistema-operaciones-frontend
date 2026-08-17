import { useQuery } from '@tanstack/react-query';
import { getStalledOperations } from '@/modules/operations/api/operations.api';

const PAGE_SIZE = 10;
export const DEFAULT_STALLED_THRESHOLD_HOURS = 48;

export function useStalledOperations(thresholdHours: number = DEFAULT_STALLED_THRESHOLD_HOURS) {
  return useQuery({
    queryKey: ['stalled-operations', thresholdHours],
    queryFn: () => getStalledOperations(0, PAGE_SIZE, thresholdHours),
  });
}
