import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

export interface BankAccountsFilters {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

const normalize = (value?: string | null) => {
  return value?.toLowerCase().trim() ?? '';
};

export function filterBankAccounts(
  accounts: BankAccountResponse[],
  filters: BankAccountsFilters,
) {
  const search = normalize(filters.search);

  return accounts.filter((account) => {
    const matchesSearch =
      !search ||
      normalize(account.banco).includes(search) ||
      normalize(account.titular).includes(search) ||
      normalize(account.numeroCuenta).includes(search) ||
      normalize(account.clabe).includes(search);

    const matchesStatus =
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && account.activo) ||
      (filters.status === 'INACTIVE' && !account.activo);

    return matchesSearch && matchesStatus;
  });
}