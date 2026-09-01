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
  /**
   * Solo parcialidades: la jefa de cajas ya cerró su parte (foto + persona que
   * recibió), independientemente de si el socio ya confirmó. `undefined` en el
   * flujo legacy (`ReturnPaymentResponse`), que no distingue las dos marcas.
   */
  cerradoPorJefa?: boolean;
}

const FULLY_DELIVERED_STATUSES = new Set(['ENTREGADO', 'RETORNADO', 'COMPLETADA']);
// Estatus intermedio ("confirmación parcial" en parcialidades / "entregado,
// falta cerrar" en el flujo legacy): sin `cerradoPorJefa` explícito se sigue
// tratando como entregado, para no regresar el comportamiento legacy.
const PARTIALLY_DELIVERED_STATUSES = new Set(['ENTREGADO', 'ENTREGADA']);
const PENDING_STATUSES = new Set(['SOLICITADO', 'EN_RECOLECCION', 'PROGRAMADA']);
const SCHEDULED_STATUSES = new Set(['EN_RECOLECCION', 'PROGRAMADA']);

/** Normaliza una parcialidad a la forma que consume el resumen. */
export function installmentToDeliveryLike(i: ReturnInstallment): DeliveryLike {
  return {
    estatus: i.estatus,
    monto: i.monto,
    scheduledAt: i.fechaHoraRecoleccion ?? null,
    cerradoPorJefa: i.cerradoPorJefa,
  };
}

/**
 * El dinero cuenta como entregado cuando la parcialidad está `COMPLETADA`, o
 * cuando la jefa de cajas ya cerró su parte aunque falte el socio
 * (`cerradoPorJefa === true`): el efectivo ya salió de sus manos. Con una sola
 * marca del socio (`cerradoPorJefa === false`) sigue pendiente. El flujo legacy
 * no manda `cerradoPorJefa` y conserva su comportamiento previo.
 */
function countsAsDelivered(delivery: DeliveryLike): boolean {
  if (FULLY_DELIVERED_STATUSES.has(delivery.estatus)) return true;
  if (!PARTIALLY_DELIVERED_STATUSES.has(delivery.estatus)) return false;
  return delivery.cerradoPorJefa !== false;
}

/**
 * Calcula el resumen diario de entregas a partir de la lista ya cargada
 * (una sola consulta al backend, sin volver a calcular sobre otra página).
 *
 * "Entregado" / "pendiente" se interpretan desde la perspectiva operativa de
 * JEFA_CAJAS: si el efectivo ya salió físicamente de sus manos o no — ver
 * {@link countsAsDelivered}. `pendingConfirmationCount` cuenta las entregas en
 * confirmación parcial donde JEFA_CAJAS todavía no cierra su parte.
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
    if (countsAsDelivered(delivery)) {
      totalDelivered += delivery.monto;
    } else if (
      PENDING_STATUSES.has(delivery.estatus) ||
      PARTIALLY_DELIVERED_STATUSES.has(delivery.estatus)
    ) {
      totalPending += delivery.monto;
    }

    if (
      classifyDelivery(
        { estatus: delivery.estatus, scheduledAt: delivery.scheduledAt },
        now,
      ) === 'PENDING_STAFF_CONFIRMATION' &&
      delivery.cerradoPorJefa !== true
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
