import clsx from 'clsx';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';

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
        STATUS_BADGE_CLASS,
        isPaid
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700',
      )}
    >
      {isPaid ? 'Pagada' : 'Generada'}
    </span>
  );
}
