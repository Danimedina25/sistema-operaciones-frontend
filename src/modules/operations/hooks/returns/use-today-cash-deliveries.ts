import { useQuery } from '@tanstack/react-query';
import {
  getTodayCashDeliveries,
  type TodayCashDeliveriesFilters,
} from '@/modules/operations/api/operations.api';

const PAGE_SIZE = 200;

/**
 * Trae en una sola llamada todas las entregas de efectivo/retiro sin
 * tarjeta programadas para el día (tamaño de página generoso — se asume
 * que las entregas de un día no superan ese número; ver
 * daily-delivery-summary.ts para el cálculo del resumen sobre esta misma
 * lista, sin recalcular sobre una página incompleta).
 */
export function useTodayCashDeliveries(filters: TodayCashDeliveriesFilters) {
  return useQuery({
    queryKey: ['today-cash-deliveries', filters],
    queryFn: () => getTodayCashDeliveries(0, PAGE_SIZE, filters),
  });
}
