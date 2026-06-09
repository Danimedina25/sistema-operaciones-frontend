import clsx from 'clsx';

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
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
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