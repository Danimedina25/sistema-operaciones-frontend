import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';

/** All successful operation mutations refresh active lists and mark hidden counters stale. */
export function registerWorkRefresh(client: QueryClient) {
  const interceptor = api.interceptors.response.use(async (response) => {
    const method = response.config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method) && response.config.url?.includes('/operations')) {
      await client.invalidateQueries({ predicate: ({ queryKey }) => [
        'work-operations', 'staff-deliveries', 'operations-with-requested-returns', 'operations-available-to-request-return',
        'today-installment-pickups', 'socio-pending-rejected', 'socio-pending-partial-income', 'socio-pending-return-confirmation',
      ].includes(String(queryKey[0])) });
    }
    return response;
  });
  return () => api.interceptors.response.eject(interceptor);
}
