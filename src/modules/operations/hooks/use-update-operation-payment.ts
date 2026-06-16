import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/modules/auth/store/auth.context';
import { updateOperationPayment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { UpdateOperationPaymentFormValues } from '../schemas/update-operation-payment.schema';

interface UseUpdateOperationPaymentOptions {
  onSuccess?: (paymentId: number) => void | Promise<void>;
}

export function useUpdateOperationPayment(
  options?: UseUpdateOperationPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  const submitUpdateOperationPayment = async (
    paymentId: number,
    operationId: number,
    values: UpdateOperationPaymentFormValues,
    currentComprobanteUrl: string,
  ) => {
    try {
      if (!user?.userId) {
        throw new Error(
          'No se pudo identificar el usuario autenticado',
        );
      }

      setIsSubmitting(true);

      let comprobanteUrl = currentComprobanteUrl;

      const comprobante =
        values.comprobante?.item(0);

      // Solo subir si el usuario seleccionó uno nuevo
      if (comprobante) {
        const uploadResult =
          await uploadOperationProof({
            file: comprobante,
            userId: user.userId,
            operationId,
          });

        comprobanteUrl =
          uploadResult.downloadUrl;
      }

      const payment =
        await updateOperationPayment(
          paymentId,
          {
            monto: values.monto,
            tipoPago: values.tipoPago,
            cuentaDestinoId:
              values.cuentaDestinoId,
            comprobanteUrl,
            observaciones:
              values.observaciones?.trim() ||
              undefined,
          },
        );

      toast.success(
        'Pago actualizado correctamente',
      );

      await options?.onSuccess?.(
        payment.id,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitUpdateOperationPayment,
  };
}