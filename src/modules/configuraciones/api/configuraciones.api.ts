// src/modules/configuraciones/api/configuraciones.api.ts

import { api } from '@/shared/lib/axios';
import {
  ConfiguracionGeneralApiResponse,
  ConfiguracionGeneralResponse,
  PendingUrgencyThresholds,
  UpdateConfiguracionGeneralRequest,
} from '../types/configuraciones.types';
import type { ApiResponse } from '@/shared/types/api.types';

const CONFIGURACIONES_BASE_PATH = '/api/configuraciones';

export async function getConfiguracionGeneral(): Promise<ConfiguracionGeneralResponse> {
  const response = await api.get<ConfiguracionGeneralApiResponse>(
    CONFIGURACIONES_BASE_PATH,
  );

  return response.data.data;
}

export async function updateConfiguracionGeneral(
  payload: UpdateConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const response = await api.put<ConfiguracionGeneralApiResponse>(
    CONFIGURACIONES_BASE_PATH,
    payload,
  );

  return response.data.data;
}

export async function getPendingUrgencyThresholds(): Promise<PendingUrgencyThresholds> {
  const response = await api.get<ApiResponse<PendingUrgencyThresholds>>(
    `${CONFIGURACIONES_BASE_PATH}/pendientes`,
  );

  return response.data.data;
}
