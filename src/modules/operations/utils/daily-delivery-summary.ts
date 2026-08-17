import { classifyDelivery } from '@/shared/utils/delivery-classification';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';

export interface DailyDeliverySummary {
  totalDelivered: number;
  totalPending: number;
  deliveriesCount: number;
  /** Fecha/hora de la próxima recolección sin entregar aún, o null si no hay ninguna. */
  nextPickup: string | null;
  pendingConfirmationCount: number;
}

const DELIVERED_STATUSES = new Set(['ENTREGADO', 'RETORNADO']);
const PENDING_STATUSES = new Set(['SOLICITADO', 'EN_RECOLECCION']);

/**
 * Calcula el resumen diario de entregas a partir de la lista ya cargada
 * (una sola consulta al backend, sin volver a calcular sobre otra página).
 *
 * "Entregado" / "pendiente" se interpretan desde la perspectiva operativa
 * de JEFA_CAJAS: si ya entregó el efectivo físicamente (ENTREGADO o
 * RETORNADO) o no (SOLICITADO o EN_RECOLECCION) — independiente de si el
 * socio ya confirmó la recepción después.
 */
export function computeDailyDeliverySummary(
  deliveries: ReturnPaymentResponse[],
  now: Date = new Date(),
): DailyDeliverySummary {
  let totalDelivered = 0;
  let totalPending = 0;
  let pendingConfirmationCount = 0;
  let nextPickup: string | null = null;

  for (const delivery of deliveries) {
    if (DELIVERED_STATUSES.has(delivery.estatus)) {
      totalDelivered += delivery.monto;
    } else if (PENDING_STATUSES.has(delivery.estatus)) {
      totalPending += delivery.monto;
    }

    if (classifyDelivery({ estatus: delivery.estatus, scheduledAt: delivery.fechaHoraRecoleccionEfectivo }, now) === 'PENDING_PARTNER_CONFIRMATION') {
      pendingConfirmationCount += 1;
    }

    if (
      delivery.estatus === 'EN_RECOLECCION' &&
      delivery.fechaHoraRecoleccionEfectivo &&
      (nextPickup === null || delivery.fechaHoraRecoleccionEfectivo < nextPickup)
    ) {
      nextPickup = delivery.fechaHoraRecoleccionEfectivo;
    }
  }

  return {
    totalDelivered,
    totalPending,
    deliveriesCount: deliveries.length,
    nextPickup,
    pendingConfirmationCount,
  };
}
