import { useState } from 'react';
import toast from 'react-hot-toast';
import { deactivateBankAccount } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseDeactivateBankAccountOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useDeactivateBankAccount(options?: UseDeactivateBankAccountOptions) {
  const [processingAccountId, setProcessingAccountId] = useState<number | null>(null);

  const submitDeactivateBankAccount = async (id: number) => {
    try {
      setProcessingAccountId(id);

      const result = await deactivateBankAccount(id);
      toast.success(`Cuenta bancaria "${result.data.banco}" desactivada exitosamente`);

      if (options?.onSuccess) {
        await options.onSuccess();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setProcessingAccountId(null);
    }
  };

  return {
    processingAccountId,
    submitDeactivateBankAccount,
  };
}