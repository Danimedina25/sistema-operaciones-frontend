import { useQuery } from '@tanstack/react-query';
import { getLateReturns } from '@/modules/operations/api/operations.api';

const PAGE_SIZE = 20;

export function useLateReturns() {
  return useQuery({
    queryKey: ['late-returns'],
    queryFn: () => getLateReturns(0, PAGE_SIZE),
  });
}
