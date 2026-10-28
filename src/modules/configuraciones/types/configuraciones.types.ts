// src/modules/configuraciones/types/configuraciones.types.ts

import { ApiResponse } from '@/shared/types/api.types';

export interface ConfiguracionGeneralResponse {
  id: number;
  porcentajeComisionOficina: number;
  horasPendienteAtencion: number;
  horasPendienteUrgente: number;
  updatedAt: string;
}

export interface UpdateConfiguracionGeneralRequest {
  porcentajeComisionOficina: number;
  horasPendienteAtencion?: number;
  horasPendienteUrgente?: number;
}

/** Umbrales del semáforo de pendientes, visibles para todos los roles. */
export interface PendingUrgencyThresholds {
  horasPendienteAtencion: number;
  horasPendienteUrgente: number;
}

export type ConfiguracionGeneralApiResponse =
  ApiResponse<ConfiguracionGeneralResponse>;
