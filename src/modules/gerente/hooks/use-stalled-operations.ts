import { useQuery } from '@tanstack/react-query';
import { getStalledOperations } from '@/modules/operations/api/operations.api';

const PAGE_SIZE = 10;

/** Sin umbral explícito, el backend usa las horas para operación detenida de Configuración. */
export function useStalledOperations(thresholdHours?: number) {
  return useQuery({
    queryKey: ['stalled-operations', thresholdHours],
    queryFn: () => getStalledOperations(0, PAGE_SIZE, thresholdHours),
  });
}
