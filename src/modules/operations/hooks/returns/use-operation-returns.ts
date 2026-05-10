// hooks/useOperationsReturns.ts

import { useQuery } from '@tanstack/react-query';

import { OperationsFilters } from '../../types/operations.types.ts';
import { getOperationsReadyForReturn, getReturnOperationById, getReturnsByOperationId } from '../../api/operations.api.js';


export function useOperationsReadyForReturn(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
) {
  return useQuery({
    queryKey: ['operations-ready-for-return', page, pageSize, filters],
    queryFn: () =>
      getOperationsReadyForReturn(page, pageSize, filters),
  });
}

export function useReturnOperationById(operationId?: number) {
  return useQuery({
    queryKey: ['return-operation', operationId],
    queryFn: () => getReturnOperationById(operationId!),
    enabled: !!operationId,
  });
}

export function useReturnsByOperationId(operationId?: number) {
  return useQuery({
    queryKey: ['operation-returns', operationId],
    queryFn: () => getReturnsByOperationId(operationId!),
    enabled: !!operationId,
  });
}