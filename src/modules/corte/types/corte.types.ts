// src/modules/corte/types/corte.types.ts

import { ApiResponse } from '@/shared/types/api.types';

export interface DailyCashCutResponse {
  fecha: string;

  saldoInicial: number;
  saldoFinal: number;

  entradasTransferencia: number;
  entradasDeposito: number;
  entradasEfectivo: number;
  totalEntradas: number;

  retornosTransferencia: number;
  retornosDeposito: number;
  retornosEfectivo: number;
  totalRetornos: number;

  totalComisionesSocios: number;
  totalComisionesOficina: number;

  totalSalidas: number;

  registrado: boolean;
  fechaCierre?: string | null;
}

export interface DailyCashCutRequest {
  fecha: string;
  saldoInicialManual?: number | null;
  observaciones?: string | null;
  generadoPorId?: number | null;
}

export interface CashCutRangeResponse {
  fechaInicio: string;
  fechaFin: string;

  saldoInicial: number;
  saldoFinal: number;

  entradasTransferencia: number;
  entradasDeposito: number;
  entradasEfectivo: number;
  totalEntradas: number;

  retornosTransferencia: number;
  retornosDeposito: number;
  retornosEfectivo: number;
  totalRetornos: number;

  totalComisionesSocios: number;
  totalComisionesOficina: number;

  totalSalidas: number;

  incluyeDiaActualEnVivo: boolean;
}

export type DailyCashCutApiResponse = ApiResponse<DailyCashCutResponse>;

export type CashCutRangeApiResponse = ApiResponse<CashCutRangeResponse>;