// hooks/returns/use-mark-cash-return-delivered.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { markCashReturnAsDelivered } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseMarkCashReturnDeliveredOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useMarkCashReturnDelivered(
  options?: UseMarkCashReturnDeliveredOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMarkCashReturnDelivered = async (returnPaymentId: number) => {
    try {
      setIsSubmitting(true);

      await markCashReturnAsDelivered(returnPaymentId);

      toast.success('Efectivo marcado como entregado');

      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitMarkCashReturnDelivered,
  };
}
