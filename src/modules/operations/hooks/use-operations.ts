import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getMyOperations,
  getOperations,
} from '@/modules/operations/api/operations.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import {
  OperationsFilters,
  PaymentOperationResponse,
} from '../types/operations.types.ts';

export function useOperations(filters: OperationsFilters) {
  const { hasRole } = useAuth();

  const [operations, setOperations] = useState<PaymentOperationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const isSocioComercial = hasRole(['SOCIO_COMERCIAL']);

  const fetchOperations = useCallback(async (page: number) => {
    try {
      setIsLoading(true);

      const result = isSocioComercial
        ? await getMyOperations(page, pageSize, filters)
        : await getOperations(page, pageSize, filters);

      setOperations(result.content);
      setCurrentPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [isSocioComercial, pageSize, filters]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);

  useEffect(() => {
    void fetchOperations(currentPage);
  }, [fetchOperations, currentPage]);

  return {
    operations,
    isLoading,
    fetchOperations,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    setCurrentPage,
  };
}