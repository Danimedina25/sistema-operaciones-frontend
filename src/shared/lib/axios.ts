import axios, { AxiosError } from 'axios';
import { env } from '@/shared/lib/env'
import { authStorage } from '@/modules/auth/services/auth-storage';

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authStorage.clear();

      const currentPath = window.location.pathname;

      const isPublicPath = PUBLIC_PATHS.some((path) =>
        currentPath.startsWith(path),
      );

      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

const PUBLIC_PATHS = [
  '/login',
  '/activar-cuenta',
  '/verificar-correo',
  '/recuperar-password',
  '/restablecer-password',
];