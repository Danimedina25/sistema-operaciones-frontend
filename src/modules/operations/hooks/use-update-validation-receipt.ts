import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateValidationReceipt } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseUpdateValidationReceiptOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateValidationReceipt(options?: UseUpdateValidationReceiptOptions) {
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);
  const { user } = useAuth();

  const submitUpdateValidationReceipt = async (
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

      await updateValidationReceipt(paymentId, {
        comprobanteValidacionUrl: uploadResult.downloadUrl,
      });

      toast.success('Comprobante de validación actualizado correctamente');
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
    submitUpdateValidationReceipt,
  };
}
