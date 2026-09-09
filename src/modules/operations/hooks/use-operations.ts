import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  activateOperation,
  deactivateOperation,
} from '@/modules/operations/api/operations.api';
import { useWorkOperations } from './use-work-operations';
import { getApiErrorMessage } from '@/shared/utils/errors';
import {
  OperationsFilters,
} from '../types/operations.types.ts';

export function useOperations(filters: OperationsFilters) {
  const [pagination, setPagination] = useState({ filters, page: 0 });
  const currentPage = pagination.filters === filters ? pagination.page : 0;
  const setCurrentPage = (page: number) => setPagination({ filters, page });
  const query = useWorkOperations(filters, currentPage);
  const operations = query.data?.content ?? [];
  const isLoading = query.isFetching;
  const totalPages = query.data?.totalPages ?? 0;
  const totalElements = query.data?.totalElements ?? 0;
  const pageSize = 10;
  const [processingOperationId, setProcessingOperationId] = useState<number | null>(null);
  async function fetchOperations(page: number) {
    if (page !== currentPage) setCurrentPage(page);
    else await query.refetch();
  }

  const handleActivate = async (operationId: number) => {
    try {
      setProcessingOperationId(operationId);
      await activateOperation(operationId);

      await query.refetch();

      toast.success('Operación activada correctamente');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingOperationId(null);
    }
  };

  const handleDeactivate = async (operationId: number) => {
    try {
      setProcessingOperationId(operationId);
      await deactivateOperation(operationId);

      await query.refetch();

      toast.success('Operación desactivada correctamente');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingOperationId(null);
    }
  };

  return {
    error: query.error,
    operations,
    isLoading,
    fetchOperations,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    setCurrentPage,
    processingOperationId,
    handleActivate,
    handleDeactivate,
  };
}