import type { ReturnPaymentStatus } from '@/modules/operations/types/operations.types.ts';

export type DeliveryClassification =
  | 'DELIVERED'
  | 'LATE'
  | 'UPCOMING'
  | 'SCHEDULED'
  | 'PENDING_PARTNER_CONFIRMATION'
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
 * ENTREGADO (JEFA_CAJAS entrega físicamente, pendiente de que el socio
 * confirme recepción) -> RETORNADO (el socio confirmó, estado final).
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
    return 'PENDING_PARTNER_CONFIRMATION';
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
