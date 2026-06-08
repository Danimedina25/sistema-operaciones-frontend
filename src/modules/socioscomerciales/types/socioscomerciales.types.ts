// src/modules/socioscomerciales/types/socioscomerciales.types.ts

import { ApiResponse } from '@/shared/types/api.types';

export interface CommercialPartnerResponse {
  id: number;
  nombre: string;
  cuentaBancaria: string;
  banco: string;
  titularCuenta: string;
  activo: boolean;

  socioComercialId: number;
  socioComercialNombre: string;
}

export interface CreateCommercialPartnerRequest {
  nombre: string;
  cuentaBancaria: string;
  banco: string;
  titularCuenta: string;
  activo?: boolean;
}

export interface UpdateCommercialPartnerRequest {
  nombre: string;
  cuentaBancaria: string;
  banco: string;
  titularCuenta: string;
  activo?: boolean;
}

export interface CommercialPartnersPageResponse {
  content: CommercialPartnerResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export type CommercialPartnerApiResponse =
  ApiResponse<CommercialPartnerResponse>;

export type CommercialPartnerListApiResponse =
  ApiResponse<CommercialPartnersPageResponse>;

export type VoidApiResponse = ApiResponse<null>;