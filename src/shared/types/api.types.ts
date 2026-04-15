export interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  path?: string;
  timestamp?: string;
  validationErrors?: Record<string, string>;
  warningMessage?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  timestamp: string;
}
