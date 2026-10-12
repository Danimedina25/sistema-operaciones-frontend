import { StatusBadge, type StatusTone } from '@/shared/components/ui/StatusBadge';
import type { ReturnPaymentStatus } from '../../types/operations.types.ts';

const labels: Record<ReturnPaymentStatus, string> = {
  SOLICITADO: 'Solicitado',
  EN_RECOLECCION: 'En recolección',
  ENTREGADO: 'Entregado',
  PARCIALMENTE_RETORNADO: 'Parcialmente retornado',
  RETORNADO: 'Retornado',
};
const tones: Record<ReturnPaymentStatus, StatusTone> = {
  SOLICITADO: 'request',
  EN_RECOLECCION: 'pending',
  ENTREGADO: 'active',
  PARCIALMENTE_RETORNADO: 'pending',
  RETORNADO: 'success',
};

export function ReturnStatusBadge({ status }: { status: ReturnPaymentStatus }) {
  return <StatusBadge tone={tones[status]} className="whitespace-nowrap">{labels[status]}</StatusBadge>;
}
