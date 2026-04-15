import { useState } from 'react';
import toast from 'react-hot-toast';
import { activateBankAccount } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseActivateBankAccountOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useActivateBankAccount(options?: UseActivateBankAccountOptions) {
  const [processingAccountId, setProcessingAccountId] = useState<number | null>(null);

  const submitActivateBankAccount = async (id: number) => {
    try {
      setProcessingAccountId(id);

      const result = await activateBankAccount(id);
      toast.success(`Cuenta bancaria "${result.data.banco}" activada exitosamente`);

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
    submitActivateBankAccount,
  };
}