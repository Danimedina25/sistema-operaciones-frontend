import { useState } from 'react';
import toast from 'react-hot-toast';
import { createBankAccount } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { BankAccountFormValues } from '@/modules/bank-accounts/schemas/bank-account.schema';

interface UseCreateBankAccountOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateBankAccount(options?: UseCreateBankAccountOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCreateBankAccount = async (values: BankAccountFormValues) => {
    try {
      setIsSubmitting(true);

      const result = await createBankAccount({
        banco: values.banco.trim(),
        titular: values.titular.trim(),
        numeroCuenta: values.numeroCuenta.trim(),
        clabe: values.clabe.trim(),
      });

      toast.success(result.message);

      if (options?.onSuccess) {
        await options.onSuccess();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitCreateBankAccount,
  };
}