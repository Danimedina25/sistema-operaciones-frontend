import { useState } from 'react';
import toast from 'react-hot-toast';

import { updateRequestReturnPayment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

import {
  EditReturnPaymentFormValues,
} from '../../components/returns/EditReturnPaymentForm';

interface UseUpdateRequestReturnPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

function cleanText(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function cleanNumbers(value?: string) {
  const cleaned = value?.replace(/\s/g, '').trim();
  return cleaned ? cleaned : undefined;
}

export function useUpdateRequestReturnPayment(
  options?: UseUpdateRequestReturnPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateRequestReturnPayment = async (
    values: EditReturnPaymentFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const isCash = values.tipoPago === 'EFECTIVO';

      await updateRequestReturnPayment(
        values.id,
        {
            monto: values.monto,
            tipoPago: values.tipoPago,
            banco: isCash
              ? null
              : cleanText(values.banco),
            titular: isCash
              ? null
              : cleanText(values.titular),
            clabe: isCash
              ? null
              : cleanNumbers(values.clabe),
            observaciones: cleanText(
              values.observaciones,
            ),
          }
      );

      toast.success(
        'Solicitud de retorno actualizada correctamente',
      );

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
    submitUpdateRequestReturnPayment,
  };
}