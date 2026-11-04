// src/modules/configuraciones/types/configuraciones.types.ts

import { ApiResponse } from '@/shared/types/api.types';

export interface ConfiguracionGeneralResponse {
  id: number;
  porcentajeComisionOficina: number;
  horasPendienteAtencion: number;
  horasPendienteUrgente: number;
  /** Una operación sin cambios por más de estas horas se considera detenida. */
  horasOperacionDetenida: number;
  /** Día ISO en que se pagan las comisiones de la semana anterior: 1 = lunes … 7 = domingo. */
  diaPagoComisiones: number;
  updatedAt: string;
}

export interface UpdateConfiguracionGeneralRequest {
  porcentajeComisionOficina: number;
  horasPendienteAtencion?: number;
  horasPendienteUrgente?: number;
  horasOperacionDetenida?: number;
  diaPagoComisiones?: number;
}

/** Umbrales del semáforo de pendientes, visibles para todos los roles. */
export interface PendingUrgencyThresholds {
  horasPendienteAtencion: number;
  horasPendienteUrgente: number;
}

export type ConfiguracionGeneralApiResponse =
  ApiResponse<ConfiguracionGeneralResponse>;

/** Días de la semana en formato ISO (1 = lunes … 7 = domingo). */
export const DIAS_SEMANA: Record<number, string> = {
  1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes', 6: 'sábado', 7: 'domingo',
};
