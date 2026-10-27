import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';
import { useNotificationReceived } from '@/modules/notifications/hooks/use-notification-received';
export interface CardlessPendingTask {
  requestId: number; operationId: number; cliente: string;
  porRegistrar: number; porConfirmar: number; fecha?: string | null;
}
export function useCardlessPending() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['cardless-work'], queryFn: async () =>
    (await api.get<{ data: CardlessPendingTask[] }>('/api/operations/returns/cardless-work')).data.data,
    refetchInterval: 30000 });
  useNotificationReceived(['CASH_RETURN_REQUESTED','RETURN_INSTALLMENT_CODE_AVAILABLE','RETURN_INSTALLMENT_DELIVERED','RETURN_REQUEST_COMPLETED'], () => {
    void client.invalidateQueries({ queryKey: ['bank-work'] });
    void query.refetch();
  });
  return query;
}
