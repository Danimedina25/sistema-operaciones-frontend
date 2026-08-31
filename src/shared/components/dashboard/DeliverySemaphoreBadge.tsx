import { classifyDelivery, type DeliveryClassification } from '@/shared/utils/delivery-classification';
import type {
  ReturnInstallmentStatus,
  ReturnPaymentStatus,
} from '@/modules/operations/types/operations.types.ts';
import { cn } from '@/shared/lib/cn';

interface DeliverySemaphoreBadgeProps {
  estatus: ReturnPaymentStatus | ReturnInstallmentStatus;
  scheduledAt?: string | null;
  className?: string;
}

const CLASSIFICATION_STYLES: Record<DeliveryClassification, { bg: string; text: string; label: string }> = {
  DELIVERED: {
    bg: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Entregada',
  },
  PENDING_STAFF_CONFIRMATION: {
    bg: 'border-indigo-200 bg-indigo-50',
    text: 'text-indigo-700',
    label: 'Pendiente de tu confirmación',
  },
  LATE: {
    bg: 'border-rose-200 bg-rose-50',
    text: 'text-rose-700',
    label: 'Atrasada',
  },
  UPCOMING: {
    bg: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
    label: 'Próxima',
  },
  SCHEDULED: {
    bg: 'border-blue-200 bg-blue-50',
    text: 'text-blue-700',
    label: 'Programada',
  },
  UNSCHEDULED: {
    bg: 'border-slate-200 bg-slate-50',
    text: 'text-slate-600',
    label: 'Sin programar',
  },
};

/**
 * Semáforo visual de entregas para retornos en efectivo/retiro sin
 * tarjeta. Usa `classifyDelivery` (shared/utils/delivery-classification.ts),
 * que refleja el flujo real de backend: SOLICITADO -> EN_RECOLECCION ->
 * ENTREGADO (el socio ya confirmó, pendiente de que JEFA_CAJAS cierre) ->
 * RETORNADO. Solo se usa en la vista de JEFA_CAJAS (Entregas de hoy), por
 * eso el label de "pendiente" se dirige a ella.
 */
export function DeliverySemaphoreBadge({ estatus, scheduledAt, className }: DeliverySemaphoreBadgeProps) {
  const classification = classifyDelivery({ estatus, scheduledAt });
  const styles = CLASSIFICATION_STYLES[classification];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        styles.bg,
        styles.text,
        className,
      )}
    >
      {styles.label}
    </span>
  );
}
