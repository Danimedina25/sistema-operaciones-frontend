import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  regenerateOperationCommissions,
} from '../api/commercial-partner-commissions.api';

import { getApiErrorMessage } from '@/shared/utils/errors';

export function useRegenerateOperationCommissions() {
  const [isLoading, setIsLoading] =
    useState(false);

  const [processingOperationId,
    setProcessingOperationId] =
    useState<number | null>(null);

  const handleRegenerate =
    async (operationId: number) => {
      try {
        setProcessingOperationId(
          operationId,
        );

        setIsLoading(true);

        await regenerateOperationCommissions(
          operationId,
        );

        toast.success(
          'Comisiones regeneradas exitosamente',
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(error),
        );
      } finally {
        setProcessingOperationId(null);
        setIsLoading(false);
      }
    };

  return {
    isLoading,
    processingOperationId,
    handleRegenerate,
  };
}