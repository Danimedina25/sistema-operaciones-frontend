import { StatusBadge, type StatusTone } from '@/shared/components/ui/StatusBadge';
import { paymentStatusLabels } from '@/modules/operations/constants/operations.constants';
import type { PaymentStatus } from '../types/operations.types.ts';

const tones: Record<PaymentStatus, StatusTone> = {
  VALIDADA: 'success',
  RECHAZADA: 'danger',
  PENDIENTE_VALIDACION: 'pending',
  EN_PROCESO: 'active',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge tone={tones[status]} className="whitespace-nowrap">{paymentStatusLabels[status]}</StatusBadge>;
}
