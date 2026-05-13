import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateOperationPayment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { UpdateOperationPaymentFormValues } from '../schemas/update-operation-payment.schema';

interface UseUpdateOperationPaymentOptions {
  onSuccess?: (paymentId: number) => void | Promise<void>;
}

export function useUpdateOperationPayment(
  options?: UseUpdateOperationPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateOperationPayment = async (
    paymentId: number,
    values: UpdateOperationPaymentFormValues,
    comprobanteUrl: string,
  ) => {
    try {
      setIsSubmitting(true);

      const payment = await updateOperationPayment(paymentId, {
        monto: values.monto,
        tipoPago: values.tipoPago,
        cuentaDestinoId: values.cuentaDestinoId,
        comprobanteUrl,
        observaciones: values.observaciones?.trim() || undefined,
      });

      toast.success('Pago actualizado correctamente');

      await options?.onSuccess?.(payment.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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