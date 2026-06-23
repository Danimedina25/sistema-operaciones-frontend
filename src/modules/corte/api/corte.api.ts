// src/modules/corte/api/corte.api.ts

import { api } from '@/shared/lib/axios';
import {
  CashCutRangeApiResponse,
  CashCutRangeResponse,
  DailyCashCutApiResponse,
  DailyCashCutRequest,
  DailyCashCutResponse,
} from '../types/corte.types';

import {
  BankGroupBalanceApiResponse,
  BankGroupBalanceResponse,
} from '../types/corte.types';

const BANK_ACCOUNT_DAILY_CUTS_BASE_PATH =
  '/api/bank-account-daily-cuts';

const DAILY_CASH_CUTS_BASE_PATH = '/api/daily-cash-cuts';

export async function calculateDailyCashCut(
  fecha: string,
): Promise<DailyCashCutResponse> {
  const response = await api.get<DailyCashCutApiResponse>(
    `${DAILY_CASH_CUTS_BASE_PATH}/daily`,
    {
      params: { fecha },
    },
  );

  return response.data.data;
}

export async function registerDailyCashCutByDate(
  fecha: string,
): Promise<DailyCashCutResponse> {
  const response = await api.post<DailyCashCutApiResponse>(
    `${DAILY_CASH_CUTS_BASE_PATH}/register`,
    null,
    {
      params: { fecha },
    },
  );

  return response.data.data;
}

export async function registerDailyCashCut(
  payload: DailyCashCutRequest,
): Promise<DailyCashCutResponse> {
  const response = await api.post<DailyCashCutApiResponse>(
    DAILY_CASH_CUTS_BASE_PATH,
    payload,
  );

  return response.data.data;
}

type CalculateCashCutRangeParams = {
  startDate: string;
  endDate: string;
};

export async function calculateCashCutRange(
  params: CalculateCashCutRangeParams,
): Promise<CashCutRangeResponse> {
  const response = await api.get<CashCutRangeApiResponse>(
    `${DAILY_CASH_CUTS_BASE_PATH}/range`,
    {
      params,
    },
  );

  return response.data.data;
}

export async function calculateBankBalancesGrouped(
  fecha?: string,
): Promise<BankGroupBalanceResponse[]> {
  const response = await api.get<BankGroupBalanceApiResponse>(
    `${BANK_ACCOUNT_DAILY_CUTS_BASE_PATH}/grouped`,
    {
      params: fecha ? { fecha } : {},
    },
  );

  return response.data.data;
}