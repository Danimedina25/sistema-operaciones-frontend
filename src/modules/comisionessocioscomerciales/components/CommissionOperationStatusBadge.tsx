import clsx from 'clsx';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';

interface CommissionOperationStatusBadgeProps {
  paidCompletely: boolean;
  partialPayment?: boolean;
}

export function CommissionOperationStatusBadge({
  paidCompletely,
  partialPayment,
}: CommissionOperationStatusBadgeProps) {
  return (
    <span
      className={clsx(
        STATUS_BADGE_CLASS,
        paidCompletely
          ? 'bg-emerald-100 text-emerald-700'
          : partialPayment
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700',
      )}
    >
      {paidCompletely
        ? 'Pagada completamente'
        : partialPayment
          ? 'Pagada parcialmente'
          : 'Pendiente'}
    </span>
  );
}
