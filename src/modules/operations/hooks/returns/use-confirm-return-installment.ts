import { useState } from 'react';
import toast from 'react-hot-toast';

import { confirmReturnInstallment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface Options {
  onSuccess?: () => void | Promise<void>;
}

export function useConfirmReturnInstallment(options?: Options) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitConfirmReturnInstallment = async (installmentId: number) => {
    try {
      setIsSubmitting(true);
      await confirmReturnInstallment(installmentId);
      toast.success('Confirmaste la recepción de la parcialidad');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitConfirmReturnInstallment };
}
