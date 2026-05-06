import { useCallback, useEffect, useState } from 'react';
import { getBankAccountById, getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import toast from 'react-hot-toast';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccountResponse[]>([]);
  const [account, setAccount] = useState<BankAccountResponse>();
  const [isLoading, setIsLoading] = useState(true);

  const loadBankAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getBankAccounts();
      console.log("here", result)
      setAccounts(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBankAccount = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      const result = await getBankAccountById(id);
      return result; 
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

  return {
    accounts,
    isLoading,
    loadBankAccounts,
    loadBankAccount,
    setAccounts,
  };
}