import type { ReturnPaymentStatus } from '@/modules/operations/types/operations.types.ts';

export type DeliveryClassification =
  | 'DELIVERED'
  | 'LATE'
  | 'UPCOMING'
  | 'SCHEDULED'
  | 'PENDING_STAFF_CONFIRMATION'
  | 'UNSCHEDULED';

export interface DeliveryClassificationInput {
  estatus: ReturnPaymentStatus;
  /** Fecha/hora programada de recolección (fechaHoraRecoleccionEfectivo). */
  scheduledAt?: string | null;
}

const UPCOMING_WINDOW_HOURS = 2;

/**
 * Clasifica una entrega (retorno en efectivo o retiro sin tarjeta) en un
 * semáforo visual. El flujo real del backend es:
 * SOLICITADO -> EN_RECOLECCION (JEFA_CAJAS programa recolección) ->
 * ENTREGADO (el socio comercial confirma que recogió el efectivo,
 * pendiente de que JEFA_CAJAS cierre el retorno) -> RETORNADO (JEFA_CAJAS
 * confirmó el cierre, estado final).
 */
export function classifyDelivery(
  input: DeliveryClassificationInput,
  now: Date = new Date(),
): DeliveryClassification {
  const { estatus, scheduledAt } = input;

  if (estatus === 'RETORNADO') {
    return 'DELIVERED';
  }

  if (estatus === 'ENTREGADO') {
    return 'PENDING_STAFF_CONFIRMATION';
  }

  if (!scheduledAt) {
    return 'UNSCHEDULED';
  }

  const scheduledDate = new Date(scheduledAt);
  const hoursUntilScheduled = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilScheduled < 0) {
    return 'LATE';
  }

  if (hoursUntilScheduled <= UPCOMING_WINDOW_HOURS) {
    return 'UPCOMING';
  }

  return 'SCHEDULED';
}
