import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { cajaGeneralApi } from '../api/caja-general.api';
import type { CloseCashDay, CreateCashMovement, OpenCashDay } from '../types/caja-general.types';
export function useCajaGeneral(start: string, end: string) {
  const client = useQueryClient();
  const { user } = useAuth();
  const latest = useQuery({ queryKey: ['caja-general', user?.userId, 'latest'], queryFn: cajaGeneralApi.latest });
  const ledger = useQuery({ queryKey: ['caja-general', user?.userId, 'ledger', start, end], queryFn: () => cajaGeneralApi.ledger(start, end), enabled: Boolean(start && end && start <= end) });
  const options = {
    onSuccess: async () => {
      toast.success('Caja General actualizada');
      await client.invalidateQueries({ queryKey: ['caja-general'] });
    },
    onError: (error: unknown) => { toast.error(getApiErrorMessage(error)); },
  };
  const open = useMutation({ mutationFn: (data: OpenCashDay) => cajaGeneralApi.open(data), ...options });
  const movement = useMutation({ mutationFn: ({ id, data }: { id: number; data: CreateCashMovement }) => cajaGeneralApi.movement(id, data), ...options });
  const close = useMutation({ mutationFn: ({ id, data }: { id: number; data: CloseCashDay }) => cajaGeneralApi.close(id, data), ...options });
  const deleteDay = useMutation({
    mutationFn: ({ id, version, motivo }: { id: number; version: number; motivo: string }) => cajaGeneralApi.deleteDay(id, version, motivo),
    ...options,
  });
  return { latest, ledger, open, movement, close, deleteDay };
}
