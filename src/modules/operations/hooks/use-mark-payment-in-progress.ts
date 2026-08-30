import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  markPaymentInProgress,
  releasePaymentInProgress,
} from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseMarkPaymentInProgressOptions {
  onSuccess?: () => void | Promise<void>;
}

/**
 * Marca un comprobante por transferencia/depósito como "en proceso" (a la
 * espera de que el movimiento se refleje en las cuentas de la empresa) o lo
 * libera de vuelta a pendiente. No sube archivo.
 */
export function useMarkPaymentInProgress(
  options?: UseMarkPaymentInProgressOptions,
) {
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(
    null,
  );

  const submitMarkInProgress = async (
    paymentId: number,
    observaciones?: string,
  ) => {
    try {
      setProcessingPaymentId(paymentId);

      await markPaymentInProgress(
        paymentId,
        observaciones?.trim() ? { observaciones: observaciones.trim() } : undefined,
      );

      toast.success('Comprobante marcado en proceso');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const submitRelease = async (paymentId: number) => {
    try {
      setProcessingPaymentId(paymentId);

      await releasePaymentInProgress(paymentId);

      toast.success('Comprobante liberado');
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
    submitMarkInProgress,
    submitRelease,
  };
}
