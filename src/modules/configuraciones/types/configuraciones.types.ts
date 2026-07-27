// src/modules/configuraciones/types/configuraciones.types.ts

import { ApiResponse } from '@/shared/types/api.types';

export interface ConfiguracionGeneralResponse {
  id: number;
  porcentajeComisionOficina: number;
  updatedAt: string;
}

export interface UpdateConfiguracionGeneralRequest {
  porcentajeComisionOficina: number;
}

export type ConfiguracionGeneralApiResponse =
  ApiResponse<ConfiguracionGeneralResponse>;
