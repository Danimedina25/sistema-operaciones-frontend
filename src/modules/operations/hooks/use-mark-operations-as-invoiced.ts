import { useState } from 'react';
import toast from 'react-hot-toast';
import { markOperationAsInvoiced } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseMarkOperationAsInvoicedOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useMarkOperationAsInvoiced(
  options?: UseMarkOperationAsInvoicedOptions,
) {
  const [processingOperationId, setProcessingOperationId] = useState<number | null>(null);

  const submitMarkAsInvoiced = async (operationId: number) => {
    try {
      setProcessingOperationId(operationId);

      await markOperationAsInvoiced(operationId);

      toast.success('Operación marcada como facturada');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setProcessingOperationId(null);
    }
  };

  return {
    processingOperationId,
    submitMarkAsInvoiced,
  };
}