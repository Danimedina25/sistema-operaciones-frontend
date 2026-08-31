import { cn } from "@/shared/lib/cn";
import type { ReturnPaymentStatus } from '../../types/operations.types.ts';

interface ReturnStatusBadgeProps {
  status: ReturnPaymentStatus;
}

const LABELS: Record<ReturnPaymentStatus, string> = {
  SOLICITADO: 'Solicitado',
  EN_RECOLECCION: 'En recolección',
  ENTREGADO: 'Entregado',
  PARCIALMENTE_RETORNADO: 'Parcialmente retornado',
  RETORNADO: 'Retornado',
};

export function ReturnStatusBadge({ status }: ReturnStatusBadgeProps) {
  return (
    <span
      className={cn(
        `
        inline-flex
        min-w-[140px]
        items-center
        justify-center
        rounded-full
        border
        px-3
        py-1
        text-center
        text-xs
        font-semibold
        `,
        status === 'RETORNADO' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',

        status === 'PARCIALMENTE_RETORNADO' &&
          'border-teal-200 bg-teal-50 text-teal-700',

        status === 'ENTREGADO' &&
          'border-indigo-200 bg-indigo-50 text-indigo-700',

        status === 'EN_RECOLECCION' &&
          'border-blue-200 bg-blue-50 text-blue-700',

        status === 'SOLICITADO' &&
          'border-amber-200 bg-amber-50 text-amber-700',
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
