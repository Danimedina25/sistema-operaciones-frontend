import { ApiResponse } from '@/shared/types/api.types';

export type CommissionStatus =
  | 'GENERADA'
  | 'PAGADA';

export type CommissionBeneficiaryType =
  | 'USER'
  | 'COMMERCIAL_PARTNER';

export interface PayCommissionRequest {
  paymentProofUrl: string;
}

export interface PayCommissionBatchRequest {
  commissionIds: number[];

  paymentProofUrl: string;
}

export interface CommissionPartnerSummaryResponse {

  beneficiaryId: number;

  beneficiaryType: CommissionBeneficiaryType;

  nombre: string;

  banco: string | null;

  cuentaBancaria: string | null;

  titularCuenta: string | null;

  totalOperaciones: number;

  totalComisiones: number;

  totalPendientes: number;

  totalPagadas: number;

  totalComisionesPendientes: number;

  commissionIdsToPay: number[];

   paymentProofUrl: string | null;
}

export interface CommissionPartnerSummaryListResponse {

  totalComisiones: number;

  totalPendientes: number;

  totalPagadas: number;

  totalBeneficiarios: number;

  socios: CommissionPartnerSummaryResponse[];
}

export interface CommercialPartnerCommissionResponse {

  id: number;

  operationId: number;

  userId: number | null;

  commercialPartnerId: number | null;

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

  pagadaParcialmente: boolean;

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

export type CommissionPartnerSummaryListApiResponse =
  ApiResponse<CommissionPartnerSummaryListResponse>;

export type VoidApiResponse =
  ApiResponse<null>;