import { ApiResponse } from '@/shared/types/api.types';

export type CommissionStatus =
  | 'PENDING'
  | 'PAID';

export interface PayCommissionRequest {
  paymentProofUrl: string;
}

export interface CommercialPartnerCommissionResponse {
  id: number;

  operationId: number;

  userId: number;

  commercialPartnerId: number;

  nombreBeneficiario: string;

  commissionAmount: number;

  status: CommissionStatus;

  paymentProofUrl: string | null;

  generatedAt: string;

  paidAt: string | null;
}

export interface CommissionBeneficiaryResponse {
  commissionId: number;

  operationId: number;

  nivel: number;

  nombre: string;

  banco: string;

  cuentaBancaria: string;

  titularCuenta: string;

  commissionAmount: number;

  status: CommissionStatus;

  paymentProofUrl: string | null;

  commissionPercentage: number;
}

export interface CommissionOperationSummaryResponse {
  operationId: number;

  cliente: string;

  nivelesRedComercial: number;

  totalBeneficiarios: number;

  montoOperacion: number;

  totalComisiones: number;

  pagadaCompletamente: boolean;

  fechaOperacion: string;
}

export interface CommissionSummaryResponse {
  totalComisiones: number;

  totalPagadas: number;

  totalPendientes: number;

  totalOperaciones: number;

  totalBeneficiarios: number;

  operaciones: CommissionOperationSummaryResponse[];
}

export interface CommissionOperationDetailResponse {
  operationId: number;

  cliente: string;

  montoOperacion: number;

  porcentajeComisionIndividual: number;

  porcentajeComisionTotalRed: number;

  nivelesRedComercial: number;

  beneficiarios: CommissionBeneficiaryResponse[];

  totalCommissionAmount: number;
}

export type CommissionSummaryApiResponse =
  ApiResponse<CommissionSummaryResponse>;

export type CommercialPartnerCommissionApiResponse =
  ApiResponse<CommercialPartnerCommissionResponse>;

export type CommissionOperationDetailApiResponse =
  ApiResponse<CommissionOperationDetailResponse>;

export type CommissionBeneficiariesApiResponse =
  ApiResponse<CommissionBeneficiaryResponse[]>;

export type VoidApiResponse =
  ApiResponse<null>;