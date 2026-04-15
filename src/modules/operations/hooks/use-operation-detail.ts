import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getOperationById } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { PaymentOperationResponse } from '../types/operations.types.ts';

export function useOperationDetail(operationId: number) {
  const [operation, setOperation] = useState<PaymentOperationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOperation = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getOperationById(operationId);
      setOperation(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    void fetchOperation();
  }, [fetchOperation]);

  return {
    operation,
    isLoading,
    fetchOperation,
  };
}