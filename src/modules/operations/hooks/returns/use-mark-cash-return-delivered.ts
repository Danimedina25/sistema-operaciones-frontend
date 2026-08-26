// hooks/returns/use-mark-cash-return-delivered.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { markCashReturnAsDelivered } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseMarkCashReturnDeliveredOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useMarkCashReturnDelivered(
  options?: UseMarkCashReturnDeliveredOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitMarkCashReturnDelivered = async (
    returnPaymentId: number,
    operationId: number,
    comprobanteEntrega: File,
  ) => {
    try {
      if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
      }

      if (!comprobanteEntrega.type.startsWith('image/')) {
        throw new Error('El comprobante de entrega debe ser una imagen');
      }

      setIsSubmitting(true);

      const uploadResult = await uploadOperationProof({
        file: comprobanteEntrega,
        userId: user.userId,
        operationId,
        folder: 'comprobantes-entrega-efectivo',
      });

      await markCashReturnAsDelivered(returnPaymentId, {
        comprobanteEntregaEfectivoUrl: uploadResult.downloadUrl,
      });

      toast.success('Efectivo marcado como entregado');

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
    submitMarkCashReturnDelivered,
  };
}
