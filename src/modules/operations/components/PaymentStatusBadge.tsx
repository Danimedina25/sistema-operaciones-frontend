import { cn } from '@/shared/lib/cn';
import { paymentStatusLabels } from '@/modules/operations/constants/operations.constants';
import { PaymentStatus } from '../types/operations.types.ts';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        status === 'VALIDADA' && 'bg-emerald-100 text-emerald-700',
        status === 'RECHAZADA' && 'bg-red-100 text-red-700',
        status === 'PENDIENTE_VALIDACION' && 'bg-amber-100 text-amber-700',
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}