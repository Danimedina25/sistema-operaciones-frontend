import { useQuery } from '@tanstack/react-query';
import {
  getTodayInstallmentPickups,
  type TodayCashDeliveriesFilters,
} from '@/modules/operations/api/operations.api';

const PAGE_SIZE = 200;

/**
 * Trae en una sola llamada todas las parcialidades de efectivo/retiro sin
 * tarjeta programadas para el día (tamaño de página generoso — ver
 * daily-delivery-summary.ts para el cálculo del resumen sobre esta misma
 * lista, sin recalcular sobre una página incompleta).
 */
export function useTodayCashDeliveries(filters: TodayCashDeliveriesFilters) {
  return useQuery({
    queryKey: ['today-installment-pickups', filters],
    queryFn: () => getTodayInstallmentPickups(0, PAGE_SIZE, filters),
  });
}
