import { useState } from 'react';
import toast from 'react-hot-toast';

import { realizeReturnPayment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';

export interface RealizeReturnPaymentValues {
  operationId: number;
  cuentaOrigenId?: string;
  comprobante: FileList;
  observaciones?: string;
}

interface UseRealizeReturnPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useRealizeReturnPayment(
  options?: UseRealizeReturnPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitRealizeReturnPayment = async (
    returnPaymentId: number,
    values: RealizeReturnPaymentValues,
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
        operationId: values.operationId,
      });

      await realizeReturnPayment(returnPaymentId, {
        cuentaOrigenId: values.cuentaOrigenId
          ? Number(values.cuentaOrigenId)
          : null,
        comprobanteUrl: uploadResult.downloadUrl,
        observaciones: values.observaciones?.trim() || undefined,
      });

      toast.success('Retorno realizado correctamente');
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
    submitRealizeReturnPayment,
  };
}