import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getMyOperations,
  getOperations,
} from '@/modules/operations/api/operations.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { PaymentOperationResponse } from '../types/operations.types.ts';

export function useOperations() {
  const { hasRole } = useAuth();

  const [operations, setOperations] = useState<PaymentOperationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSocioComercial = hasRole(['SOCIO_COMERCIAL']);

  const fetchOperations = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = isSocioComercial
        ? await getMyOperations()
        : await getOperations();

      setOperations(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [isSocioComercial]);

  useEffect(() => {
    void fetchOperations();
  }, [fetchOperations]);

  return {
    operations,
    isLoading,
    fetchOperations,
  };
}