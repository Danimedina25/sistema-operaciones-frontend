import { cn } from '@/shared/lib/cn';

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
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',

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