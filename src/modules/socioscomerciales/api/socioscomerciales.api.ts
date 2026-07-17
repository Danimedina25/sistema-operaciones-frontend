// src/modules/socioscomerciales/api/socioscomerciales.api.ts

import { api } from '@/shared/lib/axios';
import { CommercialPartnersPageResponse, CommercialPartnerListApiResponse, CommercialPartnerResponse, CommercialPartnerApiResponse, CreateCommercialPartnerRequest, UpdateCommercialPartnerRequest } from '../types/socioscomerciales.types';



const COMMERCIAL_PARTNERS_BASE_PATH = '/api/commercial-partners';

type GetCommercialPartnersParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  activo?: boolean;
  nombre?: string;
  cuentaBancaria?: string;
};

export async function getCommercialPartners(
  params?: GetCommercialPartnersParams,
): Promise<CommercialPartnersPageResponse> {
  const response = await api.get<CommercialPartnerListApiResponse>(
    COMMERCIAL_PARTNERS_BASE_PATH,
    {
      params,
    },
  );

  return response.data.data;
}

export async function getCommercialPartnerById(
  id: number,
): Promise<CommercialPartnerResponse> {
  const response = await api.get<CommercialPartnerApiResponse>(
    `${COMMERCIAL_PARTNERS_BASE_PATH}/${id}`,
  );

  return response.data.data;
}

export async function createCommercialPartner(
  payload: CreateCommercialPartnerRequest,
): Promise<CommercialPartnerResponse> {
  const response = await api.post<CommercialPartnerApiResponse>(
    COMMERCIAL_PARTNERS_BASE_PATH,
    payload,
  );

  return response.data.data;
}

export async function updateCommercialPartner(
  id: number,
  payload: UpdateCommercialPartnerRequest,
): Promise<CommercialPartnerResponse> {
  const response = await api.put<CommercialPartnerApiResponse>(
    `${COMMERCIAL_PARTNERS_BASE_PATH}/${id}`,
    payload,
  );

  return response.data.data;
}

export async function activateCommercialPartner(
  id: number,
): Promise<CommercialPartnerResponse> {
  const response = await api.patch<CommercialPartnerApiResponse>(
    `${COMMERCIAL_PARTNERS_BASE_PATH}/${id}/activate`,
  );

  return response.data.data;
}

export async function deactivateCommercialPartner(
  id: number,
): Promise<CommercialPartnerResponse> {
  const response = await api.patch<CommercialPartnerApiResponse>(
    `${COMMERCIAL_PARTNERS_BASE_PATH}/${id}/deactivate`,
  );

  return response.data.data;
}

export async function deleteCommercialPartner(id: number): Promise<void> {
  await api.delete(`${COMMERCIAL_PARTNERS_BASE_PATH}/${id}`);
}