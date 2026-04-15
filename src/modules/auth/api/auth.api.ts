import { api } from '@/shared/lib/axios';
import type {
  AuthResponse,
  LoginRequest,
} from '@/modules/auth/types/auth.types';
import { ApiResponse } from '@/shared/types/api.types';
import { VoidApiResponse } from '@/modules/users/types/users.types';

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', payload);
  return response.data.data;
}

export async function requestPasswordReset(payload: {
  correo: string;
}): Promise<void> {
  await api.post<VoidApiResponse>(
    `/api/auth/request-password-reset`,
    payload,
  );
}

export async function completePasswordReset(payload: {
  token: string;
  password: string;
}): Promise<void> {
  await api.post<VoidApiResponse>(
    `/api/auth/complete-password-reset`,
    payload,
  );
}