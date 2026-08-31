import { classifyDelivery } from '@/shared/utils/delivery-classification';
import type {
  ReturnInstallment,
  ReturnInstallmentStatus,
  ReturnPaymentStatus,
} from '@/modules/operations/types/operations.types.ts';

export interface DailyDeliverySummary {
  totalDelivered: number;
  totalPending: number;
  deliveriesCount: number;
  /** Fecha/hora de la próxima recolección sin entregar aún, o null si no hay ninguna. */
  nextPickup: string | null;
  pendingConfirmationCount: number;
}

/**
 * Forma mínima que necesita el resumen. La alimentan tanto las parcialidades
 * (flujo por parcialidades) como los retornos completos (flujo legacy).
 */
export interface DeliveryLike {
  estatus: ReturnPaymentStatus | ReturnInstallmentStatus;
  monto: number;
  scheduledAt?: string | null;
}

const DELIVERED_STATUSES = new Set(['ENTREGADO', 'RETORNADO', 'ENTREGADA', 'COMPLETADA']);
const PENDING_STATUSES = new Set(['SOLICITADO', 'EN_RECOLECCION', 'PROGRAMADA']);
const SCHEDULED_STATUSES = new Set(['EN_RECOLECCION', 'PROGRAMADA']);

/** Normaliza una parcialidad a la forma que consume el resumen. */
export function installmentToDeliveryLike(i: ReturnInstallment): DeliveryLike {
  return {
    estatus: i.estatus,
    monto: i.monto,
    scheduledAt: i.fechaHoraRecoleccion ?? null,
  };
}

/**
 * Calcula el resumen diario de entregas a partir de la lista ya cargada
 * (una sola consulta al backend, sin volver a calcular sobre otra página).
 *
 * "Entregado" / "pendiente" se interpretan desde la perspectiva operativa de
 * JEFA_CAJAS: si el efectivo ya salió físicamente de sus manos o no.
 * `pendingConfirmationCount` cuenta las entregas donde el socio ya confirmó y
 * falta que JEFA_CAJAS las cierre (ENTREGADO / ENTREGADA).
 */
export function computeDailyDeliverySummary(
  deliveries: DeliveryLike[],
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

    if (
      classifyDelivery(
        { estatus: delivery.estatus, scheduledAt: delivery.scheduledAt },
        now,
      ) === 'PENDING_STAFF_CONFIRMATION'
    ) {
      pendingConfirmationCount += 1;
    }

    if (
      SCHEDULED_STATUSES.has(delivery.estatus) &&
      delivery.scheduledAt &&
      (nextPickup === null || delivery.scheduledAt < nextPickup)
    ) {
      nextPickup = delivery.scheduledAt;
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
