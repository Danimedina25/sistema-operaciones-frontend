import axios from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;

    // Caso: ApiResponse del backend
    if (response?.message) {
      return response.message;
    }

    // Caso: errores de validación u otros
    if (response?.errors) {
      if (typeof response.errors === 'string') {
        return response.errors;
      }

      if (Array.isArray(response.errors)) {
        return response.errors.join(', ');
      }
    }

    return 'Error en la petición al servidor';
  }

  return 'Error inesperado';
}