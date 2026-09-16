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

import type {
  BankMovement,
  BankMovementFilters,
  BankMovementPageApiResponse,
  BankMovementTotals,
  BankMovementTotalsApiResponse,
} from '../types/bank-movements.types';
import type { PaginatedResponse } from '@/shared/types/api.types';

const BANK_ACCOUNT_DAILY_CUTS_BASE_PATH =
  '/api/bank-account-daily-cuts';

const DAILY_CASH_CUTS_BASE_PATH = '/api/daily-cash-cuts';

const BANK_MOVEMENTS_BASE_PATH = '/api/bank-movements';

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
/**
 * Historial general de movimientos bancarios. Sólo consulta: el backend no expone
 * ninguna captura manual porque todo movimiento nace de un pago, un retorno o un
 * cheque cobrado en Caja General.
 */
function bankMovementParams(filters: BankMovementFilters) {
  return {
    desde: filters.desde,
    hasta: filters.hasta,
    ...(filters.bankAccountId ? { bankAccountId: filters.bankAccountId } : {}),
    ...(filters.banco ? { banco: filters.banco } : {}),
    ...(filters.direccion ? { direccion: filters.direccion } : {}),
    ...(filters.tipo ? { tipo: filters.tipo } : {}),
  };
}

export async function searchBankMovements(
  filters: BankMovementFilters,
  page: number,
  size: number,
): Promise<PaginatedResponse<BankMovement>> {
  const response = await api.get<BankMovementPageApiResponse>(
    BANK_MOVEMENTS_BASE_PATH,
    { params: { ...bankMovementParams(filters), page, size } },
  );

  return response.data.data;
}

/** Totales sobre todo el filtro. Nunca se suman los renglones de la página. */
export async function getBankMovementTotals(
  filters: BankMovementFilters,
): Promise<BankMovementTotals> {
  const response = await api.get<BankMovementTotalsApiResponse>(
    `${BANK_MOVEMENTS_BASE_PATH}/summary`,
    { params: bankMovementParams(filters) },
  );

  return response.data.data;
}
