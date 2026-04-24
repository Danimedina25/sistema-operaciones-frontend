import { useState } from 'react';
import toast from 'react-hot-toast';
import { rejectPayment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseRejectPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useRejectPayment(options?: UseRejectPaymentOptions) {
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);

  const submitRejectPayment = async (paymentId: number, motivo: string) => {
    try {
      setProcessingPaymentId(paymentId);

      await rejectPayment(paymentId, { observaciones: motivo });

      toast.success('Pago rechazado correctamente');
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
    submitRejectPayment,
  };
}