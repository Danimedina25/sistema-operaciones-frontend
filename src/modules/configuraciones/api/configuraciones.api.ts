// src/modules/configuraciones/api/configuraciones.api.ts

import { api } from '@/shared/lib/axios';
import {
  ConfiguracionGeneralApiResponse,
  ConfiguracionGeneralResponse,
  UpdateConfiguracionGeneralRequest,
} from '../types/configuraciones.types';

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
