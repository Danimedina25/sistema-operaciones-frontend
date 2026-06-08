import clsx from 'clsx';

interface CommissionOperationStatusBadgeProps {
  paidCompletely: boolean;
}

export function CommissionOperationStatusBadge({
  paidCompletely,
}: CommissionOperationStatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        paidCompletely
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700',
      )}
    >
      {paidCompletely
        ? 'Pagada completamente'
        : 'Pendiente'}
    </span>
  );
}