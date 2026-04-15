import { useState } from 'react';
import toast from 'react-hot-toast';
import { validatePayment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseValidatePaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useValidatePayment(options?: UseValidatePaymentOptions) {
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);

  const submitValidatePayment = async (paymentId: number) => {
    try {
      setProcessingPaymentId(paymentId);

      await validatePayment(paymentId, {});

      toast.success('Pago validado correctamente');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setProcessingPaymentId(null);
    }
  };

  return {
    processingPaymentId,
    submitValidatePayment,
  };
}