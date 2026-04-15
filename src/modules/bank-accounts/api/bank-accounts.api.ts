import { api } from '@/shared/lib/axios';
import type {
  BankAccountApiResponse,
  BankAccountRequest,
  BankAccountsListApiResponse,
  BankAccountResponse,
} from '@/modules/bank-accounts/types/bank-accounts.types';

const BANK_ACCOUNTS_BASE_PATH = '/api/bank-accounts';

export async function getBankAccounts(): Promise<BankAccountResponse[]> {
  const response = await api.get<BankAccountsListApiResponse>(BANK_ACCOUNTS_BASE_PATH);
  return response.data.data;
}

export async function getBankAccountById(id: number): Promise<BankAccountResponse> {
  const response = await api.get<BankAccountApiResponse>(`${BANK_ACCOUNTS_BASE_PATH}/${id}`);
  return response.data.data;
}

export async function createBankAccount(payload: BankAccountRequest) {
  const response = await api.post<BankAccountApiResponse>(BANK_ACCOUNTS_BASE_PATH, payload);
  return response.data;
}

export async function updateBankAccount(id: number, payload: BankAccountRequest) {
  const response = await api.put<BankAccountApiResponse>(
    `${BANK_ACCOUNTS_BASE_PATH}/${id}`,
    payload,
  );
  return response.data;
}

export async function activateBankAccount(id: number) {
  const response = await api.patch<BankAccountApiResponse>(
    `${BANK_ACCOUNTS_BASE_PATH}/${id}/activate`,
  );
  return response.data;
}

export async function deactivateBankAccount(id: number) {
  const response = await api.patch<BankAccountApiResponse>(
    `${BANK_ACCOUNTS_BASE_PATH}/${id}/deactivate`,
  );
  return response.data;
}