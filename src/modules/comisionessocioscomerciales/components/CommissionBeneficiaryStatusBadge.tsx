import clsx from 'clsx';

interface CommissionBeneficiaryStatusBadgeProps {
  status: string;
}

export function CommissionBeneficiaryStatusBadge({
  status,
}: CommissionBeneficiaryStatusBadgeProps) {
  const isPaid = status === 'PAGADA';

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        isPaid
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700',
      )}
    >
      {isPaid ? 'Pagada' : 'Generada'}
    </span>
  );
}