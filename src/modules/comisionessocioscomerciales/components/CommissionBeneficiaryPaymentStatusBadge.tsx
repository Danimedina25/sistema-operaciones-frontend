import { cn } from '@/shared/lib/cn';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';

interface Props {
  status:
    | 'PAGADA'
    | 'PARCIAL'
    | 'PENDIENTE';
}

export function CommissionBeneficiaryPaymentStatusBadge({
  status,
}: Props) {

  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,

        status === 'PAGADA' &&
          'bg-emerald-100 text-emerald-700',

        status === 'PENDIENTE' &&
          'bg-red-100 text-red-700',

        status === 'PARCIAL' &&
          'bg-amber-100 text-amber-700',
      )}
    >
      {status === 'PAGADA' &&
        'Pagado'}

      {status === 'PENDIENTE' &&
        'No pagado'}

      {status === 'PARCIAL' &&
        'Pago parcial'}
    </span>
  );
}
