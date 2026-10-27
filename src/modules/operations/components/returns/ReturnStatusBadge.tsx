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

export function ReturnStatusBadge({ status, stage }: { status: ReturnPaymentStatus; stage?: string | null }) {
  if (stage === 'PENDIENTE_CODIGO') return <StatusBadge tone="pending">Por registrar código</StatusBadge>;
  if (stage === 'CODIGOS_EN_SEGUIMIENTO') return <StatusBadge tone="pending">Códigos en seguimiento</StatusBadge>;
  if (stage === 'CODIGOS_CONCLUIDOS') return <StatusBadge tone="success">Retiros completados</StatusBadge>;
  if (stage === 'PENDIENTE_CUENTA') return <StatusBadge tone="pending">Pendiente de Cuentas</StatusBadge>;
  if (stage === 'PENDIENTE_PREPARACION') return <StatusBadge tone="pending">Por preparar en Caja</StatusBadge>;
  return <StatusBadge tone={tones[status]} className="whitespace-nowrap">{labels[status]}</StatusBadge>;
}
