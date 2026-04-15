import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateBankAccount } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { BankAccountFormValues } from '@/modules/bank-accounts/schemas/bank-account.schema';

interface UseUpdateBankAccountOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateBankAccount(options?: UseUpdateBankAccountOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateBankAccount = async (
    id: number,
    values: BankAccountFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      await updateBankAccount(id, {
        banco: values.banco.trim(),
        titular: values.titular.trim(),
        numeroCuenta: values.numeroCuenta.trim(),
        clabe: values.clabe.trim(),
      });

      toast.success('Cuenta bancaria actualizada exitosamente');

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
    submitUpdateBankAccount,
  };
}