import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getOperationById } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { PaymentOperationResponse } from '../types/operations.types.ts';

export function useOperationDetail(operationId: number) {
  const [operation, setOperation] = useState<PaymentOperationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Solo la primera carga de cada operación muestra el esqueleto. Un refresco tras validar o
  // rechazar conserva la vista: desmontarla reabría paneles iniciados desde la URL.
  const loadedOperationId = useRef<number | null>(null);

  const fetchOperation = useCallback(async () => {
    try {
      if (loadedOperationId.current !== operationId) setIsLoading(true);
      setError(null);
      const result = await getOperationById(operationId);
      setOperation(result);
      loadedOperationId.current = operationId;
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

  useEffect(() => {
    const refresh = (event: Event) => {
      if ((event as CustomEvent<{ operationId: number }>).detail.operationId === operationId) void fetchOperation();
    };
    window.addEventListener('cheque-updated', refresh);
    return () => window.removeEventListener('cheque-updated', refresh);
  }, [operationId, fetchOperation]);

  return {
    operation,
    isLoading,
    error,
    fetchOperation,
  };
}