import { api } from '@/shared/lib/axios';
import type {
  CreateUserRequest,
  UpdateUserEmailRequest,
  UpdateUserRequest,
  UserCreatedApiResponse,
  UserApiResponse,
  UserResponse,
  UsersListApiResponse,
  VoidApiResponse,
} from '@/modules/users/types/users.types';

const USERS_BASE_PATH = '/api/admin/users';

export async function getUsers(): Promise<UserResponse[]> {
  const response = await api.get<UsersListApiResponse>(USERS_BASE_PATH);
  return response.data.data;
}

export async function getUserById(id: number): Promise<UserResponse> {
  const response = await api.get<UserApiResponse>(`${USERS_BASE_PATH}/${id}`);
  return response.data.data;
}

export async function createUser(payload: CreateUserRequest) {
  const response = await api.post<UserCreatedApiResponse>(USERS_BASE_PATH, payload);
  return response.data;
}

export async function updateUser(id: number, payload: UpdateUserRequest): Promise<UserResponse> {
  const response = await api.put<UserApiResponse>(`${USERS_BASE_PATH}/${id}`, payload);
  return response.data.data;
}

export async function activateUser(id: number): Promise<UserResponse> {
  const response = await api.patch<UserApiResponse>(`${USERS_BASE_PATH}/${id}/activate`);
  return response.data.data;
}

export async function deactivateUser(id: number): Promise<UserResponse> {
  const response = await api.patch<UserApiResponse>(`${USERS_BASE_PATH}/${id}/deactivate`);
  return response.data.data;
}

export async function resendActivationEmail(id: number): Promise<void> {
  await api.post<VoidApiResponse>(`${USERS_BASE_PATH}/${id}/resend-activation-email`);
}

export async function updateUserEmailAndResend(
  id: number,
  payload: UpdateUserEmailRequest,
): Promise<void> {
  await api.patch<VoidApiResponse>(`${USERS_BASE_PATH}/${id}/email`, payload);
}

export async function completeActivation(payload: {
  token: string;
  password: string;
}): Promise<void> {
  await api.post<VoidApiResponse>(
    `${USERS_BASE_PATH}/complete-activation`,
    payload,
  );
}

export async function completeEmailVerification(token: string): Promise<void> {
  await api.post<VoidApiResponse>(
    `${USERS_BASE_PATH}/complete-email-verification`,
    { token },
  );
}
