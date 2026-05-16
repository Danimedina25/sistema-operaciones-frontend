// hooks/useOperationsReturns.ts

import { useQuery } from '@tanstack/react-query';

import {
  getOperationsAvailableToRequestReturn,
  getOperationsWithRequestedReturns,
  getReturnOperationById,
  getReturnsByOperationId,
} from '../../api/operations.api';
import { OperationsFilters } from '../../types/operations.types.ts';

export function useOperationsAvailableToRequestReturn(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
) {
  return useQuery({
    queryKey: ['operations-available-to-request-return', page, pageSize, filters],
    queryFn: () =>
      getOperationsAvailableToRequestReturn(page, pageSize, filters),
  });
}

export function useOperationsWithRequestedReturns(
  page: number,
  pageSize: number,
  filters: OperationsFilters,
) {
  return useQuery({
    queryKey: ['operations-with-requested-returns', page, pageSize, filters],
    queryFn: () =>
      getOperationsWithRequestedReturns(page, pageSize, filters),
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