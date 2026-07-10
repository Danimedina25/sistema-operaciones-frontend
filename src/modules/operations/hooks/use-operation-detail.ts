import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getOperationById } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { PaymentOperationResponse } from '../types/operations.types.ts';

export function useOperationDetail(operationId: number) {
  const [operation, setOperation] = useState<PaymentOperationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getOperationById(operationId);
      setOperation(result);
    } catch (fetchError) {
      const message = getApiErrorMessage(fetchError);
      setError(message);
      toast.error(message);
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
    error,
    fetchOperation,
  };
}