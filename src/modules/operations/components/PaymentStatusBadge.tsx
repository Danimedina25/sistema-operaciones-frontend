import { cn } from '@/shared/lib/cn';
import {
  paymentStatusLabels,
} from '@/modules/operations/constants/operations.constants';

import {
  PaymentStatus,
} from '../types/operations.types.ts';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({
  status,
}: PaymentStatusBadgeProps) {

  return (
    <span
      className={cn(
        `
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        tracking-wide
        `,
        status === 'VALIDADA' &&
          `
          border-emerald-200
          bg-emerald-50
          text-emerald-700
          `,

        status === 'RECHAZADA' &&
          `
          border-rose-200
          bg-rose-50
          text-rose-700
          `,

        status === 'PENDIENTE_VALIDACION' &&
          `
          border-amber-200
          bg-amber-50
          text-amber-700
          `,
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}