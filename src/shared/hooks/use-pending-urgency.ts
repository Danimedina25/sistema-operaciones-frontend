import { useQuery } from '@tanstack/react-query';
import { getPendingUrgencyThresholds } from '@/modules/configuraciones/api/configuraciones.api';
import { pendingUrgency, type PendingUrgency } from '@/shared/utils/pending-urgency';

export function usePendingThresholds() {
  return useQuery({ queryKey: ['configuraciones', 'pendientes'], queryFn: getPendingUrgencyThresholds, staleTime: 5 * 60_000 });
}

/** Sin umbrales cargados no se inventa un color: se devuelve null y no se pinta alerta. */
export function usePendingUrgency() {
  const thresholds = usePendingThresholds();
  return (count: number | null | undefined, oldest: string | null | undefined): PendingUrgency | null =>
    count == null || !thresholds.data ? null : pendingUrgency(count, oldest, thresholds.data);
}
