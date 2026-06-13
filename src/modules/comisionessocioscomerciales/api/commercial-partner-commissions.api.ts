import { api } from '@/shared/lib/axios';

import {
  CommissionSummaryApiResponse,
  CommissionSummaryResponse,
  CommercialPartnerCommissionApiResponse,
  CommercialPartnerCommissionResponse,
  CommissionOperationDetailApiResponse,
  CommissionOperationDetailResponse,
  CommissionBeneficiariesApiResponse,
  CommissionBeneficiaryResponse,
  PayCommissionRequest,
  VoidApiResponse,
  CommissionPartnerSummaryListApiResponse,
  CommissionPartnerSummaryListResponse,
  PayCommissionBatchRequest,
  CommissionBeneficiaryType,
  BeneficiaryCommissionDetailApiResponse,
  BeneficiaryCommissionDetailResponse,
  MyWeeklyCommissionsApiResponse,
  MyWeeklyCommissionsResponse,
} from '../types/commercial-partner-commissions.types';

const BASE_PATH =
  '/api/commercial-partner-commissions';

interface DateRangeParams {
  startDate: string;
  endDate: string;
}

interface BeneficiaryCommissionDetailParams {

  beneficiaryId: number;

  beneficiaryType: CommissionBeneficiaryType;

  startDate: string;

  endDate: string;
}

export async function generatePendingCommissions() {
  await api.post<VoidApiResponse>(
    `${BASE_PATH}/generate`,
  );
}

export async function getSummary(
  params: DateRangeParams,
): Promise<CommissionSummaryResponse> {
  const response =
    await api.get<CommissionSummaryApiResponse>(
      `${BASE_PATH}/summary`,
      { params },
    );

  return response.data.data;
}

export async function getSummaryByBeneficiary(
  params: DateRangeParams,
): Promise<CommissionPartnerSummaryListResponse> {

  const response =
    await api.get<CommissionPartnerSummaryListApiResponse>(
      `${BASE_PATH}/beneficiaries-summary`,
      { params },
    );

  return response.data.data;
}

export async function payBeneficiaryCommissions(
  payload: PayCommissionBatchRequest,
): Promise<void> {

  await api.post<VoidApiResponse>(
    `${BASE_PATH}/pay-batch`,
    payload,
  );
}

export async function getPendingCommissions(
  params: DateRangeParams,
): Promise<CommissionSummaryResponse> {
  const response =
    await api.get<CommissionSummaryApiResponse>(
      `${BASE_PATH}/pending`,
      { params },
    );

  return response.data.data;
}

export async function getPaidCommissions(
  params: DateRangeParams,
): Promise<CommissionSummaryResponse> {
  const response =
    await api.get<CommissionSummaryApiResponse>(
      `${BASE_PATH}/paid`,
      { params },
    );

  return response.data.data;
}

export async function getCommissionById(
  commissionId: number,
): Promise<CommercialPartnerCommissionResponse> {
  const response =
    await api.get<CommercialPartnerCommissionApiResponse>(
      `${BASE_PATH}/${commissionId}`,
    );

  return response.data.data;
}

export async function payCommission(
  commissionId: number,
  payload: PayCommissionRequest,
): Promise<CommercialPartnerCommissionResponse> {
  const response =
    await api.patch<CommercialPartnerCommissionApiResponse>(
      `${BASE_PATH}/${commissionId}/pay`,
      payload,
    );

  return response.data.data;
}

export async function regenerateOperationCommissions(
  operationId: number,
) {
  await api.post<VoidApiResponse>(
    `${BASE_PATH}/operations/${operationId}/regenerate`,
  );
}

export async function getOperationDetail(
  operationId: number,
): Promise<CommissionOperationDetailResponse> {
  const response =
    await api.get<CommissionOperationDetailApiResponse>(
      `${BASE_PATH}/operations/${operationId}`,
    );

  return response.data.data;
}

export async function getOperationBeneficiaries(
  operationId: number,
): Promise<CommissionBeneficiaryResponse[]> {
  const response =
    await api.get<CommissionBeneficiariesApiResponse>(
      `${BASE_PATH}/operations/${operationId}/beneficiaries`,
    );

  return response.data.data;
}

export async function getBeneficiaryCommissionDetail(
  params: BeneficiaryCommissionDetailParams,
): Promise<BeneficiaryCommissionDetailResponse> {

  const response =
    await api.get<BeneficiaryCommissionDetailApiResponse>(
      `${BASE_PATH}/beneficiaries/${params.beneficiaryId}/detail`,
      {
        params: {
          beneficiaryType: params.beneficiaryType,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    );

  return response.data.data;
}

export async function getMyWeeklyCommissions(
  params: DateRangeParams,
): Promise<MyWeeklyCommissionsResponse> {

  const response =
    await api.get<MyWeeklyCommissionsApiResponse>(
      `${BASE_PATH}/my-weekly-commissions`,
      {
        params,
      },
    );

  return response.data.data;
}