import { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteBankAccount } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseDeleteBankAccountOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useDeleteBankAccount(options?: UseDeleteBankAccountOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const submitDeleteBankAccount = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await deleteBankAccount(id);

      toast.success('Cuenta bancaria eliminada permanentemente');

      if (options?.onSuccess) {
        await options.onSuccess();
      }

      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    submitDeleteBankAccount,
  };
}
