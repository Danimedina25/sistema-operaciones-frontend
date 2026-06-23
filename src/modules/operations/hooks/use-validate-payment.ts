import { useState } from 'react';
import toast from 'react-hot-toast';
import { validatePayment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseValidatePaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useValidatePayment(options?: UseValidatePaymentOptions) {
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);
  const { user } = useAuth();

  const submitValidatePayment = async (
    operationId: number,
    paymentId: number,
    comprobanteValidacion: File,
  ) => {
    try {
      if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
      }

      if (!comprobanteValidacion) {
        throw new Error('El comprobante de validación es obligatorio');
      }

      setProcessingPaymentId(paymentId);

      const uploadResult = await uploadOperationProof({
        file: comprobanteValidacion,
        userId: user.userId,
        operationId,
      });

      await validatePayment(paymentId, {
        comprobanteValidacionUrl: uploadResult.downloadUrl,
      });

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