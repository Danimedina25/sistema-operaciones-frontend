import { useState } from 'react';
import toast from 'react-hot-toast';

import { cancelReturnInstallment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface Options {
  onSuccess?: () => void | Promise<void>;
}

export function useCancelReturnInstallment(options?: Options) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCancelReturnInstallment = async (
    installmentId: number,
    motivo: string,
  ) => {
    try {
      if (!motivo.trim()) {
        throw new Error('El motivo de cancelación es obligatorio');
      }
      setIsSubmitting(true);
      await cancelReturnInstallment(installmentId, { motivo: motivo.trim() });
      toast.success('Parcialidad cancelada');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitCancelReturnInstallment };
}
