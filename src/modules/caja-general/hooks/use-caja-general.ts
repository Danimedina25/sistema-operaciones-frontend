import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createElement } from 'react';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { formatMoney } from '@/shared/format';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/weeks';
import { cajaGeneralApi } from '../api/caja-general.api';
import type { CashDay, CloseCashDay, CreateCashMovement, OpenCashDay } from '../types/caja-general.types';
import { formatCashDate } from '../utils/cash-dates';

function closeMessage(day: CashDay): string {
  const counted = day.saldoContado ?? day.saldoActual;
  const difference = day.diferencia ?? 0;
  const detail = difference > 0 ? `Sobrante de ${formatMoney(difference)}`
    : difference < 0 ? `Faltante de ${formatMoney(Math.abs(difference))}`
      : 'Sin diferencia';
  return `Caja cerrada · ${formatCashDate(day.fecha)}\nSaldo contado ${formatMoney(counted)} · ${detail}`;
}

export function useCajaGeneral(start: string, end: string) {
  const client = useQueryClient();
  const { user } = useAuth();
  const latest = useQuery({ queryKey: ['caja-general', user?.userId, 'latest'], queryFn: cajaGeneralApi.latest });
  const today = formatDate(new Date());
  const ledger = useQuery({ queryKey: ['caja-general', user?.userId, 'ledger', start, end], queryFn: () => cajaGeneralApi.ledger(start, end), enabled: Boolean(start && end && start <= end && end <= today) });
  const options = {
    onSuccess: async () => {
      toast.success('Caja General actualizada');
      await client.invalidateQueries({ queryKey: ['caja-general'] });
    },
    onError: (error: unknown) => { toast.error(getApiErrorMessage(error)); },
  };
  const open = useMutation({
    mutationFn: (data: OpenCashDay) => cajaGeneralApi.open(data),
    onSuccess: async (day: CashDay) => {
      toast.success(`Caja abierta · ${formatCashDate(day.fecha)}\nSaldo inicial ${formatMoney(day.saldoInicial)}`, { style: { whiteSpace: 'pre-line' } });
      await client.invalidateQueries({ queryKey: ['caja-general'] });
    },
    onError: options.onError,
  });
  const movement = useMutation({ mutationFn: ({ id, data }: { id: number; data: CreateCashMovement }) => cajaGeneralApi.movement(id, data), ...options });
  const close = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CloseCashDay }) => cajaGeneralApi.close(id, data),
    onSuccess: async (day: CashDay) => {
      // Rojo = cerrar (reglas de interfaz); el salto de línea separa fecha y saldo.
      toast(closeMessage(day), { icon: createElement(Lock, { className: 'size-4 text-rose-600', 'aria-hidden': true }), style: { whiteSpace: 'pre-line', borderLeft: '4px solid #e11d48' } });
      await client.invalidateQueries({ queryKey: ['caja-general'] });
    },
    onError: options.onError,
  });
  const deleteDay = useMutation({
    mutationFn: ({ id, version, motivo }: { id: number; version: number; motivo: string }) => cajaGeneralApi.deleteDay(id, version, motivo),
    ...options,
  });
  return { latest, ledger, open, movement, close, deleteDay };
}
