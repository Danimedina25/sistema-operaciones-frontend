import { useState } from 'react';
import toast from 'react-hot-toast';

import { requestReturnPayment } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { AddReturnPaymentFormValues } from '../../components/AddReturnPaymentForm';

interface UseRequestReturnPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

function parseCurrency(value: string) {
  return Number(value.replace(/,/g, ''));
}

export function useRequestReturnPayment(
  options?: UseRequestReturnPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequestReturnPayment = async (
    operationId: number,
    values: AddReturnPaymentFormValues,
  ) => {
    try {
      if (!values.tipoPago) {
        throw new Error('El tipo de retorno es obligatorio');
      }

      setIsSubmitting(true);

      const isCash = values.tipoPago === 'EFECTIVO';

      await requestReturnPayment(operationId, {
        monto: parseCurrency(values.monto),
        tipoPago: values.tipoPago,
        cuentaDestinoCliente: isCash
          ? null
          : values.cuentaDestinoCliente?.replace(/\s/g, ''),
        observaciones: values.observaciones?.trim() || undefined,
      });

      toast.success('Solicitud de retorno registrada correctamente');
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
    submitRequestReturnPayment,
  };
}