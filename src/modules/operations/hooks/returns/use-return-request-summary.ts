import { useQuery } from '@tanstack/react-query';

import { getReturnRequestSummary } from '@/modules/operations/api/operations.api';

export function useReturnRequestSummary(returnRequestId?: number) {
  return useQuery({
    queryKey: ['return-request-summary', returnRequestId],
    queryFn: () => getReturnRequestSummary(returnRequestId!),
    enabled: !!returnRequestId,
  });
}
