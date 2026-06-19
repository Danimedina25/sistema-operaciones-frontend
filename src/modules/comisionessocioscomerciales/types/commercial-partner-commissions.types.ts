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

  fechaPagada: string;

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

export interface BeneficiaryCommissionOperationResponse {

  commissionId: number;

  operationId: number;

  clienteNombre: string;

  operationDate: string;

  nivel: number;

  operationAmount: number;

  commissionPercentage: number;

  commissionAmount: number;

  commissionStatus: CommissionStatus;
}

export interface BeneficiaryCommissionDetailResponse {

  beneficiaryId: number;

  beneficiaryName: string;

  beneficiaryType: CommissionBeneficiaryType;

  totalOperations: number;

  totalCommission: number;

  operations: BeneficiaryCommissionOperationResponse[];
}

export interface MyWeeklyCommissionOperationResponse {

  operationId: number;

  cliente: string;

  fechaOperacion: string;

  montoOperacion: number;

  nivelesRedComercial: number;

  porcentajeComision: number;

  miComision: number;

  myCommissionStatus: CommissionStatus;

  comisionRed: number;

  comisionNivel2: number;

  comisionNivel3: number;

  socioNivel2: string | null;

  socioNivel3: string | null;

  statusNivel2: CommissionStatus | null;

  statusNivel3: CommissionStatus | null;
}

export interface MyWeeklyCommissionsResponse {

  totalGanado: number;

  totalGanadoRed: number;

  totalOperaciones: number;

  operaciones: MyWeeklyCommissionOperationResponse[];
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

export type BeneficiaryCommissionDetailApiResponse =
  ApiResponse<BeneficiaryCommissionDetailResponse>;

  export type MyWeeklyCommissionsApiResponse =
  ApiResponse<MyWeeklyCommissionsResponse>;

export type VoidApiResponse =
  ApiResponse<null>;