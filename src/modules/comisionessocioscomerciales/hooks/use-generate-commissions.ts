import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  generatePendingCommissions,
} from '../api/commercial-partner-commissions.api';

import { getApiErrorMessage } from '@/shared/utils/errors';

export function useGenerateCommissions() {
  const [isLoading, setIsLoading] =
    useState(false);

  const handleGenerateCommissions =
    async () => {
      try {
        setIsLoading(true);

        await generatePendingCommissions();

        toast.success(
          'Comisiones generadas exitosamente',
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(error),
        );
      } finally {
        setIsLoading(false);
      }
    };

  return {
    isLoading,
    handleGenerateCommissions,
  };
}