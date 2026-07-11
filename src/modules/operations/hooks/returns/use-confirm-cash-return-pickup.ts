// hooks/returns/use-confirm-cash-return-pickup.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { confirmCashReturnPickup } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseConfirmCashReturnPickupOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useConfirmCashReturnPickup(
  options?: UseConfirmCashReturnPickupOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitConfirmCashReturnPickup = async (returnPaymentId: number) => {
    try {
      setIsSubmitting(true);

      await confirmCashReturnPickup(returnPaymentId);

      toast.success('Confirmaste la recepción del retorno en efectivo');

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
    submitConfirmCashReturnPickup,
  };
}
