import { useState } from 'react';
import toast from 'react-hot-toast';
import { addOperationPayment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { AddOperationPaymentFormValues } from '@/modules/operations/components/AddOperationPaymentForm';
import { PaymentType } from '../types/operations.types.ts';

interface UseAddOperationPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

function parseCurrency(value: string) {
  return Number(value.replace(/,/g, ''));
}

export function useAddOperationPayment(options?: UseAddOperationPaymentOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitAddOperationPayment = async (
    operationId: number,
    values: AddOperationPaymentFormValues,
  ) => {
    try {
      if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
      }

      const comprobante = values.comprobante?.item(0);

      if (!comprobante) {
        throw new Error('El comprobante es obligatorio');
      }

      setIsSubmitting(true);

      const uploadResult = await uploadOperationProof({
        file: comprobante,
        userId: user.userId,
        operationId,
      });

      await addOperationPayment({
        operacionId: operationId,
        monto: parseCurrency(values.monto),
        tipoPago: values.tipoPago as PaymentType,
        cuentaDestinoId: Number(values.cuentaDestinoId),
        comprobanteUrl: uploadResult.downloadUrl,
        observaciones: values.observaciones?.trim() || undefined,
      });

      toast.success('Pago registrado correctamente');
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
    submitAddOperationPayment,
  };
}